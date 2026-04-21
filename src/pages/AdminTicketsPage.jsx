import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import { TicketChatPanel } from "@/features/tickets/components/TicketChatPanel";
import { useDeleteTicketMutation, useTicketsQuery } from "@/features/tickets/hooks/useTickets";
import { formatDateTime, formatTicketId } from "@/utils/date";
import { cn } from "@/utils/cn";

function statusVariant(s) {
  if (s === "Rezolvat") return "success";
  if (s === "In lucru") return "warning";
  return "info";
}

export function AdminTicketsPage() {
  const ticketsQuery = useTicketsQuery();
  const deleteMutation = useDeleteTicketMutation();

  const [statusFilter, setStatusFilter] = useState("Toate");
  const [deptFilter, setDeptFilter] = useState("Toate");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const allTickets = ticketsQuery.data || [];

  const filtered = useMemo(() => {
    return allTickets.filter((t) => {
      const s = statusFilter === "Toate" || t.status === statusFilter;
      const d = deptFilter === "Toate" || t.department === deptFilter;
      return s && d;
    });
  }, [allTickets, statusFilter, deptFilter]);

  const handleDelete = async (id) => {
    await deleteMutation.mutateAsync(id);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Toate tichetele"
        subtitle="Vizualizare si administrare globala a tuturor solicitarilor."
        action={
          <Badge variant="info" className="text-sm">{filtered.length} rezultate</Badge>
        }
      />

      <Card className="flex flex-wrap gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Departament</label>
          <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-44">
            <option>Toate</option>
            <option>Tehnic</option>
            <option>HR</option>
            <option>Administrativ</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
            <option>Toate</option>
            <option>Deschis</option>
            <option>In lucru</option>
            <option>Rezolvat</option>
          </Select>
        </div>
      </Card>

      {ticketsQuery.isLoading ? (
        <Card><Loader label="Se incarca tichetele..." /></Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">Niciun tichet gasit.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <Card key={ticket.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <button
                  className="min-w-0 text-left"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">{formatTicketId(ticket.id)}</span>
                    <Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge>
                    <Badge variant="info">{ticket.department}</Badge>
                  </div>
                  <p className="mt-1 font-semibold text-slate-900 hover:underline">{ticket.subject}</p>
                  {ticket.description ? (
                    <p className="mt-0.5 text-sm text-slate-500 line-clamp-1">{ticket.description}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-400">
                    {ticket.requesterName} · {formatDateTime(ticket.created_at || ticket.createdAt)}
                  </p>
                </button>

                <div className="shrink-0">
                  {confirmDelete === ticket.id ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(null)}>
                        Anuleaza
                      </Button>
                      <Button
                        size="sm"
                        className="bg-rose-600 hover:bg-rose-700 text-white"
                        onClick={() => handleDelete(ticket.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Sterge
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(ticket.id)}>
                      Sterge
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedTicket ? (
        <TicketChatPanel ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      ) : null}
    </div>
  );
}
