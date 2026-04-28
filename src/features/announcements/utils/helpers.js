export const ALL_DEPARTMENTS = [
  "Tehnic",
  "HR",
  "Administrativ",
  "Urbanism",
  "Registratura",
];

export const ALL_DEPARTMENTS_TOKEN = "Toate";

export function normalizeDepartments(announcement) {
  if (Array.isArray(announcement?.departments) && announcement.departments.length) {
    return announcement.departments;
  }

  if (announcement?.department) {
    return [announcement.department];
  }

  return [ALL_DEPARTMENTS_TOKEN];
}

export function targetsEveryone(departments) {
  return !departments.length || departments.includes(ALL_DEPARTMENTS_TOKEN);
}

export function isRelevantForUser(announcement, user) {
  if (!user) return false;
  if (user.isAdmin) return true;

  const departments = normalizeDepartments(announcement);
  if (targetsEveryone(departments)) return true;

  if (user.department && departments.includes(user.department)) return true;

  if (user.handledDepartments?.some((d) => departments.includes(d))) return true;

  return false;
}

export function priorityVariant(priority) {
  if (priority === "Ridicata") return "danger";
  if (priority === "Medie") return "warning";
  return "neutral";
}

export function getDeadlineInfo(announcement) {
  if (!announcement?.dueAt) {
    return { label: "Fara termen", variant: "neutral", urgency: "none", diffDays: null };
  }

  const now = new Date();
  const due = new Date(announcement.dueAt);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86_400_000);

  if (diffMs < 0) {
    return { label: "Termen depasit", variant: "danger", urgency: "overdue", diffDays };
  }

  if (diffDays <= 1) {
    return { label: "Azi / maine", variant: "danger", urgency: "critical", diffDays };
  }

  if (diffDays <= 3) {
    return { label: `${diffDays} zile`, variant: "warning", urgency: "soon", diffDays };
  }

  if (diffDays <= 7) {
    return { label: `${diffDays} zile`, variant: "warning", urgency: "this-week", diffDays };
  }

  return { label: `${diffDays} zile`, variant: "info", urgency: "later", diffDays };
}

export function isUrgentDeadline(announcement) {
  const info = getDeadlineInfo(announcement);
  return ["overdue", "critical", "soon"].includes(info.urgency);
}

export function formatDepartmentList(departments) {
  if (targetsEveryone(departments)) return "Toate departamentele";
  return departments.join(", ");
}
