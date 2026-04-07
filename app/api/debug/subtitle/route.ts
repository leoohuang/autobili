import {
  fetchSubtitleContent,
  fetchSubtitleList,
  fetchVideoInfo,
  resolveBvid,
} from "@/lib/bilibili";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawInput = searchParams.get("input")?.trim();
  const rawBvid = searchParams.get("bvid")?.trim();
  const bvid = rawBvid || rawInput ? await resolveBvid(rawBvid || rawInput || "") : "";

  if (!bvid) {
    return Response.json(
      { error: "缺少可识别的 bvid 或视频链接" },
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

  try {
    const videoInfo = await fetchVideoInfo(bvid);
    title = videoInfo.title;
    cid = videoInfo.cid;

    subtitleList = await fetchSubtitleList(bvid, cid);
    firstSubtitleUrl =
      typeof subtitleList[0] === "object" &&
      subtitleList[0] !== null &&
      "subtitle_url" in subtitleList[0] &&
      typeof subtitleList[0].subtitle_url === "string"
        ? subtitleList[0].subtitle_url
        : null;

    if (!firstSubtitleUrl) {
      throw new Error("NO_SUBTITLE");
    }

    const transcript = await fetchSubtitleContent(firstSubtitleUrl);
    transcriptPreview = transcript.slice(0, 200);
    transcriptLength = transcript.length;
  } catch (caughtError) {
    console.error(caughtError);
    error =
      caughtError instanceof Error ? caughtError.message : "UNKNOWN_ERROR";
  }

  return Response.json({
    bvid,
    title,
    cid,
    subtitle_list: subtitleList,
    first_subtitle_url: firstSubtitleUrl,
    transcript_preview: transcriptPreview,
    transcript_length: transcriptLength,
    error,
  });
}
