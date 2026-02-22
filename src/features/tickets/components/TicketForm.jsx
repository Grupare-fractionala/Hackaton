import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

const initialForm = {
  category: "Tehnic",
  priority: "Medie",
  subject: "",
  description: "",
};

export function TicketForm({ onSubmit, isSubmitting }) {
  const [form, setForm] = useState(initialForm);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(form);
    setForm(initialForm);
  };

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900">Creeaza tichet nou</h2>
      <p className="mt-1 text-sm text-slate-600">Completeaza rapid o solicitare pentru departamentul responsabil.</p>

      <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="ticket-category">
              Categorie
            </label>
            <Select
              id="ticket-category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            >
              <option>Tehnic</option>
              <option>HR</option>
              <option>Legislativ</option>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="ticket-priority">
              Prioritate
            </label>
            <Select
              id="ticket-priority"
              value={form.priority}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
            >
              <option>Scazuta</option>
              <option>Medie</option>
              <option>Ridicata</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="ticket-subject">
            Subiect
          </label>
          <Input
            id="ticket-subject"
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            placeholder="Ex: Imprimanta registratura"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="ticket-description">
            Descriere
          </label>
          <Textarea
            id="ticket-description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Descrie problema si pasii deja incercati"
            required
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? "Se trimite..." : "Trimite tichet"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
