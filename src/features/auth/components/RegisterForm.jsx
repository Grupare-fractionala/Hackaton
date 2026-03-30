import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useRegister } from "@/features/auth/hooks/useAuth";

export function RegisterForm() {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      // This is a simple validation, we could use a better way but for now it's okay.
      return;
    }

    try {
      await registerMutation.mutateAsync({ email: form.email, password: form.password });
      navigate("/", { replace: true });
    } catch {
      // Error is rendered through mutation state.
    }
  };

  const isPasswordMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  return (
    <Card className="w-full max-w-md p-5 sm:p-6">
      <div>
        <h1 className="text-[clamp(1.3rem,1.05rem+1vw,1.8rem)] font-bold text-slate-900">Creare cont</h1>
        <p className="mt-1 text-sm text-slate-600">
          Inregistreaza-te pentru a accesa platforma.
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

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">
            Confirma Parola
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
            required
          />
          {isPasswordMismatch && (
            <p className="mt-1 text-xs text-rose-600">Parolele nu se potrivesc.</p>
          )}
        </div>

        {registerMutation.isError ? (
          <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {registerMutation.error?.message || "Inregistrarea a esuat"}
          </div>
        ) : null}

        {registerMutation.isSuccess && !registerMutation.data?.user?.identities?.length ? (
           <div className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-700">
             Cont creat cu succes! Te rugam sa iti verifici email-ul pentru confirmare.
           </div>
        ) : null}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={registerMutation.isPending || isPasswordMismatch}
        >
          {registerMutation.isPending ? "Se inregistreaza..." : "Creeaza cont"}
        </Button>
      </form>
    </Card>
  );
}
