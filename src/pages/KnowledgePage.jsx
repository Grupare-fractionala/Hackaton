import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useCreateDocumentMutation, useDocumentsQuery } from "@/features/documents/hooks/useDocuments";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_DEPARTMENTS,
  GENERAL_DOCUMENT_DEPARTMENT,
} from "@/features/documents/utils/constants";
import { getAssignedDepartmentByCategory } from "@/features/tickets/utils/routing";
import { useAuthStore } from "@/store/useAuthStore";
import { formatDateTime } from "@/utils/date";

const orientationSections = [
  {
    title: "Tehnic",
    tips: [
      "Inregistreaza codul exact al erorii inainte sa deschizi tichet.",
      "Verifica alimentarea, cablurile si conexiunea la retea.",
      "Pentru incidente repetate, ataseaza intervalul orar cand apare problema.",
    ],
  },
  {
    title: "HR",
    tips: [
      "Pentru informatii angajati foloseste doar documentele aprobate intern.",
      "Regulamentul de ordine interioara trebuie sa fie disponibil pentru toata institutia.",
      "Cazurile speciale (medical, suspendari) se documenteaza cu acte justificative.",
    ],
  },
  {
    title: "Legislativ / Urbanism",
    tips: [
      "Pentru avize de constructie, specifica zona si functiunea terenului.",
      "Distantele minime intre constructii se valideaza cu regulament local + documentatia de urbanism.",
      "Raspunsurile AI sunt orientative; raspunsul oficial se emite de specialist.",
    ],
  },
];

const searchFieldCandidates = ["title", "description", "fileName", "uploadedByName"];

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Nu am putut citi fisierul selectat."));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes) {
  const size = Number(bytes) || 0;

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function KnowledgePage() {
  const user = useAuthStore((state) => state.user);
  const documentsQuery = useDocumentsQuery();
  const createDocumentMutation = useCreateDocumentMutation();

  const employeeDepartment = getAssignedDepartmentByCategory(user?.department || "");

  const allowedDepartments = useMemo(() => {
    if (user?.role === "admin") {
      return DOCUMENT_DEPARTMENTS;
    }

    if (user?.role === "agent") {
      const departments = [GENERAL_DOCUMENT_DEPARTMENT, ...(user?.handledDepartments || [])];
      return Array.from(new Set(departments));
    }

    return Array.from(new Set([GENERAL_DOCUMENT_DEPARTMENT, employeeDepartment]));
  }, [employeeDepartment, user?.handledDepartments, user?.role]);

  const [form, setForm] = useState({
    title: "",
    category: DOCUMENT_CATEGORIES[0],
    department: GENERAL_DOCUMENT_DEPARTMENT,
    description: "",
    file: null,
  });

  const [filters, setFilters] = useState({
    department: "Toate",
    category: "Toate",
    query: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [filePickerKey, setFilePickerKey] = useState(0);

  useEffect(() => {
    if (!allowedDepartments.length) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      department: allowedDepartments.includes(prev.department)
        ? prev.department
        : allowedDepartments[0],
    }));
  }, [allowedDepartments]);

  const documents = documentsQuery.data || [];

  const categoryOptions = useMemo(() => {
    return Array.from(new Set([...DOCUMENT_CATEGORIES, ...documents.map((document) => document.category)]));
  }, [documents]);

  const departmentOptions = useMemo(() => {
    return Array.from(
      new Set([...DOCUMENT_DEPARTMENTS, ...documents.map((document) => document.department)]),
    );
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();

    return documents.filter((document) => {
      const departmentMatches =
        filters.department === "Toate" || document.department === filters.department;
      const categoryMatches = filters.category === "Toate" || document.category === filters.category;
      const queryMatches = !normalizedQuery
        ? true
        : searchFieldCandidates.some((field) =>
            String(document[field] || "").toLowerCase().includes(normalizedQuery),
          );

      return departmentMatches && categoryMatches && queryMatches;
    });
  }, [documents, filters.category, filters.department, filters.query]);

  const handleDownload = (documentItem) => {
    if (!documentItem.fileDataUrl) {
      return;
    }

    const anchor = window.document.createElement("a");
    anchor.href = documentItem.fileDataUrl;
    anchor.download = documentItem.fileName || `${documentItem.title}.pdf`;
    window.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleCreateDocument = async (event) => {
    event.preventDefault();
    setSuccessMessage("");
    setFormError("");

    if (!form.file) {
      setFormError("Selecteaza un fisier pentru upload.");
      return;
    }

    try {
      const fileDataUrl = await readFileAsDataUrl(form.file);

      await createDocumentMutation.mutateAsync({
        title: form.title,
        category: form.category,
        department: form.department,
        description: form.description,
        fileName: form.file.name,
        fileType: form.file.type || "application/octet-stream",
        fileSize: form.file.size,
        fileDataUrl,
      });

      setSuccessMessage("Document incarcat cu succes.");
      setForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        file: null,
      }));
      setFilePickerKey((value) => value + 1);
    } catch (error) {
      setFormError(
        error?.response?.data?.message || error?.message || "Nu am putut incarca documentul.",
      );
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documente interne"
        subtitle="Arhiva interna pe departamente: HR, Tehnic, Administrativ si documente generale."
        action={
          <Badge variant="info" className="text-sm">
            {filteredDocuments.length} documente
          </Badge>
        }
      />

      <div className="grid gap-4 2xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Incarca document</h2>
          <p className="mt-1 text-sm text-slate-600">
            Exemplu: informatii angajati HR, regulament intern, proceduri operationale.
          </p>

          <form className="mt-4 space-y-4" onSubmit={handleCreateDocument}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="document-title">
                Titlu document
              </label>
              <Input
                id="document-title"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Ex: Procedura concedii 2026"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="document-department">
                  Departament
                </label>
                <Select
                  id="document-department"
                  value={form.department}
                  onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
                >
                  {allowedDepartments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="document-category">
                  Categorie
                </label>
                <Select
                  id="document-category"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                >
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="document-description">
                Descriere
              </label>
              <Textarea
                id="document-description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Ce contine documentul si pentru cine este util."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="document-file">
                Fisier
              </label>
              <input
                key={filePickerKey}
                id="document-file"
                type="file"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] || null;
                  setForm((prev) => ({ ...prev, file: selectedFile }));
                }}
                className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-900"
                required
              />
              <p className="mt-1 text-xs text-slate-500">Maxim 2.5 MB (demo local).</p>
            </div>

            {successMessage ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            {formError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {formError}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={createDocumentMutation.isPending}>
              {createDocumentMutation.isPending ? "Se incarca..." : "Incarca document"}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Departament
              </label>
              <Select
                value={filters.department}
                onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}
              >
                <option>Toate</option>
                {departmentOptions.map((department) => (
                  <option key={department}>{department}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Categorie
              </label>
              <Select
                value={filters.category}
                onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
              >
                <option>Toate</option>
                {categoryOptions.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cautare
              </label>
              <Input
                value={filters.query}
                onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
                placeholder="Titlu, fisier, autor..."
              />
            </div>
          </Card>

          <Card className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Arhiva documente</h3>

            {documentsQuery.isLoading ? (
              <Loader label="Se incarca documentele..." />
            ) : filteredDocuments.length ? (
              filteredDocuments.map((documentItem) => (
                <div key={documentItem.id} className="rounded-xl border border-slate-200 bg-white/80 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{documentItem.title}</p>
                      <p className="text-xs text-slate-500">{documentItem.fileName}</p>
                    </div>
                    <Badge variant="neutral">{documentItem.id}</Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="info">{documentItem.department}</Badge>
                    <Badge variant="neutral">{documentItem.category}</Badge>
                  </div>

                  {documentItem.description ? (
                    <p className="mt-2 text-sm text-slate-700">{documentItem.description}</p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      Incarcat de {documentItem.uploadedByName} la {formatDateTime(documentItem.createdAt)} |{" "}
                      {formatFileSize(documentItem.fileSize)}
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(documentItem)}
                      disabled={!documentItem.fileDataUrl}
                    >
                      Descarca
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">
                Nu exista documente pentru filtrele selectate sau pentru drepturile tale curente.
              </p>
            )}
          </Card>

          <div className="grid gap-4 xl:grid-cols-3">
            {orientationSections.map((section) => (
              <Card key={section.title}>
                <h4 className="text-base font-semibold text-slate-900">{section.title}</h4>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {section.tips.map((tip) => (
                    <li key={tip}>- {tip}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
