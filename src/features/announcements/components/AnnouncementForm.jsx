import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  ALL_DEPARTMENTS,
  ALL_DEPARTMENTS_TOKEN,
} from "@/features/announcements/utils/helpers";

const CATEGORY_OPTIONS = ["General", "Raportare", "Tehnic", "HR", "Organizare", "Legislativ"];
const PRIORITY_OPTIONS = ["Scazuta", "Medie", "Ridicata"];

function fromDatetimeLocalValue(value) {
  return value ? new Date(value).toISOString() : "";
}

export function AnnouncementForm({ type, onSubmit, isPending, error }) {
  const [form, setForm] = useState({
    title: "",
    message: "",
    category: "General",
    priority: "Medie",
    dueAt: "",
    pinned: false,
    departments: [ALL_DEPARTMENTS_TOKEN],
  });

  const targetsAll = form.departments.includes(ALL_DEPARTMENTS_TOKEN);

  const toggleDepartment = (department) => {
    setForm((prev) => {
      const set = new Set(prev.departments);
      if (set.has(department)) {
        set.delete(department);
      } else {
        set.add(department);
      }
      return { ...prev, departments: Array.from(set) };
    });
  };

  const toggleAll = () => {
    setForm((prev) =>
      prev.departments.includes(ALL_DEPARTMENTS_TOKEN)
        ? { ...prev, departments: [] }
        : { ...prev, departments: [ALL_DEPARTMENTS_TOKEN] },
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const departments = form.departments.length
      ? form.departments
      : [ALL_DEPARTMENTS_TOKEN];

    await onSubmit({
      ...form,
      departments,
      type,
      dueAt: fromDatetimeLocalValue(form.dueAt),
    });

    setForm({
      title: "",
      message: "",
      category: "General",
      priority: "Medie",
      dueAt: "",
      pinned: false,
      departments: [ALL_DEPARTMENTS_TOKEN],
    });
  };

  const isDeadline = type === "deadline";

  return (
    <Card>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-[1fr_12rem]">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="form-title">
              Titlu
            </label>
            <Input
              id="form-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder={isDeadline ? "Ex: Termen depunere raport lunar" : "Ex: Sedinta saptamanala"}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="form-priority">
              Prioritate
            </label>
            <Select
              id="form-priority"
              value={form.priority}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="form-message">
            Mesaj
          </label>
          <Textarea
            id="form-message"
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            placeholder="Detalii pentru destinatari."
            rows={4}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="form-category">
              Categorie
            </label>
            <Select
              id="form-category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            >
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="form-due">
              Data {isDeadline ? "termen" : "informativa"} {isDeadline ? "(obligatoriu)" : "(optional)"}
            </label>
            <Input
              id="form-due"
              type="datetime-local"
              value={form.dueAt}
              onChange={(event) => setForm((prev) => ({ ...prev, dueAt: event.target.value }))}
              required={isDeadline}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Departamente vizate</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleAll}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                targetsAll
                  ? "border-brand-500 bg-brand-100 text-brand-800"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Toate
            </button>
            {ALL_DEPARTMENTS.map((department) => {
              const selected = form.departments.includes(department);
              return (
                <button
                  key={department}
                  type="button"
                  onClick={() => toggleDepartment(department)}
                  disabled={targetsAll}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    selected && !targetsAll
                      ? "border-brand-500 bg-brand-100 text-brand-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  } ${targetsAll ? "opacity-50" : ""}`}
                >
                  {department}
                </button>
              );
            })}
          </div>
          {!targetsAll && form.departments.length === 0 ? (
            <p className="mt-2 text-xs text-amber-700">
              Daca nu selectezi niciun departament, anuntul devine vizibil pentru toti.
            </p>
          ) : null}
        </div>

        <label className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.pinned}
            onChange={(event) => setForm((prev) => ({ ...prev, pinned: event.target.checked }))}
            className="h-4 w-4 accent-brand-600"
          />
          Fixeaza sus
        </label>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Se publica..." : isDeadline ? "Publica termen" : "Publica anunt"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
