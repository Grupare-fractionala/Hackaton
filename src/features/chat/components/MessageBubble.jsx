import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/utils/date";
import { cn } from "@/utils/cn";

export function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <article
      className={cn("message-enter flex", isUser ? "justify-end" : "justify-start")}
      aria-live="polite"
    >
      <div
        className={cn(
          "max-w-[95%] rounded-2xl p-3 text-sm shadow-sm sm:max-w-[85%]",
          isUser
            ? "rounded-br-md bg-brand-600 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-800",
        )}
      >
        {!isUser && message.category ? (
          <Badge className="mb-2" variant="neutral">
            {message.category}
          </Badge>
        ) : null}

        <p className="break-words leading-relaxed whitespace-pre-wrap">{message.content}</p>

        <p className={cn("mt-2 text-[11px]", isUser ? "text-white/70" : "text-slate-500")}>
          {formatDateTime(message.createdAt)}
        </p>
      </div>
    </article>
  );
}
