import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, BookOpen, BriefcaseBusiness, PlayCircle, Sparkles, Users } from "lucide-react";
import { SectionTitle } from "@/components/marketing/section-title";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";

export default async function Home() {
  const [featuredPosts, featuredVideos, settings] = await Promise.all([
    db.post.findMany({
      where: { published: true, featured: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
      include: { author: { select: { name: true } } },
    }),
    db.video.findMany({
      where: { published: true, featured: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
      include: { author: { select: { name: true } } },
    }),
    getSiteSettings(),
  ]);

  return (
    <div>
      <section
        className="grain-bg overflow-hidden"
        style={
          {
            backgroundImage: `radial-gradient(circle at top left, ${settings.primaryColor}33, transparent 24%), radial-gradient(circle at top right, ${settings.accentColor}24, transparent 24%), linear-gradient(180deg, ${settings.darkColor} 0%, #111827 100%)`,
          } as CSSProperties
        }
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-[1.05fr_0.95fr] md:py-28">
          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/72">
              <Sparkles className="h-4 w-4" style={{ color: settings.primaryColor }} />
              {settings.heroBadge}
            </div>
            <div className="space-y-6">
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.92] text-white md:text-7xl">
                {settings.heroTitle.split("\n").map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-white/72">
                {settings.heroSubtitle}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href={settings.primaryButtonHref}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-medium text-slate-950"
              >
                {settings.primaryButtonLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={settings.secondaryButtonHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/16 px-6 py-3 font-medium text-white"
              >
                {settings.secondaryButtonLabel}
              </Link>
            </div>
            <div className="grid gap-4 pt-4 md:grid-cols-3">
              {settings.stats.map((stat) => (
                <article key={stat.label} className="rounded-3xl border border-white/10 bg-white/6 p-5">
                  <p className="text-sm text-white/55">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
                  <p className="mt-2 text-sm leading-6 text-white/65">{stat.note}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute -right-20 -top-12 h-48 w-48 rounded-full blur-3xl"
              style={{ backgroundColor: `${settings.accentColor}33` }}
            />
            <div className="panel relative overflow-hidden rounded-[2rem] border-white/12 bg-white/8 p-5">
              <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[1.75rem] bg-[#131d29] p-4">
                  <Image
                    src={settings.heroImage}
                    alt="启探科技品牌插画"
                    width={1472}
                    height={1104}
                    className="h-full rounded-[1.4rem] object-cover"
                    priority
                  />
                </div>
                <div className="grid gap-4">
                  <article className="rounded-[1.75rem] bg-white p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: settings.accentColor }}>
                      内容矩阵
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-950">博客、视频、训练营统一承接</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      官网不只是展示页，而是内容发布、用户注册、线索转化和会员沉淀的统一入口。
                    </p>
                  </article>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <article className="rounded-[1.75rem] bg-[#131d29] p-5 text-white">
                      <p className="text-sm text-white/60">专业定位</p>
                      <p className="mt-3 text-xl font-semibold">深度 AI 内容</p>
                    </article>
                    <article
                      className="rounded-[1.75rem] p-5 text-white"
                      style={{ backgroundColor: settings.accentColor }}
                    >
                      <p className="text-sm text-white/70">增长目标</p>
                      <p className="mt-3 text-xl font-semibold">会员与企业双转化</p>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionTitle
          eyebrow="What We Build"
          title="官网的三条主线"
          description="网站围绕品牌表达、内容中台和商业转化来设计，让访客能快速理解启探科技的专业性与服务深度。"
          align="center"
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: "博客与知识沉淀",
              text: "发布 AI 洞察、课程预告、行业分析和方法论文章，长期积累搜索与品牌资产。",
            },
            {
              icon: PlayCircle,
              title: "视频与多平台分发",
              text: "同步展示 B 站、YouTube、抖音等视频内容，打通内容消费与课程转化。",
            },
            {
              icon: Users,
              title: "会员与企业服务",
              text: "承接会员注册、学习权益展示和企业培训咨询，把流量转成长期用户关系。",
            },
          ].map((item) => (
            <article key={item.title} className="panel rounded-[2rem] p-8">
              <item.icon className="h-10 w-10 text-[#ff6f3c]" />
              <h3 className="mt-6 text-2xl font-semibold">{item.title}</h3>
              <p className="mt-4 text-base leading-8 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <article className="panel rounded-[2rem] p-8">
            <SectionTitle
              eyebrow="Featured Blog"
              title="最新博客内容"
              description="围绕 AI 专业内容、产品化方法和企业应用场景，持续发布深度文章。"
            />
            <div className="mt-8 space-y-4">
              {featuredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="block rounded-[1.5rem] border border-slate-200/70 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <p className="text-sm text-slate-500">{post.author.name}</p>
                  <h3 className="mt-2 text-xl font-semibold">{post.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </article>

          <article className="panel rounded-[2rem] p-8">
            <SectionTitle
              eyebrow="Featured Video"
              title="深度视频入口"
              description="视频页会持续承接平台内容，并把用户导流到课程、社群和会员体系。"
            />
            <div className="mt-8 space-y-4">
              {featuredVideos.map((video) => (
                <Link
                  key={video.id}
                  href={`/videos/${video.slug}`}
                  className="block rounded-[1.5rem] border border-slate-200/70 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <p className="text-sm text-slate-500">{video.platform}</p>
                  <h3 className="mt-2 text-xl font-semibold">{video.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{video.excerpt}</p>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 md:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <SectionTitle
            eyebrow="Enterprise Services"
            title="服务企业，把 AI 能力真正落地"
            description="启探科技的官网不仅服务个人用户，也服务正在建设 AI 组织能力的企业团队。"
          />
          <div className="space-y-4 text-base leading-8 text-slate-600">
            <p>我们面向企业提供 AI 培训工作坊、内容合作策划、行业洞察分享和团队效率升级方案。</p>
            <p>这部分会成为未来官网的重要转化入口，也和博客、视频内容形成相互增强的飞轮。</p>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 font-medium text-white"
            style={{ backgroundColor: settings.darkColor }}
          >
            查看服务方案
            <BriefcaseBusiness className="h-4 w-4" />
          </Link>
        </div>
        <div className="panel overflow-hidden rounded-[2rem] p-4">
          <Image
            src={settings.teamImage}
            alt="启探科技团队形象"
            width={384}
            height={512}
            className="h-[420px] w-full rounded-[1.5rem] object-cover"
          />
        </div>
      </section>
    </div>
  );
}
