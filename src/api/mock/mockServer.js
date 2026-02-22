import {
  getDocuments,
  getPublicUser,
  getTickets,
  getUsers,
  nextDocumentId,
  nextTicketId,
  parseToken,
  saveDocuments,
  saveTickets,
} from "@/api/mock/storage";
import {
  DEPARTMENT_ADMINISTRATIVE,
  getAssignedDepartmentByCategory,
} from "@/features/tickets/utils/routing";

const technicalWords = [
  "imprimanta",
  "printer",
  "laptop",
  "calculator",
  "internet",
  "retea",
  "scan",
  "monitor",
  "eroare",
  "nu merge",
];
const hrWords = ["concediu", "zile", "pontaj", "salariu", "adeverinta", "medical"];
const legalWords = [
  "urbanism",
  "aviz",
  "construct",
  "distanta",
  "autorizatie",
  "certificat",
  "puz",
  "pud",
  "regulament",
];

const delay = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_DOCUMENT_SIZE_BYTES = 2_500_000;

function makeError(message, status = 400) {
  const error = new Error(message);
  error.response = {
    status,
    data: { message },
  };
  return error;
}

function getUserFromToken(token) {
  const userId = parseToken(token);
  if (!userId) {
    return null;
  }

  const users = getUsers();
  return users.find((user) => user.id === userId) || null;
}

function canHandleDepartment(user, department) {
  if (!user || !department) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  if (user.role === "agent") {
    return Array.isArray(user.handledDepartments) && user.handledDepartments.includes(department);
  }

  return false;
}

function canAccessDocument(user, document) {
  if (!user || !document) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  if (document.department === "General") {
    return true;
  }

  if (user.role === "agent") {
    return (
      Array.isArray(user.handledDepartments) && user.handledDepartments.includes(document.department)
    );
  }

  if (user.role === "employee") {
    const employeeDepartment = getAssignedDepartmentByCategory(user.department);
    return (
      document.department === employeeDepartment || document.department === DEPARTMENT_ADMINISTRATIVE
    );
  }

  return false;
}

function canUploadDocument(user, department) {
  if (!user) {
    return false;
  }

  if (user.role === "admin") {
    return true;
  }

  if (department === "General") {
    return true;
  }

  if (user.role === "agent") {
    return Array.isArray(user.handledDepartments) && user.handledDepartments.includes(department);
  }

  if (user.role === "employee") {
    const employeeDepartment = getAssignedDepartmentByCategory(user.department);
    return department === employeeDepartment;
  }

  return false;
}

function getCategory(text) {
  const lower = text.toLowerCase();

  const score = {
    Tehnic: technicalWords.filter((word) => lower.includes(word)).length,
    HR: hrWords.filter((word) => lower.includes(word)).length,
    Legislativ: legalWords.filter((word) => lower.includes(word)).length,
  };

  const sorted = Object.entries(score).sort((a, b) => b[1] - a[1]);

  if (!sorted[0] || sorted[0][1] === 0) {
    return "General";
  }

  return sorted[0][0];
}

function buildTechnicalResponse(text) {
  const lower = text.toLowerCase();

  if (lower.includes("imprimanta") || lower.includes("printer")) {
    const unresolved = lower.includes("tot") || lower.includes("urgent") || lower.includes("eroare");

    return {
      reply:
        "Incearca in ordine: 1) verifica alimentarea si cablul USB/retea, 2) seteaza imprimanta ca Default, 3) reporneste serviciul Print Spooler, 4) trimite un test page.",
      resolved: !unresolved,
      shouldCreateTicket: unresolved,
      suggestedTicket: unresolved
        ? {
            category: "Tehnic",
            priority: lower.includes("urgent") ? "Ridicata" : "Medie",
            subject: "Incident imprimanta - necesita interventie IT",
            description:
              "Utilizatorul a urmat pasii standard pentru imprimanta, dar problema persista. Solicit suport tehnic onsite.",
          }
        : null,
    };
  }

  return {
    reply:
      "Pentru incident tehnic, noteaza exact mesajul de eroare si daca problema apare pe un singur calculator. Daca persista dupa restart, recomand escalare catre IT.",
    resolved: false,
    shouldCreateTicket: true,
    suggestedTicket: {
      category: "Tehnic",
      priority: "Medie",
      subject: "Incident tehnic intern",
      description:
        "Problema tehnica raportata de utilizator. Necesita investigare de catre echipa IT.",
    },
  };
}

function buildHrResponse(text, user) {
  const lower = text.toLowerCase();

  if (lower.includes("concediu") || lower.includes("zile")) {
    return {
      reply: `Conform datelor curente, mai ai ${user.leaveBalance} zile de concediu disponibile in acest an.`,
      resolved: true,
      shouldCreateTicket: false,
      suggestedTicket: null,
    };
  }

  if (lower.includes("adeverinta")) {
    return {
      reply:
        "Pentru adeverinte, depune cererea in portalul HR intern sau trimite formularul standard catre Serviciul Resurse Umane.",
      resolved: true,
      shouldCreateTicket: false,
      suggestedTicket: null,
    };
  }

  return {
    reply:
      "Pot raspunde la intrebari despre concediu, pontaj si documente HR. Daca este un caz special, recomand trimiterea unui tichet HR.",
    resolved: false,
    shouldCreateTicket: true,
    suggestedTicket: {
      category: "HR",
      priority: "Medie",
      subject: "Solicitare HR - clarificare",
      description:
        "Solicitare HR care necesita verificare manuala din partea departamentului de resurse umane.",
    },
  };
}

function buildLegalResponse(text) {
  const lower = text.toLowerCase();

  if (lower.includes("distanta") || lower.includes("construct")) {
    return {
      reply:
        "Pentru distante intre constructii trebuie verificat cumulativ regulamentul local de urbanism, codul civil si documentatia zonei (PUZ/PUD). Pentru un raspuns oficial, escaladez catre Urbanism.",
      resolved: false,
      shouldCreateTicket: true,
      suggestedTicket: {
        category: "Legislativ",
        priority: "Ridicata",
        subject: "Clarificare distanta minima intre constructii",
        description:
          "Solicitare pentru aviz constructie. Necesita raspuns oficial din partea specialistului Urbanism.",
      },
    };
  }

  return {
    reply:
      "Pot oferi orientare generala, dar pentru interpretare oficiala a normelor recomand analiza specialistului juridic/urbanism.",
    resolved: false,
    shouldCreateTicket: true,
    suggestedTicket: {
      category: "Legislativ",
      priority: "Medie",
      subject: "Solicitare legislativa",
      description:
        "Intrebare legislativa care necesita validare de catre departamentul de specialitate.",
    },
  };
}

function buildGeneralResponse(text) {
  const lower = text.toLowerCase();

  if (lower.includes("tichet") || lower.includes("ticket")) {
    return {
      reply:
        "Pot crea acum un tichet cu rezumatul discutiei si il trimit automat catre departamentul potrivit.",
      category: "General",
      resolved: false,
      shouldCreateTicket: true,
      suggestedTicket: {
        category: "Tehnic",
        priority: "Medie",
        subject: "Solicitare interna",
        description: "Tichet generat din chat pentru preluare manuala.",
      },
    };
  }

  return {
    reply:
      "Nu am suficient context sa ofer un raspuns precis. Da-mi mai multe detalii sau creeaza tichet pentru preluare umana.",
    category: "General",
    resolved: false,
    shouldCreateTicket: true,
    suggestedTicket: {
      category: "Tehnic",
      priority: "Medie",
      subject: "Solicitare care necesita clarificari",
      description: "Mesaj initial insuficient, necesita preluare de catre operator.",
    },
  };
}

export const mockApi = {
  auth: {
    async login({ email, password }) {
      await delay(550);
      const users = getUsers();

      const user = users.find(
        (entry) => entry.email.toLowerCase() === String(email).toLowerCase().trim(),
      );

      if (!user || user.password !== password) {
        throw makeError("Email sau parola invalida", 401);
      }

      return {
        token: `mock-token-${user.id}`,
        user: getPublicUser(user),
      };
    },

    async me(token) {
      await delay(300);
      const user = getUserFromToken(token);

      if (!user) {
        throw makeError("Sesiune invalida", 401);
      }

      return getPublicUser(user);
    },
  },

  chat: {
    async ask({ token, message }) {
      await delay(800);
      const user = getUserFromToken(token);

      if (!user) {
        throw makeError("Nu esti autentificat", 401);
      }

      const category = getCategory(message);

      if (category === "Tehnic") {
        const technical = buildTechnicalResponse(message);
        return { ...technical, category };
      }

      if (category === "HR") {
        const hr = buildHrResponse(message, user);
        return { ...hr, category };
      }

      if (category === "Legislativ") {
        const legal = buildLegalResponse(message);
        return { ...legal, category };
      }

      return buildGeneralResponse(message);
    },
  },

  tickets: {
    async list({ token }) {
      await delay(420);
      const user = getUserFromToken(token);

      if (!user) {
        throw makeError("Nu esti autentificat", 401);
      }

      const tickets = getTickets().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      if (user.role === "admin") {
        return tickets;
      }

      if (user.role === "agent") {
        return tickets.filter((ticket) => canHandleDepartment(user, ticket.assignedDepartment));
      }

      return tickets.filter((ticket) => ticket.userId === user.id);
    },

    async create({ token, data }) {
      await delay(500);
      const user = getUserFromToken(token);

      if (!user) {
        throw makeError("Nu esti autentificat", 401);
      }

      if (!data?.description || !data?.subject) {
        throw makeError("Subiectul si descrierea sunt obligatorii", 400);
      }

      const tickets = getTickets();
      const assignedDepartment = data.assignedDepartment || getAssignedDepartmentByCategory(data.category);

      const newTicket = {
        id: nextTicketId(tickets),
        userId: user.id,
        requesterName: user.name,
        category: data.category || "Tehnic",
        subject: data.subject,
        description: data.description,
        priority: data.priority || "Medie",
        status: "Deschis",
        assignedDepartment,
        handledByName: null,
        handledByUserId: null,
        lastResponse: null,
        source: data.source || "manual",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      tickets.push(newTicket);
      saveTickets(tickets);

      return newTicket;
    },

    async respond({ token, ticketId, action, message }) {
      await delay(380);
      const user = getUserFromToken(token);

      if (!user) {
        throw makeError("Nu esti autentificat", 401);
      }

      const tickets = getTickets();
      const index = tickets.findIndex((ticket) => ticket.id === ticketId);

      if (index < 0) {
        throw makeError("Tichetul nu exista", 404);
      }

      const ticket = tickets[index];

      if (!canHandleDepartment(user, ticket.assignedDepartment)) {
        throw makeError("Nu ai drepturi pentru acest tichet", 403);
      }

      const now = new Date().toISOString();

      if (action === "take") {
        ticket.status = "In lucru";
        ticket.handledByName = user.name;
        ticket.handledByUserId = user.id;
        ticket.lastResponse = message || `Tichet preluat de ${user.name}.`;
      } else if (action === "resolve") {
        ticket.status = "Rezolvat";
        ticket.handledByName = user.name;
        ticket.handledByUserId = user.id;
        ticket.lastResponse = message || `Tichet rezolvat de ${user.name}.`;
      } else if (action === "reopen") {
        ticket.status = "Deschis";
        ticket.lastResponse = message || `Tichet redeschis de ${user.name}.`;
      } else if (action === "reassign-admin") {
        ticket.assignedDepartment = DEPARTMENT_ADMINISTRATIVE;
        ticket.status = "Deschis";
        ticket.handledByName = null;
        ticket.handledByUserId = null;
        ticket.lastResponse = message || "Tichet rerutat catre Administrativ.";
      } else {
        throw makeError("Actiune invalida", 400);
      }

      ticket.updatedAt = now;
      tickets[index] = ticket;
      saveTickets(tickets);

      return ticket;
    },
  },

  documents: {
    async list({ token }) {
      await delay(320);
      const user = getUserFromToken(token);

      if (!user) {
        throw makeError("Nu esti autentificat", 401);
      }

      const documents = getDocuments()
        .filter((document) => canAccessDocument(user, document))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return documents;
    },

    async create({ token, data }) {
      await delay(420);
      const user = getUserFromToken(token);

      if (!user) {
        throw makeError("Nu esti autentificat", 401);
      }

      if (!data?.title || !data?.category || !data?.department || !data?.fileName) {
        throw makeError("Titlul, categoria, departamentul si fisierul sunt obligatorii", 400);
      }

      if (!canUploadDocument(user, data.department)) {
        throw makeError("Nu ai drepturi sa incarci documente pentru acest departament", 403);
      }

      const fileSize = Number(data.fileSize) || 0;
      if (fileSize > MAX_DOCUMENT_SIZE_BYTES) {
        throw makeError("Fisierul este prea mare (maxim 2.5 MB in demo)", 400);
      }

      const documents = getDocuments();
      const now = new Date().toISOString();

      const newDocument = {
        id: nextDocumentId(documents),
        title: data.title,
        category: data.category,
        department: data.department,
        description: data.description || "",
        fileName: data.fileName,
        fileType: data.fileType || "application/octet-stream",
        fileSize,
        fileDataUrl: data.fileDataUrl || null,
        uploadedByUserId: user.id,
        uploadedByName: user.name,
        createdAt: now,
        updatedAt: now,
      };

      documents.push(newDocument);
      saveDocuments(documents);

      return newDocument;
    },
  },
};
