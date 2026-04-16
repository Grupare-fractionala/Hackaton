import { createBrowserRouter, redirect } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { AdminPage } from "@/pages/AdminPage";
import { AdminTicketsPage } from "@/pages/AdminTicketsPage";
import { ChatPage } from "@/pages/ChatPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { KnowledgePage } from "@/pages/KnowledgePage";
import { LoginPage } from "@/pages/LoginPage";
import { NewTicketPage } from "@/pages/NewTicketPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { TicketsPage } from "@/pages/TicketsPage";
import { useAuthStore } from "@/store/useAuthStore";

const requireAuth = () => {
  const token = useAuthStore.getState().token;

  if (!token) {
    throw redirect("/login");
  }

  return null;
};

const redirectIfAuthenticated = () => {
  const token = useAuthStore.getState().token;

  if (token) {
    throw redirect("/");
  }

  return null;
};

export const router = createBrowserRouter(
  [
    {
      path: "/login",
      loader: redirectIfAuthenticated,
      element: <LoginPage />,
    },
    {
      path: "/",
      loader: requireAuth,
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <DashboardPage />,
        },
        {
          path: "chat",
          element: <ChatPage />,
        },
        {
          path: "tickets",
          element: <TicketsPage />,
        },
        {
          path: "tickets/new",
          element: <NewTicketPage />,
        },
        {
          path: "documents",
          element: <KnowledgePage />,
        },
        {
          path: "knowledge",
          element: <KnowledgePage />,
        },
        {
          path: "admin/users",
          element: <AdminPage />,
        },
        {
          path: "admin/tickets",
          element: <AdminTicketsPage />,
        },
      ],
    },
    {
      path: "*",
      element: <NotFoundPage />,
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
);
