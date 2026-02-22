export function Loader({ label = "Se incarca..." }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span className="h-2 w-2 animate-pulse rounded-full bg-brand-600" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500 [animation-delay:120ms]" />
      <span className="h-2 w-2 animate-pulse rounded-full bg-brand-400 [animation-delay:240ms]" />
      <span>{label}</span>
    </div>
  );
}
