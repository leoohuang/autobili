import { cn } from "@/lib/utils";

type SectionTitleProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
};

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionTitleProps) {
  return (
    <div className={cn("space-y-4", align === "center" && "mx-auto max-w-3xl text-center")}>
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#ff6f3c]">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">{title}</h2>
      <p className="max-w-3xl text-base leading-8 text-slate-600 md:text-lg">{description}</p>
    </div>
  );
}
