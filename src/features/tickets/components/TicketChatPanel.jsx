import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { Textarea } from "@/components/ui/Textarea";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useTicketMessagesQuery, useSendTicketMessageMutation } from "@/features/tickets/hooks/useTicketMessages";
import { formatDateTime, formatTicketId } from "@/utils/date";
import { cn } from "@/utils/cn";

function ChatHistorySection({ history }) {
  const [expanded, setExpanded] = useState(false);

  if (!history) return null;

  return (
    <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left text-sm font-semibold text-amber-900"
      >
        <span>Istoric conversatie AI ({expanded ? "ascunde" : "arata"})</span>
        <span className="text-xs">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded ? (
        <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700">
          {history}
        </pre>
      ) : null}
    </div>
  );
}

function statusVariant(status) {
  if (status === "Rezolvat") return "success";
  if (status === "In lucru") return "warning";
  return "info";
}

export function TicketChatPanel({ ticket, onClose }) {
  const user = useCurrentUser();
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef(null);

  const messagesQuery = useTicketMessagesQuery(ticket?.id);
  const sendMutation = useSendTicketMessageMutation(ticket?.id);

  const messages = messagesQuery.data || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sendMutation.isPending) return;

    setDraft("");
    await sendMutation.mutateAsync({
      ticketId: ticket.id,
      userId: user?.id || "unknown",
      userName: user?.name || "Utilizator",
      userRole: user?.role || "employee",
      message: text,
    });
  };

  if (!ticket) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">{formatTicketId(ticket.id)}</span>
              <Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge>
              <Badge variant="info">{ticket.department}</Badge>
            </div>
            <h2 className="mt-1 text-base font-semibold text-slate-900 leading-snug">{ticket.subject}</h2>
            {ticket.description ? (
              <p className="mt-1 text-sm text-slate-600 line-clamp-2">{ticket.description}</p>
            ) : null}
            <p className="mt-1 text-xs text-slate-400">
              Creat de {ticket.requesterName} · {formatDateTime(ticket.created_at || ticket.createdAt)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
            ✕
          </Button>
        </header>

        {ticket.chat_history && ticket.user_id !== user?.id ? (
          <ChatHistorySection history={ticket.chat_history} />
        ) : null}

        <div className="flex-1 overflow-y-auto space-y-3 bg-slate-50/60 p-4">
          {messagesQuery.isLoading ? (
            <Loader label="Se incarca mesajele..." />
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">
              Niciun mesaj inca. Incepe conversatia.
            </p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.user_id === user?.id;
              return (
                <article
                  key={msg.id}
                  className={cn("flex", isMe ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      isMe
                        ? "rounded-br-md bg-brand-600 text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-800",
                    )}
                  >
                    {!isMe ? (
                      <p className="mb-1 text-xs font-semibold text-slate-500">{msg.user_name}</p>
                    ) : null}
                    <p className="break-words leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    <p className={cn("mt-1 text-[11px]", isMe ? "text-white/70" : "text-slate-400")}>
                      {formatDateTime(msg.created_at)}
                    </p>
                  </div>
                </article>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="flex flex-col gap-2 border-t border-slate-200 bg-white p-3"
        >
          {sendMutation.isError ? (
            <p className="text-xs text-rose-600">Eroare la trimiterea mesajului. Incearca din nou.</p>
          ) : null}
          <Textarea
            placeholder="Scrie un mesaj..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!draft.trim() || sendMutation.isPending}>
              {sendMutation.isPending ? "Se trimite..." : "Trimite"}
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
