import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import { ROLES, roleLabel } from "@/features/admin/api/adminApi";
import { useCreateUserMutation, useDeleteUserMutation, useUsersQuery } from "@/features/admin/hooks/useAdmin";
import { formatDateTime } from "@/utils/date";

const initialForm = { username: "", password: "", role: "employee", department: "" };

function roleBadgeVariant(role) {
  if (role === "admin") return "danger";
  if (role.startsWith("agent")) return "warning";
  return "neutral";
}

export function AdminPage() {
  const usersQuery = useUsersQuery();
  const createMutation = useCreateUserMutation();
  const deleteMutation = useDeleteUserMutation();

  const [form, setForm] = useState(initialForm);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const users = usersQuery.data || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync(form);
    setForm(initialForm);
  };

  const handleDelete = async (userId) => {
    await deleteMutation.mutateAsync(userId);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrare utilizatori"
        subtitle="Creeaza si gestioneaza conturile angajatilor."
      />

      <div className="grid gap-6 2xl:grid-cols-[400px_minmax(0,1fr)]">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Cont nou</h2>
          <p className="mt-1 text-sm text-slate-600">Creeaza un cont pentru un angajat.</p>

          <form className="mt-4 grid gap-4" onSubmit={handleCreate}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="username">
                Username
              </label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                placeholder="ion_popescu"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
                Parola
              </label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Minim 6 caractere"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="role">
                Rol
              </label>
              <Select
                id="role"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="department">
                Departament (optional)
              </label>
              <Input
                id="department"
                value={form.department}
                onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                placeholder="Ex: Registratura"
              />
            </div>

            {createMutation.isError ? (
              <p className="text-sm text-rose-600">
                {createMutation.error?.message || "Eroare la crearea contului."}
              </p>
            ) : null}

            {createMutation.isSuccess ? (
              <p className="text-sm text-emerald-600">Cont creat cu succes.</p>
            ) : null}

            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Se creeaza..." : "Creeaza cont"}
            </Button>
          </form>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Utilizatori
            <span className="ml-2 text-sm font-normal text-slate-500">({users.length})</span>
          </h2>

          {usersQuery.isLoading ? (
            <Card><Loader label="Se incarca utilizatorii..." /></Card>
          ) : users.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">Niciun utilizator inca.</Card>
          ) : (
            users.map((user) => (
              <Card key={user.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{user.username}</p>
                    <Badge variant={roleBadgeVariant(user.role)}>{roleLabel(user.role)}</Badge>
                  </div>
                  {user.department ? (
                    <p className="mt-0.5 text-sm text-slate-500">{user.department}</p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(user.created_at)}</p>
                </div>

                <div className="shrink-0">
                  {confirmDelete === user.id ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Anuleaza
                      </Button>
                      <Button
                        size="sm"
                        className="bg-rose-600 hover:bg-rose-700 text-white"
                        onClick={() => handleDelete(user.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Sterge
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setConfirmDelete(user.id)}
                    >
                      Sterge
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
