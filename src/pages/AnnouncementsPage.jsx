import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  useAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useMarkAnnouncementReadMutation,
  useMarkAnnouncementsReadMutation,
  useReadAnnouncementsQuery,
} from "@/features/announcements/hooks/useAnnouncements";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/date";

const DEPARTMENT_OPTIONS = [
  "Toate",
  "Tehnic",
  "HR",
  "Administrativ",
  "Urbanism",
  "Registratura",
];
const CATEGORY_OPTIONS = ["General", "Raportare", "Tehnic", "HR", "Organizare", "Legislativ"];
const PRIORITY_OPTIONS = ["Scazuta", "Medie", "Ridicata"];

const initialForm = {
  type: "announcement",
  title: "",
  message: "",
  category: "General",
  department: "Toate",
  priority: "Medie",
  dueAt: "",
  pinned: false,
};

function priorityVariant(priority) {
  if (priority === "Ridicata") return "danger";
  if (priority === "Medie") return "warning";
  return "neutral";
}

function typeLabel(type) {
  return type === "deadline" ? "Termen" : "Anunt";
}

function typeVariant(type) {
  return type === "deadline" ? "info" : "neutral";
}

function isRelevantForUser(announcement, user) {
  if (!user || user.isAdmin) {
    return true;
  }

  if (announcement.department === "Toate") {
    return true;
  }

  if (announcement.department === user.department) {
    return true;
  }

  return user.handledDepartments?.includes(announcement.department);
}

function getDeadlineInfo(announcement) {
  if (!announcement.dueAt) {
    return { label: "Fara termen", variant: "neutral", isSoon: false };
  }

  const now = new Date();
  const due = new Date(announcement.dueAt);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86_400_000);

  if (diffMs < 0) {
    return { label: "Termen depasit", variant: "danger", isSoon: true };
  }

  if (diffDays <= 1) {
    return { label: "Azi / maine", variant: "danger", isSoon: true };
  }

  if (diffDays <= 7) {
    return { label: `${diffDays} zile`, variant: "warning", isSoon: true };
  }

  return { label: `${diffDays} zile`, variant: "info", isSoon: false };
}

function fromDatetimeLocalValue(value) {
  return value ? new Date(value).toISOString() : "";
}

function AnnouncementCard({
  announcement,
  isRead,
  isAdmin,
  onMarkRead,
  onDelete,
  isBusy,
}) {
  const deadline = getDeadlineInfo(announcement);

  return (
    <Card
      className={cn(
        "p-4",
        !isRead ? "border border-brand-200 bg-white" : "border border-white/70",
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {!isRead ? <Badge variant="success">Nou</Badge> : null}
            {announcement.pinned ? <Badge variant="warning">Fixat</Badge> : null}
            <Badge variant={typeVariant(announcement.type)}>{typeLabel(announcement.type)}</Badge>
            <Badge variant={priorityVariant(announcement.priority)}>{announcement.priority}</Badge>
            <Badge variant="neutral">{announcement.department}</Badge>
          </div>

          <h2 className="mt-3 text-lg font-semibold text-slate-900">{announcement.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{announcement.message}</p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            <span>Categorie: {announcement.category}</span>
            <span>Publicat: {formatDateTime(announcement.createdAt)}</span>
            <span>De: {announcement.createdBy}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 lg:w-44">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Termen
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {announcement.dueAt ? formatDateTime(announcement.dueAt) : "Fara termen"}
            </p>
            {announcement.dueAt ? (
              <Badge variant={deadline.variant} className="mt-2">
                {deadline.label}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 lg:flex-col">
            {!isRead ? (
              <Button size="sm" variant="secondary" onClick={onMarkRead} disabled={isBusy}>
                Marcheaza citit
              </Button>
            ) : null}
            {isAdmin ? (
              <Button size="sm" variant="ghost" onClick={onDelete} disabled={isBusy}>
                Sterge
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function AnnouncementsPage() {
  const currentUser = useCurrentUser();
  const announcementsQuery = useAnnouncementsQuery();
  const readQuery = useReadAnnouncementsQuery();
  const createMutation = useCreateAnnouncementMutation();
  const deleteMutation = useDeleteAnnouncementMutation();
  const markReadMutation = useMarkAnnouncementReadMutation();
  const markAllReadMutation = useMarkAnnouncementsReadMutation();

  const [typeFilter, setTypeFilter] = useState("toate");
  const [departmentFilter, setDepartmentFilter] = useState("relevante");
  const [priorityFilter, setPriorityFilter] = useState("toate");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);

  const announcements = announcementsQuery.data || [];
  const readIds = useMemo(() => new Set(readQuery.data || []), [readQuery.data]);

  const relevantAnnouncements = useMemo(
    () => announcements.filter((announcement) => isRelevantForUser(announcement, currentUser)),
    [announcements, currentUser],
  );

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const typeMatches = typeFilter === "toate" || announcement.type === typeFilter;
      const priorityMatches =
        priorityFilter === "toate" || announcement.priority === priorityFilter;
      const departmentMatches =
        departmentFilter === "toate"
          ? true
          : departmentFilter === "relevante"
            ? isRelevantForUser(announcement, currentUser)
            : announcement.department === departmentFilter;

      return typeMatches && priorityMatches && departmentMatches;
    });
  }, [announcements, currentUser, departmentFilter, priorityFilter, typeFilter]);

  const unreadRelevant = relevantAnnouncements.filter((announcement) => !readIds.has(announcement.id));
  const soonDeadlines = relevantAnnouncements.filter(
    (announcement) => announcement.type === "deadline" && getDeadlineInfo(announcement).isSoon,
  );
  const urgentAnnouncements = relevantAnnouncements.filter(
    (announcement) => announcement.priority === "Ridicata",
  );

  const handleCreate = async (event) => {
    event.preventDefault();

    await createMutation.mutateAsync({
      ...form,
      dueAt: fromDatetimeLocalValue(form.dueAt),
    });

    setForm(initialForm);
    setShowForm(false);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(unreadRelevant.map((announcement) => announcement.id));
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Anunturi si termene"
        subtitle="Notificari interne, termene limita si informari pentru departamente."
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-slate-600">Necitite</p>
          <p className="mt-2 text-2xl font-bold text-brand-800">{unreadRelevant.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Termene apropiate</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">{soonDeadlines.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Anunturi relevante</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{relevantAnnouncements.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-600">Prioritate ridicata</p>
          <p className="mt-2 text-2xl font-bold text-rose-700">{urgentAnnouncements.length}</p>
        </Card>
      </section>

      {showForm && currentUser?.isAdmin ? (
        <Card>
          <form className="grid gap-4" onSubmit={handleCreate}>
            <div className="grid gap-4 lg:grid-cols-[1fr_12rem_12rem]">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="announcement-title">
                  Titlu
                </label>
                <Input
                  id="announcement-title"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Ex: Termen transmitere raport"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="announcement-type">
                  Tip
                </label>
                <Select
                  id="announcement-type"
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                >
                  <option value="announcement">Anunt</option>
                  <option value="deadline">Termen</option>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="announcement-priority">
                  Prioritate
                </label>
                <Select
                  id="announcement-priority"
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
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="announcement-message">
                Mesaj
              </label>
              <Textarea
                id="announcement-message"
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Scrie informarea sau detaliile termenului."
                rows={4}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="announcement-category">
                  Categorie
                </label>
                <Select
                  id="announcement-category"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="announcement-department">
                  Departament
                </label>
                <Select
                  id="announcement-department"
                  value={form.department}
                  onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
                >
                  {DEPARTMENT_OPTIONS.map((department) => (
                    <option key={department}>{department}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="announcement-due">
                  Data termen
                </label>
                <Input
                  id="announcement-due"
                  type="datetime-local"
                  value={form.dueAt}
                  onChange={(event) => setForm((prev) => ({ ...prev, dueAt: event.target.value }))}
                />
              </div>

              <label className="flex items-center gap-2 self-end rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(event) => setForm((prev) => ({ ...prev, pinned: event.target.checked }))}
                  className="h-4 w-4 accent-brand-600"
                />
                Fixeaza sus
              </label>
            </div>

            {createMutation.isError ? (
              <p className="text-sm text-rose-600">
                {createMutation.error?.message || "Nu am putut crea anuntul."}
              </p>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Se publica..." : "Publica"}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card className="grid gap-3 p-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tip
          </label>
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="toate">Toate</option>
            <option value="announcement">Anunturi</option>
            <option value="deadline">Termene</option>
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
            {DEPARTMENT_OPTIONS.filter((department) => department !== "Toate").map((department) => (
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
      ) : filteredAnnouncements.length ? (
        <div className="space-y-3">
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              isRead={readIds.has(announcement.id)}
              isAdmin={Boolean(currentUser?.isAdmin)}
              isBusy={markReadMutation.isPending || deleteMutation.isPending}
              onMarkRead={() => markReadMutation.mutate(announcement.id)}
              onDelete={() => deleteMutation.mutate(announcement.id)}
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
