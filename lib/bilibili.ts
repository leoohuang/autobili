const BILIBILI_HEADERS = {
  "User-Agent": "Mozilla/5.0",
};

export type VideoPage = {
  cid: number;
  page: number;
  part: string;
};

export type BilibiliSubtitleItem = {
  id?: number;
  id_str?: string;
  lan?: string;
  lan_doc?: string;
  is_lock?: boolean;
  subtitle_url?: string;
  type?: number;
  ai_type?: number;
  ai_status?: number;
  author_mid?: number;
};

export type SubtitlePageAttempt = {
  page: number;
  part: string;
  cid: number;
  subtitle_count: number;
  first_subtitle_url: string | null;
  transcript_length: number;
  error: string | null;
};

export type SubtitleProbeResult = {
  title: string | null;
  cid: number | null;
  selected_page: number | null;
  selected_part: string | null;
  subtitle_list: BilibiliSubtitleItem[];
  page_attempts: SubtitlePageAttempt[];
  first_subtitle_url: string | null;
  transcript_preview: string;
  transcript_length: number;
  transcript: string;
  error: string | null;
};

const BVID_PATTERN = /BV[0-9A-Za-z]+/i;

/**
 * Hosts we are willing to fetch server-side when resolving a short/redirect
 * link to a BV id. Restricting this prevents SSRF: without an allowlist a
 * caller could make the server request arbitrary internal/external URLs
 * (e.g. cloud metadata endpoints or private network services).
 */
const ALLOWED_RESOLVE_HOSTS = new Set(["b23.tv", "bilibili.com"]);

function isAllowedResolveUrl(url: URL): boolean {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return false;
  }
  const hostname = url.hostname.toLowerCase();
  if (ALLOWED_RESOLVE_HOSTS.has(hostname)) {
    return true;
  }
  // Allow subdomains like www.bilibili.com / m.bilibili.com
  return hostname.endsWith(".bilibili.com");
}

/**
 * Matches an absolute http(s) URL embedded anywhere inside a longer string.
 * Stops at whitespace and at CJK punctuation that is never part of a URL but is
 * routinely glued onto one in Bilibili share text (e.g. "链接：https://b23.tv/x，快看").
 */
const URL_IN_TEXT_PATTERN =
  /https?:\/\/[^\s\u3000-\u303f\uff00-\uff65"'<>]+/i;

/**
 * Matches a scheme-less Bilibili host + path, e.g. "b23.tv/8kNq2Xv".
 * Users very often paste the short link without "https://".
 */
const SCHEMELESS_URL_PATTERN =
  /(?:^|[\s\u3000(（\[【])((?:b23\.tv|(?:[a-z0-9-]+\.)*bilibili\.com)\/[^\s\u3000-\u303f\uff00-\uff65"'<>]*)/i;

/** Punctuation that commonly trails a pasted link but is not part of it. */
const TRAILING_NOISE_PATTERN = /[.,;:!?)\]}>'"，。；：！？）】》」』]+$/;

function stripTrailingNoise(candidate: string): string {
  return candidate.replace(TRAILING_NOISE_PATTERN, "");
}

/**
 * Pull a usable URL out of arbitrary user input.
 *
 * Bilibili's mobile app "copy link" produces share text rather than a bare URL,
 * for example:
 *   "【标题-哔哩哔哩】 https://b23.tv/8kNq2Xv"
 * Passing that whole string to `new URL()` throws, which previously made every
 * b23.tv share (the most common way people paste a link) fail with
 * "无法识别 B 站视频链接" — the BV id is not present in the text either, so the
 * direct-match path could not save it.
 *
 * Returns null when no URL-looking substring is present.
 */
function extractUrlCandidate(input: string): string | null {
  const withScheme = input.match(URL_IN_TEXT_PATTERN)?.[0];
  if (withScheme) {
    const cleaned = stripTrailingNoise(withScheme);
    return cleaned || null;
  }

  const schemeless = input.match(SCHEMELESS_URL_PATTERN)?.[1];
  if (schemeless) {
    const cleaned = stripTrailingNoise(schemeless);
    return cleaned ? `https://${cleaned}` : null;
  }

  return null;
}

export type ResolveBvidResult = {
  bvid: string | null;
  source: "direct_match" | "redirect_url" | "fallback_url" | "invalid_input";
  finalUrl: string | null;
};

type ViewResponse = {
  code: number;
  message: string;
  data?: {
    cid?: number;
    title?: string;
    pages?: Array<{
      cid?: number;
      page?: number;
      part?: string;
    }>;
  };
};

type SubtitleListResponse = {
  code: number;
  message: string;
  data?: {
    subtitle?: {
      subtitles?: BilibiliSubtitleItem[];
    };
  };
};

type SubtitleBodyResponse = {
  body?: Array<{
    content?: string;
  }>;
};

const FETCH_TIMEOUT_MS = 10_000; // 10 seconds per request
const MAX_RETRIES = 2;
const MAX_CONCURRENT_SUBTITLE_REQUESTS = 5; // cap concurrent subtitle API calls

const RETRYABLE_HTTP_STATUS = new Set([412, 429, 502, 503, 504]);

class RetryableHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`BILIBILI_HTTP_${status}`);
    this.name = "RetryableHttpError";
    this.status = status;
  }
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError) return true; // network failure / DNS error
  if (error instanceof Error && error.name === "AbortError") return true; // timeout / abort
  if (error instanceof RetryableHttpError) return true; // transient server errors
  return false;
}

/**
 * A lightweight semaphore for limiting concurrent async operations.
 * Uses a promise-based FIFO queue — no busy-waiting, no CPU waste.
 */
class Semaphore {
  private running = 0;
  private waiters: Array<() => void> = [];

  constructor(private readonly limit: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.limit) {
      this.running++;
      return;
    }
    // Park this acquire call in the queue; resolve it when a slot frees up
    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  release(): void {
    if (this.waiters.length > 0) {
      // Wake the oldest waiter — they are responsible for incrementing running
      const next = this.waiters.shift();
      next!();
    } else {
      this.running--;
    }
  }
}

async function fetchJson<T>(url: string, retries = MAX_RETRIES): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        headers: BILIBILI_HEADERS,
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (RETRYABLE_HTTP_STATUS.has(response.status)) {
          throw new RetryableHttpError(response.status);
        }
        throw new Error(`BILIBILI_HTTP_${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (isRetryableError(error) && attempt < retries) {
        // Exponential backoff: 500ms, 1000ms
        const delayMs = 500 * (attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      throw lastError;
    }
  }
  // TypeScript control flow analysis requires this unreachable throw
  throw lastError!;
}

function normalizeSubtitleUrl(subtitleUrl: string): string {
  if (subtitleUrl.startsWith("//")) {
    return `https:${subtitleUrl}`;
  }

  return subtitleUrl;
}

export function extractBvid(input: string): string | null {
  return input.match(BVID_PATTERN)?.[0] ?? null;
}

export async function resolveBvidDetails(
  input: string,
): Promise<ResolveBvidResult> {
  const trimmedInput = input.trim();
  const directMatch = extractBvid(trimmedInput);

  if (directMatch) {
    return {
      bvid: directMatch,
      source: "direct_match",
      finalUrl: null,
    };
  }

  // Accept share text / scheme-less links, not just a bare URL string.
  const urlCandidate = extractUrlCandidate(trimmedInput);

  if (!urlCandidate) {
    return {
      bvid: null,
      source: "invalid_input",
      finalUrl: null,
    };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(urlCandidate);
  } catch {
    return {
      bvid: null,
      source: "invalid_input",
      finalUrl: null,
    };
  }

  // SSRF guard: only fetch URLs on known Bilibili hosts. Anything else
  // (internal IPs, metadata endpoints, arbitrary third-party sites) is
  // rejected without making a server-side request.
  if (!isAllowedResolveUrl(parsedUrl)) {
    return {
      bvid: null,
      source: "invalid_input",
      finalUrl: null,
    };
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(parsedUrl.toString(), {
        headers: BILIBILI_HEADERS,
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const finalUrl = response.url || parsedUrl.toString();
      return {
        bvid: extractBvid(finalUrl),
        source: "redirect_url",
        finalUrl,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        // Exponential backoff: 500ms, 1000ms
        const delayMs = 500 * (attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // Either non-retryable error or final retry attempt exhausted
      console.error(error);
      return {
        bvid: extractBvid(parsedUrl.toString()),
        source: "fallback_url",
        finalUrl: parsedUrl.toString(),
      };
    }
  }
  // TypeScript control flow analysis requires this unreachable return
  return {
    bvid: extractBvid(parsedUrl.toString()),
    source: "fallback_url" as const,
    finalUrl: parsedUrl.toString(),
  };
}

async function fetchViewData(bvid: string): Promise<ViewResponse> {
  const viewUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(
    bvid,
  )}`;
  const viewData = await fetchJson<ViewResponse>(viewUrl);

  if (viewData.code !== 0) {
    throw new Error(
      `BILIBILI_API_ERROR(${viewData.code}): ${viewData.message || "未知错误"}`,
    );
  }

  if (!viewData.data) {
    throw new Error("VIDEO_DATA_NULL");
  }

  return viewData;
}

export async function fetchVideoPages(bvid: string): Promise<VideoPage[]> {
  const viewData = await fetchViewData(bvid);
  const pages = viewData.data?.pages ?? [];

  return pages
    .map((item) => ({
      cid: item.cid ?? 0,
      page: item.page ?? 0,
      part: item.part?.trim() ?? "",
    }))
    .filter((item) => item.cid > 0);
}

export async function fetchSubtitleList(
  bvid: string,
  cid: number,
): Promise<BilibiliSubtitleItem[]> {
  const subtitleListUrl = `https://api.bilibili.com/x/player/wbi/v2?bvid=${encodeURIComponent(
    bvid,
  )}&cid=${cid}`;
  const subtitleListData = await fetchJson<SubtitleListResponse>(subtitleListUrl);

  if (subtitleListData.code !== 0) {
    throw new Error(
      `BILIBILI_API_ERROR(${subtitleListData.code}): ${subtitleListData.message || "未知错误"}`,
    );
  }

  return subtitleListData.data?.subtitle?.subtitles ?? [];
}

export async function fetchSubtitleContent(url: string): Promise<string> {
  const subtitleData = await fetchJson<SubtitleBodyResponse>(
    normalizeSubtitleUrl(url),
  );
  const transcript = (subtitleData.body ?? [])
    .map((item) => item.content?.trim())
    .filter((content): content is string => Boolean(content))
    .join(" ")
    .trim();

  if (!transcript) {
    throw new Error("NO_SUBTITLE");
  }

  return transcript;
}

export async function fetchSubtitle(bvid: string): Promise<string> {
  const probe = await probeSubtitles(bvid);

  if (!probe.transcript) {
    throw new Error("NO_SUBTITLE");
  }

  return probe.transcript;
}

export async function probeSubtitles(bvid: string): Promise<SubtitleProbeResult> {
  let title: string | null = null;
  let cid: number | null = null;
  let selectedPage: number | null = null;
  let selectedPart: string | null = null;
  let subtitleList: BilibiliSubtitleItem[] = [];
  let firstSubtitleUrl: string | null = null;
  let transcriptPreview = "";
  let transcriptLength = 0;
  let transcript = "";
  let error: string | null = null;
  const pageAttempts: SubtitlePageAttempt[] = [];

  try {
    // Single API call instead of two separate fetchVideoInfo + fetchVideoPages
    const viewData = await fetchViewData(bvid);
    title = viewData.data?.title?.trim() ?? null;

    const pages = (viewData.data?.pages ?? [])
      .map((item) => ({
        cid: item.cid ?? 0,
        page: item.page ?? 0,
        part: item.part?.trim() ?? "",
      }))
      .filter((item) => item.cid > 0);

    // Probe ALL pages and select the one with the longest transcript
    let bestTranscript = "";
    let bestTranscriptLength = 0;
    let bestTranscriptPreview = "";
    let bestSubtitleUrl: string | null = null;
    let bestSubtitleList: BilibiliSubtitleItem[] = [];
    let bestPage: number | null = null;
    let bestPart: string | null = null;
    let bestCid: number | null = null;

    // Submit all pages through a semaphore to cap concurrency.
    // This avoids Bilibili IP rate-limits on multi-page videos while
    // still running multiple requests in parallel (up to MAX_CONCURRENT_SUBTITLE_REQUESTS).
    const subtitleSemaphore = new Semaphore(MAX_CONCURRENT_SUBTITLE_REQUESTS);

    // Pre-allocate pageAttempts in original page order
    for (const page of pages) {
      pageAttempts.push({
        page: page.page,
        part: page.part,
        cid: page.cid,
        subtitle_count: 0,
        first_subtitle_url: null,
        transcript_length: 0,
        error: null,
      });
    }

    // Worker: fetches one page's subtitles, updates shared best* vars, returns record
    const worker = async (page: VideoPage, index: number) => {
      await subtitleSemaphore.acquire();
      try {
        const attemptSubtitleList = await fetchSubtitleList(bvid, page.cid);
        const attemptSubtitleUrl = attemptSubtitleList[0]?.subtitle_url ?? null;
        let attemptTranscriptLength = 0;

        if (attemptSubtitleUrl) {
          const attemptTranscript = await fetchSubtitleContent(attemptSubtitleUrl);
          attemptTranscriptLength = attemptTranscript.length;

          if (attemptTranscriptLength > bestTranscriptLength) {
            // Atomically update shared best* vars (all are primitive writes, safe enough
            // for this single-reader/single-writer scenario)
            bestTranscript = attemptTranscript;
            bestTranscriptLength = attemptTranscriptLength;
            bestTranscriptPreview = attemptTranscript.slice(0, 200);
            bestSubtitleUrl = attemptSubtitleUrl;
            bestSubtitleList = attemptSubtitleList;
            bestPage = page.page;
            bestPart = page.part;
            bestCid = page.cid;
          }
        }

        pageAttempts[index] = {
          page: page.page,
          part: page.part,
          cid: page.cid,
          subtitle_count: attemptSubtitleList.length,
          first_subtitle_url: attemptSubtitleUrl,
          transcript_length: attemptTranscriptLength,
          error: null,
        };
      } catch (caughtError) {
        console.error(caughtError);
        pageAttempts[index] = {
          page: page.page,
          part: page.part,
          cid: page.cid,
          subtitle_count: 0,
          first_subtitle_url: null,
          transcript_length: 0,
          error:
            caughtError instanceof Error
              ? caughtError.name === "AbortError"
                ? "TIMEOUT"
                : caughtError.message
              : "UNKNOWN_ERROR",
        };
      } finally {
        subtitleSemaphore.release();
      }
    };

    // Launch all workers concurrently; semaphore caps actual parallelism at MAX_CONCURRENT_SUBTITLE_REQUESTS
    await Promise.all(pages.map((page, index) => worker(page, index)));

    // Use the best transcript found across all pages
    if (bestTranscriptLength > 0) {
      cid = bestCid;
      selectedPage = bestPage;
      selectedPart = bestPart;
      subtitleList = bestSubtitleList;
      firstSubtitleUrl = bestSubtitleUrl;
      transcriptPreview = bestTranscriptPreview;
      transcriptLength = bestTranscriptLength;
      transcript = bestTranscript;
    } else {
      cid = viewData.data?.cid ?? null;
      error = "NO_SUBTITLE";
    }
  } catch (caughtError) {
    console.error(caughtError);
    error =
      caughtError instanceof Error ? caughtError.message : "UNKNOWN_ERROR";
  }

  return {
    title,
    cid,
    selected_page: selectedPage,
    selected_part: selectedPart,
    subtitle_list: subtitleList,
    page_attempts: pageAttempts,
    first_subtitle_url: firstSubtitleUrl,
    transcript_preview: transcriptPreview,
    transcript_length: transcriptLength,
    transcript,
    error,
  };
}

export function summarizeSubtitleProbe(probe: {
  selected_page: number | null;
  page_attempts: Array<{ subtitle_count: number }>;
  error: string | null;
}) {
  const hitCount = probe.page_attempts.filter((item) => item.subtitle_count > 0).length;
  return `共 ${probe.page_attempts.length} 页，命中 ${hitCount} 页字幕${
    probe.selected_page ? `，当前选中第 ${probe.selected_page} 页` : ""
  }${probe.error ? `，状态：${probe.error}` : "，状态：可用"}`;
}
