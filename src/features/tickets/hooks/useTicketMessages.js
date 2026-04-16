import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTicketMessages, sendTicketMessage } from "@/features/tickets/api/ticketMessagesApi";

export function useTicketMessagesQuery(ticketId) {
  return useQuery({
    queryKey: ["ticket-messages", ticketId],
    queryFn: () => getTicketMessages(ticketId),
    enabled: Boolean(ticketId),
    refetchInterval: 5000,
  });
}

export function useSendTicketMessageMutation(ticketId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendTicketMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticketId] });
    },
  });
}
