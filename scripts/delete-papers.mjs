/**
 * Delete papers we uploaded from D:/Download/2026.04.07
 * Matches by generated titles (both old format with year and new format without year).
 * Safe: only deletes exact title matches — pre-existing papers are untouched.
 *
 * Usage: node scripts/delete-papers.mjs <email> <password>
 */

import fs from "fs";
import path from "path";
import readline from "readline";

const API_BASE =
  "https://tutorme-backend-api-d7a6cjdkgnedbxf0.southeastasia-01.azurewebsites.net";
const PAPERS_DIR = process.env.PAPERS_DIR ?? "D:/Download/2026.04.07";

const SUPPORTED_GRADES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

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

async function fetchAllPapers(token) {
  const res = await fetch(`${API_BASE}/v1/papers?page=1&limit=10000`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.results ?? [];
}

async function deletePaper(token, id) {
  const res = await fetch(`${API_BASE}/v1/papers/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Delete failed (${res.status}): ${text}`);
  }
}

// ─── Parsers (identical to upload script) ────────────────────────────────────

function parseFolderName(folderName) {
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

// ─── Build the set of all titles we could have generated ─────────────────────

function buildTargetTitles() {
  const titles = new Set();

  const folders = fs.readdirSync(PAPERS_DIR).filter((name) => {
    const full = path.join(PAPERS_DIR, name);
    return fs.statSync(full).isDirectory() && /^Grade\s+\d+/i.test(name);
  });

  for (const folder of folders) {
    const parsed = parseFolderName(folder);
    if (!parsed) continue;

    const { gradeNumber, subject, medium } = parsed;
    if (!SUPPORTED_GRADES.has(gradeNumber)) continue;

    const folderPath = path.join(PAPERS_DIR, folder);
    const pdfs = fs
      .readdirSync(folderPath)
      .filter((f) => f.toLowerCase().endsWith(".pdf"));

    for (const pdf of pdfs) {
      const fileParsed = parseFileName(pdf);
      if (!fileParsed) continue;

      const { year, term } = fileParsed;

      // new format (no year in title) — what we're switching to
      titles.add(
        `Grade ${gradeNumber} ${subject} ${medium} Medium ${term} Term Test Paper`
          .toLowerCase()
          .trim(),
      );

      // old format (year in title) — what was previously uploaded
      titles.add(
        `Grade ${gradeNumber} ${subject} ${medium} Medium ${term} Term Test Paper ${year}`
          .toLowerCase()
          .trim(),
      );
    }
  }

  return titles;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== TutorMe Paper Deleter ===\n");
  console.log(
    "This will ONLY delete papers whose titles match what we generated from:",
  );
  console.log(`  ${PAPERS_DIR}\n`);

  const email = process.argv[2] ?? (await prompt("Admin email: "));
  const password = process.argv[3] ?? (await prompt("Admin password: "));

  console.log("\nLogging in...");
  const token = await login(email, password);
  console.log("✓ Logged in\n");

  console.log("Building target title set from folder structure...");
  const targetTitles = buildTargetTitles();
  console.log(`✓ ${targetTitles.size} distinct titles generated\n`);

  console.log("Fetching all papers from DB...");
  const papers = await fetchAllPapers(token);
  console.log(`✓ ${papers.length} papers in DB\n`);

  const toDelete = papers.filter((p) =>
    targetTitles.has(p.title.toLowerCase().trim()),
  );
  console.log(
    `Found ${toDelete.length} papers to delete (${papers.length - toDelete.length} will be kept)\n`,
  );

  if (toDelete.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  let deleted = 0;
  let errors = 0;

  for (const paper of toDelete) {
    try {
      process.stdout.write(`  Deleting: ${paper.title} ... `);
      await deletePaper(token, paper.id);
      console.log("✓");
      deleted++;
    } catch (err) {
      console.log(`✗ ${err.message}`);
      errors++;
    }
  }

  console.log("\n=== Done ===");
  console.log(`  ✓ Deleted : ${deleted}`);
  console.log(`  ✗ Errors  : ${errors}`);
}

main().catch((err) => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
