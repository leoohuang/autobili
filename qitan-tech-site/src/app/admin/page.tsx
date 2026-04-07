import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { getAdminSummary } from "@/app/actions";

export default async function AdminPage() {
  const { posts, videos, users } = await getAdminSummary();

  return (
    <div className="mx-auto max-w-7xl px-6 py-18">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ff6f3c]">Admin</p>
          <h1 className="mt-4 text-5xl font-semibold">启探科技后台</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/appearance" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-900">
            前台视觉设置
          </Link>
          <Link href="/admin/posts/new" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
            发布博客
          </Link>
          <Link href="/admin/videos/new" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-900">
            发布视频
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <section className="panel rounded-[2rem] p-6">
          <h2 className="text-2xl font-semibold">最近博客</h2>
          <div className="mt-6 space-y-4">
            {posts.map((post) => (
              <article key={post.id} className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{post.title}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {post.published ? "已发布" : "草稿"} · {format(post.createdAt, "PPP", { locale: zhCN })}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="panel rounded-[2rem] p-6">
          <h2 className="text-2xl font-semibold">最近视频</h2>
          <div className="mt-6 space-y-4">
            {videos.map((video) => (
              <article key={video.id} className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{video.title}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {video.published ? "已发布" : "草稿"} · {format(video.createdAt, "PPP", { locale: zhCN })}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="panel rounded-[2rem] p-6">
          <h2 className="text-2xl font-semibold">最近用户</h2>
          <div className="mt-6 space-y-4">
            {users.map((user) => (
              <article key={user.id} className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{user.name}</p>
                <p className="mt-2 text-sm text-slate-500">{user.email}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {user.role} · {format(user.createdAt, "PPP", { locale: zhCN })}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
