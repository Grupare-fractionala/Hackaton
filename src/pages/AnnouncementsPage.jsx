import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { AnnouncementCard } from "@/features/announcements/components/AnnouncementCard";
import { AnnouncementForm } from "@/features/announcements/components/AnnouncementForm";
import {
  useAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useMarkAnnouncementReadMutation,
  useMarkAnnouncementsReadMutation,
  useReadAnnouncementsQuery,
} from "@/features/announcements/hooks/useAnnouncements";
import {
  ALL_DEPARTMENTS,
  isRelevantForUser,
  normalizeDepartments,
} from "@/features/announcements/utils/helpers";

const PRIORITY_OPTIONS = ["Scazuta", "Medie", "Ridicata"];

export function AnnouncementsPage() {
  const currentUser = useCurrentUser();
  const announcementsQuery = useAnnouncementsQuery();
  const readQuery = useReadAnnouncementsQuery();
  const createMutation = useCreateAnnouncementMutation();
  const deleteMutation = useDeleteAnnouncementMutation();
  const markReadMutation = useMarkAnnouncementReadMutation();
  const markAllReadMutation = useMarkAnnouncementsReadMutation();

  const [departmentFilter, setDepartmentFilter] = useState("relevante");
  const [priorityFilter, setPriorityFilter] = useState("toate");
  const [showForm, setShowForm] = useState(false);

  const allItems = announcementsQuery.data || [];
  const announcements = useMemo(
    () => allItems.filter((a) => a.type === "announcement"),
    [allItems],
  );
  const readIds = useMemo(() => new Set(readQuery.data || []), [readQuery.data]);

  const relevant = useMemo(
    () => announcements.filter((a) => isRelevantForUser(a, currentUser)),
    [announcements, currentUser],
  );

  const filtered = useMemo(() => {
    return announcements.filter((announcement) => {
      const priorityMatches =
        priorityFilter === "toate" || announcement.priority === priorityFilter;

      const departments = normalizeDepartments(announcement);
      const departmentMatches =
        departmentFilter === "toate"
          ? true
          : departmentFilter === "relevante"
            ? isRelevantForUser(announcement, currentUser)
            : departments.includes(departmentFilter);

      return priorityMatches && departmentMatches;
    });
  }, [announcements, currentUser, departmentFilter, priorityFilter]);

  const unreadRelevant = relevant.filter((a) => !readIds.has(a.id));

  const handleCreate = async (payload) => {
    await createMutation.mutateAsync(payload);
    setShowForm(false);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(unreadRelevant.map((a) => a.id));
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Anunturi"
        subtitle="Notificari si informari interne pentru departamente."
        action={
          <div className="flex flex-wrap gap-2">
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
                {showForm ? "Ascunde formular" : "Adauga anunt"}
              </Button>
            ) : null}
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-slate-600">Necitite</p>
          <p className="mt-2 text-2xl font-bold text-brand-800">{unreadRelevant.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Anunturi relevante</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{relevant.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Prioritate ridicata</p>
          <p className="mt-2 text-2xl font-bold text-rose-700">
            {relevant.filter((a) => a.priority === "Ridicata").length}
          </p>
        </Card>
      </section>

      {showForm && currentUser?.isAdmin ? (
        <AnnouncementForm
          type="announcement"
          onSubmit={handleCreate}
          isPending={createMutation.isPending}
          error={createMutation.isError ? createMutation.error?.message : null}
        />
      ) : null}

      <Card className="grid gap-3 p-4 md:grid-cols-2">
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
          <Loader label="Se incarca anunturile..." />
        </Card>
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              isRead={readIds.has(announcement.id)}
              isAdmin={Boolean(currentUser?.isAdmin)}
              isBusy={markReadMutation.isPending || deleteMutation.isPending}
              onMarkRead={() => markReadMutation.mutate(announcement.id)}
              onDelete={() => deleteMutation.mutate(announcement.id)}
              showDeadline={false}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-600">Nu exista anunturi pentru filtrele selectate.</p>
        </Card>
      )}
    </div>
  );
}
