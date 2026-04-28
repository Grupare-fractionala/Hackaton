import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
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

  const buildTranscript = () => {
    const lines = messages
      .filter((m) => m.role === "user" || m.role === "ai")
      .map((m) => `${m.role === "user" ? "Utilizator" : "mihAI"}: ${m.content}`);

    if (!lines.length) return "";

    return ["[Istoric conversatie cu mihAI]", "", ...lines].join("\n");
  };

  const inferredCategory = [...messages]
    .reverse()
    .find((m) => m.role === "ai" && m.category && m.category !== "General")?.category;

  const handleEscalate = () => {
    navigate("/tickets/new", {
      state: {
        chatHistory: buildTranscript(),
        category: inferredCategory,
      },
    });
  };

  return (
    <Card className="min-w-0 overflow-hidden p-0">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar kind="mihai" size="md" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              mihAI <span className="text-sm font-normal text-slate-500">· asistentul tau de la primarie</span>
            </h2>
            <p className="text-sm text-slate-600">
              Stau aici sa te ajut cu IT, HR sau Juridic. Daca e ceva mai serios, deschidem un tichet impreuna.
            </p>
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={onClear}>
          Incepem de la zero
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
            placeholder="Spune-i lui mihAI ce s-a intamplat..."
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
          Nu reusim sa rezolvam aici — deschide un tichet
        </Button>
      </form>
    </Card>
  );
}
