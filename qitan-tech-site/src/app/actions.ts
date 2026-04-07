"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearSession, createSession, hashPassword, requireAdmin, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const postSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().min(12),
  content: z.string().min(20),
  coverImage: z.string().optional(),
  publish: z.enum(["draft", "publish"]),
  featured: z.enum(["off", "on"]).optional(),
});

const videoSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().min(12),
  description: z.string().min(20),
  platform: z.enum(["BILIBILI", "YOUTUBE", "DOUYIN", "OTHER"]),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().optional(),
  duration: z.string().optional(),
  publish: z.enum(["draft", "publish"]),
  featured: z.enum(["off", "on"]).optional(),
});

const settingsSchema = z.object({
  siteName: z.string().min(2),
  siteTagline: z.string().min(2),
  heroBadge: z.string().min(2),
  heroTitle: z.string().min(6),
  heroSubtitle: z.string().min(20),
  primaryButtonLabel: z.string().min(2),
  primaryButtonHref: z.string().min(1),
  secondaryButtonLabel: z.string().min(2),
  secondaryButtonHref: z.string().min(1),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  darkColor: z.string().regex(/^#([A-Fa-f0-9]{6})$/),
  heroImage: z.string().min(1),
  teamImage: z.string().min(1),
  statsJson: z.string().min(10),
});

export async function registerAction(formData: FormData) {
  const parsed = authSchema.extend({ name: z.string().min(2).max(40) }).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/auth/register?error=表单信息不完整");
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    redirect("/auth/register?error=该邮箱已注册");
  }

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  redirect("/me");
}

export async function loginAction(formData: FormData) {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/auth/login?error=请输入正确的邮箱和密码");
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    redirect("/auth/login?error=邮箱或密码错误");
  }

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  redirect(user.role === "ADMIN" ? "/admin" : "/me");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function createPostAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    coverImage: formData.get("coverImage") || "",
    publish: formData.get("publish"),
    featured: formData.get("featured") || "off",
  });

  if (!parsed.success) {
    redirect("/admin/posts/new?error=请完整填写博客内容");
  }

  await db.post.create({
    data: {
      title: parsed.data.title,
      slug: slugify(parsed.data.title),
      excerpt: parsed.data.excerpt,
      content: parsed.data.content,
      coverImage: parsed.data.coverImage || null,
      published: parsed.data.publish === "publish",
      featured: parsed.data.featured === "on",
      publishedAt: parsed.data.publish === "publish" ? new Date() : null,
      authorId: admin.id,
    },
  });

  revalidatePath("/blog");
  revalidatePath("/");
  redirect("/admin?created=post");
}

export async function createVideoAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = videoSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    description: formData.get("description"),
    platform: formData.get("platform"),
    videoUrl: formData.get("videoUrl"),
    thumbnailUrl: formData.get("thumbnailUrl") || "",
    duration: formData.get("duration") || "",
    publish: formData.get("publish"),
    featured: formData.get("featured") || "off",
  });

  if (!parsed.success) {
    redirect("/admin/videos/new?error=请完整填写视频内容");
  }

  await db.video.create({
    data: {
      title: parsed.data.title,
      slug: slugify(parsed.data.title),
      excerpt: parsed.data.excerpt,
      description: parsed.data.description,
      platform: parsed.data.platform,
      videoUrl: parsed.data.videoUrl,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
      duration: parsed.data.duration || null,
      published: parsed.data.publish === "publish",
      featured: parsed.data.featured === "on",
      publishedAt: parsed.data.publish === "publish" ? new Date() : null,
      authorId: admin.id,
    },
  });

  revalidatePath("/videos");
  revalidatePath("/");
  redirect("/admin?created=video");
}

export async function updateSiteSettingsAction(formData: FormData) {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    siteName: formData.get("siteName"),
    siteTagline: formData.get("siteTagline"),
    heroBadge: formData.get("heroBadge"),
    heroTitle: formData.get("heroTitle"),
    heroSubtitle: formData.get("heroSubtitle"),
    primaryButtonLabel: formData.get("primaryButtonLabel"),
    primaryButtonHref: formData.get("primaryButtonHref"),
    secondaryButtonLabel: formData.get("secondaryButtonLabel"),
    secondaryButtonHref: formData.get("secondaryButtonHref"),
    primaryColor: formData.get("primaryColor"),
    accentColor: formData.get("accentColor"),
    darkColor: formData.get("darkColor"),
    heroImage: formData.get("heroImage"),
    teamImage: formData.get("teamImage"),
    statsJson: formData.get("statsJson"),
  });

  if (!parsed.success) {
    redirect("/admin/appearance?error=视觉配置格式不正确");
  }

  try {
    const stats = JSON.parse(parsed.data.statsJson);
    if (!Array.isArray(stats)) {
      throw new Error("Invalid stats");
    }
  } catch {
    redirect("/admin/appearance?error=统计数据必须是 JSON 数组");
  }

  await db.siteSettings.upsert({
    where: { id: "main" },
    update: {
      ...parsed.data,
    },
    create: {
      id: "main",
      ...parsed.data,
    },
  });

  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/videos");
  revalidatePath("/services");
  revalidatePath("/membership");
  revalidatePath("/admin/appearance");
  redirect("/admin/appearance?saved=1");
}

export async function getAdminSummary() {
  await requireAdmin();

  const [posts, videos, users] = await Promise.all([
    db.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, title: true, published: true, createdAt: true },
    }),
    db.video.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, title: true, published: true, createdAt: true },
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  return { posts, videos, users };
}

export type PublicPost = Prisma.PostGetPayload<{
  include: { author: { select: { name: true } } };
}>;

export type PublicVideo = Prisma.VideoGetPayload<{
  include: { author: { select: { name: true } } };
}>;
