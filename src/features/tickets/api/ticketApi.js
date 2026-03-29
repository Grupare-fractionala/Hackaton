import { addTicketToDB } from "./TicketToDatabase";
import { supabase } from "@/supabaseClient";

export async function getTickets() {
  // Try to fetch from Supabase
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching tickets from Supabase:", error);
    throw error;
  }
}

export async function createTicket(ticketData) {
  // Use the direct Supabase integration
  const userId = localStorage.getItem("userId"); 
  const result = await addTicketToDB(
    ticketData.subject,
    ticketData.description,
    ticketData.category || "Tehnic",
    userId
  );

  if (result && result.length > 0) {
    return result[0];
  }

  throw new Error("Failed to create ticket in Supabase");
}

export async function respondToTicket(payload) {
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
