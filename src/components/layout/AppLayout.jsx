import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/useAuthStore";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  useAnnouncementsQuery,
  useCompletedDeadlinesQuery,
} from "@/features/announcements/hooks/useAnnouncements";
import {
  getDeadlineInfo,
  isRelevantForUser,
} from "@/features/announcements/utils/helpers";

const BASE_LINKS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/chat", label: "Chat AI" },
  { to: "/tickets", label: "Tichete" },
  { to: "/announcements", label: "Anunturi" },
  { to: "/deadlines", label: "Termene", urgentBadge: true },
];

const ADMIN_LINKS = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/tickets", label: "Toate tichetele" },
  { to: "/admin/users", label: "Utilizatori" },
  { to: "/documents", label: "Documente" },
];

export function AppLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useCurrentUser();

  const links = BASE_LINKS;
  const adminLinks = currentUser?.isAdmin ? ADMIN_LINKS : [];

  const announcementsQuery = useAnnouncementsQuery();
  const completedDeadlinesQuery = useCompletedDeadlinesQuery();
  const urgentDeadlineCount = useMemo(() => {
    const items = announcementsQuery.data || [];
    const completed = new Set(completedDeadlinesQuery.data || []);
    return items.filter((item) => {
      if (item.type !== "deadline") return false;
      if (completed.has(item.id)) return false;
      if (!isRelevantForUser(item, currentUser)) return false;
      const info = getDeadlineInfo(item);
      return info.urgency === "overdue" || info.urgency === "critical" || info.urgency === "soon";
    }).length;
  }, [announcementsQuery.data, completedDeadlinesQuery.data, currentUser]);

  const initials = useMemo(() => {
    if (!user?.name) {
      return "U";
    }

    return user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const roleLabel = {
    admin: "Administrator",
    agent_tehnic: "Agent Tehnic",
    agent_hr: "Agent HR",
    agent_legislativ: "Agent Legislativ",
    employee: "Angajat",
  }[currentUser?.role] ?? "Angajat";

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto flex w-full max-w-[1450px] gap-3 p-3 sm:gap-4 sm:p-4 lg:gap-5 lg:p-6">
        <div
          className={cn(
            "fixed inset-0 z-20 bg-slate-900/30 transition lg:hidden",
            isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />

        <aside
          className={cn(
            "card-glass fixed left-4 top-4 z-30 flex h-[calc(100dvh-2rem)] w-[min(18rem,calc(100vw-2rem))] flex-col overflow-y-auto rounded-2xl border border-white/80 p-4 shadow-soft transition-transform lg:static lg:h-auto lg:min-h-[calc(100dvh-3rem)] lg:w-72 lg:translate-x-0",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-[120%]",
          )}
        >
          <div className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-4 text-white">
            <p className="text-xs uppercase tracking-[0.16em] text-white/70">Portal Intern</p>
            <h2 className="mt-2 text-xl font-bold font-title">Primarie Support</h2>
            <p className="mt-2 text-sm text-white/80">Asistenta tehnica, HR si legislativa intr-un singur loc.</p>
          </div>

          <nav className="mt-5 space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-brand-100 text-brand-800"
                      : "text-slate-700 hover:bg-white hover:text-slate-900",
                  )
                }
              >
                <span>{link.label}</span>
                {link.urgentBadge && urgentDeadlineCount > 0 ? (
                  <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                    {urgentDeadlineCount}
                  </span>
                ) : null}
              </NavLink>
            ))}

            {adminLinks.length > 0 ? (
              <div className="pt-3">
                <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Admin
                </p>
                {adminLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "block rounded-xl px-3 py-2 text-sm font-medium transition",
                        isActive
                          ? "bg-brand-100 text-brand-800"
                          : "text-slate-700 hover:bg-white hover:text-slate-900",
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </nav>

          <div className="mt-auto rounded-2xl bg-white/80 p-3">
            <p className="text-xs text-slate-500">Conectat ca</p>
            <p className="text-sm font-semibold text-slate-900">{user?.name || "Utilizator"}</p>
            <p className="text-xs text-slate-500">{user?.department || "Departament"}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
          <header className="card-glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/80 px-3 py-3 shadow-soft sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                variant="secondary"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                Meniu
              </Button>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Platforma interna</p>
                <p className="truncate text-sm font-semibold text-slate-900">Gestionare solicitari angajati</p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.name || "Utilizator"}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-200 to-brand-300 text-sm font-bold text-brand-900 ring-2 ring-brand-300/80 shadow-[0_6px_16px_rgba(34,184,173,0.28)] sm:h-10 sm:w-10">
                {initials}
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </header>

          <main className="pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
