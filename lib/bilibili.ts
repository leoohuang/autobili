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
        throw new Error(`BILIBILI_HTTP_${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));

      const isRetryableError =
        error instanceof TypeError || // network failure / DNS error
        lastError.name === "AbortError"; // timeout / abort (works in both Node.js and browser)

      if (isRetryableError && attempt < retries) {
        // Wait 500ms before retry
        await new Promise((resolve) => setTimeout(resolve, 500));
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

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(trimmedInput);
  } catch {
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

      const isRetryableError =
        error instanceof TypeError || // network failure / DNS error
        lastError.name === "AbortError"; // timeout / abort

      if (isRetryableError && attempt < MAX_RETRIES) {
        // Wait 500ms before retry
        await new Promise((resolve) => setTimeout(resolve, 500));
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
  return fetchJson<ViewResponse>(viewUrl);
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

    for (const page of pages) {
      let attemptError: string | null = null;
      let attemptSubtitleList: BilibiliSubtitleItem[] = [];
      let attemptSubtitleUrl: string | null = null;
      let attemptTranscriptLength = 0;

      try {
        attemptSubtitleList = await fetchSubtitleList(bvid, page.cid);
        attemptSubtitleUrl = attemptSubtitleList[0]?.subtitle_url ?? null;

        if (attemptSubtitleUrl) {
          const nextTranscript = await fetchSubtitleContent(attemptSubtitleUrl);
          attemptTranscriptLength = nextTranscript.length;

          if (!firstSubtitleUrl) {
            cid = page.cid;
            selectedPage = page.page;
            selectedPart = page.part;
            subtitleList = attemptSubtitleList;
            firstSubtitleUrl = attemptSubtitleUrl;
            transcriptPreview = nextTranscript.slice(0, 200);
            transcriptLength = nextTranscript.length;
            transcript = nextTranscript;
            // Found valid transcript — no need to probe remaining pages
            pageAttempts.push({
              page: page.page,
              part: page.part,
              cid: page.cid,
              subtitle_count: attemptSubtitleList.length,
              first_subtitle_url: attemptSubtitleUrl,
              transcript_length: attemptTranscriptLength,
              error: null,
            });
            break;
          }
        } else {
          attemptError = "NO_SUBTITLE";
        }
      } catch (caughtAttemptError) {
        console.error(caughtAttemptError);
        attemptError =
          caughtAttemptError instanceof Error
            ? caughtAttemptError.name === "AbortError"
              ? "TIMEOUT"
              : caughtAttemptError.message
            : "UNKNOWN_ERROR";
      }

      pageAttempts.push({
        page: page.page,
        part: page.part,
        cid: page.cid,
        subtitle_count: attemptSubtitleList.length,
        first_subtitle_url: attemptSubtitleUrl,
        transcript_length: attemptTranscriptLength,
        error: attemptError,
      });
    }

    if (!firstSubtitleUrl) {
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
