import { CheckCircle2 } from "lucide-react";
import { SectionTitle } from "@/components/marketing/section-title";

const services = [
  "企业 AI 培训工作坊",
  "AI 内容策略与品牌合作",
  "课程体系设计与知识产品孵化",
  "团队效率工具落地训练",
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-18">
      <SectionTitle
        eyebrow="Services"
        title="启探科技企业服务"
        description="从 AI 培训、内容合作到知识产品咨询，官网会成为启探科技承接企业客户的重要入口。"
      />

      <div className="mt-12 grid gap-8 md:grid-cols-[1fr_1fr]">
        <div className="panel rounded-[2rem] p-8">
          <h2 className="text-3xl font-semibold">适合什么团队</h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            适合希望系统提升 AI 认知、建立内部工作流、做品牌内容或规划培训产品的中小团队与成长型组织。
          </p>
        </div>
        <div className="panel rounded-[2rem] p-8">
          <h2 className="text-3xl font-semibold">服务清单</h2>
          <div className="mt-6 space-y-4">
            {services.map((service) => (
              <div key={service} className="flex items-center gap-3 text-base text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-[#ff6f3c]" />
                <span>{service}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
