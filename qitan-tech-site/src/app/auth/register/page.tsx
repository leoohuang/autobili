import { registerAction } from "@/app/actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-6 py-18">
      <div className="panel rounded-[2rem] p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ff6f3c]">Register</p>
        <h1 className="mt-4 text-4xl font-semibold">注册启探会员</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">先把基础会员体系搭起来，后续可继续接课程、社群和订阅功能。</p>
        {params.error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {params.error}
          </div>
        ) : null}
        <form action={registerAction} className="mt-8 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">姓名</span>
            <input name="name" required className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">邮箱</span>
            <input name="email" type="email" required className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">密码</span>
            <input name="password" type="password" required minLength={8} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
          </label>
          <button type="submit" className="w-full rounded-full bg-slate-950 px-6 py-3 font-medium text-white">
            创建账号
          </button>
        </form>
      </div>
    </div>
  );
}
