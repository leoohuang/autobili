import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { requireUser } from "@/lib/auth";

export default async function MePage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-4xl px-6 py-18">
      <div className="panel rounded-[2rem] p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ff6f3c]">Member Center</p>
        <h1 className="mt-4 text-4xl font-semibold">你好，{user.name}</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">账号邮箱</p>
            <p className="mt-2 font-medium text-slate-900">{user.email}</p>
          </article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">当前角色</p>
            <p className="mt-2 font-medium text-slate-900">{user.role}</p>
          </article>
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">注册时间</p>
            <p className="mt-2 font-medium text-slate-900">{format(user.createdAt, "PPP", { locale: zhCN })}</p>
          </article>
        </div>
      </div>
    </div>
  );
}
