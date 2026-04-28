import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTicketsQuery } from "@/features/tickets/hooks/useTickets";

const CATEGORY_COLORS = {
  Tehnic: "#0f8e87",
  HR: "#cbac73",
  Legislativ: "#0d5457",
  General: "#94a3b8",
};

const STATUS_COLORS = {
  Deschis: "#ef4444",
  "In lucru": "#f59e0b",
  Rezolvat: "#10b981",
};

const SOURCE_COLORS = {
  chat: "#0f8e87",
  manual: "#cbac73",
};

function formatDay(date) {
  return date.toLocaleDateString("ro-RO", { day: "2-digit", month: "short" });
}

function getDayKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildDailyTrend(tickets, days = 14) {
  const counts = new Map();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    counts.set(getDayKey(d), { day: formatDay(d), key: getDayKey(d), tichete: 0 });
  }

  for (const t of tickets) {
    if (!t.created_at) continue;
    const d = new Date(t.created_at);
    const key = getDayKey(d);
    if (counts.has(key)) {
      counts.get(key).tichete += 1;
    }
  }

  return Array.from(counts.values());
}

function countBy(tickets, field, fallback = "Necunoscut") {
  const map = new Map();
  for (const t of tickets) {
    const value = t[field] || fallback;
    map.set(value, (map.get(value) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

function topRequesters(tickets, limit = 5) {
  const map = new Map();
  for (const t of tickets) {
    const name = t.requesterName || "Necunoscut";
    map.set(name, (map.get(name) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function KpiCard({ label, value, accent }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-3xl font-bold ${accent || "text-slate-900"}`}>{value}</p>
    </Card>
  );
}

export function AdminDashboardPage() {
  const { data: tickets = [], isLoading, isError } = useTicketsQuery();

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === "Deschis").length;
    const inProgress = tickets.filter((t) => t.status === "In lucru").length;
    const resolved = tickets.filter((t) => t.status === "Rezolvat").length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const oldOpen = tickets.filter(
      (t) => t.status !== "Rezolvat" && t.created_at && new Date(t.created_at) < sevenDaysAgo,
    ).length;

    return { total, open, inProgress, resolved, resolutionRate, oldOpen };
  }, [tickets]);

  const dailyTrend = useMemo(() => buildDailyTrend(tickets, 14), [tickets]);
  const byCategory = useMemo(() => countBy(tickets, "category", "General"), [tickets]);
  const byDepartment = useMemo(() => countBy(tickets, "department", "Nealocat"), [tickets]);
  const byPriority = useMemo(() => countBy(tickets, "priority", "Medie"), [tickets]);
  const bySource = useMemo(() => countBy(tickets, "source", "manual"), [tickets]);
  const byStatus = useMemo(() => countBy(tickets, "status", "Deschis"), [tickets]);
  const requesters = useMemo(() => topRequesters(tickets), [tickets]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Eroare la incarcare"
        description="Nu am putut incarca datele dashboard-ului."
      />
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard administrator"
        subtitle="Privire de ansamblu asupra tichetelor, departamentelor si tendintelor."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Tichete totale" value={stats.total} />
        <KpiCard label="Deschise" value={stats.open} accent="text-rose-600" />
        <KpiCard label="In lucru" value={stats.inProgress} accent="text-amber-600" />
        <KpiCard label="Rezolvate" value={stats.resolved} accent="text-emerald-600" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
        <KpiCard
          label="Rata de rezolvare"
          value={`${stats.resolutionRate}%`}
          accent="text-brand-700"
        />
        <KpiCard
          label="Restante > 7 zile"
          value={stats.oldOpen}
          accent={stats.oldOpen > 0 ? "text-rose-600" : "text-slate-900"}
        />
      </div>

      <Card>
        <h3 className="text-base font-semibold text-slate-900">Tichete per zi (ultimele 14 zile)</h3>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="tichete"
                stroke="#0f8e87"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Tichete pe categorie</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {byCategory.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[entry.name] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-900">Volum pe departament</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0a6969" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-900">Distributie pe status</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {byStatus.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-900">Distributie pe prioritate</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#cbac73" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Sursa tichetelor</h3>
          <p className="text-xs text-slate-500">Cate solicitari vin din chat-ul AI vs manual.</p>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bySource}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {bySource.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={SOURCE_COLORS[entry.name] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-900">Top solicitanti</h3>
          <p className="text-xs text-slate-500">
            Angajatii care au creat cele mai multe tichete.
          </p>
          {requesters.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Nu exista date.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2">Angajat</th>
                  <th className="py-2 text-right">Tichete</th>
                </tr>
              </thead>
              <tbody>
                {requesters.map((r) => (
                  <tr key={r.name} className="border-b border-slate-100">
                    <td className="py-2 font-medium text-slate-800">{r.name}</td>
                    <td className="py-2 text-right text-slate-700">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
