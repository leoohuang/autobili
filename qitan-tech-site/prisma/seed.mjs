import bcrypt from "bcryptjs";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Qitan2026!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@qitantech.com" },
    update: {},
    create: {
      name: "启探科技管理员",
      email: "admin@qitantech.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.post.upsert({
    where: { slug: "ai-content-to-product" },
    update: {},
    create: {
      title: "从 AI 内容团队到产品化公司，启探科技的下一步",
      slug: "ai-content-to-product",
      excerpt: "把创始人的判断力沉淀成课程、内容资产与企业服务，是启探科技 2026 年的主命题。",
      content:
        "过去一年，启探科技已经验证了专业 AI 内容的真实需求。下一阶段，我们会把内容能力升级为可复制的产品能力，围绕课程、企业培训和会员服务持续建设。\n\n官网将承担三件事：品牌表达、内容分发、会员转化。",
      coverImage: "/brand/hero-art.png",
      published: true,
      featured: true,
      publishedAt: new Date(),
      authorId: admin.id,
    },
  });

  await prisma.video.upsert({
    where: { slug: "deep-ai-learning-roadmap" },
    update: {},
    create: {
      title: "如何系统进入 AI 深度学习赛道",
      slug: "deep-ai-learning-roadmap",
      excerpt: "一支面向中文用户的 AI 学习路径视频，串联工具、课程与长期能力建设。",
      description:
        "启探科技的视频内容以专业拆解、课程延展和企业落地为核心，帮助用户建立长期 AI 能力。",
      platform: "BILIBILI",
      videoUrl: "https://www.bilibili.com/",
      thumbnailUrl: "/brand/classroom.jpg",
      duration: "18:40",
      featured: true,
      published: true,
      publishedAt: new Date(),
      authorId: admin.id,
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
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
      statsJson: JSON.stringify([
        { label: "B站基础", value: "45万+", note: "创始人既有认知影响力" },
        { label: "合作平台", value: "20+", note: "Flowith、飞书、腾讯新闻等" },
        { label: "年度方向", value: "3条", note: "内容、课程、企业服务并行" },
      ]),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
