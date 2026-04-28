import { supabase } from "@/supabaseClient";
import { isMockMode } from "@/config/env";
import { ALL_DEPARTMENTS_TOKEN, normalizeDepartments } from "@/features/announcements/utils/helpers";

const ANNOUNCEMENTS_KEY = "primarie-announcements";
const READ_KEY_PREFIX = "primarie-announcements-read";
const COMPLETED_KEY_PREFIX = "primarie-deadlines-completed";

function daysFromNow(days, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

const defaultAnnouncements = [
  {
    id: "ann-001",
    type: "deadline",
    title: "Termen depunere raport lunar",
    message:
      "Departamentele trebuie sa incarce raportul lunar pana la finalul zilei de lucru.",
    category: "Raportare",
    departments: [ALL_DEPARTMENTS_TOKEN],
    priority: "Ridicata",
    dueAt: daysFromNow(2, 16),
    createdAt: daysFromNow(-1, 9),
    createdBy: "Administrator IT",
    pinned: true,
  },
  {
    id: "ann-002",
    type: "announcement",
    title: "Mentenanta portal intern",
    message:
      "Portalul poate avea intreruperi scurte maine dimineata intre 08:00 si 09:00.",
    category: "Tehnic",
    departments: [ALL_DEPARTMENTS_TOKEN],
    priority: "Medie",
    dueAt: daysFromNow(1, 8),
    createdAt: daysFromNow(-2, 11),
    createdBy: "Operator Tehnic",
    pinned: false,
  },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // Re-seed malformed local demo data.
  }

  const value = typeof fallback === "function" ? fallback() : fallback;
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readKeyForUser(userId) {
  return `${READ_KEY_PREFIX}-${userId || "anon"}`;
}

function completedKeyForUser(userId) {
  return `${COMPLETED_KEY_PREFIX}-${userId || "anon"}`;
}

function fromRow(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    category: row.category,
    departments: Array.isArray(row.departments) ? row.departments : [ALL_DEPARTMENTS_TOKEN],
    priority: row.priority,
    dueAt: row.due_at || "",
    pinned: Boolean(row.pinned),
    createdBy: row.created_by || "Administrator",
    createdAt: row.created_at,
  };
}

function sortAnnouncements(items) {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;

    const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
    const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;

    if (aDue !== bDue) return aDue - bDue;

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function getAnnouncements() {
  if (isMockMode) {
    const stored = readJson(ANNOUNCEMENTS_KEY, defaultAnnouncements);
    return sortAnnouncements(stored.map((a) => ({ ...a, departments: normalizeDepartments(a) })));
  }

  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return sortAnnouncements((data || []).map(fromRow));
}

export async function createAnnouncement(payload, author) {
  const departments =
    Array.isArray(payload.departments) && payload.departments.length
      ? payload.departments
      : [ALL_DEPARTMENTS_TOKEN];

  const createdBy = author?.name || author?.username || "Administrator";

  if (isMockMode) {
    const announcements = readJson(ANNOUNCEMENTS_KEY, defaultAnnouncements);
    const announcement = {
      id: `ann-${Date.now()}`,
      type: payload.type,
      title: payload.title.trim(),
      message: payload.message.trim(),
      category: (payload.category || "General").trim() || "General",
      departments,
      priority: payload.priority || "Medie",
      dueAt: payload.dueAt || "",
      createdAt: new Date().toISOString(),
      createdBy,
      pinned: Boolean(payload.pinned),
    };
    writeJson(ANNOUNCEMENTS_KEY, [announcement, ...announcements]);
    return announcement;
  }

  const { data, error } = await supabase
    .from("announcements")
    .insert([
      {
        type: payload.type,
        title: payload.title.trim(),
        message: payload.message.trim(),
        category: (payload.category || "General").trim() || "General",
        departments,
        priority: payload.priority || "Medie",
        due_at: payload.dueAt || null,
        pinned: Boolean(payload.pinned),
        created_by: createdBy,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return fromRow(data);
}

export async function deleteAnnouncement(announcementId) {
  if (isMockMode) {
    const announcements = readJson(ANNOUNCEMENTS_KEY, defaultAnnouncements).filter(
      (a) => a.id !== announcementId,
    );
    writeJson(ANNOUNCEMENTS_KEY, announcements);
    return;
  }

  const { error } = await supabase.from("announcements").delete().eq("id", announcementId);
  if (error) throw error;
}

export async function getReadAnnouncementIds(userId) {
  if (!userId) return [];

  if (isMockMode) {
    return readJson(readKeyForUser(userId), []);
  }

  const { data, error } = await supabase
    .from("announcement_reads")
    .select("announcement_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data || []).map((row) => row.announcement_id);
}

export async function markAnnouncementRead({ announcementId, userId }) {
  if (!userId) return [];

  if (isMockMode) {
    const key = readKeyForUser(userId);
    const ids = new Set(readJson(key, []));
    ids.add(announcementId);
    const next = Array.from(ids);
    writeJson(key, next);
    return next;
  }

  const { error } = await supabase
    .from("announcement_reads")
    .upsert({ user_id: userId, announcement_id: announcementId }, {
      onConflict: "user_id,announcement_id",
    });

  if (error) throw error;
  return getReadAnnouncementIds(userId);
}

export async function markAnnouncementsRead({ announcementIds, userId }) {
  if (!userId || !announcementIds.length) return [];

  if (isMockMode) {
    const key = readKeyForUser(userId);
    const ids = new Set(readJson(key, []));
    for (const id of announcementIds) ids.add(id);
    const next = Array.from(ids);
    writeJson(key, next);
    return next;
  }

  const rows = announcementIds.map((id) => ({ user_id: userId, announcement_id: id }));

  const { error } = await supabase
    .from("announcement_reads")
    .upsert(rows, { onConflict: "user_id,announcement_id" });

  if (error) throw error;
  return getReadAnnouncementIds(userId);
}

export async function getCompletedDeadlineIds(userId) {
  if (!userId) return [];

  if (isMockMode) {
    return readJson(completedKeyForUser(userId), []);
  }

  const { data, error } = await supabase
    .from("deadline_completions")
    .select("deadline_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data || []).map((row) => row.deadline_id);
}

export async function markDeadlineCompleted({ deadlineId, userId }) {
  if (!userId) return [];

  if (isMockMode) {
    const key = completedKeyForUser(userId);
    const ids = new Set(readJson(key, []));
    ids.add(deadlineId);
    const next = Array.from(ids);
    writeJson(key, next);
    return next;
  }

  const { error } = await supabase
    .from("deadline_completions")
    .upsert({ user_id: userId, deadline_id: deadlineId }, {
      onConflict: "user_id,deadline_id",
    });

  if (error) throw error;
  return getCompletedDeadlineIds(userId);
}

export async function unmarkDeadlineCompleted({ deadlineId, userId }) {
  if (!userId) return [];

  if (isMockMode) {
    const key = completedKeyForUser(userId);
    const ids = new Set(readJson(key, []));
    ids.delete(deadlineId);
    const next = Array.from(ids);
    writeJson(key, next);
    return next;
  }

  const { error } = await supabase
    .from("deadline_completions")
    .delete()
    .eq("user_id", userId)
    .eq("deadline_id", deadlineId);

  if (error) throw error;
  return getCompletedDeadlineIds(userId);
}
