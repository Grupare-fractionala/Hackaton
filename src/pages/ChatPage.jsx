import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ChatWindow } from "@/features/chat/components/ChatWindow";
import { useChat } from "@/features/chat/hooks/useChat";
import { useCreateTicketMutation } from "@/features/tickets/hooks/useTickets";

export function ChatPage() {
  const { messages, sendMessage, resetConversation, isSending } = useChat();
  const createTicketMutation = useCreateTicketMutation();

  const handleCreateTicket = (suggestion) => {
    return createTicketMutation.mutateAsync({
      ...suggestion,
      source: "chat",
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Chat AI intern"
        subtitle="Raspunsuri rapide pentru intrebari operationale. Escalare automata in tichet cand este necesar."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18.75rem]">
        <ChatWindow
          messages={messages}
          isSending={isSending}
          onSend={sendMessage}
          onClear={resetConversation}
          onCreateTicket={handleCreateTicket}
        />

        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Cum sa pui intrebari</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>- Mentioneaza departamentul implicat.</li>
            <li>- Include eroarea exacta sau contextul legal.</li>
            <li>- Precizeaza daca este urgent.</li>
          </ul>

          <div className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Exemplu bun</p>
            <p className="mt-1">
              "La registratura imprimanta HP afiseaza eroare spooler dupa restart. Puteti escalada catre IT?"
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
