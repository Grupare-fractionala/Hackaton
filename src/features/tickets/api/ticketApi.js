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

  const { data, error } = await supabase
    .from("tickets")
    .insert([{
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
    }])
    .select();

  if (error) throw error;
  if (data && data.length > 0) return data[0];
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
