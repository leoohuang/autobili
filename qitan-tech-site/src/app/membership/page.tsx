import Link from "next/link";
import { SectionTitle } from "@/components/marketing/section-title";

export default function MembershipPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-18">
      <SectionTitle
        eyebrow="Membership"
        title="会员体系入口"
        description="先建立会员注册和登录体系，后续可以继续接课程权益、专栏、社群和订阅服务。"
      />

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {[
          {
            title: "会员专属文章",
            text: "未来可以扩展为仅会员可见的深度研究、工具清单和课程配套资料。",
          },
          {
            title: "学习路径沉淀",
            text: "把视频、博客、训练营连接成一条系统学习路径，而不是零散消费内容。",
          },
          {
            title: "长期私域运营",
            text: "注册会员后可以进一步承接邮件、社群、活动和课程通知。",
          },
        ].map((item) => (
          <article key={item.title} className="panel rounded-[2rem] p-8">
            <h2 className="text-2xl font-semibold">{item.title}</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">{item.text}</p>
          </article>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link href="/auth/register" className="rounded-full bg-slate-950 px-6 py-3 font-medium text-white">
          注册会员
        </Link>
        <Link href="/auth/login" className="rounded-full border border-slate-300 px-6 py-3 font-medium text-slate-900">
          已有账号，去登录
        </Link>
      </div>
    </div>
  );
}
