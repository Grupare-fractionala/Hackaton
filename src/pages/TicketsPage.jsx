import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import { TicketChatPanel } from "@/features/tickets/components/TicketChatPanel";
import {
  useRespondToTicketMutation,
  useTicketsQuery,
} from "@/features/tickets/hooks/useTickets";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/utils/cn";
import { formatTicketId } from "@/utils/date";

function statusVariant(status) {
  if (status === "Rezolvat") return "success";
  if (status === "In lucru") return "warning";
  if (status === "Deschis") return "info";
  return "neutral";
}

function priorityVariant(priority) {
  if (priority === "Ridicata") return "danger";
  if (priority === "Medie") return "warning";
  return "neutral";
}

function TicketRow({ ticket, onClick, onRespond, isResponding, canManage }) {
  return (
    <Card
      className="cursor-pointer p-4 transition hover:shadow-md"
      onClick={() => onClick(ticket)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">{formatTicketId(ticket.id)}</span>
            <Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge>
            <Badge variant="info">{ticket.department}</Badge>
          </div>
          <p className="mt-1 font-semibold text-slate-900">{ticket.subject}</p>
          {ticket.description ? (
            <p className="mt-0.5 text-sm text-slate-500 line-clamp-1">{ticket.description}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="neutral">{ticket.category}</Badge>
            <Badge variant={priorityVariant(ticket.priority)}>{ticket.priority}</Badge>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {ticket.requesterName} · Sursa: {ticket.source}
          </p>
        </div>
      </div>

      {canManage ? (
        <div
          className="mt-3 flex flex-wrap gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {ticket.status === "Deschis" ? (
            <Button
              size="sm"
              onClick={() => onRespond({ ticketId: ticket.id, action: "take" })}
              disabled={isResponding}
            >
              Preia
            </Button>
          ) : null}

          {ticket.status !== "Rezolvat" ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onRespond({ ticketId: ticket.id, action: "resolve" })}
              disabled={isResponding}
            >
              Marcheaza rezolvat
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onRespond({ ticketId: ticket.id, action: "reopen" })}
              disabled={isResponding}
            >
              Redeschide
            </Button>
          )}
        </div>
      ) : null}
    </Card>
  );
}

export function TicketsPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const ticketsQuery = useTicketsQuery();
  const respondToTicketMutation = useRespondToTicketMutation();

  const [activeTab, setActiveTab] = useState(() => {
    const role = useAuthStore.getState().user?.role || "employee";
    return role.startsWith("agent_") ? "toResolve" : "myTickets";
  });
  const [statusFilter, setStatusFilter] = useState("Toate");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updatedId, setUpdatedId] = useState("");

  const allTickets = ticketsQuery.data || [];

  const myTickets = useMemo(
    () => allTickets.filter((t) => t.user_id === user?.id),
    [allTickets, user?.id],
  );

  const ticketsToResolve = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") return allTickets;
    if (user.isAgent) {
      return allTickets.filter((t) =>
        user.handledDepartments.includes(t.department),
      );
    }
    return [];
  }, [allTickets, user]);

  const isAgent = user?.isAgent;

  const displayedTickets = useMemo(() => {
    const base = activeTab === "myTickets" ? myTickets : ticketsToResolve;
    return statusFilter === "Toate" ? base : base.filter((t) => t.status === statusFilter);
  }, [activeTab, myTickets, ticketsToResolve, statusFilter]);

  const handleRespond = async (payload) => {
    try {
      const updated = await respondToTicketMutation.mutateAsync(payload);
      setUpdatedId(updated?.id || "");
    } catch {
      // error shown below
    }
  };

  const canManageTicket = (ticket) => {
    if (!user || !ticket) return false;
    if (user.isAgent) return user.handledDepartments.includes(ticket.department);
    return false;
  };

  const tabs = [
    { id: "myTickets", label: "Tichetele mele", count: myTickets.length },
    ...(isAgent
      ? [{ id: "toResolve", label: "Tichete de rezolvat", count: ticketsToResolve.length }]
      : []),
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tichete"
        subtitle="Gestioneaza solicitarile tale si cele repartizate departamentului tau."
        action={
          <Button size="sm" onClick={() => navigate("/tickets/new")}>
            + Creeaza tichet
          </Button>
        }
      />

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setStatusFilter("Toate"); }}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              activeTab === tab.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            {tab.label}
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1 text-xs font-semibold text-slate-700">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </label>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          >
            <option>Toate</option>
            <option>Deschis</option>
            <option>In lucru</option>
            <option>Rezolvat</option>
          </Select>
        </div>

        <Badge variant="info" className="mt-4 text-sm self-end">
          {displayedTickets.length} rezultate
        </Badge>
      </div>

      {updatedId ? (
        <Card className="border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">Tichet actualizat cu succes: {updatedId}</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setUpdatedId("")}>
            Ascunde
          </Button>
        </Card>
      ) : null}

      {respondToTicketMutation.isError ? (
        <Card className="border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-700">
            {respondToTicketMutation.error?.message || "Nu am putut actualiza tichetul."}
          </p>
        </Card>
      ) : null}

      {ticketsQuery.isLoading ? (
        <Card>
          <Loader label="Se incarca tichetele..." />
        </Card>
      ) : displayedTickets.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500">
            {activeTab === "myTickets"
              ? "Nu ai niciun tichet inca. Apasa butonul Creeaza tichet pentru a deschide unul."
              : "Nu exista tichete repartizate departamentului tau."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedTickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onClick={setSelectedTicket}
              onRespond={handleRespond}
              isResponding={respondToTicketMutation.isPending}
              canManage={canManageTicket(ticket)}
            />
          ))}
        </div>
      )}

      {selectedTicket ? (
        <TicketChatPanel
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      ) : null}
    </div>
  );
}
