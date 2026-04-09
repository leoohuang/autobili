import {
  probeSubtitles,
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

  const probe = await probeSubtitles(bvid);

  return Response.json({
    input: originalInput,
    bvid,
    resolved_bvid: bvid,
    resolve_source: resolved.source,
    final_url: resolved.finalUrl,
    title: probe.title,
    cid: probe.cid,
    selected_page: probe.selected_page,
    selected_part: probe.selected_part,
    subtitle_list: probe.subtitle_list,
    page_attempts: probe.page_attempts,
    first_subtitle_url: probe.first_subtitle_url,
    transcript_preview: probe.transcript_preview,
    transcript_length: probe.transcript_length,
    error: probe.error,
  });
}
