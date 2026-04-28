import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  formatDepartmentList,
  getDeadlineInfo,
  normalizeDepartments,
  priorityVariant,
} from "@/features/announcements/utils/helpers";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/date";

export function AnnouncementCard({
  announcement,
  isRead,
  isAdmin,
  onMarkRead,
  onDelete,
  onComplete,
  onUncomplete,
  isCompleted = false,
  isBusy,
  showDeadline = true,
  emphasizeUrgency = false,
}) {
  const deadline = getDeadlineInfo(announcement);
  const departments = normalizeDepartments(announcement);

  const urgencyClass =
    emphasizeUrgency && deadline.urgency === "overdue"
      ? "border-2 border-rose-400 bg-rose-50/40"
      : emphasizeUrgency && deadline.urgency === "critical"
        ? "border-2 border-amber-400 bg-amber-50/40"
        : !isRead
          ? "border border-brand-200 bg-white"
          : "border border-white/70";

  return (
    <Card className={cn("p-4", urgencyClass)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {isCompleted ? <Badge variant="success">Indeplinit</Badge> : null}
            {!isRead && !isCompleted ? <Badge variant="success">Nou</Badge> : null}
            {announcement.pinned ? <Badge variant="warning">Fixat</Badge> : null}
            <Badge variant={priorityVariant(announcement.priority)}>{announcement.priority}</Badge>
            <Badge variant="neutral">{formatDepartmentList(departments)}</Badge>
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
          {showDeadline ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Termen</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {announcement.dueAt ? formatDateTime(announcement.dueAt) : "Fara termen"}
              </p>
              {announcement.dueAt ? (
                <Badge variant={deadline.variant} className="mt-2">
                  {deadline.label}
                </Badge>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 lg:flex-col">
            {onComplete && !isCompleted ? (
              <Button size="sm" onClick={onComplete} disabled={isBusy}>
                Marcheaza indeplinit
              </Button>
            ) : null}
            {onUncomplete && isCompleted ? (
              <Button size="sm" variant="secondary" onClick={onUncomplete} disabled={isBusy}>
                Reactiveaza
              </Button>
            ) : null}
            {!isRead && !isCompleted ? (
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
