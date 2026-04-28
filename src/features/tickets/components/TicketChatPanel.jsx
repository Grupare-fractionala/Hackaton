import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { Textarea } from "@/components/ui/Textarea";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useTicketMessagesQuery, useSendTicketMessageMutation } from "@/features/tickets/hooks/useTicketMessages";
import { getUserAvatarUrl } from "@/utils/avatar";
import { formatDateTime, formatTicketId } from "@/utils/date";
import { cn } from "@/utils/cn";

const ROLE_LABEL = {
  admin: "Administrator",
  agent_tehnic: "Agent Tehnic",
  agent_hr: "Agent HR",
  agent_legislativ: "Agent Legislativ",
  employee: "Angajat",
};

function parseChatHistory(history) {
  if (!history) return [];

  const lines = history.split("\n");
  const turns = [];
  let current = null;

  for (const raw of lines) {
    if (raw.startsWith("[Istoric") || raw.trim() === "" || raw.trim() === "---") {
      if (current) {
        turns.push(current);
        current = null;
      }
      continue;
    }

    const userMatch = raw.match(/^Utilizator:\s?(.*)$/);
    const aiMatch = raw.match(/^(?:mihAI|Asistent AI):\s?(.*)$/);

    if (userMatch) {
      if (current) turns.push(current);
      current = { role: "user", content: userMatch[1] };
    } else if (aiMatch) {
      if (current) turns.push(current);
      current = { role: "ai", content: aiMatch[1] };
    } else if (current) {
      current.content += `\n${raw}`;
    }
  }

  if (current) turns.push(current);
  return turns;
}

function ChatHistoryModal({ history, onClose }) {
  const turns = parseChatHistory(history);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed left-1/2 top-1/2 z-[70] flex max-h-[85vh] w-[min(40rem,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Istoric conversatie cu mihAI</h3>
            <p className="text-xs text-slate-500">
              Conversatia originala dintre solicitant si mihAI.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4">
          {turns.length === 0 ? (
            <p className="text-center text-sm text-slate-400">Conversatia este goala.</p>
          ) : (
            turns.map((turn, idx) => {
              const isUser = turn.role === "user";
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-end gap-2",
                    isUser ? "justify-end" : "justify-start",
                  )}
                >
                  {!isUser ? <Avatar kind="mihai" size="sm" /> : null}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      isUser
                        ? "rounded-br-md bg-brand-600 text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-800",
                    )}
                  >
                    <p className={cn(
                      "mb-1 text-[11px] font-semibold",
                      isUser ? "text-white/80" : "text-brand-700",
                    )}>
                      {isUser ? "Solicitant" : "mihAI"}
                    </p>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {turn.content}
                    </p>
                  </div>
                  {isUser ? (
                    <Avatar name="Solicitant" seed="solicitant" size="sm" />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const canViewChatHistory =
    Boolean(ticket?.chat_history) && ticket?.user_id !== user?.id;

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

        {canViewChatHistory ? (
          <div className="border-b border-slate-200 bg-amber-50/40 px-4 py-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              className="w-full border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
            >
              🤖 Vezi conversatia cu mihAI
            </Button>
          </div>
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
              const displayName = isMe
                ? user?.name || msg.user_name || "Tu"
                : msg.user_name || "Utilizator";
              const roleLabel = ROLE_LABEL[msg.user_role] || null;
              const avatarSrc = isMe
                ? getUserAvatarUrl(user)
                : getUserAvatarUrl({ username: msg.user_name, name: msg.user_name });

              return (
                <article
                  key={msg.id}
                  className={cn(
                    "flex items-end gap-2",
                    isMe ? "justify-end" : "justify-start",
                  )}
                >
                  {!isMe ? (
                    <Avatar
                      src={avatarSrc}
                      name={displayName}
                      seed={msg.user_id || displayName}
                      size="sm"
                    />
                  ) : null}

                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      isMe
                        ? "rounded-br-md bg-brand-600 text-white"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-800",
                    )}
                  >
                    <p
                      className={cn(
                        "mb-1 text-xs font-semibold",
                        isMe ? "text-white/85" : "text-slate-700",
                      )}
                    >
                      {isMe ? "Tu" : displayName}
                      {roleLabel ? (
                        <span
                          className={cn(
                            "ml-1 font-normal",
                            isMe ? "text-white/65" : "text-slate-400",
                          )}
                        >
                          · {roleLabel}
                        </span>
                      ) : null}
                    </p>
                    <p className="break-words leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    <p className={cn("mt-1 text-[11px]", isMe ? "text-white/70" : "text-slate-400")}>
                      {formatDateTime(msg.created_at)}
                    </p>
                  </div>

                  {isMe ? (
                    <Avatar
                      src={avatarSrc}
                      name={displayName}
                      seed={user?.id || displayName}
                      size="sm"
                    />
                  ) : null}
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

      {historyOpen && canViewChatHistory ? (
        <ChatHistoryModal
          history={ticket.chat_history}
          onClose={() => setHistoryOpen(false)}
        />
      ) : null}
    </>
  );
}
