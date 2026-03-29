import { supabase } from '../../../supabaseClient'; // Adjust the path if your client file is somewhere else

/**
 * How to use this function:
 * 
 * const newTicket = await addTicketToDB(
 *   "Ticket Title", 
 *   "Description of the issue", 
 *   "Target Department", 
 *   "User ID" // Pass the logged-in user's ID
 * );
 * 
 * if (newTicket) {
 *   // Success: do something (clear form, show message, etc.)
 * }
 */
export const addTicketToDB = async (ticketTitle, ticketDescription, targetDepartment, currentUserId) => {
  const insertData = { 
    title: ticketTitle, 
    description: ticketDescription, 
    department: targetDepartment,
    status: 'Deschis' 
  };

  if (currentUserId) {
    insertData.user_id = currentUserId;
  }

  // 1. Call Supabase and insert the data into the 'tickets' table
  const { data, error } = await supabase
    .from('tickets')
    .insert([insertData])
    .select(); 

  // 2. Handle any errors (like missing data or network issues)
  if (error) {
    console.error("Eroare la adăugarea tichetului:", error.message);
    // Note: alert might not work in all environments (like Node.js tests)
    if (typeof alert !== 'undefined') {
        alert("Eroare: " + error.message);
    }
    return null;
  }

  // 3. Success!
  console.log("Tichet salvat cu succes în baza de date!", data);
  return data;
};
