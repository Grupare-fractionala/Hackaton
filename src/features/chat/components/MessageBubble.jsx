import ReactMarkdown from "react-markdown";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/utils/date";
import { cn } from "@/utils/cn";

export function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <article
      className={cn("message-enter flex items-end gap-2", isUser ? "justify-end" : "justify-start")}
      aria-live="polite"
    >
      {!isUser ? <Avatar kind="mihai" size="sm" /> : null}

      <div
        className={cn(
          "max-w-[95%] rounded-2xl p-3 text-sm shadow-sm sm:max-w-[85%]",
          isUser
            ? "rounded-br-md bg-brand-600 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-800",
        )}
      >
        {!isUser ? (
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">
              mihAI
            </span>
            {message.category ? (
              <Badge variant="neutral">{message.category}</Badge>
            ) : null}
          </div>
        ) : null}

        <div
          className={cn(
            "break-words leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1",
            isUser && "prose-invert prose-headings:text-white prose-strong:text-white",
          )}
        >
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        <p className={cn("mt-2 text-[11px]", isUser ? "text-white/70" : "text-slate-500")}>
          {formatDateTime(message.createdAt)}
        </p>
      </div>
    </article>
  );
}
