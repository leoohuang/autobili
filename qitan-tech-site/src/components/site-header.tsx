import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/blog", label: "博客" },
  { href: "/videos", label: "视频" },
  { href: "/services", label: "服务" },
  { href: "/membership", label: "会员" },
];

export async function SiteHeader() {
  const session = await getSession();
  const settings = await getSiteSettings();

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/10 backdrop-blur"
      style={{ backgroundColor: `${settings.darkColor}cc` }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-white"
            style={{
              backgroundImage: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.accentColor})`,
            }}
          >
            {settings.siteName.slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{settings.siteName}</p>
            <p className="text-xs text-white/50">{settings.siteTagline}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-white/72 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                href={session.role === "ADMIN" ? "/admin" : "/me"}
                className="rounded-full border border-white/14 px-4 py-2 text-sm text-white transition hover:border-white/28"
              >
                {session.role === "ADMIN" ? "后台管理" : "个人中心"}
              </Link>
              <Link
                href="/auth/logout"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#0d1117]"
              >
                退出
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-full border border-white/14 px-4 py-2 text-sm text-white transition hover:border-white/28"
              >
                登录
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#0d1117]"
              >
                注册会员
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
