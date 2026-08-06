import OpenAI from "openai";
import {
  probeSubtitles,
  resolveBvidDetails,
  summarizeSubtitleProbe,
} from "@/lib/bilibili";
import { getOpenAIClient, getOpenAIModel } from "@/lib/openai";
import { PROMPT_A, PROMPT_B } from "@/lib/prompts";

/** In-memory rate limiter: simple token bucket per IP (Vercel/Node). */
const rateLimiter = (() => {
  const windowMs = 60_000; // 1 minute window
  const maxRequests = 10; // max requests per window per IP
  const buckets = new Map<string, { count: number; resetAt: number }>();
  const STALE_CLEANUP_INTERVAL_MS = 5 * 60_000; // 5 minutes

  // Periodically remove expired buckets to prevent unbounded memory growth.
  // No active timer needed here — triggered opportunistically on each check.
  let lastCleanup = Date.now();

  function pruneStaleBuckets() {
    const now = Date.now();
    if (now - lastCleanup < STALE_CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(key);
    }
  }

  return {
    check(ip: string): { allowed: boolean; retryAfterMs: number } {
      pruneStaleBuckets();
      const now = Date.now();
      const bucket = buckets.get(ip);

      if (!bucket || now > bucket.resetAt) {
        buckets.set(ip, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterMs: 0 };
      }

      if (bucket.count >= maxRequests) {
        return { allowed: false, retryAfterMs: bucket.resetAt - now };
      }

      bucket.count++;
      return { allowed: true, retryAfterMs: 0 };
    },
  };
})();

export const runtime = "nodejs";
export const maxDuration = 150; // must exceed the longest OpenAI call timeout (120s)

type AnalysisResult = {
  total_words?: number;
  topic?: string;
  hook?: {
    type?: string;
    content?: string;
    why_it_works?: string;
  };
  structure?: Array<{
    section?: string;
    function?: string;
    word_count?: number;
    key_points?: string[];
  }>;
  rhetorical_devices?: string[];
  reusable_assets?: {
    viewpoints?: string[];
    examples?: string[];
    analogies?: string[];
  };
  pacing?: string;
  ending?: string;
};

/**
 * Fill `{placeholder}` slots in a prompt template with literal values.
 *
 * Uses a replacer function instead of a plain string replacement because
 * `String.prototype.replaceAll(search, replacement)` treats `$` sequences in
 * the replacement string as special patterns (`$$`, `$&`, `$'`, `` $` ``,
 * `$<n>`). A transcript or user topic containing e.g. "$$" or "$&" would
 * silently corrupt the prompt. Passing a function makes the value literal.
 */
function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{${key}}`, () => value);
  }
  return result;
}

/**
 * Upper bound on how much subtitle text is fed into the analysis prompt.
 *
 * `probeSubtitles()` returns the FULL transcript of the longest subtitle page,
 * and until now that string was interpolated into PROMPT_A verbatim. For long
 * videos (公开课 / 纪录片 / 长访谈) a single page can easily run to tens of
 * thousands of characters, which overflows the model context window:
 *
 *   - gpt-4          ->   8k tokens  (~5k 中文字符 is already too much)
 *   - gpt-3.5-turbo  ->  16k tokens
 *   - gpt-4o         -> 128k tokens (a 3h transcript still gets close)
 *
 * All three are in the supported-model list in `lib/openai.ts`, so this is not
 * a theoretical edge case. When it happened the user paid the full cost of the
 * link resolve + multi-page subtitle probe, waited for it, and then got an
 * opaque `AI 服务错误 (400): ...` with no hint about what to do.
 *
 * Capping the input keeps long videos working (structure analysis only needs a
 * representative sample, not every word) and keeps token spend predictable.
 * Chinese characters are roughly 1-1.5 tokens each, so the 24k default leaves
 * headroom on a 16k-token model once prompt scaffolding and the JSON response
 * are accounted for.
 */
const DEFAULT_MAX_TRANSCRIPT_CHARS = 24_000;
const MIN_MAX_TRANSCRIPT_CHARS = 1_000;

function getMaxTranscriptChars(): number {
  const raw = process.env.MAX_TRANSCRIPT_CHARS;
  if (!raw) return DEFAULT_MAX_TRANSCRIPT_CHARS;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < MIN_MAX_TRANSCRIPT_CHARS) {
    console.warn(
      `[generate] Ignoring invalid MAX_TRANSCRIPT_CHARS="${raw}" ` +
        `(must be an integer >= ${MIN_MAX_TRANSCRIPT_CHARS}). ` +
        `Falling back to ${DEFAULT_MAX_TRANSCRIPT_CHARS}.`,
    );
    return DEFAULT_MAX_TRANSCRIPT_CHARS;
  }

  return parsed;
}

/**
 * Tell the model the text it is looking at is a prefix, not the whole video.
 * Without this it reports the truncated length as the real `total_words` and
 * describes the missing tail as "没有结尾".
 */
const TRUNCATION_NOTICE =
  "\n\n[注意：以上字幕因长度限制已被截断，只是原视频前段内容，不是完整视频。" +
  "请基于这段可见文本分析创作结构，total_words 按你实际看到的文本字数估算。]";

/** Sentence terminators we prefer to cut on, so we never slice mid-sentence. */
const SENTENCE_BOUNDARIES = ["。", "！", "？", "；", "…", ".", "!", "?", " "];

/**
 * Only accept a sentence boundary reasonably close to the limit — otherwise a
 * transcript with no punctuation at all (common for auto-generated subtitles)
 * would get cut back to almost nothing.
 */
const MIN_BOUNDARY_RATIO = 0.8;

type TruncatedTranscript = {
  text: string;
  truncated: boolean;
  originalLength: number;
  usedLength: number;
};

function truncateTranscript(
  transcript: string,
  maxChars: number,
): TruncatedTranscript {
  if (transcript.length <= maxChars) {
    return {
      text: transcript,
      truncated: false,
      originalLength: transcript.length,
      usedLength: transcript.length,
    };
  }

  const head = transcript.slice(0, maxChars);
  const boundary = Math.max(
    ...SENTENCE_BOUNDARIES.map((marker) => head.lastIndexOf(marker)),
  );
  const body =
    boundary >= maxChars * MIN_BOUNDARY_RATIO ? head.slice(0, boundary + 1) : head;

  return {
    text: `${body}${TRUNCATION_NOTICE}`,
    truncated: true,
    originalLength: transcript.length,
    usedLength: body.length,
  };
}

/**
 * Backstop for the cap above: a deployment can raise MAX_TRANSCRIPT_CHARS or
 * point OPENAI_MODEL at an even smaller-context model. Recognise the overflow
 * so the user gets an actionable message instead of a raw 400.
 */
function isContextLengthError(error: InstanceType<typeof OpenAI.APIError>): boolean {
  if (error.code === "context_length_exceeded") return true;
  return /maximum context length|context_length_exceeded|too many tokens/i.test(
    error.message ?? "",
  );
}

function buildAnalysisPrompt(transcript: string): string {
  return fillTemplate(PROMPT_A, { transcript });
}

function buildScriptPrompt(params: {
  analysis: string;
  userTopic: string;
  targetWords: number;
  targetMinutes: string;
  hookType: string;
}): string {
  return fillTemplate(PROMPT_B, {
    analysis: params.analysis,
    user_topic: params.userTopic,
    target_words: String(params.targetWords),
    target_minutes: params.targetMinutes,
    hook_type: params.hookType,
  });
}

export async function POST(request: Request) {
  // --- Rate limit ---
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const { allowed, retryAfterMs } = rateLimiter.check(clientIp);
  if (!allowed) {
    return Response.json(
      {
        error: "RATE_LIMITED",
        message: `请求过于频繁，请 ${Math.ceil(retryAfterMs / 1000)} 秒后再试`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      },
    );
  }

  try {
    const body = (await request.json()) as {
      url?: string;
      topic?: string;
    };
    const url = body.url?.trim();
    const topic = body.topic?.trim();

    if (!url || !topic) {
      return Response.json(
        { error: "BAD_REQUEST", message: "请提供视频链接和新话题" },
        { status: 400 },
      );
    }

    if (url.length > 2000) {
      return Response.json(
        { error: "INVALID_URL", message: "链接过长，请重新复制粘贴正确的视频链接" },
        { status: 400 },
      );
    }

    if (topic.length < 2) {
      return Response.json(
        { error: "INVALID_TOPIC", message: "话题至少需要 2 个字符" },
        { status: 400 },
      );
    }

    if (topic.length > 500) {
      return Response.json(
        { error: "INVALID_TOPIC", message: "话题不能超过 500 个字符" },
        { status: 400 },
      );
    }

    // Guard decode/encode failures that could crash the handler — return 400
    // instead of propagating an unhandled exception to the error catch block.
    let encodedUrl: string;
    try {
      encodedUrl = encodeURIComponent(url);
    } catch {
      return Response.json(
        { error: "INVALID_URL", message: "视频链接包含无法处理的字符" },
        { status: 400 },
      );
    }

    // Defensive: tolerate invalid user input in topic even if JavaScript strips
    // it on the client.  encodeURIComponent always succeeds for valid JS strings.
    let encodedTopic: string;
    try {
      encodedTopic = encodeURIComponent(topic);
    } catch {
      return Response.json(
        { error: "INVALID_TOPIC", message: "话题包含无法处理的字符" },
        { status: 400 },
      );
    }

    // Validate OpenAI configuration (API key + model) BEFORE doing expensive
    // Bilibili work, so a missing/again-invalid key fails fast instead of wasting
    // subtitle fetches (resolve + multi-page probe) just to error out later.
    let openai: OpenAI;
    let openaiModel: string;
    try {
      openai = getOpenAIClient();
      openaiModel = getOpenAIModel();
    } catch {
      return Response.json(
        { error: "MISSING_OPENAI_API_KEY", message: "缺少 OPENAI_API_KEY 环境变量" },
        { status: 500 },
      );
    }

    const resolved = await resolveBvidDetails(url);
    const bvid = resolved.bvid;

    if (!bvid) {
      return Response.json(
        {
          error: "BAD_URL",
          message: "无法识别 B 站视频链接",
          debug_summary: `链接解析失败，来源：${resolved.source}`,
        },
        { status: 400 },
      );
    }

    const probe = await probeSubtitles(bvid);

    if (!probe.transcript) {
      return Response.json(
        {
          error: "NO_SUBTITLE",
          message: "该视频没有字幕，暂不支持",
          debug_summary: summarizeSubtitleProbe(probe),
          debug_payload: {
            bvid,
            title: probe.title,
            cid: probe.cid,
            selected_page: probe.selected_page,
            selected_part: probe.selected_part,
            page_attempts: probe.page_attempts,
          },
        },
        { status: 400 },
      );
    }

    // Bound the transcript before it ever reaches the model. Long videos used
    // to blow the context window here and surface as an opaque OpenAI 400.
    const transcript = truncateTranscript(
      probe.transcript,
      getMaxTranscriptChars(),
    );

    if (transcript.truncated) {
      console.warn(
        `[generate] Transcript truncated for ${bvid}: ` +
          `${transcript.originalLength} -> ${transcript.usedLength} chars`,
      );
    }

    const analysisPrompt = buildAnalysisPrompt(transcript.text);
    const analysisResponse = await openai.chat.completions.create(
      {
        model: openaiModel,
        messages: [
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        response_format: { type: "json_object" },
      },
      { timeout: 60_000 },
    );

    const analysisText = analysisResponse.choices[0]?.message?.content;

    if (!analysisText) {
      throw new Error("EMPTY_ANALYSIS");
    }

    let analysis: AnalysisResult;
    try {
      analysis = JSON.parse(analysisText) as AnalysisResult;
    } catch (parseError) {
      throw new Error(`INVALID_ANALYSIS_JSON: ${analysisText.slice(0, 500)}`);
    }

    if (!analysis || typeof analysis !== "object") {
      throw new Error(`INVALID_ANALYSIS_JSON: Analysis is not an object: ${analysisText.slice(0, 500)}`);
    }

    // Validate structure: must be a non-empty array
    if (!Array.isArray(analysis.structure) || analysis.structure.length === 0) {
      throw new Error(
        `INVALID_ANALYSIS_JSON: 'structure' must be a non-empty array. Raw: ${analysisText.slice(0, 500)}`,
      );
    }

    // Validate each structure item has required fields
    for (const [index, section] of analysis.structure.entries()) {
      if (!section.section || typeof section.section !== "string") {
        throw new Error(
          `INVALID_ANALYSIS_JSON: structure[${index}].section is missing or not a string. Raw: ${analysisText.slice(0, 500)}`,
        );
      }
      if (typeof section.word_count !== "number" || section.word_count < 0) {
        throw new Error(
          `INVALID_ANALYSIS_JSON: structure[${index}].word_count must be a non-negative number. Raw: ${analysisText.slice(0, 500)}`,
        );
      }
    }

    // Validate total_words: must be a positive integer within reasonable range
    const totalWords = analysis.total_words;
    if (
      typeof totalWords !== "number" ||
      !Number.isInteger(totalWords) ||
      totalWords <= 0 ||
      totalWords > 100000 // Reasonable upper bound for video transcripts
    ) {
      throw new Error(
        `INVALID_ANALYSIS_JSON: total_words must be a positive integer <= 100000, got: ${totalWords}. Raw: ${analysisText.slice(0, 500)}`,
      );
    }

    // totalWords is now guaranteed to be a valid positive integer
    const targetWords = totalWords;
    const targetMinutes = (targetWords / 240).toFixed(1);
    const hookType = analysis.hook?.type ?? "其他";
    const scriptPrompt = buildScriptPrompt({
      analysis: JSON.stringify(analysis, null, 2),
      userTopic: topic,
      targetWords,
      targetMinutes,
      hookType,
    });

    const stream = await openai.chat.completions.create(
      {
        model: openaiModel,
        messages: [
          {
            role: "user",
            content: scriptPrompt,
          },
        ],
        stream: true,
      },
      { timeout: 120_000 },
    );

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          console.error(error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);

    // Handle OpenAI API errors with user-friendly messages
    if (error instanceof OpenAI.APIError) {
      const status = error.status;
      if (isContextLengthError(error)) {
        return Response.json(
          {
            error: "CONTEXT_LENGTH_EXCEEDED",
            message:
              "视频字幕太长，超出了当前模型的上下文长度。请换用上下文更大的模型（如 gpt-4o），" +
              "或调小 MAX_TRANSCRIPT_CHARS 后重试。",
          },
          { status: 400 },
        );
      }
      if (status === 429) {
        return Response.json(
          { error: "RATE_LIMIT", message: "AI 服务请求过于频繁，请稍后再试" },
          { status: 429 },
        );
      }
      if (status === 401) {
        return Response.json(
          { error: "INVALID_API_KEY", message: "OPENAI_API_KEY 无效或已过期，请检查配置" },
          { status: 500 },
        );
      }
      if (status === 403) {
        return Response.json(
          { error: "INSUFFICIENT_PERMISSIONS", message: "API 密钥权限不足，请检查 OPENAI_API_KEY 配置" },
          { status: 500 },
        );
      }
      if (status && status >= 500) {
        return Response.json(
          { error: "OPENAI_SERVER_ERROR", message: "AI 服务暂时不可用，请稍后重试" },
          { status: 503 },
        );
      }
      return Response.json(
        { error: "OPENAI_API_ERROR", message: `AI 服务错误 (${status}): ${error.message}` },
        { status: 500 },
      );
    }

    // Handle OpenAI connection errors
    if (error instanceof OpenAI.APIConnectionError) {
      return Response.json(
        { error: "API_CONNECTION_ERROR", message: "无法连接到 AI 服务，请检查网络后重试" },
        { status: 503 },
      );
    }

    if (error instanceof Error && error.message === "MISSING_OPENAI_API_KEY") {
      return Response.json(
        { error: "MISSING_OPENAI_API_KEY", message: "缺少 OPENAI_API_KEY 环境变量" },
        { status: 500 },
      );
    }

    if (error instanceof Error && error.message.startsWith("EMPTY_ANALYSIS")) {
      return Response.json(
        { error: "EMPTY_ANALYSIS", message: "AI 返回的分析结果为空，请重试" },
        { status: 500 },
      );
    }

    if (error instanceof Error && error.message.startsWith("INVALID_ANALYSIS_JSON")) {
      return Response.json(
        { error: "INVALID_ANALYSIS_JSON", message: `AI 返回的分析结果格式异常: ${error.message.slice(0, 200)}，请重试` },
        { status: 500 },
      );
    }

    return Response.json(
      { error: "INTERNAL_ERROR", message: "生成失败，请稍后重试" },
      { status: 500 },
    );
  }
}
