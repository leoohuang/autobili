const BILIBILI_HEADERS = {
  "User-Agent": "Mozilla/5.0",
};

export type VideoInfo = {
  cid: number;
  title: string;
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

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: BILIBILI_HEADERS,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`BILIBILI_HTTP_${response.status}`);
  }

  return (await response.json()) as T;
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

export async function resolveBvid(input: string): Promise<string | null> {
  const result = await resolveBvidDetails(input);
  return result.bvid;
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

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: BILIBILI_HEADERS,
      redirect: "follow",
      cache: "no-store",
    });
    const finalUrl = response.url || parsedUrl.toString();
    return {
      bvid: extractBvid(finalUrl),
      source: "redirect_url",
      finalUrl,
    };
  } catch (error) {
    console.error(error);
    return {
      bvid: extractBvid(parsedUrl.toString()),
      source: "fallback_url",
      finalUrl: parsedUrl.toString(),
    };
  }
}

export async function fetchVideoInfo(bvid: string): Promise<VideoInfo> {
  const viewUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(
    bvid,
  )}`;
  const viewData = await fetchJson<ViewResponse>(viewUrl);
  const cid = viewData.data?.cid;
  const title = viewData.data?.title?.trim();

  if (!cid || !title) {
    throw new Error("NO_SUBTITLE");
  }

  return { cid, title };
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
  const { cid } = await fetchVideoInfo(bvid);
  const subtitleList = await fetchSubtitleList(bvid, cid);
  const subtitleUrl = subtitleList[0]?.subtitle_url;

  if (!subtitleUrl) {
    throw new Error("NO_SUBTITLE");
  }

  return fetchSubtitleContent(subtitleUrl);
}
