import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const videos = await db.video.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      platform: true,
      videoUrl: true,
      publishedAt: true,
      author: { select: { name: true } },
    },
  });

  return NextResponse.json(videos);
}
