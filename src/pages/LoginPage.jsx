import { LoginForm } from "@/features/auth/components/LoginForm";

export function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1200px] items-start p-4 sm:p-5 md:items-center md:p-6">
      <div className="grid w-full items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="card-glass rounded-3xl p-5 shadow-soft sm:p-6 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-700">Sistem intern</p>
          <h1 className="mt-3 text-[clamp(1.85rem,1.2rem+3.2vw,3.2rem)] font-bold text-slate-900">
            Hub digital pentru angajatii primariei
          </h1>
          <p className="mt-4 max-w-xl text-sm text-slate-700 sm:text-base md:text-lg">
            Un singur punct de contact pentru intrebari tehnice, HR si legislative. AI rezolva instant ce
            poate, iar cazurile complexe sunt transformate automat in tichete.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/85 p-4">
              <p className="text-sm font-semibold text-slate-900">Suport Tehnic</p>
              <p className="mt-1 text-xs text-slate-600">Incidente echipamente si retea.</p>
            </div>
            <div className="rounded-2xl bg-white/85 p-4">
              <p className="text-sm font-semibold text-slate-900">Suport HR</p>
              <p className="mt-1 text-xs text-slate-600">Concedii, documente, pontaj.</p>
            </div>
            <div className="rounded-2xl bg-white/85 p-4">
              <p className="text-sm font-semibold text-slate-900">Ghid Legislativ</p>
              <p className="mt-1 text-xs text-slate-600">Intrebari urbanism si proceduri.</p>
            </div>
          </div>
        </section>

        <div className="flex flex-col items-center justify-center lg:items-end">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
