import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useLogin } from "@/features/auth/hooks/useAuth";

export function LoginForm() {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const [form, setForm] = useState({ username: "", password: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await loginMutation.mutateAsync(form);
      navigate("/", { replace: true });
    } catch {
      // Error rendered through mutation state.
    }
  };

  return (
    <Card className="w-full max-w-md p-5 sm:p-6">
      <div>
        <h1 className="text-[clamp(1.3rem,1.05rem+1vw,1.8rem)] font-bold text-slate-900">
          Autentificare
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Intra in portalul intern cu datele primite de la administrator.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="username">
            Username
          </label>
          <Input
            id="username"
            type="text"
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            placeholder="ion_popescu"
            required
            autoComplete="username"
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
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
            autoComplete="current-password"
          />
        </div>

        {loginMutation.isError ? (
          <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {loginMutation.error?.message || "Autentificare esuata."}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Se autentifica..." : "Intra in platforma"}
        </Button>
      </form>
    </Card>
  );
}
