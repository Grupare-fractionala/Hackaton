import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import { AnnouncementForm } from "@/features/announcements/components/AnnouncementForm";
import {
  useAnnouncementsQuery,
  useCompletedDeadlinesQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useMarkAnnouncementReadMutation,
  useMarkAnnouncementsReadMutation,
  useMarkDeadlineCompletedMutation,
  useReadAnnouncementsQuery,
  useUnmarkDeadlineCompletedMutation,
} from "@/features/announcements/hooks/useAnnouncements";
import {
  ALL_DEPARTMENTS,
  getDeadlineInfo,
  isRelevantForUser,
  normalizeDepartments,
} from "@/features/announcements/utils/helpers";
import { formatDateTime } from "@/utils/date";

const PRIORITY_OPTIONS = ["Scazuta", "Medie", "Ridicata"];

function UrgentBanner({ items }) {
  if (!items.length) return null;

  return (
    <Card className="border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-amber-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-sm font-bold text-white">
          !
        </span>
        <h3 className="text-base font-semibold text-rose-900">
          Termene urgente ({items.length})
        </h3>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const info = getDeadlineInfo(item);
          return (
            <li
              key={item.id}
              className="flex flex-col gap-1 rounded-xl border border-rose-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">
                  Scadent: {formatDateTime(item.dueAt)}
                </p>
              </div>
              <Badge variant={info.variant}>{info.label}</Badge>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function DeadlinesPage() {
  const currentUser = useCurrentUser();
  const announcementsQuery = useAnnouncementsQuery();
  const readQuery = useReadAnnouncementsQuery();
  const completedQuery = useCompletedDeadlinesQuery();
  const createMutation = useCreateAnnouncementMutation();
  const deleteMutation = useDeleteAnnouncementMutation();
  const markReadMutation = useMarkAnnouncementReadMutation();
  const markAllReadMutation = useMarkAnnouncementsReadMutation();
  const completeMutation = useMarkDeadlineCompletedMutation();
  const uncompleteMutation = useUnmarkDeadlineCompletedMutation();

  const [departmentFilter, setDepartmentFilter] = useState("relevante");
  const [priorityFilter, setPriorityFilter] = useState("toate");
  const [statusFilter, setStatusFilter] = useState("active");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const allItems = announcementsQuery.data || [];
  const deadlines = useMemo(
    () => allItems.filter((a) => a.type === "deadline"),
    [allItems],
  );
  const readIds = useMemo(() => new Set(readQuery.data || []), [readQuery.data]);
  const completedIds = useMemo(
    () => new Set(completedQuery.data || []),
    [completedQuery.data],
  );

  const relevant = useMemo(
    () =>
      deadlines.filter(
        (d) => isRelevantForUser(d, currentUser) && !completedIds.has(d.id),
      ),
    [deadlines, currentUser, completedIds],
  );

  const urgent = useMemo(
    () =>
      relevant.filter((d) => {
        const info = getDeadlineInfo(d);
        return info.urgency === "overdue" || info.urgency === "critical";
      }),
    [relevant],
  );

  const filtered = useMemo(() => {
    return deadlines.filter((deadline) => {
      const isCompleted = completedIds.has(deadline.id);
      if (isCompleted && !showCompleted) return false;
      if (!isCompleted && showCompleted) return false;

      const info = getDeadlineInfo(deadline);

      const statusMatches =
        statusFilter === "toate"
          ? true
          : statusFilter === "active"
            ? info.urgency !== "overdue"
            : statusFilter === "depasite"
              ? info.urgency === "overdue"
              : true;

      const priorityMatches =
        priorityFilter === "toate" || deadline.priority === priorityFilter;

      const departments = normalizeDepartments(deadline);
      const departmentMatches =
        departmentFilter === "toate"
          ? true
          : departmentFilter === "relevante"
            ? isRelevantForUser(deadline, currentUser)
            : departments.includes(departmentFilter);

      return statusMatches && priorityMatches && departmentMatches;
    });
  }, [
    deadlines,
    currentUser,
    departmentFilter,
    priorityFilter,
    statusFilter,
    completedIds,
    showCompleted,
  ]);

  const completedCount = useMemo(
    () =>
      deadlines.filter(
        (d) => isRelevantForUser(d, currentUser) && completedIds.has(d.id),
      ).length,
    [deadlines, currentUser, completedIds],
  );

  const unreadRelevant = relevant.filter((d) => !readIds.has(d.id));
  const overdue = relevant.filter((d) => getDeadlineInfo(d).urgency === "overdue");
  const thisWeek = relevant.filter((d) => {
    const u = getDeadlineInfo(d).urgency;
    return u === "critical" || u === "soon" || u === "this-week";
  });

  const handleCreate = async (payload) => {
    await createMutation.mutateAsync(payload);
    setShowForm(false);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(unreadRelevant.map((d) => d.id));
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Termene"
        subtitle="Termene limita pentru raportari, predari si activitati."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={showCompleted ? "primary" : "secondary"}
              onClick={() => setShowCompleted((v) => !v)}
            >
              {showCompleted ? "Ascunde indeplinite" : `Vezi indeplinite (${completedCount})`}
            </Button>
            {unreadRelevant.length ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
              >
                Marcheaza tot citit
              </Button>
            ) : null}
            {currentUser?.isAdmin ? (
              <Button size="sm" onClick={() => setShowForm((value) => !value)}>
                {showForm ? "Ascunde formular" : "Adauga termen"}
              </Button>
            ) : null}
          </div>
        }
      />

      <UrgentBanner items={urgent} />

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-slate-600">Depasite</p>
          <p className="mt-2 text-2xl font-bold text-rose-700">{overdue.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Aceasta saptamana</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{thisWeek.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Total relevante</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{relevant.length}</p>
        </Card>
      </section>

      {showForm && currentUser?.isAdmin ? (
        <AnnouncementForm
          type="deadline"
          onSubmit={handleCreate}
          isPending={createMutation.isPending}
          error={createMutation.isError ? createMutation.error?.message : null}
        />
      ) : null}

      <Card className="grid gap-3 p-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </label>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="active">Active</option>
            <option value="depasite">Depasite</option>
            <option value="toate">Toate</option>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Departament
          </label>
          <Select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
          >
            <option value="relevante">Relevante pentru mine</option>
            <option value="toate">Toate</option>
            {ALL_DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Prioritate
          </label>
          <Select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="toate">Toate</option>
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </Select>
        </div>
      </Card>

      {announcementsQuery.isLoading || readQuery.isLoading ? (
        <Card>
          <Loader label="Se incarca termenele..." />
        </Card>
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((deadline) => {
            const isCompleted = completedIds.has(deadline.id);
            return (
              <AnnouncementCard
                key={deadline.id}
                announcement={deadline}
                isRead={readIds.has(deadline.id)}
                isCompleted={isCompleted}
                isAdmin={Boolean(currentUser?.isAdmin)}
                isBusy={
                  markReadMutation.isPending ||
                  deleteMutation.isPending ||
                  completeMutation.isPending ||
                  uncompleteMutation.isPending
                }
                onMarkRead={() => markReadMutation.mutate(deadline.id)}
                onDelete={() => deleteMutation.mutate(deadline.id)}
                onComplete={() => completeMutation.mutate(deadline.id)}
                onUncomplete={() => uncompleteMutation.mutate(deadline.id)}
                emphasizeUrgency={!isCompleted}
              />
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-600">Nu exista termene pentru filtrele selectate.</p>
        </Card>
      )}
    </div>
  );
}
