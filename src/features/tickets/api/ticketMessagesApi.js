import { supabase } from "@/supabaseClient";
import { getMockTicketMessages, sendMockTicketMessage } from "@/api/mockStore";
import { isMockMode } from "@/config/env";

export async function getTicketMessages(ticketId) {
  if (isMockMode) {
    return getMockTicketMessages(ticketId);
  }

  const { data, error } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function sendTicketMessage({ ticketId, userId, userName, userRole, message }) {
  if (isMockMode) {
    return sendMockTicketMessage({ ticketId, userId, userName, userRole, message });
  }

  const { data, error } = await supabase
    .from("ticket_messages")
    .insert([{ ticket_id: ticketId, user_id: userId, user_name: userName, user_role: userRole, message }])
    .select();

  if (error) throw error;
  return data?.[0];
}
