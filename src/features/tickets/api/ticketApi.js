import { supabase } from "@/supabaseClient";
import {
  createMockTicket,
  deleteMockTicket,
  getMockTickets,
  respondToMockTicket,
} from "@/api/mockStore";
import { isMockMode } from "@/config/env";
import { useAuthStore } from "@/store/useAuthStore";
import { getAssignedDepartmentByCategory } from "@/features/tickets/utils/routing";

export async function getTickets() {
  if (isMockMode) {
    return getMockTickets();
  }

  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTicket(ticketData) {
  const user = useAuthStore.getState().user;

  if (isMockMode) {
    return createMockTicket(ticketData, user);
  }

  const department = getAssignedDepartmentByCategory(ticketData.category);

  const payload = {
    title: ticketData.subject,
    subject: ticketData.subject,
    description: ticketData.description,
    category: ticketData.category || "Tehnic",
    priority: ticketData.priority || "Medie",
    department,
    status: "Deschis",
    source: ticketData.source || "manual",
    user_id: user?.id || null,
    requesterName: user?.name || user?.username || "Angajat",
    chat_history: ticketData.chatHistory || null,
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  let response;
  try {
    response = await fetch(`${supabaseUrl}/rest/v1/tickets`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Cererea catre Supabase nu a raspuns in 15 secunde. Reincarca pagina si reincearca.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Insert tichet esuat (${response.status}): ${text || response.statusText}`);
  }

  const rows = await response.json();
  if (Array.isArray(rows) && rows.length > 0) return rows[0];
  throw new Error("Failed to create ticket");
}

export async function deleteTicket(ticketId) {
  if (isMockMode) {
    return deleteMockTicket(ticketId);
  }

  const { error } = await supabase.from("tickets").delete().eq("id", ticketId);
  if (error) throw error;
}

export async function respondToTicket(payload) {
  if (isMockMode) {
    return respondToMockTicket(payload);
  }

  // Try to update in Supabase
  try {
    let status = "Deschis";
    if (payload.action === "take") status = "In lucru";
    else if (payload.action === "resolve") status = "Rezolvat";
    else if (payload.action === "reopen") status = "Deschis";

    const { data, error } = await supabase
      .from("tickets")
      .update({ 
        status: status,
      })
      .eq("id", payload.ticketId)
      .select();

    if (error) throw error;
    if (data && data.length > 0) return data[0];
    
    throw new Error("Ticket not found or update failed");
  } catch (error) {
    console.error("Error updating ticket in Supabase:", error);
    throw error;
  }
}
