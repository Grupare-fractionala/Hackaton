export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white p-3 text-sm shadow">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500 [animation-delay:120ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500 [animation-delay:240ms]" />
          <span className="ml-1 text-xs text-slate-600">mihAI scrie un raspuns...</span>
        </div>
      </div>
    </div>
  );
}
