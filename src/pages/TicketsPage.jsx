import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import { TicketForm } from "@/features/tickets/components/TicketForm";
import { TicketTable } from "@/features/tickets/components/TicketTable";
import {
  useCreateTicketMutation,
  useRespondToTicketMutation,
  useTicketsQuery,
} from "@/features/tickets/hooks/useTickets";
import { useAuthStore } from "@/store/useAuthStore";

export function TicketsPage() {
  const user = useAuthStore((state) => state.user);
  const ticketsQuery = useTicketsQuery();
  const createTicketMutation = useCreateTicketMutation();
  const respondToTicketMutation = useRespondToTicketMutation();

  const [filters, setFilters] = useState({
    department: "Toate",
    category: "Toate",
    status: "Toate",
  });
  const [successId, setSuccessId] = useState("");
  const [updatedId, setUpdatedId] = useState("");

  const tickets = ticketsQuery.data || [];

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const departmentOk =
        filters.department === "Toate" || ticket.assignedDepartment === filters.department;
      const categoryOk = filters.category === "Toate" || ticket.category === filters.category;
      const statusOk = filters.status === "Toate" || ticket.status === filters.status;
      return departmentOk && categoryOk && statusOk;
    });
  }, [tickets, filters.department, filters.category, filters.status]);

  const handleCreate = async (payload) => {
    const created = await createTicketMutation.mutateAsync({
      ...payload,
      source: "manual",
    });
    setSuccessId(created.id);
  };

  const handleRespond = async (payload) => {
    try {
      const updated = await respondToTicketMutation.mutateAsync(payload);
      setUpdatedId(updated.id);
      return updated;
    } catch {
      return null;
    }
  };

  const isAgent = user?.role === "agent";
  const isEmployee = user?.role === "employee";
  const pageSubtitle = isAgent
    ? "Tichete nefinalizate de chatbot, repartizate departamentului tau."
    : "Centralizare solicitari deschise de angajati sau generate din chat AI.";

  useEffect(() => {
    if (!isAgent) {
      return;
    }

    const firstDepartment = user?.handledDepartments?.[0];
    if (!firstDepartment) {
      return;
    }

    setFilters((prev) => ({ ...prev, department: firstDepartment }));
  }, [isAgent, user?.handledDepartments]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tichete"
        subtitle={pageSubtitle}
        action={
          <Badge variant="info" className="text-sm">
            {filteredTickets.length} rezultate
          </Badge>
        }
      />

      <div className={isAgent ? "grid gap-4" : "grid gap-4 2xl:grid-cols-[380px_minmax(0,1fr)]"}>
        {!isAgent ? (
          <div className="space-y-4">
            <TicketForm onSubmit={handleCreate} isSubmitting={createTicketMutation.isPending} />

            {successId ? (
              <Card className="border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-800">Tichet creat cu succes: {successId}</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setSuccessId("")}>
                  Ascunde
                </Button>
              </Card>
            ) : null}

            {isEmployee ? (
              <Card className="border border-brand-200 bg-brand-50 p-4">
                <p className="text-sm font-semibold text-brand-900">Flux escalare</p>
                <p className="mt-1 text-sm text-brand-800">
                  Daca AI nu rezolva, tichetul este trimis automat catre departamentul responsabil:
                  Tehnic, HR sau Administrativ.
                </p>
              </Card>
            ) : null}
          </div>
        ) : null}

        <div className="min-w-0 space-y-4">
          <Card className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Departament responsabil
              </label>
              <Select
                value={filters.department}
                onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}
              >
                <option>Toate</option>
                <option>Tehnic</option>
                <option>HR</option>
                <option>Administrativ</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Categorie
              </label>
              <Select
                value={filters.category}
                onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
              >
                <option>Toate</option>
                <option>Tehnic</option>
                <option>HR</option>
                <option>Legislativ</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </label>
              <Select
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option>Toate</option>
                <option>Deschis</option>
                <option>In lucru</option>
                <option>Rezolvat</option>
              </Select>
            </div>
          </Card>

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
                {respondToTicketMutation.error?.response?.data?.message ||
                  respondToTicketMutation.error?.message ||
                  "Nu am putut actualiza tichetul."}
              </p>
            </Card>
          ) : null}

          {ticketsQuery.isLoading ? (
            <Card>
              <Loader label="Se incarca tichetele..." />
            </Card>
          ) : (
            <TicketTable
              tickets={filteredTickets}
              currentUser={user}
              onRespond={handleRespond}
              isResponding={respondToTicketMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
