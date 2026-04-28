import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ChatWindow } from "@/features/chat/components/ChatWindow";
import { useChat } from "@/features/chat/hooks/useChat";

export function ChatPage() {
  const { messages, sendMessage, resetConversation, isSending, firstUserMessage } = useChat();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stai de vorba cu mihAI"
        subtitle="Asistentul tau prietenos pentru IT, HR si Juridic — raspunsuri rapide, iar daca e nevoie deschidem un tichet impreuna."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18.75rem]">
        <ChatWindow
          messages={messages}
          isSending={isSending}
          onSend={sendMessage}
          onClear={resetConversation}
          firstUserMessage={firstUserMessage}
        />

        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Cum il ajuti pe mihAI sa te ajute</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>- Spune-i din ce departament esti.</li>
            <li>- Lasa-i mesajul exact al erorii sau articolul de lege.</li>
            <li>- Mentioneaza daca te grabesti.</li>
          </ul>

          <div className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Exemplu bun</p>
            <p className="mt-1">
              "Salut mihAI, la registratura imprimanta HP imi da eroare spooler dupa restart. Poti sa ma ajuti sa escaladez catre IT?"
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
