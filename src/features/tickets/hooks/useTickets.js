import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTicket, deleteTicket, getTickets, respondToTicket } from "@/features/tickets/api/ticketApi";
import { useAuthStore } from "@/store/useAuthStore";

const TICKETS_QUERY_KEY = ["tickets"];

function buildTicketsQueryKey(token) {
  return [...TICKETS_QUERY_KEY, token || "anon"];
}

export function useTicketsQuery() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: buildTicketsQueryKey(token),
    queryFn: getTickets,
    enabled: Boolean(token),
    refetchOnMount: "always",
    refetchInterval: 5000,
  });
}

export function useCreateTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
    },
  });
}

export function useDeleteTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTicket,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY }),
  });
}

export function useRespondToTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: respondToTicket,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: TICKETS_QUERY_KEY });

      const previousQueries = queryClient.getQueriesData({ queryKey: TICKETS_QUERY_KEY });
      const nextResponseMessage = payload?.message || null;

      queryClient.setQueriesData({ queryKey: TICKETS_QUERY_KEY }, (current) => {
        if (!Array.isArray(current)) {
          return current;
        }

        return current.map((ticket) => {
          if (ticket.id !== payload.ticketId) {
            return ticket;
          }

          if (payload.action === "take") {
            return {
              ...ticket,
              status: "In lucru",
              lastResponse: nextResponseMessage || ticket.lastResponse,
            };
          }

          if (payload.action === "resolve") {
            return {
              ...ticket,
              status: "Rezolvat",
              lastResponse: nextResponseMessage || ticket.lastResponse,
            };
          }

          if (payload.action === "reopen") {
            return {
              ...ticket,
              status: "Deschis",
              lastResponse: nextResponseMessage || ticket.lastResponse,
            };
          }

          return ticket;
        });
      });

      return { previousQueries };
    },
    onError: (_error, _payload, context) => {
      if (!Array.isArray(context?.previousQueries)) {
        return;
      }

      for (const [queryKey, previousData] of context.previousQueries) {
        queryClient.setQueryData(queryKey, previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKETS_QUERY_KEY });
    },
  });
}
