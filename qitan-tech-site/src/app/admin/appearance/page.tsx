import { updateSiteSettingsAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";

const statsHint = `[
  { "label": "B站基础", "value": "45万+", "note": "创始人既有认知影响力" },
  { "label": "合作平台", "value": "20+", "note": "Flowith、飞书、腾讯新闻等" },
  { "label": "年度方向", "value": "3条", "note": "内容、课程、企业服务并行" }
]`;

export default async function AppearancePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  await requireAdmin();
  const settings = await getSiteSettings();
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-6xl px-6 py-18">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ff6f3c]">Appearance</p>
          <h1 className="mt-4 text-5xl font-semibold">前台视觉设置</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            这里可以直接改官网的品牌文案、主色、首页主视觉图、团队图和统计卡片，不需要碰代码。
          </p>
        </div>
      </div>

      {params.error ? (
        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {params.error}
        </div>
      ) : null}
      {params.saved ? (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          前台视觉设置已保存，首页和相关页面已经刷新。
        </div>
      ) : null}

      <form action={updateSiteSettingsAction} className="mt-8 grid gap-8">
        <section className="panel rounded-[2rem] p-8">
          <h2 className="text-2xl font-semibold">品牌基础</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">站点名称</span>
              <input name="siteName" defaultValue={settings.siteName} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">站点副标题</span>
              <input name="siteTagline" defaultValue={settings.siteTagline} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
            </label>
          </div>
        </section>

        <section className="panel rounded-[2rem] p-8">
          <h2 className="text-2xl font-semibold">首页 Hero</h2>
          <div className="mt-6 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">徽标文案</span>
              <input name="heroBadge" defaultValue={settings.heroBadge} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">主标题</span>
              <textarea name="heroTitle" defaultValue={settings.heroTitle} rows={3} className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 outline-none" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">副标题</span>
              <textarea name="heroSubtitle" defaultValue={settings.heroSubtitle} rows={4} className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 outline-none" />
            </label>
          </div>
        </section>

        <section className="panel rounded-[2rem] p-8">
          <h2 className="text-2xl font-semibold">按钮与跳转</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">主按钮文案</span>
              <input name="primaryButtonLabel" defaultValue={settings.primaryButtonLabel} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">主按钮链接</span>
              <input name="primaryButtonHref" defaultValue={settings.primaryButtonHref} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">次按钮文案</span>
              <input name="secondaryButtonLabel" defaultValue={settings.secondaryButtonLabel} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">次按钮链接</span>
              <input name="secondaryButtonHref" defaultValue={settings.secondaryButtonHref} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
            </label>
          </div>
        </section>

        <section className="panel rounded-[2rem] p-8">
          <h2 className="text-2xl font-semibold">色彩与图片</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">主色</span>
              <input name="primaryColor" defaultValue={settings.primaryColor} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">强调色</span>
              <input name="accentColor" defaultValue={settings.accentColor} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">深色背景</span>
              <input name="darkColor" defaultValue={settings.darkColor} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
            </label>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">首页主图 URL 或本地 public 路径</span>
              <input name="heroImage" defaultValue={settings.heroImage} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">团队图片 URL 或本地 public 路径</span>
              <input name="teamImage" defaultValue={settings.teamImage} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none" />
            </label>
          </div>
        </section>

        <section className="panel rounded-[2rem] p-8">
          <h2 className="text-2xl font-semibold">首页统计卡片</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            请填写 JSON 数组，每项包含 `label`、`value`、`note` 三个字段。
          </p>
          <textarea
            name="statsJson"
            defaultValue={typeof settings.statsJson === "string" ? settings.statsJson : JSON.stringify(settings.stats, null, 2)}
            rows={12}
            placeholder={statsHint}
            className="mt-5 w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 font-mono text-sm outline-none"
          />
        </section>

        <div className="flex flex-wrap gap-4">
          <button type="submit" className="rounded-full bg-slate-950 px-6 py-3 font-medium text-white">
            保存视觉设置
          </button>
        </div>
      </form>
    </div>
  );
}
