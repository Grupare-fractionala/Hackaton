import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useLogin } from "@/features/auth/hooks/useAuth";

const demoAccounts = [
  { email: "secretara@primarie.local", password: "Secretara123!", label: "Angajat" },
  { email: "tehnic@primarie.local", password: "Tehnic123!", label: "Agent Tehnic" },
  { email: "hr@primarie.local", password: "Hr123456!", label: "Agent HR" },
  { email: "administrativ@primarie.local", password: "AdminDep123!", label: "Agent Admin" },
  { email: "urbanism@primarie.local", password: "Urbanism123!", label: "Urbanism" },
  { email: "admin@primarie.local", password: "Admin123!", label: "Admin IT" },
];

export function LoginForm() {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const [form, setForm] = useState({
    email: demoAccounts[0].email,
    password: demoAccounts[0].password,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await loginMutation.mutateAsync(form);
      navigate("/", { replace: true });
    } catch {
      // Error is rendered through mutation state.
    }
  };

  return (
    <Card className="w-full max-w-md p-5 sm:p-6">
      <div>
        <h1 className="text-[clamp(1.3rem,1.05rem+1vw,1.8rem)] font-bold text-slate-900">Autentificare</h1>
        <p className="mt-1 text-sm text-slate-600">
          Intra in portalul intern pentru chat AI si management tichete.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Parola
          </label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
        </div>

        {loginMutation.isError ? (
          <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {loginMutation.error?.message || "Autentificare esuata"}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Se autentifica..." : "Intra in platforma"}
        </Button>
      </form>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Conturi demo
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
          {demoAccounts.map((account) => (
            <Button
              key={account.email}
              variant="secondary"
              size="sm"
              onClick={() => setForm({ email: account.email, password: account.password })}
            >
              {account.label}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
