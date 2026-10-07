import {
  probeSubtitles,
  resolveBvidDetails,
} from "@/lib/bilibili";

export const runtime = "nodejs";
// Wall-clock ceiling for the debug probe. This route runs the SAME expensive,
// multi-page Bilibili work as /api/generate (resolveBvidDetails + probeSubtitles
// -> fetchViewData + up to N parallel subtitle fetches), and every fetchJson call
// already carries its own 10s timeout plus retries. On a multi-page video with
// retries the probe can easily run past Vercel's default 10s function ceiling,
// so without this cap the platform kills the function mid-probe and the user gets
// a bare 500/504 instead of the subtitle debug payload. The generate route sets
// 300 (see there for the platform-clamp rationale); this route makes NO OpenAI
// call, so its realistic worst case is only the Bilibili fetch fan-out, and 120s
// leaves comfortable headroom without over-committing to the plan maximum.
export const maxDuration = 120;

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
