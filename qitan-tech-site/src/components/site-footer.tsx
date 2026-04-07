import { getSiteSettings } from "@/lib/site-settings";

export async function SiteFooter() {
  const settings = await getSiteSettings();

  return (
    <footer className="border-t border-black/8 bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-10 text-sm text-slate-600 md:grid-cols-3">
        <div>
          <p className="font-semibold text-slate-900">{settings.siteName}</p>
          <p className="mt-2 leading-7">
            专注 AI 专业内容、课程产品与企业培训，帮助个人和团队建立长期 AI 能力。
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">核心栏目</p>
          <ul className="mt-2 space-y-2">
            <li>博客洞察</li>
            <li>视频内容</li>
            <li>会员专区</li>
            <li>企业服务</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-900">当前版本</p>
          <p className="mt-2 leading-7">
            已支持博客发布、视频发布、会员注册登录和管理员后台，可继续扩展课程购买、支付和企业线索表单。
          </p>
        </div>
      </div>
    </footer>
  );
}
