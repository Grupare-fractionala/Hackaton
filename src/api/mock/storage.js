import {
  DEPARTMENT_ADMINISTRATIVE,
  DEPARTMENT_HR,
  DEPARTMENT_TECHNICAL,
  TICKET_DEPARTMENTS,
  getAssignedDepartmentByCategory,
} from "@/features/tickets/utils/routing";

const USERS_KEY = "mock-users";
const TICKETS_KEY = "mock-tickets";
const DOCUMENTS_KEY = "mock-documents";
const DOCUMENT_DEPARTMENTS = ["General", ...TICKET_DEPARTMENTS];

const DEFAULT_USERS = [
  {
    id: "u1",
    email: "secretara@primarie.local",
    password: "Secretara123!",
    name: "Maria Popescu",
    role: "employee",
    department: "Secretariat",
    leaveBalance: 14,
  },
  {
    id: "u2",
    email: "urbanism@primarie.local",
    password: "Urbanism123!",
    name: "Andrei Iacob",
    role: "employee",
    department: "Urbanism",
    leaveBalance: 10,
  },
  {
    id: "u3",
    email: "admin@primarie.local",
    password: "Admin123!",
    name: "Elena Dumitru",
    role: "admin",
    department: "IT",
    leaveBalance: 20,
  },
  {
    id: "u4",
    email: "tehnic@primarie.local",
    password: "Tehnic123!",
    name: "Radu Stanciu",
    role: "agent",
    department: "Departament Tehnic",
    handledDepartments: [DEPARTMENT_TECHNICAL],
    leaveBalance: 12,
  },
  {
    id: "u5",
    email: "hr@primarie.local",
    password: "Hr123456!",
    name: "Ioana Enache",
    role: "agent",
    department: "Resurse Umane",
    handledDepartments: [DEPARTMENT_HR],
    leaveBalance: 16,
  },
  {
    id: "u6",
    email: "administrativ@primarie.local",
    password: "AdminDep123!",
    name: "Mihai Serban",
    role: "agent",
    department: "Serviciul Administrativ",
    handledDepartments: [DEPARTMENT_ADMINISTRATIVE],
    leaveBalance: 13,
  },
];

const DEFAULT_TICKETS = [
  {
    id: "TCK-0001",
    userId: "u1",
    requesterName: "Maria Popescu",
    category: "Tehnic",
    subject: "Imprimanta de la registratura nu tipareste",
    description: "Eroare de spooler dupa repornire. Solicit interventie IT.",
    priority: "Ridicata",
    status: "In lucru",
    assignedDepartment: DEPARTMENT_TECHNICAL,
    handledByName: "Radu Stanciu",
    handledByUserId: "u4",
    lastResponse:
      "Incident preluat de departamentul tehnic. Se intervine onsite in cursul zilei.",
    source: "chat",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "TCK-0002",
    userId: "u2",
    requesterName: "Andrei Iacob",
    category: "Legislativ",
    subject: "Clarificare distanta minima intre constructii",
    description: "Solicitare clarificare pentru caz urbanism in zona mixta.",
    priority: "Medie",
    status: "Deschis",
    assignedDepartment: DEPARTMENT_ADMINISTRATIVE,
    handledByName: null,
    handledByUserId: null,
    lastResponse: null,
    source: "manual",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
];

const DEFAULT_DOCUMENTS = [
  {
    id: "DOC-0001",
    title: "Regulament de ordine interioara",
    category: "Regulamente",
    department: "General",
    description: "Reguli generale aplicabile tuturor angajatilor din primarie.",
    fileName: "regulament_ordine_interioara_2026.pdf",
    fileType: "application/pdf",
    fileSize: 0,
    fileDataUrl: null,
    uploadedByUserId: "u3",
    uploadedByName: "Elena Dumitru",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: "DOC-0002",
    title: "Procedura concedii si invoiri",
    category: "Proceduri",
    department: DEPARTMENT_HR,
    description: "Flux intern pentru solicitari de concediu, invoiri si aprobari.",
    fileName: "procedura_concedii_hr.pdf",
    fileType: "application/pdf",
    fileSize: 0,
    fileDataUrl: null,
    uploadedByUserId: "u5",
    uploadedByName: "Ioana Enache",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
  },
  {
    id: "DOC-0003",
    title: "Checklist interventii imprimante",
    category: "Tehnic",
    department: DEPARTMENT_TECHNICAL,
    description: "Checklist de verificari standard inainte de escalare ticket IT.",
    fileName: "checklist_imprimante_it.pdf",
    fileType: "application/pdf",
    fileSize: 0,
    fileDataUrl: null,
    uploadedByUserId: "u4",
    uploadedByName: "Radu Stanciu",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
];

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeUser(user) {
  if (!user) {
    return user;
  }

  if (user.role === "agent") {
    const inferred = getAssignedDepartmentByCategory(user.department);
    const handledDepartments = Array.isArray(user.handledDepartments) && user.handledDepartments.length
      ? user.handledDepartments.filter((item) => TICKET_DEPARTMENTS.includes(item))
      : [TICKET_DEPARTMENTS.includes(inferred) ? inferred : DEPARTMENT_ADMINISTRATIVE];

    return {
      ...user,
      handledDepartments,
    };
  }

  return {
    ...user,
    handledDepartments: [],
  };
}

function normalizeTicket(ticket) {
  if (!ticket) {
    return ticket;
  }

  const assignedDepartment =
    ticket.assignedDepartment && TICKET_DEPARTMENTS.includes(ticket.assignedDepartment)
      ? ticket.assignedDepartment
      : getAssignedDepartmentByCategory(ticket.category);

  return {
    ...ticket,
    assignedDepartment,
    handledByName: ticket.handledByName || null,
    handledByUserId: ticket.handledByUserId || null,
    lastResponse: ticket.lastResponse || null,
    updatedAt: ticket.updatedAt || ticket.createdAt || new Date().toISOString(),
  };
}

function normalizeDocument(document) {
  if (!document) {
    return document;
  }

  const department =
    document.department && DOCUMENT_DEPARTMENTS.includes(document.department)
      ? document.department
      : "General";

  const numericFileSize = Number(document.fileSize);

  return {
    ...document,
    department,
    category: document.category || "General",
    description: document.description || "",
    fileName: document.fileName || "document.pdf",
    fileType: document.fileType || "application/octet-stream",
    fileSize: Number.isFinite(numericFileSize) ? numericFileSize : 0,
    fileDataUrl: document.fileDataUrl || null,
    uploadedByUserId: document.uploadedByUserId || null,
    uploadedByName: document.uploadedByName || "Necunoscut",
    createdAt: document.createdAt || new Date().toISOString(),
    updatedAt: document.updatedAt || document.createdAt || new Date().toISOString(),
  };
}

export function ensureSeeded() {
  const users = readJSON(USERS_KEY, []);
  const tickets = readJSON(TICKETS_KEY, []);
  const documents = readJSON(DOCUMENTS_KEY, []);

  if (!users.length) {
    writeJSON(USERS_KEY, DEFAULT_USERS.map(normalizeUser));
  } else {
    const existingById = new Map(users.map((user) => [user.id, normalizeUser(user)]));
    for (const defaultUser of DEFAULT_USERS) {
      if (!existingById.has(defaultUser.id)) {
        existingById.set(defaultUser.id, normalizeUser(defaultUser));
      }
    }
    writeJSON(USERS_KEY, Array.from(existingById.values()));
  }

  if (!tickets.length) {
    writeJSON(TICKETS_KEY, DEFAULT_TICKETS.map(normalizeTicket));
  } else {
    writeJSON(TICKETS_KEY, tickets.map(normalizeTicket));
  }

  if (!documents.length) {
    writeJSON(DOCUMENTS_KEY, DEFAULT_DOCUMENTS.map(normalizeDocument));
  } else {
    writeJSON(DOCUMENTS_KEY, documents.map(normalizeDocument));
  }
}

export function getUsers() {
  ensureSeeded();
  return readJSON(USERS_KEY, DEFAULT_USERS).map(normalizeUser);
}

export function getTickets() {
  ensureSeeded();
  return readJSON(TICKETS_KEY, DEFAULT_TICKETS).map(normalizeTicket);
}

export function saveTickets(tickets) {
  writeJSON(TICKETS_KEY, tickets);
}

export function getDocuments() {
  ensureSeeded();
  return readJSON(DOCUMENTS_KEY, DEFAULT_DOCUMENTS).map(normalizeDocument);
}

export function saveDocuments(documents) {
  writeJSON(DOCUMENTS_KEY, documents);
}

export function getPublicUser(user) {
  if (!user) {
    return null;
  }

  const { password, ...safeUser } = user;
  return safeUser;
}

export function parseToken(token) {
  if (!token || !token.startsWith("mock-token-")) {
    return null;
  }

  return token.replace("mock-token-", "");
}

export function nextTicketId(tickets) {
  const ids = tickets
    .map((ticket) => Number(ticket.id.replace("TCK-", "")))
    .filter((value) => Number.isFinite(value));

  const next = Math.max(0, ...ids) + 1;
  return `TCK-${String(next).padStart(4, "0")}`;
}

export function nextDocumentId(documents) {
  const ids = documents
    .map((document) => Number(String(document.id || "").replace("DOC-", "")))
    .filter((value) => Number.isFinite(value));

  const next = Math.max(0, ...ids) + 1;
  return `DOC-${String(next).padStart(4, "0")}`;
}
