import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { SectionTitle } from "@/components/marketing/section-title";
import { db } from "@/lib/db";

export default async function BlogPage() {
  const posts = await db.post.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-18">
      <SectionTitle
        eyebrow="Blog"
        title="博客与专业洞察"
        description="承接启探科技的长期知识沉淀，适合发布行业分析、课程预告、方法论文章和品牌观点。"
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="panel rounded-[2rem] p-8">
            <p className="text-sm text-slate-500">
              {post.author.name} · {post.publishedAt ? format(post.publishedAt, "PPP", { locale: zhCN }) : "未发布"}
            </p>
            <h2 className="mt-4 text-2xl font-semibold">{post.title}</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
