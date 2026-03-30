import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/utils/date";

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

function canManageTicket(currentUser, ticket) {
  if (!currentUser || !ticket) {
    return false;
  }

  if (currentUser.role === "admin") {
    return true;
  }

  if (currentUser.role === "agent") {
    return (
      Array.isArray(currentUser.handledDepartments) &&
      currentUser.handledDepartments.includes(ticket.assignedDepartment)
    );
  }

  return false;
}

export function TicketTable({ tickets, currentUser, onRespond, isResponding }) {
  const containerRef = useRef(null);
  const [isCompactLayout, setIsCompactLayout] = useState(true);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return undefined;
    }

    const updateLayout = () => {
      setIsCompactLayout(node.clientWidth < 980);
    };

    updateLayout();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateLayout);
      return () => window.removeEventListener("resize", updateLayout);
    }

    const observer = new ResizeObserver(updateLayout);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  if (!tickets.length) {
    return (
      <EmptyState
        title="Nu exista tichete"
        description="Creeaza primul tichet din formular sau direct din chat-ul AI."
      />
    );
  }

  return (
    <div ref={containerRef} className="space-y-3">
      {isCompactLayout ? (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{ticket.id}</p>
                <Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge>
              </div>

              <p className="mt-2 text-sm font-semibold text-slate-900">{ticket.subject}</p>
              <p className="mt-1 text-xs text-slate-500">{ticket.requesterName}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="info">{ticket.assignedDepartment}</Badge>
                <Badge variant="neutral">{ticket.category}</Badge>
                <Badge variant={priorityVariant(ticket.priority)}>{ticket.priority}</Badge>
              </div>

              <p className="mt-3 text-xs text-slate-500">{formatDateTime(ticket.created_at || ticket.createdAt)}</p>
              <p className="mt-1 text-xs text-slate-500">Sursa: {ticket.source}</p>
              {ticket.lastResponse ? (
                <p className="mt-2 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  Ultimul raspuns: {ticket.lastResponse}
                </p>
              ) : null}

              {canManageTicket(currentUser, ticket) ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ticket.status === "Deschis" ? (
                    <Button
                      size="sm"
                      onClick={() =>
                        onRespond({
                          ticketId: ticket.id,
                          action: "take",
                          message: `Tichet preluat de ${currentUser.name}.`,
                        })
                      }
                      disabled={isResponding}
                    >
                      Preia
                    </Button>
                  ) : null}

                  {ticket.status !== "Rezolvat" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        onRespond({
                          ticketId: ticket.id,
                          action: "resolve",
                          message: `Tichet rezolvat de ${currentUser.name}.`,
                        })
                      }
                      disabled={isResponding}
                    >
                      Marcheaza rezolvat
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        onRespond({
                          ticketId: ticket.id,
                          action: "reopen",
                          message: `Tichet redeschis de ${currentUser.name}.`,
                        })
                      }
                      disabled={isResponding}
                    >
                      Redeschide
                    </Button>
                  )}
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="w-full">
            <table className="w-full table-fixed divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-24 px-3 py-3 font-semibold lg:px-4">ID</th>
                  <th className="px-3 py-3 font-semibold lg:px-4">Subiect</th>
                  <th className="w-28 px-3 py-3 font-semibold lg:px-4">Dept.</th>
                  <th className="w-24 px-3 py-3 font-semibold lg:px-4">Categorie</th>
                  <th className="w-28 px-3 py-3 font-semibold lg:px-4">Prioritate</th>
                  <th className="w-24 px-3 py-3 font-semibold lg:px-4">Status</th>
                  <th className="w-32 px-3 py-3 font-semibold lg:px-4">Creat</th>
                  <th className="hidden w-24 px-3 py-3 font-semibold 2xl:table-cell lg:px-4">Sursa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/80">
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="px-3 py-3 font-semibold text-slate-900 lg:px-4">{ticket.id}</td>
                    <td className="px-3 py-3 lg:px-4">
                      <p className="break-words font-medium text-slate-900">{ticket.subject}</p>
                      <p className="text-xs text-slate-500">{ticket.requesterName}</p>
                      {ticket.lastResponse ? (
                        <p className="mt-1 text-xs text-slate-500">Raspuns: {ticket.lastResponse}</p>
                      ) : null}
                      {canManageTicket(currentUser, ticket) ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ticket.status === "Deschis" ? (
                            <Button
                              size="sm"
                              onClick={() =>
                                onRespond({
                                  ticketId: ticket.id,
                                  action: "take",
                                  message: `Tichet preluat de ${currentUser.name}.`,
                                })
                              }
                              disabled={isResponding}
                            >
                              Preia
                            </Button>
                          ) : null}

                          {ticket.status !== "Rezolvat" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                onRespond({
                                  ticketId: ticket.id,
                                  action: "resolve",
                                  message: `Tichet rezolvat de ${currentUser.name}.`,
                                })
                              }
                              disabled={isResponding}
                            >
                              Marcheaza rezolvat
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                onRespond({
                                  ticketId: ticket.id,
                                  action: "reopen",
                                  message: `Tichet redeschis de ${currentUser.name}.`,
                                })
                              }
                              disabled={isResponding}
                            >
                              Redeschide
                            </Button>
                          )}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-slate-700 lg:px-4">{ticket.assignedDepartment}</td>
                    <td className="px-3 py-3 text-slate-700 lg:px-4">{ticket.category}</td>
                    <td className="px-3 py-3 lg:px-4">
                      <Badge variant={priorityVariant(ticket.priority)}>{ticket.priority}</Badge>
                    </td>
                    <td className="px-3 py-3 lg:px-4">
                      <Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-slate-600 lg:px-4">
                      {formatDateTime(ticket.created_at || ticket.createdAt)}
                    </td>
                    <td className="hidden px-3 py-3 text-slate-600 2xl:table-cell lg:px-4">{ticket.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
