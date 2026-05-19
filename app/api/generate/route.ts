import {
  probeSubtitles,
  resolveBvidDetails,
  summarizeSubtitleProbe,
} from "@/lib/bilibili";
import { getOpenAIClient } from "@/lib/openai";
import { PROMPT_A, PROMPT_B } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

type AnalysisResult = {
  total_words?: number;
  hook?: {
    type?: string;
  };
};

function buildAnalysisPrompt(transcript: string): string {
  return PROMPT_A.replaceAll("{transcript}", transcript);
}

function buildScriptPrompt(params: {
  analysis: string;
  userTopic: string;
  targetWords: number;
  targetMinutes: string;
  hookType: string;
}): string {
  return PROMPT_B.replaceAll("{analysis}", params.analysis)
    .replaceAll("{user_topic}", params.userTopic)
    .replaceAll("{target_words}", String(params.targetWords))
    .replaceAll("{target_minutes}", params.targetMinutes)
    .replaceAll("{hook_type}", params.hookType);
}

export async function POST(request: Request) {
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

    const transcript = probe.transcript;
    const openai = getOpenAIClient();
    const analysisPrompt = buildAnalysisPrompt(transcript);
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      response_format: { type: "json_object" },
    });

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
    const targetWords = Math.max(1, Math.round(analysis.total_words ?? 0));
    const targetMinutes = (targetWords / 240).toFixed(1);
    const hookType = analysis.hook?.type ?? "其他";
    const scriptPrompt = buildScriptPrompt({
      analysis: JSON.stringify(analysis, null, 2),
      userTopic: topic,
      targetWords,
      targetMinutes,
      hookType,
    });

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: scriptPrompt,
        },
      ],
      stream: true,
    });

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

    if (error instanceof Error && error.message === "MISSING_OPENAI_API_KEY") {
      return Response.json(
        { error: "MISSING_OPENAI_API_KEY", message: "缺少 OPENAI_API_KEY" },
        { status: 500 },
      );
    }

    if (error instanceof Error && error.message === "EMPTY_ANALYSIS") {
      return Response.json(
        { error: "EMPTY_ANALYSIS", message: "AI 返回的分析结果为空，请重试" },
        { status: 500 },
      );
    }

    if (error instanceof Error && error.message === "INVALID_ANALYSIS_JSON") {
      return Response.json(
        { error: "INVALID_ANALYSIS_JSON", message: "AI 返回的分析结果格式异常，请重试" },
        { status: 500 },
      );
    }

    return Response.json(
      { error: "INTERNAL_ERROR", message: "生成失败，请稍后重试" },
      { status: 500 },
    );
  }
}
