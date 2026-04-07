import { loginAction } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-6 py-18">
      <div className="panel rounded-[2rem] p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ff6f3c]">Login</p>
        <h1 className="mt-4 text-4xl font-semibold">登录启探会员系统</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          登录后可进入会员中心；管理员账号还可进入后台发布博客与视频。
        </p>
        {params.error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {params.error}
          </div>
        ) : null}
        <form action={loginAction} className="mt-8 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">邮箱</span>
            <input name="email" type="email" required className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">密码</span>
            <input name="password" type="password" required className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          </label>
          <button type="submit" className="w-full rounded-full bg-slate-950 px-6 py-3 font-medium text-white">
            登录
          </button>
        </form>
      </div>
    </div>
  );
}
