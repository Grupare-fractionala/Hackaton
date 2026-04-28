import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useCreateTicketMutation } from "@/features/tickets/hooks/useTickets";

export function NewTicketPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const createTicketMutation = useCreateTicketMutation();

  const prefillDescription = searchParams.get("description") || "";
  const chatHistory = location.state?.chatHistory || "";
  const inferredCategory = location.state?.category;
  const fromChat = Boolean(chatHistory);

  const [form, setForm] = useState({
    category: inferredCategory || "Tehnic",
    priority: "Medie",
    subject: "",
    description: prefillDescription,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createTicketMutation.mutateAsync({
      ...form,
      source: fromChat ? "chat" : "manual",
      chatHistory,
    });
    navigate("/tickets");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Creeaza tichet nou"
        subtitle="Completeaza detaliile solicitarii tale."
        action={
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            Inapoi
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="category">
                Categorie
              </label>
              <Select
                id="category"
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                <option>Tehnic</option>
                <option>HR</option>
                <option>Legislativ</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="priority">
                Prioritate
              </label>
              <Select
                id="priority"
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
              >
                <option>Scazuta</option>
                <option>Medie</option>
                <option>Ridicata</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="subject">
              Subiect
            </label>
            <Input
              id="subject"
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Ex: Imprimanta registratura"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="description">
              Descriere
            </label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Descrie problema si pasii deja incercati"
              rows={5}
              required
            />
          </div>

          {createTicketMutation.isError ? (
            <p className="text-sm text-rose-600">
              {createTicketMutation.error?.message || "Eroare la crearea tichetului."}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={createTicketMutation.isPending}>
              {createTicketMutation.isPending ? "Se trimite..." : "Trimite tichet"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
