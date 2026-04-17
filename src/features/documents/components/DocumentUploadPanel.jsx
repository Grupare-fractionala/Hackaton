import { useState, useRef, useCallback, useEffect } from "react";
import { uploadDocument } from "@/features/documents/documentApi";
import { supabase } from "@/supabaseClient";

export function DocumentUploadPanel() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [department, setDepartment] = useState("General");
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchDocuments() {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setDocuments(data);
    }
    fetchDocuments();
  }, []);

  const handleFiles = useCallback(
    async (files) => {
      const file = files[0];
      if (!file) return;
      setIsUploading(true);
      setUploadError(null);
      try {
        const success = await uploadDocument(file, department);
        if (!success) {
          setUploadError("Upload failed. Please try again.");
        } else {
          // Refresh list from DB to get the new document with its id
          const { data } = await supabase
            .from("documents")
            .select("*")
            .order("created_at", { ascending: false });
          if (data) setDocuments(data);
        }
      } catch (err) {
        setUploadError(err.message || "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [department]
  );

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onFileChange = (e) => handleFiles(e.target.files);

  return (
    <aside className="fixed right-0 top-0 h-screen w-80 bg-white shadow-lg flex flex-col z-50">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-200">
        <h2 className="text-base font-semibold text-slate-900">Documente</h2>
        <p className="mt-0.5 text-xs text-slate-500">Incarca si gestioneaza fisierele companiei</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Department selector */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700" htmlFor="doc-department">
            Departament
          </label>
          <select
            id="doc-department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option>General</option>
            <option>Tehnic</option>
            <option>HR</option>
            <option>Legislativ</option>
          </select>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors cursor-pointer select-none
            ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"}
            ${isUploading ? "pointer-events-none opacity-60" : ""}`}
        >
          {isUploading ? (
            <>
              <svg className="h-8 w-8 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-sm font-medium text-blue-600">Se incarca...</p>
            </>
          ) : (
            <>
              <svg className="h-8 w-8 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-sm font-medium text-slate-700">
                {isDragging ? "Elibereaza fisierul" : "Trage fisierul aici"}
              </p>
              <p className="text-xs text-slate-500">sau <span className="text-blue-500 underline">alege de pe calculator</span></p>
            </>
          )}
          <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} />
        </div>

        {/* Error */}
        {uploadError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-200">
            {uploadError}
          </p>
        )}

        {/* Document list */}
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Fisiere incarcate ({documents.length})
          </h3>
          {documents.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Niciun document incarcat inca.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate text-xs font-medium text-slate-800 hover:text-blue-600"
                    >
                      {doc.file_name}
                    </a>
                    <p className="mt-0.5 text-xs text-slate-400">{doc.department}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
