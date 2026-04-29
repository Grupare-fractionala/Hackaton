import { supabase } from '../../../supabaseClient';

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

  const { data, error } = await supabase
    .from('tickets')
    .insert([insertData])
    .select();

  if (error) {
    console.error("Eroare la adăugarea tichetului:", error.message);
    if (typeof alert !== 'undefined') {
      alert("Eroare: " + error.message);
    }
    return null;
  }

  return data;
};
