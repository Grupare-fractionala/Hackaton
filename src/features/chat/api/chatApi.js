const FLOWISE_BASE_URL = import.meta.env.VITE_FLOWISE_BASE_URL ? import.meta.env.VITE_FLOWISE_BASE_URL : "/flowise";
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
    headers: { "Content-Type": "application/json" },
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
      "Salut! Sunt asistentul virtual al primăriei. Pot să te ajut cu probleme de IT, HR sau Juridice. Te rog detaliază cererea.";
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
  return sendViaFlowise(payload);
}
