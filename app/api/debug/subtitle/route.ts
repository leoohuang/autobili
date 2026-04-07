import {
  fetchSubtitleContent,
  fetchSubtitleList,
  fetchVideoInfo,
  fetchVideoPages,
  resolveBvidDetails,
} from "@/lib/bilibili";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawInput = searchParams.get("input")?.trim();
  const rawBvid = searchParams.get("bvid")?.trim();
  const originalInput = rawBvid || rawInput || "";
  const resolved = originalInput
    ? await resolveBvidDetails(originalInput)
    : {
        bvid: null,
        source: "invalid_input" as const,
        finalUrl: null,
      };
  const bvid = resolved.bvid;

  if (!bvid) {
    return Response.json(
      {
        input: originalInput,
        resolved_bvid: null,
        resolve_source: resolved.source,
        final_url: resolved.finalUrl,
        error: "INVALID_BVID_INPUT",
      },
      { status: 400 },
    );
  }

  let title: string | null = null;
  let cid: number | null = null;
  let subtitleList: unknown[] = [];
  let firstSubtitleUrl: string | null = null;
  let transcriptPreview = "";
  let transcriptLength = 0;
  let error: string | null = null;
  let selectedPage: number | null = null;
  let selectedPart: string | null = null;
  let pageAttempts: Array<{
    page: number;
    part: string;
    cid: number;
    subtitle_count: number;
    first_subtitle_url: string | null;
    transcript_length: number;
    error: string | null;
  }> = [];

  try {
    const videoInfo = await fetchVideoInfo(bvid);
    title = videoInfo.title;
    const pages = await fetchVideoPages(bvid);

    for (const page of pages) {
      let attemptError: string | null = null;
      let attemptSubtitleList: unknown[] = [];
      let attemptSubtitleUrl: string | null = null;
      let attemptTranscriptLength = 0;

      try {
        attemptSubtitleList = await fetchSubtitleList(bvid, page.cid);
        attemptSubtitleUrl =
          typeof attemptSubtitleList[0] === "object" &&
          attemptSubtitleList[0] !== null &&
          "subtitle_url" in attemptSubtitleList[0] &&
          typeof attemptSubtitleList[0].subtitle_url === "string"
            ? attemptSubtitleList[0].subtitle_url
            : null;

        if (attemptSubtitleUrl) {
          const transcript = await fetchSubtitleContent(attemptSubtitleUrl);
          attemptTranscriptLength = transcript.length;

          if (!firstSubtitleUrl) {
            cid = page.cid;
            selectedPage = page.page;
            selectedPart = page.part;
            subtitleList = attemptSubtitleList;
            firstSubtitleUrl = attemptSubtitleUrl;
            transcriptPreview = transcript.slice(0, 200);
            transcriptLength = transcript.length;
          }
        } else {
          attemptError = "NO_SUBTITLE";
        }
      } catch (caughtAttemptError) {
        console.error(caughtAttemptError);
        attemptError =
          caughtAttemptError instanceof Error
            ? caughtAttemptError.message
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
      cid = videoInfo.cid;
      throw new Error("NO_SUBTITLE");
    }
  } catch (caughtError) {
    console.error(caughtError);
    error =
      caughtError instanceof Error ? caughtError.message : "UNKNOWN_ERROR";
  }

  return Response.json({
    input: originalInput,
    bvid,
    resolved_bvid: bvid,
    resolve_source: resolved.source,
    final_url: resolved.finalUrl,
    title,
    cid,
    selected_page: selectedPage,
    selected_part: selectedPart,
    subtitle_list: subtitleList,
    page_attempts: pageAttempts,
    first_subtitle_url: firstSubtitleUrl,
    transcript_preview: transcriptPreview,
    transcript_length: transcriptLength,
    error,
  });
}
