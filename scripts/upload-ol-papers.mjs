/**
 * O/L Past Paper Uploader
 * Reads OL folders created by scrape-ol-papers.mjs, uploads each PDF to Azure,
 * then creates a paper record via the backend API.
 *
 * Folder convention:
 *   {PAPERS_DIR}/OL {Subject} {medium} medium/
 *     ol-{subject-slug}-{medium}-{year}.pdf
 *
 * Title convention:
 *   G.C.E. Ordinary Level {Subject} {medium} Medium Past Paper {year}
 *
 * Usage: node scripts/upload-ol-papers.mjs <email> <password>
 */

import fs from "fs";
import path from "path";
import readline from "readline";

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE =
  "https://tutorme-backend-api-d7a6cjdkgnedbxf0.southeastasia-01.azurewebsites.net";
const PAPERS_DIR = process.env.PAPERS_DIR ?? "D:/Download/OL-Papers";

const AZURE_ACCOUNT = "tutormeuploads";
const AZURE_CONTAINER = "uploads";
const AZURE_KEY = process.env.AZURE_STORAGE_KEY ?? "";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans);
    }),
  );
}

async function login(email, password, retries = 5) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(`${API_BASE}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    if (text.startsWith("Too many")) {
      const wait = (i + 1) * 10000;
      console.log(`  Rate limited — waiting ${wait / 1000}s...`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(`Login failed: ${data.message}`);
    return data.tokens.access.token;
  }
  throw new Error("Login failed after retries");
}

async function fetchGrades(token) {
  const res = await fetch(`${API_BASE}/v1/grades?page=1&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.results ?? [];
}

async function fetchExistingKeys(token) {
  const res = await fetch(`${API_BASE}/v1/papers?page=1&limit=10000`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return new Set(
    (data.results ?? []).map((p) => {
      const medium = p.medium?.id ?? p.medium ?? "";
      return `${p.title.toLowerCase().trim()}|${medium.toLowerCase()}|${p.year ?? ""}`;
    }),
  );
}

async function createPaper(token, paper) {
  const res = await fetch(`${API_BASE}/v1/papers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(paper),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Create paper failed: ${JSON.stringify(data)}`);
  return data;
}

// ─── Azure SAS upload ─────────────────────────────────────────────────────────

async function generateSasUrl(blobName, fileType) {
  const { createHmac } = await import("crypto");
  const now = new Date();
  const expires = new Date(now.getTime() + 60 * 60 * 1000);
  const toIso = (d) => d.toISOString().replace(/\.\d+Z$/, "Z");
  const start = toIso(now);
  const end = toIso(expires);
  const permissions = "cw";
  const signedFields = [
    permissions,
    start,
    end,
    `/blob/${AZURE_ACCOUNT}/${AZURE_CONTAINER}/${blobName}`,
    "",
    "",
    "https",
    "2024-11-04",
    "b",
    "",
    "",
    "",
    "",
    "",
    "",
    fileType,
  ];
  const sig = createHmac("sha256", Buffer.from(AZURE_KEY, "base64"))
    .update(signedFields.join("\n"), "utf8")
    .digest("base64");
  const params = new URLSearchParams({
    sp: permissions,
    st: start,
    se: end,
    spr: "https",
    sv: "2024-11-04",
    sr: "b",
    rsct: fileType,
    sig,
  });
  return `https://${AZURE_ACCOUNT}.blob.core.windows.net/${AZURE_CONTAINER}/${blobName}?${params}`;
}

async function uploadToAzure(filePath, fileName) {
  const fileType = "application/pdf";
  const blobName = `${Date.now()}-${fileName}`;
  const sasUrl = await generateSasUrl(blobName, fileType);
  const fileBuffer = fs.readFileSync(filePath);
  const res = await fetch(sasUrl, {
    method: "PUT",
    headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": fileType },
    body: fileBuffer,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Azure upload failed (${res.status}): ${text}`);
  }
  return sasUrl.split("?")[0];
}

// ─── Subject matching ─────────────────────────────────────────────────────────

function normalizeSubject(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*&\s*/g, " and ")
    .trim();
}

function findSubjectId(grade, subjectName) {
  if (!grade?.subjects) return null;
  const normalized = normalizeSubject(subjectName);
  const match = grade.subjects.find((s) => {
    const db = normalizeSubject(s.title);
    return (
      db === normalized || db.includes(normalized) || normalized.includes(db)
    );
  });
  return match?.id ?? null;
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

// "OL Mathematics sinhala medium" → {subject: "Mathematics", medium: "Sinhala"}
function parseFolderName(folderName) {
  const match = folderName.match(
    /^OL\s+(.+?)\s+(sinhala|english|tamil)\s+medium$/i,
  );
  if (!match) return null;
  return {
    subject: match[1].trim(),
    medium: match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase(),
  };
}

// "ol-mathematics-sinhala-2024.pdf" → {year: "2024"}
function parseFileName(fileName) {
  const yearMatch = fileName.match(/(\d{4})\.pdf$/i);
  if (!yearMatch) return null;
  return { year: yearMatch[1] };
}

// "G.C.E. Ordinary Level Mathematics Sinhala Medium Past Paper 2024"
function buildTitle(subject, medium, year) {
  return `G.C.E. Ordinary Level ${subject} ${medium} Medium Past Paper ${year}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== TutorMe O/L Paper Uploader ===\n");

  const email = process.argv[2] ?? (await prompt("Admin email: "));
  const password = process.argv[3] ?? (await prompt("Admin password: "));

  console.log("\nLogging in...");
  const token = await login(email, password);
  console.log("✓ Logged in\n");

  console.log("Fetching grades from API...");
  const grades = await fetchGrades(token);
  const olGrade = grades.find((g) => /ordinary level/i.test(g.title));
  if (!olGrade)
    throw new Error(
      "O/L grade not found in API — no grade with 'Ordinary Level' in title",
    );
  console.log(
    `✓ Found O/L grade: ${olGrade.title} (${(olGrade.subjects ?? []).length} subjects)\n`,
  );

  const folders = fs.readdirSync(PAPERS_DIR).filter((name) => {
    const full = path.join(PAPERS_DIR, name);
    return fs.statSync(full).isDirectory() && /^OL\s+/i.test(name);
  });
  console.log(`Found ${folders.length} OL folders\n`);

  console.log("Fetching existing papers to skip duplicates...");
  const existingKeys = await fetchExistingKeys(token);
  console.log(`✓ ${existingKeys.size} papers already in DB\n`);

  const uploadedThisRun = new Set();
  let successCount = 0,
    skipCount = 0,
    errorCount = 0;

  for (const folder of folders) {
    const parsed = parseFolderName(folder);
    if (!parsed) {
      console.log(`  SKIP (can't parse folder): ${folder}`);
      skipCount++;
      continue;
    }

    const { subject, medium } = parsed;
    const subjectId = findSubjectId(olGrade, subject);

    if (!subjectId) {
      const available =
        (olGrade.subjects ?? []).map((s) => s.title).join(", ") || "none";
      console.log(
        `  SKIP (subject "${subject}" not found in O/L grade). Available: ${available}`,
      );
      skipCount++;
      continue;
    }

    const folderPath = path.join(PAPERS_DIR, folder);
    const pdfs = fs
      .readdirSync(folderPath)
      .filter((f) => f.toLowerCase().endsWith(".pdf"));

    for (const pdf of pdfs) {
      const fileParsed = parseFileName(pdf);
      if (!fileParsed) {
        console.log(`  SKIP (can't parse filename): ${pdf}`);
        skipCount++;
        continue;
      }

      const { year } = fileParsed;
      const title = buildTitle(subject, medium, year);
      const dedupKey = `${title.toLowerCase().trim()}|${medium.toLowerCase()}|${year}`;

      if (existingKeys.has(dedupKey) || uploadedThisRun.has(dedupKey)) {
        console.log(`  SKIP (already exists): ${title}`);
        skipCount++;
        continue;
      }

      try {
        process.stdout.write(`  Uploading: ${title} ... `);

        const pdfPath = path.join(folderPath, pdf);
        const publicUrl = await uploadToAzure(pdfPath, pdf);

        await createPaper(token, {
          title,
          medium,
          subject: subjectId,
          grade: olGrade.id,
          year,
          url: publicUrl,
        });

        console.log("✓");
        uploadedThisRun.add(dedupKey);
        successCount++;
      } catch (err) {
        console.log(`✗ ERROR: ${err.message}`);
        errorCount++;
      }
    }
  }

  console.log("\n=== Done ===");
  console.log(`  ✓ Uploaded : ${successCount}`);
  console.log(`  ⚠ Skipped  : ${skipCount}`);
  console.log(`  ✗ Errors   : ${errorCount}`);
}

main().catch((err) => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
