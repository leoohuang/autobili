import { notFound } from "next/navigation";
import { renderParagraphs } from "@/lib/utils";
import { db } from "@/lib/db";

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await db.post.findUnique({
    where: { slug },
    include: { author: { select: { name: true } } },
  });

  if (!post || !post.published) {
    notFound();
  }

  const paragraphs = renderParagraphs(post.content);

  return (
    <article className="mx-auto max-w-4xl px-6 py-18">
      <div className="panel rounded-[2rem] p-8 md:p-12">
        <p className="text-sm text-slate-500">{post.author.name}</p>
        <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{post.title}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">{post.excerpt}</p>

        <div className="prose-rich mt-10 space-y-6 text-base leading-8 text-slate-700">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
