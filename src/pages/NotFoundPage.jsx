import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card-glass max-w-md rounded-2xl p-8 text-center shadow-soft">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">404</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Pagina nu exista</h1>
        <p className="mt-2 text-sm text-slate-600">Ruta solicitata nu a fost gasita in aplicatie.</p>
        <Link to="/">
          <Button className="mt-5">Inapoi la Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
