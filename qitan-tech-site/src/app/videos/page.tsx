import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { SectionTitle } from "@/components/marketing/section-title";
import { db } from "@/lib/db";

export default async function VideosPage() {
  const videos = await db.video.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-18">
      <SectionTitle
        eyebrow="Videos"
        title="视频内容中心"
        description="这里统一承接 B 站、YouTube、抖音等平台的深度内容，方便官网访客浏览并完成后续转化。"
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {videos.map((video) => (
          <Link key={video.id} href={`/videos/${video.slug}`} className="panel rounded-[2rem] p-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">{video.platform}</p>
              <PlayCircle className="h-5 w-5 text-[#ff6f3c]" />
            </div>
            <h2 className="mt-4 text-2xl font-semibold">{video.title}</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">{video.excerpt}</p>
            <p className="mt-4 text-sm text-slate-500">作者：{video.author.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
