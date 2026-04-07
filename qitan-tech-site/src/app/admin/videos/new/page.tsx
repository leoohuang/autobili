import { createVideoAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";

export default async function NewVideoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-4xl px-6 py-18">
      <div className="panel rounded-[2rem] p-8 md:p-10">
        <h1 className="text-4xl font-semibold">发布视频</h1>
        {params.error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {params.error}
          </div>
        ) : null}
        <form action={createVideoAction} className="mt-8 space-y-5">
          <input name="title" required placeholder="视频标题" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          <input name="excerpt" required placeholder="视频摘要" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          <textarea name="description" required rows={10} placeholder="视频说明文案" className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 outline-none" />
          <select name="platform" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none">
            <option value="BILIBILI">Bilibili</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="DOUYIN">抖音</option>
            <option value="OTHER">其他</option>
          </select>
          <input name="videoUrl" required placeholder="视频链接 URL" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          <input name="thumbnailUrl" placeholder="缩略图 URL，可为空" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          <input name="duration" placeholder="时长，例如 18:40" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="featured" value="on" />
              设为首页推荐
            </label>
            <label className="text-sm text-slate-700">
              发布状态
              <select name="publish" className="ml-3 rounded-full border border-slate-200 px-4 py-2">
                <option value="publish">直接发布</option>
                <option value="draft">保存草稿</option>
              </select>
            </label>
          </div>
          <button type="submit" className="rounded-full bg-slate-950 px-6 py-3 font-medium text-white">
            保存视频
          </button>
        </form>
      </div>
    </div>
  );
}
