import { db } from "@/lib/db";

export type SiteStat = {
  label: string;
  value: string;
  note: string;
};

export const fallbackSiteSettings = {
  siteName: "启探科技",
  siteTagline: "AI Content + Training Platform",
  heroBadge: "专业 AI 内容、课程与企业培训平台",
  heroTitle: "把 AI 判断力\n做成可持续增长的内容与产品",
  heroSubtitle:
    "启探科技面向中文市场提供高质量 AI 博客、深度视频、会员学习内容与企业培训服务，把专业能力从单点创作升级成长期品牌资产。",
  primaryButtonLabel: "成为会员",
  primaryButtonHref: "/membership",
  secondaryButtonLabel: "查看企业服务",
  secondaryButtonHref: "/services",
  primaryColor: "#ff8e53",
  accentColor: "#f97316",
  darkColor: "#0d1117",
  heroImage: "/brand/hero-art.png",
  teamImage: "/brand/team.jpg",
  stats: [
    { label: "B站基础", value: "45万+", note: "创始人既有认知影响力" },
    { label: "合作平台", value: "20+", note: "Flowith、飞书、腾讯新闻等" },
    { label: "年度方向", value: "3条", note: "内容、课程、企业服务并行" },
  ] satisfies SiteStat[],
  statsJson: JSON.stringify(
    [
      { label: "B站基础", value: "45万+", note: "创始人既有认知影响力" },
      { label: "合作平台", value: "20+", note: "Flowith、飞书、腾讯新闻等" },
      { label: "年度方向", value: "3条", note: "内容、课程、企业服务并行" },
    ],
    null,
    2
  ),
};

export async function getSiteSettings() {
  const settings = await db.siteSettings.findUnique({
    where: { id: "main" },
  });

  if (!settings) {
    return fallbackSiteSettings;
  }

  let stats = fallbackSiteSettings.stats;
  try {
    const parsed = JSON.parse(settings.statsJson);
    if (Array.isArray(parsed)) {
      stats = parsed.filter(Boolean);
    }
  } catch {}

  return {
    ...settings,
    stats,
  };
}
