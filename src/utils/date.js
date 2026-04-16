export function formatTicketId(id) {
  if (!id) return "—";
  return `TKT-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export function formatDateTime(value) {
  const date = new Date(value);

  return date.toLocaleString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeDate(value) {
  const then = new Date(value).getTime();
  const now = Date.now();
  const diffMinutes = Math.max(1, Math.round((now - then) / 60_000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} zile`;
}
