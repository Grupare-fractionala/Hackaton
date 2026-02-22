import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function TicketActionCard({ suggestion, onCreateTicket }) {
  const [status, setStatus] = useState("idle");
  const [ticketId, setTicketId] = useState(null);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setStatus("loading");
    setError("");

    try {
      const created = await onCreateTicket(suggestion);
      setTicketId(created.id);
      setStatus("done");
    } catch (err) {
      setError(err?.response?.data?.message || "Nu am putut crea tichetul.");
      setStatus("error");
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/70 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="info">Escalare recomandata</Badge>
        <Badge variant={suggestion.priority === "Ridicata" ? "warning" : "neutral"}>
          Prioritate: {suggestion.priority}
        </Badge>
      </div>

      <p className="mt-2 text-sm font-semibold text-slate-900">{suggestion.subject}</p>
      <p className="mt-1 text-sm text-slate-700">{suggestion.description}</p>

      {status === "done" ? (
        <p className="mt-2 text-sm font-medium text-emerald-700">
          Tichet creat cu succes: {ticketId}
        </p>
      ) : (
        <Button
          className="mt-3"
          size="sm"
          onClick={handleCreate}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Se creeaza..." : "Creeaza tichet"}
        </Button>
      )}

      {status === "error" ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
