import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { sendChatMessage } from "@/features/chat/api/chatApi";
import { useAuthStore } from "@/store/useAuthStore";
import { uid } from "@/utils/id";

function getWelcomeMessage(name) {
  return {
    id: uid("msg"),
    role: "ai",
    content: `Salut, ${name || "coleg"}. Sunt asistentul intern pentru solicitari tehnice, HR si legislative.`,
    createdAt: new Date().toISOString(),
  };
}

export function useChat() {
  const user = useAuthStore((state) => state.user);

  const storageKey = useMemo(() => `chat-history-${user?.id || "anon"}`, [user?.id]);

  const [messages, setMessages] = useState(() => {
    if (!user?.id) {
      return [];
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Ignore localStorage parse errors.
    }

    return [getWelcomeMessage(user.name)];
  });

  useEffect(() => {
    if (!user?.id) {
      setMessages([]);
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setMessages(JSON.parse(raw));
        return;
      }
    } catch {
      // Ignore localStorage parse errors.
    }

    setMessages([getWelcomeMessage(user.name)]);
  }, [storageKey, user?.id, user?.name]);

  useEffect(() => {
    if (!user?.id || !messages.length) {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey, user?.id]);

  const mutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (result) => {
      const aiMessage = {
        id: uid("msg"),
        role: "ai",
        content: result.reply,
        category: result.category,
        ticketSuggestion: result.shouldCreateTicket ? result.suggestedTicket : null,
        resolved: result.resolved,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    },
    onError: (error) => {
      const aiMessage = {
        id: uid("msg"),
        role: "ai",
        content:
          error?.response?.data?.message ||
          "A aparut o problema la procesarea mesajului. Incearca din nou.",
        category: "General",
        ticketSuggestion: null,
        resolved: false,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    },
  });

  const sendMessage = (text) => {
    const content = String(text || "").trim();
    if (!content || mutation.isPending) {
      return;
    }

    const userMessage = {
      id: uid("msg"),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    mutation.mutate({ message: content });
  };

  const resetConversation = () => {
    const initial = [getWelcomeMessage(user?.name)];
    setMessages(initial);
    localStorage.setItem(storageKey, JSON.stringify(initial));
  };

  const firstUserMessage = messages.find((m) => m.role === "user")?.content || "";

  return {
    messages,
    sendMessage,
    resetConversation,
    isSending: mutation.isPending,
    firstUserMessage,
  };
}
