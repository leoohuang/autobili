import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { renderParagraphs } from "@/lib/utils";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const video = await db.video.findUnique({
    where: { slug },
    include: { author: { select: { name: true } } },
  });

  if (!video || !video.published) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-5xl px-6 py-18">
      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="panel overflow-hidden rounded-[2rem] p-4">
          <Image
            src={video.thumbnailUrl || "/brand/classroom.jpg"}
            alt={video.title}
            width={750}
            height={1000}
            className="h-full w-full rounded-[1.5rem] object-cover"
          />
        </div>
        <div className="panel rounded-[2rem] p-8">
          <p className="text-sm text-slate-500">{video.platform}</p>
          <h1 className="mt-4 text-4xl font-semibold">{video.title}</h1>
          <p className="mt-4 text-base leading-8 text-slate-600">{video.excerpt}</p>
          <div className="mt-6 space-y-3 text-sm text-slate-500">
            <p>作者：{video.author.name}</p>
            <p>时长：{video.duration || "未填写"}</p>
          </div>
          <Link
            href={video.videoUrl}
            target="_blank"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-medium text-white"
          >
            前往观看
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <div className="panel prose-rich mt-8 rounded-[2rem] p-8 md:p-10">
        {renderParagraphs(video.description).map((paragraph) => (
          <p key={paragraph} className="text-base leading-8 text-slate-700">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
