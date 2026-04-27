const ANNOUNCEMENTS_KEY = "primarie-announcements";
const READ_KEY_PREFIX = "primarie-announcements-read";

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
    department: "Toate",
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
    department: "Toate",
    priority: "Medie",
    dueAt: daysFromNow(1, 8),
    createdAt: daysFromNow(-2, 11),
    createdBy: "Operator Tehnic",
    pinned: false,
  },
  {
    id: "ann-003",
    type: "deadline",
    title: "Actualizare documente HR",
    message:
      "Documentele pentru concedii si adeverinte trebuie verificate si actualizate in arhiva.",
    category: "HR",
    department: "HR",
    priority: "Medie",
    dueAt: daysFromNow(7, 12),
    createdAt: daysFromNow(-3, 13),
    createdBy: "Operator HR",
    pinned: false,
  },
  {
    id: "ann-004",
    type: "announcement",
    title: "Sedinta operativa",
    message:
      "Sedinta scurta pentru statusul solicitarilor deschise are loc in sala de consiliu.",
    category: "Organizare",
    department: "Administrativ",
    priority: "Scazuta",
    dueAt: daysFromNow(4, 10),
    createdAt: daysFromNow(-1, 14),
    createdBy: "Operator Administrativ",
    pinned: false,
  },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
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

function sortAnnouncements(items) {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    const aDue = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
    const bDue = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;

    if (aDue !== bDue) {
      return aDue - bDue;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function getAnnouncements() {
  return sortAnnouncements(readJson(ANNOUNCEMENTS_KEY, defaultAnnouncements));
}

export async function createAnnouncement(payload, author) {
  const announcements = readJson(ANNOUNCEMENTS_KEY, defaultAnnouncements);
  const announcement = {
    id: `ann-${Date.now()}`,
    type: payload.type,
    title: payload.title.trim(),
    message: payload.message.trim(),
    category: payload.category.trim() || "General",
    department: payload.department || "Toate",
    priority: payload.priority || "Medie",
    dueAt: payload.dueAt || "",
    createdAt: new Date().toISOString(),
    createdBy: author?.name || author?.username || "Administrator",
    pinned: Boolean(payload.pinned),
  };

  writeJson(ANNOUNCEMENTS_KEY, [announcement, ...announcements]);
  return announcement;
}

export async function deleteAnnouncement(announcementId) {
  const announcements = readJson(ANNOUNCEMENTS_KEY, defaultAnnouncements).filter(
    (announcement) => announcement.id !== announcementId,
  );
  writeJson(ANNOUNCEMENTS_KEY, announcements);
}

export async function getReadAnnouncementIds(userId) {
  return readJson(readKeyForUser(userId), []);
}

export async function markAnnouncementRead({ announcementId, userId }) {
  const key = readKeyForUser(userId);
  const readIds = new Set(readJson(key, []));
  readIds.add(announcementId);
  const nextIds = Array.from(readIds);
  writeJson(key, nextIds);
  return nextIds;
}

export async function markAnnouncementsRead({ announcementIds, userId }) {
  const key = readKeyForUser(userId);
  const readIds = new Set(readJson(key, []));

  for (const announcementId of announcementIds) {
    readIds.add(announcementId);
  }

  const nextIds = Array.from(readIds);
  writeJson(key, nextIds);
  return nextIds;
}
