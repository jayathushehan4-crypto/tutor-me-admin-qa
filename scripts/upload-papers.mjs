/**
 * Bulk test paper uploader
 * Usage: node scripts/upload-papers.mjs
 *
 * Reads grade folders from PAPERS_DIR, uploads each PDF to Azure Blob Storage,
 * then creates a paper record via the backend API.
 */

import fs from "fs";
import path from "path";
import readline from "readline";

// ─── Config ──────────────────────────────────────────────────────────────────

const API_BASE =
  "https://tutorme-backend-api-d7a6cjdkgnedbxf0.southeastasia-01.azurewebsites.net";
const PAPERS_DIR = process.env.PAPERS_DIR ?? "D:/Download/2026.04.07";

const AZURE_ACCOUNT = "tutormeuploads";
const AZURE_CONTAINER = "uploads";
const AZURE_KEY = process.env.AZURE_STORAGE_KEY ?? "";

// Build grade number → DB grade ID map from API grades by title matching
function buildGradeMap(grades) {
  const map = {};
  for (const grade of grades) {
    const title = grade.title.toLowerCase();
    if (/primary/i.test(title)) {
      for (const n of [1, 2, 3, 4]) map[n] ??= grade.id;
    } else if (/grade 5|scholarship/i.test(title)) {
      map[5] ??= grade.id;
    } else if (/secondary/i.test(title)) {
      for (const n of [6, 7, 8, 9]) map[n] ??= grade.id;
    } else if (/ordinary level/i.test(title)) {
      map[10] ??= grade.id;
      map[11] ??= grade.id;
    }
  }
  return map;
}

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
      console.log(`  Rate limited — waiting ${wait / 1000}s before retry...`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(`Login failed: ${data.message}`);
    return data.tokens.access.token;
  }
  throw new Error("Login failed after retries — rate limited");
}

async function fetchGrades(token) {
  const res = await fetch(`${API_BASE}/v1/grades?page=1&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.results ?? [];
}

// Explicit aliases for folder names that don't fuzzy-match DB subject titles
const SUBJECT_ALIAS = {
  "environment related activities term test papers": "Environmental Studies",
  "environment related activities 2025": "Environmental Studies",
  "environment related activitie": "Environmental Studies",
  "environment related activities": "Environmental Studies",
  "environment related": "Environmental Studies",
};

// Folder names sometimes use "&" or extra spaces; normalise before matching
function normalizeSubject(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ") // collapse multiple spaces
    .replace(/\s*&\s*/g, " and ") // "Health & Physical" → "health and physical"
    .trim();
}

function findSubjectId(grades, gradeId, subjectName) {
  const grade = grades.find((g) => g.id === gradeId);
  if (!grade?.subjects) return null;

  // Check explicit alias first
  const aliasedName =
    SUBJECT_ALIAS[subjectName.toLowerCase().trim()] ?? subjectName;
  const normalized = normalizeSubject(aliasedName);

  const match = grade.subjects.find((s) => {
    const db = normalizeSubject(s.title);
    return (
      db === normalized || db.includes(normalized) || normalized.includes(db)
    );
  });
  return match?.id ?? null;
}

// Generate SAS URL using HMAC-SHA256 (Azure Shared Key auth)
async function generateSasUrl(blobName, fileType) {
  const { createHmac } = await import("crypto");

  const now = new Date();
  const expires = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

  const toIso = (d) => d.toISOString().replace(/\.\d+Z$/, "Z");
  const start = toIso(now);
  const end = toIso(expires);

  const permissions = "cw";
  const signedFields = [
    permissions, // signedPermissions
    start, // signedStart
    end, // signedExpiry
    `/blob/${AZURE_ACCOUNT}/${AZURE_CONTAINER}/${blobName}`, // canonicalizedResource
    "", // signedIdentifier
    "", // signedIP
    "https", // signedProtocol
    "2024-11-04", // signedVersion
    "b", // signedResource (blob)
    "", // signedSnapshotTime
    "", // signedEncryptionScope
    "", // rscc
    "", // rscd
    "", // rsce
    "", // rscl
    fileType, // rsct (Content-Type)
  ];

  const stringToSign = signedFields.join("\n");
  const sig = createHmac("sha256", Buffer.from(AZURE_KEY, "base64"))
    .update(stringToSign, "utf8")
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
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": fileType,
    },
    body: fileBuffer,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Azure upload failed (${res.status}): ${text}`);
  }

  return sasUrl.split("?")[0]; // public URL without SAS token
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

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseFolderName(folderName) {
  // "Grade 6 Mathematics sinhala medium"
  const match = folderName.match(
    /^Grade\s+(\d+)\s+(.+?)\s+(sinhala|english|tamil)\s+medium$/i,
  );
  if (!match) return null;
  return {
    gradeNumber: parseInt(match[1]),
    subject: match[2].trim(),
    medium: match[3].charAt(0).toUpperCase() + match[3].slice(1).toLowerCase(),
  };
}

function parseFileName(fileName) {
  // handles both:
  // sri-lanka-grade-1-english-2019-3rd-term-test-paper-xxx.pdf
  // north-western-province-grade-6-art-2019-3-term-test-paper-xxx.pdf
  const yearMatch = fileName.match(/(\d{4})/);

  const ordinalMatch = fileName.match(/(1st|2nd|3rd)/i);
  const numericMatch = fileName.match(/-(\d)-term/i);

  const ORDINAL = { 1: "1st", 2: "2nd", 3: "3rd" };

  let term = null;
  if (ordinalMatch) {
    term = ordinalMatch[1].toLowerCase();
  } else if (numericMatch) {
    term = ORDINAL[numericMatch[1]] ?? null;
  }

  if (!yearMatch || !term) return null;
  return { year: yearMatch[1], term };
}

function buildTitle(gradeNumber, subject, medium, term, year) {
  return `Grade ${gradeNumber} ${subject} ${medium} Medium ${term} Term Test Paper ${year}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== TutorMe Paper Bulk Uploader ===\n");

  const email = process.argv[2] ?? (await prompt("Admin email: "));
  const password = process.argv[3] ?? (await prompt("Admin password: "));

  console.log("\nLogging in...");
  const token = await login(email, password);
  console.log("✓ Logged in\n");

  console.log("Fetching grades from API...");
  const grades = await fetchGrades(token);
  const gradeMap = buildGradeMap(grades);
  console.log(
    `✓ Fetched ${grades.length} grades, mapped to grade numbers: ${Object.keys(gradeMap).join(", ") || "none"}\n`,
  );

  const folders = fs.readdirSync(PAPERS_DIR).filter((name) => {
    const full = path.join(PAPERS_DIR, name);
    return fs.statSync(full).isDirectory() && /^Grade\s+\d+/i.test(name);
  });

  console.log(`Found ${folders.length} grade folders\n`);

  console.log("Fetching existing paper titles to skip duplicates...");
  const existingKeys = await fetchExistingKeys(token);
  console.log(`✓ ${existingKeys.size} papers already in DB\n`);

  // Also track what we've uploaded THIS run to skip duplicate files within the same folder
  const uploadedThisRun = new Set();

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const folder of folders) {
    const parsed = parseFolderName(folder);
    if (!parsed) {
      console.log(`  SKIP (can't parse folder): ${folder}`);
      skipCount++;
      continue;
    }

    const { gradeNumber, subject, medium } = parsed;
    const gradeId = gradeMap[gradeNumber];

    if (!gradeId) {
      console.log(
        `  SKIP (no grade mapping for Grade ${gradeNumber}): ${folder}`,
      );
      skipCount++;
      continue;
    }

    const subjectId = findSubjectId(grades, gradeId, subject);
    if (!subjectId) {
      const grade = grades.find((g) => g.id === gradeId);
      const available =
        (grade?.subjects ?? []).map((s) => s.title).join(", ") || "none";
      console.log(
        `  SKIP (subject "${subject}" not found for Grade ${gradeNumber}). Available: ${available}`,
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

      const { year, term } = fileParsed;
      const title = buildTitle(gradeNumber, subject, medium, term, year);
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
          grade: gradeId,
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
