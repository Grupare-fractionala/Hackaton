import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import {
  useAnnouncementsQuery,
  useCompletedDeadlinesQuery,
} from "@/features/announcements/hooks/useAnnouncements";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useTicketsQuery } from "@/features/tickets/hooks/useTickets";
import {
  getDeadlineInfo,
  isRelevantForUser,
} from "@/features/announcements/utils/helpers";
import { formatDateTime, formatTicketId, relativeDate } from "@/utils/date";

function countByStatus(tickets, status) {
  return tickets.filter((t) => t.status === status).length;
}

export function DashboardPage() {
  const user = useCurrentUser();
  const ticketsQuery = useTicketsQuery();
  const announcementsQuery = useAnnouncementsQuery();
  const completedDeadlinesQuery = useCompletedDeadlinesQuery();
  const allTickets = ticketsQuery.data || [];

  const tickets = useMemo(() => {
    if (!user) return [];
    if (user.isAgent) {
      return allTickets.filter((t) => user.handledDepartments.includes(t.department));
    }
    return allTickets.filter((t) => t.user_id === user.id);
  }, [allTickets, user]);

  const upcomingDeadlines = useMemo(() => {
    const items = announcementsQuery.data || [];
    const completed = new Set(completedDeadlinesQuery.data || []);
    return items
      .filter(
        (item) =>
          item.type === "deadline" &&
          isRelevantForUser(item, user) &&
          !completed.has(item.id),
      )
      .map((item) => ({ item, info: getDeadlineInfo(item) }))
      .filter(({ info }) =>
        ["overdue", "critical", "soon", "this-week"].includes(info.urgency),
      )
      .sort((a, b) => new Date(a.item.dueAt).getTime() - new Date(b.item.dueAt).getTime())
      .slice(0, 3);
  }, [announcementsQuery.data, completedDeadlinesQuery.data, user]);

  const cards = [
    { label: "Total tichete", value: tickets.length, tone: "bg-brand-100 text-brand-900" },
    { label: "Deschise", value: countByStatus(tickets, "Deschis"), tone: "bg-sky-100 text-sky-900" },
    { label: "In lucru", value: countByStatus(tickets, "In lucru"), tone: "bg-amber-100 text-amber-900" },
    { label: "Rezolvate", value: countByStatus(tickets, "Rezolvat"), tone: "bg-emerald-100 text-emerald-900" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Bine ai venit, ${user?.name || "coleg"}`}
        subtitle="Monitorizeaza solicitarile si interactioneaza cu asistentul AI intern."
      />

      {upcomingDeadlines.length ? (
        <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-rose-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">
                !
              </span>
              <h3 className="text-base font-semibold text-amber-900">
                Termene apropiate pentru tine
              </h3>
            </div>
            <Link
              to="/deadlines"
              className="text-sm font-medium text-amber-800 underline hover:text-amber-900"
            >
              Vezi toate
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {upcomingDeadlines.map(({ item, info }) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 rounded-xl border border-amber-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    Scadent: {formatDateTime(item.dueAt)}
                  </p>
                </div>
                <Badge variant={info.variant}>{info.label}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="p-4">
            <p className="text-sm text-slate-600">{card.label}</p>
            <p className={`mt-2 inline-flex rounded-xl px-3 py-1 text-[clamp(1.25rem,1rem+1vw,1.7rem)] font-bold ${card.tone}`}>
              {card.value}
            </p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Solicitari recente</h2>
          <p className="mt-1 text-sm text-slate-600">
            {user?.isAgent ? "Ultimele tichete din departamentul tau." : "Ultimele tichete ale tale."}
          </p>

          {ticketsQuery.isLoading ? (
            <div className="mt-4"><Loader /></div>
          ) : (
            <div className="mt-4 space-y-3">
              {tickets.slice(0, 4).map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-slate-200 bg-white/90 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{ticket.subject}</p>
                    <Badge variant="neutral">{formatTicketId(ticket.id)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{ticket.description}</p>
                  <p className="mt-2 text-xs text-slate-500">Acum {relativeDate(ticket.createdAt)}</p>
                </div>
              ))}
              {!tickets.length ? <p className="text-sm text-slate-600">Nu exista tichete inca.</p> : null}
            </div>
          )}
        </Card>

        <Card className="border border-sand-300/80 bg-gradient-to-br from-sand-100 via-amber-50 to-orange-100 text-slate-900">
          <p className="text-xs uppercase tracking-[0.16em] text-amber-800">Recomandare AI</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Flux optim de lucru</h2>
          <ol className="mt-4 space-y-2 text-sm text-slate-800">
            <li>1. Pune intrebarea in chat.</li>
            <li>2. Daca AI nu rezolva, apasa "Creeaza tichet".</li>
            <li>3. Urmareste statusul in pagina Tichete.</li>
          </ol>
          <p className="mt-4 rounded-xl border border-amber-300/70 bg-white/75 p-3 text-sm text-slate-900">
            Pentru intrebari legislative, foloseste detalii complete (zona, tip constructie, context) pentru
            clasificare corecta.
          </p>
        </Card>
      </section>
    </div>
  );
}
