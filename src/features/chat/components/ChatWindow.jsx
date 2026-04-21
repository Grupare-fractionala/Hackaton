import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { MessageBubble } from "@/features/chat/components/MessageBubble";
import { TypingIndicator } from "@/features/chat/components/TypingIndicator";

export function ChatWindow({ messages, isSending, onSend, onClear, firstUserMessage }) {
  const [draft, setDraft] = useState("");
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const node = messagesContainerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, isSending]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSend(draft);
    setDraft("");
  };

  const handleEscalate = () => {
    const params = firstUserMessage
      ? `?description=${encodeURIComponent(firstUserMessage)}`
      : "";
    navigate(`/tickets/new${params}`);
  };

  return (
    <Card className="min-w-0 overflow-hidden p-0">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Asistent intern AI</h2>
          <p className="text-sm text-slate-600">
            Intrebari tehnice, HR sau legislative. Daca e nevoie, escalam in tichet.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={onClear}>
          Reseteaza conversatia
        </Button>
      </header>

      <div
        ref={messagesContainerRef}
        className="h-[clamp(18rem,50vh,36rem)] space-y-3 overflow-y-auto bg-slate-50/60 p-3 sm:p-4"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isSending ? <TypingIndicator /> : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 border-t border-slate-200 bg-white p-3 sm:p-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Ex: Nu imi merge imprimanta de la ghiseu..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={800}
          />
          <Button type="submit" className="w-full sm:w-auto" disabled={!draft.trim() || isSending}>
            Trimite
          </Button>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
          onClick={handleEscalate}
        >
          Problema nu poate fi rezolvata — creeaza tichet
        </Button>
      </form>
    </Card>
  );
}
