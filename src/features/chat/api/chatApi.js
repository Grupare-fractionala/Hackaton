import { isMockMode } from "@/config/env";

const FLOWISE_BASE_URL = import.meta.env.VITE_FLOWISE_BASE_URL || "/flowise";
const FLOWISE_API_KEY = import.meta.env.VITE_FLOWISE_API_KEY;
const FLOW_IDS = {
  clasificare: import.meta.env.VITE_FLOWISE_CLASSIFICATION_ID,
  IT: import.meta.env.VITE_FLOWISE_IT_ID,
  HR: import.meta.env.VITE_FLOWISE_HR_ID,
  JURIDIC: import.meta.env.VITE_FLOWISE_JURIDIC_ID,
};

const DEPT_TO_CATEGORY = {
  IT: "Tehnic",
  HR: "HR",
  JURIDIC: "Legislativ",
  GENERAL: "General",
};

function getSessionId() {
  const key = "flowise-session-id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

async function callFlowise(flowKey, question, sessionId) {
  const flowId = FLOW_IDS[flowKey];
  if (!flowId) {
    throw new Error(`Flow ID pentru ${flowKey} nu este configurat.`);
  }
  const url = `${FLOWISE_BASE_URL}/api/v1/prediction/${flowId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(FLOWISE_API_KEY && { Authorization: `Bearer ${FLOWISE_API_KEY}` }),
    },
    body: JSON.stringify({ question, sessionId }),
  });
  if (!response.ok) {
    throw new Error(`Eroare Flowise: ${response.status}`);
  }
  const data = await response.json();
  return data.text || data.answer || data.response || data.output || "Răspuns indisponibil.";
}

function classifyDepartment(rawResult) {
  const upper = rawResult.trim().toUpperCase();
  const mapping = {
    TEHNIC: "IT",
    IT: "IT",
    HR: "HR",
    RESURSE: "HR",
    JURIDIC: "JURIDIC",
    LEGISLATIV: "JURIDIC",
    LEGAL: "JURIDIC",
    URBANISM: "JURIDIC",
  };
  for (const [keyword, dept] of Object.entries(mapping)) {
    if (upper.includes(keyword)) return dept;
  }
  return "GENERAL";
}

async function sendViaFlowise({ message }) {
  const sessionId = getSessionId();

  const classificationRaw = await callFlowise("clasificare", message, sessionId);
  const department = classifyDepartment(classificationRaw);
  const category = DEPT_TO_CATEGORY[department];

  let reply;
  if (department === "GENERAL") {
    reply =
      "Hmm, nu sunt sigur unde se incadreaza intrebarea ta. 🤔 Eu, mihAI, ma descurc cel mai bine pe **IT**, **HR** sau **Juridic** — poti sa-mi dai cateva detalii in plus ca sa te pot ajuta cum trebuie?";
  } else {
    reply = await callFlowise(department, message, sessionId);
  }

  const shouldCreateTicket = department !== "GENERAL";

  return {
    reply,
    category,
    resolved: false,
    shouldCreateTicket,
    suggestedTicket: shouldCreateTicket
      ? {
          category,
          priority: "Medie",
          subject: `Solicitare ${category}`,
          description: message,
        }
      : null,
  };
}

export async function sendChatMessage(payload) {
  if (isMockMode) {
    const text = String(payload.message || "").toLowerCase();
    const category = text.includes("hr")
      ? "HR"
      : text.includes("legal") || text.includes("juridic") || text.includes("urbanism")
        ? "Legislativ"
        : text.includes("parola") || text.includes("imprimanta") || text.includes("calculator")
          ? "Tehnic"
          : "General";

    const shouldCreateTicket = category !== "General";

    return {
      reply: shouldCreateTicket
        ? `Am inteles, suna a ceva din zona **${category}**. Sunt in mod demo local, dar pot pregati un tichet din conversatia noastra daca vrei sa duci mai departe. 📝`
        : "Sunt mihAI, in mod demo local 👋. Pot sa te ajut cu intrebari de **Tehnic**, **HR** sau **Legislativ** — spune-mi ce te framanta si gasim impreuna o solutie.",
      category,
      resolved: false,
      shouldCreateTicket,
      suggestedTicket: shouldCreateTicket
        ? {
            category,
            priority: "Medie",
            subject: `Solicitare ${category}`,
            description: payload.message,
          }
        : null,
    };
  }

  return sendViaFlowise(payload);
}
