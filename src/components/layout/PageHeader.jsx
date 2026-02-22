import { cn } from "@/utils/cn";

export function PageHeader({ title, subtitle, action, className }) {
  return (
    <header className={cn("flex flex-col gap-3 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-[clamp(1.4rem,1.05rem+1.5vw,2rem)] font-bold text-slate-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {action ? <div className="w-full md:w-auto">{action}</div> : null}
    </header>
  );
}
