import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const flowiseBaseUrl = process.env.VITE_FLOWISE_BASE_URL;
const flowiseApiKey = process.env.VITE_FLOWISE_API_KEY;
const flowiseHrId = process.env.VITE_FLOWISE_HR_ID;
const flowiseJuridicId = process.env.VITE_FLOWISE_JURIDIC_ID;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

if (!flowiseBaseUrl) {
  console.error("Missing VITE_FLOWISE_BASE_URL in .env (cannot upsert without a Flowise URL)");
  process.exit(1);
}

// Mirrors FLOWISE_UPSERT_TARGETS in src/features/documents/api/documentApi.js
const UPSERT_TARGETS = {
  HR: { chatflowId: flowiseHrId, metadataDepartment: "HR" },
  Administrativ: { chatflowId: flowiseJuridicId, metadataDepartment: "Legislativ" },
};

const STORAGE_BUCKET = "company_documents";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: documents, error: queryError } = await supabase
  .from("documents")
  .select("*")
  .order("created_at", { ascending: true });

if (queryError) {
  console.error("Failed to fetch documents:", queryError.message);
  process.exit(1);
}

console.log(`Found ${documents.length} document row(s) in 'documents' table.\n`);

const stats = { upserted: 0, skipped: 0, failed: 0 };

for (const doc of documents) {
  const target = UPSERT_TARGETS[doc.department];

  if (!target) {
    console.log(`⏭  ${doc.file_name} (${doc.department}) — not embedded by design`);
    stats.skipped++;
    continue;
  }

  if (!target.chatflowId) {
    console.log(`✗  ${doc.file_name} (${doc.department}) — missing chatflow ID env var`);
    stats.failed++;
    continue;
  }

  const splitToken = `/${STORAGE_BUCKET}/`;
  const urlParts = doc.file_url ? doc.file_url.split(splitToken) : [];
  if (urlParts.length !== 2) {
    console.log(`✗  ${doc.file_name} — cannot parse storage path from file_url`);
    stats.failed++;
    continue;
  }
  const storagePath = decodeURIComponent(urlParts[1]);

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(storagePath);

  if (downloadError || !fileBlob) {
    console.log(
      `✗  ${doc.file_name} — Storage download failed: ${downloadError?.message || "no blob returned"}`,
    );
    stats.failed++;
    continue;
  }

  const formData = new FormData();
  formData.append("files", fileBlob, doc.file_name);
  formData.append(
    "overrideConfig",
    JSON.stringify({ metadata: { department: target.metadataDepartment } }),
  );

  let response;
  try {
    response = await fetch(
      `${flowiseBaseUrl}/api/v1/vector/upsert/${target.chatflowId}`,
      {
        method: "POST",
        headers: flowiseApiKey ? { Authorization: `Bearer ${flowiseApiKey}` } : {},
        body: formData,
      },
    );
  } catch (err) {
    console.log(`✗  ${doc.file_name} — Flowise unreachable: ${err.message}`);
    stats.failed++;
    continue;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.log(
      `✗  ${doc.file_name} (${doc.department}) — upsert HTTP ${response.status}: ${text || response.statusText}`,
    );
    stats.failed++;
    continue;
  }

  console.log(`✓  ${doc.file_name} (${doc.department} → metadata.department=${target.metadataDepartment})`);
  stats.upserted++;
}

console.log(
  `\nDone. Upserted: ${stats.upserted}, skipped (by design): ${stats.skipped}, failed: ${stats.failed}`,
);

if (stats.failed > 0) {
  process.exit(1);
}
