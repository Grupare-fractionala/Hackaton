import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  getCompletedDeadlineIds,
  getReadAnnouncementIds,
  markAnnouncementRead,
  markAnnouncementsRead,
  markDeadlineCompleted,
  unmarkDeadlineCompleted,
} from "@/features/announcements/api/announcementApi";
import { useAuthStore } from "@/store/useAuthStore";

const ANNOUNCEMENTS_QUERY_KEY = ["announcements"];
const READ_QUERY_KEY = ["announcements-read"];
const COMPLETED_QUERY_KEY = ["deadlines-completed"];

function readQueryKey(userId) {
  return [...READ_QUERY_KEY, userId || "anon"];
}

function completedQueryKey(userId) {
  return [...COMPLETED_QUERY_KEY, userId || "anon"];
}

export function useAnnouncementsQuery() {
  return useQuery({
    queryKey: ANNOUNCEMENTS_QUERY_KEY,
    queryFn: getAnnouncements,
  });
}

export function useReadAnnouncementsQuery() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: readQueryKey(user?.id),
    queryFn: () => getReadAnnouncementIds(user?.id),
    enabled: Boolean(user?.id),
  });
}

export function useCreateAnnouncementMutation() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (payload) => createAnnouncement(payload, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_QUERY_KEY });
    },
  });
}

export function useDeleteAnnouncementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_QUERY_KEY });
    },
  });
}

export function useMarkAnnouncementReadMutation() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (announcementId) => markAnnouncementRead({ announcementId, userId: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readQueryKey(user?.id) });
    },
  });
}

export function useMarkAnnouncementsReadMutation() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (announcementIds) =>
      markAnnouncementsRead({ announcementIds, userId: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: readQueryKey(user?.id) });
    },
  });
}

export function useCompletedDeadlinesQuery() {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: completedQueryKey(user?.id),
    queryFn: () => getCompletedDeadlineIds(user?.id),
    enabled: Boolean(user?.id),
  });
}

export function useMarkDeadlineCompletedMutation() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (deadlineId) => markDeadlineCompleted({ deadlineId, userId: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: completedQueryKey(user?.id) });
    },
  });
}

export function useUnmarkDeadlineCompletedMutation() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (deadlineId) => unmarkDeadlineCompleted({ deadlineId, userId: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: completedQueryKey(user?.id) });
    },
  });
}
