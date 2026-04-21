import { getAssignedDepartmentByCategory } from "@/features/tickets/utils/routing";

const USERS_KEY = "primarie-mock-users";
const TICKETS_KEY = "primarie-mock-tickets";
const DOCUMENTS_KEY = "primarie-mock-documents";
const TICKET_MESSAGES_KEY = "primarie-mock-ticket-messages";

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

const defaultUsers = [
  {
    id: "mock-user-secretara",
    username: "secretara",
    password: "Secretara123!",
    name: "Secretara Primarie",
    role: "employee",
    department: "Registratura",
    created_at: minutesAgo(12_000),
  },
  {
    id: "mock-user-tehnic",
    username: "tehnic",
    password: "Tehnic123!",
    name: "Operator Tehnic",
    role: "agent_tehnic",
    department: "Tehnic",
    created_at: minutesAgo(11_500),
  },
  {
    id: "mock-user-hr",
    username: "hr",
    password: "Hr123456!",
    name: "Operator HR",
    role: "agent_hr",
    department: "HR",
    created_at: minutesAgo(11_000),
  },
  {
    id: "mock-user-administrativ",
    username: "administrativ",
    password: "AdminDep123!",
    name: "Operator Administrativ",
    role: "agent_legislativ",
    department: "Administrativ",
    created_at: minutesAgo(10_500),
  },
  {
    id: "mock-user-urbanism",
    username: "urbanism",
    password: "Urbanism123!",
    name: "Operator Urbanism",
    role: "agent_legislativ",
    department: "Urbanism",
    created_at: minutesAgo(10_000),
  },
  {
    id: "mock-user-admin",
    username: "admin",
    password: "Admin123!",
    name: "Administrator IT",
    role: "admin",
    department: "IT",
    created_at: minutesAgo(9_500),
  },
];

const defaultTickets = [
  {
    id: "mock-ticket-001",
    title: "Imprimanta registratura nu printeaza",
    subject: "Imprimanta registratura nu printeaza",
    description: "Imprimanta HP afiseaza eroare spooler dupa restart.",
    category: "Tehnic",
    priority: "Ridicata",
    department: "Tehnic",
    status: "Deschis",
    source: "manual",
    user_id: "mock-user-secretara",
    requesterName: "Secretara Primarie",
    created_at: minutesAgo(80),
    createdAt: minutesAgo(80),
  },
  {
    id: "mock-ticket-002",
    title: "Adeverinta salariat",
    subject: "Adeverinta salariat",
    description: "Am nevoie de procedura pentru eliberarea unei adeverinte.",
    category: "HR",
    priority: "Medie",
    department: "HR",
    status: "In lucru",
    source: "chat",
    user_id: "mock-user-secretara",
    requesterName: "Secretara Primarie",
    created_at: minutesAgo(240),
    createdAt: minutesAgo(240),
  },
  {
    id: "mock-ticket-003",
    title: "Clarificare document urbanism",
    subject: "Clarificare document urbanism",
    description: "Solicitare verificare incadrare pentru documentatie urbanism.",
    category: "Legislativ",
    priority: "Scazuta",
    department: "Administrativ",
    status: "Rezolvat",
    source: "manual",
    user_id: "mock-user-secretara",
    requesterName: "Secretara Primarie",
    created_at: minutesAgo(1_440),
    createdAt: minutesAgo(1_440),
  },
];

const defaultDocuments = [
  {
    id: "mock-doc-001",
    file_name: "Regulament intern.pdf",
    file_url: "",
    department: "General",
    created_at: minutesAgo(2_400),
  },
  {
    id: "mock-doc-002",
    file_name: "Procedura resetare parola.pdf",
    file_url: "",
    department: "Tehnic",
    created_at: minutesAgo(1_800),
  },
  {
    id: "mock-doc-003",
    file_name: "Procedura concedii HR.pdf",
    file_url: "",
    department: "HR",
    created_at: minutesAgo(1_200),
  },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore malformed demo data and re-seed below.
  }

  const value = typeof fallback === "function" ? fallback() : fallback;
  writeJson(key, value);
  return value;
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function publicUser(user) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/@primarie\.local$/, "");
}

export async function authenticateMockUser({ username, password }) {
  const normalizedUsername = normalizeUsername(username);
  const user = readJson(USERS_KEY, defaultUsers).find(
    (candidate) =>
      normalizeUsername(candidate.username) === normalizedUsername &&
      candidate.password === password,
  );

  if (!user) {
    throw new Error("Username sau parola incorecta.");
  }

  const safeUser = publicUser(user);
  return {
    user: safeUser,
    token: `mock-token-${safeUser.id}`,
  };
}

export async function getMockUsers() {
  return readJson(USERS_KEY, defaultUsers).map(publicUser);
}

export async function createMockUser({ username, password, role, department }) {
  const users = readJson(USERS_KEY, defaultUsers);
  const normalizedUsername = normalizeUsername(username);

  if (users.some((user) => normalizeUsername(user.username) === normalizedUsername)) {
    throw new Error("Username-ul exista deja.");
  }

  const user = {
    id: `mock-user-${Date.now()}`,
    username: normalizedUsername,
    password,
    name: normalizedUsername,
    role,
    department: department || "",
    created_at: new Date().toISOString(),
  };

  writeJson(USERS_KEY, [user, ...users]);
  return publicUser(user);
}

export async function deleteMockUser(userId) {
  const users = readJson(USERS_KEY, defaultUsers).filter((user) => user.id !== userId);
  writeJson(USERS_KEY, users);
}

export async function getMockTickets() {
  return readJson(TICKETS_KEY, defaultTickets);
}

export async function createMockTicket(ticketData, user) {
  const tickets = readJson(TICKETS_KEY, defaultTickets);
  const createdAt = new Date().toISOString();
  const department = getAssignedDepartmentByCategory(ticketData.category);
  const ticket = {
    id: `mock-ticket-${Date.now()}`,
    title: ticketData.subject,
    subject: ticketData.subject,
    description: ticketData.description,
    category: ticketData.category || "Tehnic",
    priority: ticketData.priority || "Medie",
    department,
    status: "Deschis",
    source: ticketData.source || "manual",
    user_id: user?.id || "mock-user-anon",
    requesterName: user?.name || user?.username || "Angajat",
    created_at: createdAt,
    createdAt,
  };

  writeJson(TICKETS_KEY, [ticket, ...tickets]);
  return ticket;
}

export async function deleteMockTicket(ticketId) {
  const tickets = readJson(TICKETS_KEY, defaultTickets).filter((ticket) => ticket.id !== ticketId);
  writeJson(TICKETS_KEY, tickets);
}

export async function respondToMockTicket({ ticketId, action }) {
  const tickets = readJson(TICKETS_KEY, defaultTickets);
  let updatedTicket = null;

  const updatedTickets = tickets.map((ticket) => {
    if (ticket.id !== ticketId) {
      return ticket;
    }

    const statusByAction = {
      take: "In lucru",
      resolve: "Rezolvat",
      reopen: "Deschis",
    };

    updatedTicket = {
      ...ticket,
      status: statusByAction[action] || ticket.status,
    };
    return updatedTicket;
  });

  writeJson(TICKETS_KEY, updatedTickets);

  if (!updatedTicket) {
    throw new Error("Tichetul nu a fost gasit.");
  }

  return updatedTicket;
}

export async function getMockTicketMessages(ticketId) {
  const messagesByTicket = readJson(TICKET_MESSAGES_KEY, {});
  return messagesByTicket[ticketId] || [];
}

export async function sendMockTicketMessage(payload) {
  const messagesByTicket = readJson(TICKET_MESSAGES_KEY, {});
  const message = {
    id: `mock-message-${Date.now()}`,
    ticket_id: payload.ticketId,
    user_id: payload.userId,
    user_name: payload.userName,
    user_role: payload.userRole,
    message: payload.message,
    created_at: new Date().toISOString(),
  };

  messagesByTicket[payload.ticketId] = [
    ...(messagesByTicket[payload.ticketId] || []),
    message,
  ];
  writeJson(TICKET_MESSAGES_KEY, messagesByTicket);
  return message;
}

export async function getMockDocuments() {
  return readJson(DOCUMENTS_KEY, defaultDocuments);
}

export async function createMockDocument(file, department = "General") {
  const documents = readJson(DOCUMENTS_KEY, defaultDocuments);
  const document = {
    id: `mock-doc-${Date.now()}`,
    file_name: file.name,
    file_url: "",
    department,
    created_at: new Date().toISOString(),
  };

  writeJson(DOCUMENTS_KEY, [document, ...documents]);
  return document;
}

export async function deleteMockDocument(id) {
  const documents = readJson(DOCUMENTS_KEY, defaultDocuments).filter(
    (document) => document.id !== id,
  );
  writeJson(DOCUMENTS_KEY, documents);
}
