/**
 * GovDoc.lk A/L Past Paper Scraper
 * Downloads all G.C.E. Advanced Level past papers and organises them into folders.
 *
 * Usage:
 *   node scripts/scrape-al-papers.mjs
 *
 * Output folder structure (consistent with upload-papers.mjs convention):
 *   {OUTPUT_DIR}/AL {Subject} {medium} medium/
 *     al-{subject-slug}-{medium}-{year}.pdf
 */

import fs from "fs";
import path from "path";

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = "https://govdoc.lk";
const START_URL =
  "https://govdoc.lk/category/past-papers/gce-advance-level-exam";
const OUTPUT_DIR = process.env.PAPERS_DIR ?? "D:/Download/AL-Papers";
const DELAY_MS = 1500; // polite delay between requests

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124",
  Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  Referer: BASE_URL,
};

async function fetchHtml(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    if (attempt < 4) {
      const wait = attempt * 3000;
      console.log(`    Retrying in ${wait / 1000}s... (${err.message})`);
      await sleep(wait);
      return fetchHtml(url, attempt + 1);
    }
    throw err;
  }
}

async function downloadBinary(url, destPath, attempt = 1) {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("text/html")) return false; // got a page, not a file

    const buf = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buf));
    return true;
  } catch (err) {
    if (attempt < 4) {
      await sleep(attempt * 3000);
      return downloadBinary(url, destPath, attempt + 1);
    }
    throw err;
  }
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

// Extract paper card links from a listing page
// Actual HTML uses unquoted hrefs: <a class=custom-card href=https://govdoc.lk/slug>
// Titles are in: <h5 class=cate-title>Title</h5>
function extractPaperLinks(html) {
  // Extract hrefs from custom-card anchors (unquoted href attribute)
  const hrefRe = /class=custom-card\s+href=(https:\/\/govdoc\.lk\/[^\s>]+)/gi;
  const urls = [];
  let m;
  while ((m = hrefRe.exec(html)) !== null) urls.push(m[1]);

  // Extract titles from cate-title h5 elements
  const titleRe = /<h5[^>]*class=cate-title[^>]*>([\s\S]*?)<\/h5>/gi;
  const titles = [];
  while ((m = titleRe.exec(html)) !== null) {
    titles.push(m[1].replace(/<[^>]+>/g, "").trim());
  }

  // Zip them together by position
  const results = [];
  for (let i = 0; i < Math.min(urls.length, titles.length); i++) {
    if (urls[i] && titles[i])
      results.push({ url: urls[i], title: decodeHtml(titles[i]) });
  }
  return [...new Map(results.map((r) => [r.url, r])).values()];
}

// Pagination uses ?page=N query param
function buildPageUrl(pageNum) {
  return pageNum === 1 ? START_URL : `${START_URL}?page=${pageNum}`;
}

// Parse title → {subject, year}
// "G.C.E. Advance Level Exam 2025 History Past Papers"
function parsePaperTitle(title) {
  const yearMatch = title.match(/(\d{4})/);
  const subjectMatch = title.match(/Exam\s+\d{4}\s+(.+?)\s+Past Papers?/i);
  if (!yearMatch || !subjectMatch) return null;
  return { year: yearMatch[1], subject: subjectMatch[1].trim() };
}

// Extract per-medium download entries from a detail page
// Returns [{medium, id, label}, ...]
function extractMediaLinks(html) {
  const entries = [];
  // <a href="/view?id=X&amp;fid=Y">Sinhala</a>  or  href="https://govdoc.lk/view?..."
  const re =
    /<a[^>]*href="(?:https:\/\/govdoc\.lk)?\/view\?id=(\d+)&(?:amp;)?fid=([^"&\s]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const rawLabel = m[3].replace(/<[^>]+>/g, "").trim();
    if (!rawLabel) continue;

    let medium = null;
    if (/sinhala/i.test(rawLabel)) medium = "Sinhala";
    else if (/english/i.test(rawLabel)) medium = "English";
    else if (/tamil/i.test(rawLabel)) medium = "Tamil";

    if (!medium) continue;

    entries.push({ medium, id: m[1], fid: m[2], label: rawLabel });
  }
  return entries;
}

// If /downloadFile/{id} returns HTML, parse the real file URL from the download page
function extractFileUrl(html) {
  const m =
    html.match(/href="([^"]+\/downloadFile\/[^"]+)"/i) ??
    html.match(/href="([^"]+\/download\/[^"]+)"/i);
  return m ? m[1] : null;
}

function decodeHtml(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Build PDF filename — consistent with upload-papers.mjs parseFileName expectations
// e.g. al-history-sinhala-2025.pdf
function buildFileName(subject, medium, year) {
  return `al-${slugify(subject)}-${medium.toLowerCase()}-${year}.pdf`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== GovDoc A/L Paper Scraper ===");
  console.log(`Output : ${OUTPUT_DIR}\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // ── Step 1: walk all listing pages and collect detail page URLs ────────────
  const paperMap = new Map(); // detailUrl → title
  let pageNum = 1;

  while (true) {
    const listUrl = buildPageUrl(pageNum);
    console.log(`Fetching listing page ${pageNum}: ${listUrl}`);

    let html;
    try {
      html = await fetchHtml(listUrl);
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
      break;
    }

    const links = extractPaperLinks(html);
    console.log(`  Found ${links.length} papers`);

    // Stop when page returns no cards (past the last page)
    if (links.length === 0) break;

    const prevSize = paperMap.size;
    for (const { url, title } of links) paperMap.set(url, title);

    // Stop if this page added no new unique papers (duplicate page)
    if (paperMap.size === prevSize) {
      console.log(`  No new papers — reached last page`);
      break;
    }

    pageNum++;
    await sleep(DELAY_MS);
  }

  console.log(`\nTotal papers to process: ${paperMap.size}\n`);

  if (paperMap.size === 0) {
    console.log("No papers found — check the START_URL or site structure.");
    return;
  }

  let downloaded = 0;
  let skipped = 0;
  let errors = 0;

  // ── Step 2: process each detail page ──────────────────────────────────────
  for (const [detailUrl, rawTitle] of paperMap) {
    const parsed = parsePaperTitle(rawTitle);
    if (!parsed) {
      console.log(`SKIP (unparseable title): ${rawTitle}`);
      skipped++;
      continue;
    }

    const { subject, year } = parsed;
    console.log(`\n[${year}] ${subject}`);

    let html;
    try {
      html = await fetchHtml(detailUrl);
      await sleep(DELAY_MS);
    } catch (err) {
      console.log(`  ERROR fetching detail page: ${err.message}`);
      errors++;
      continue;
    }

    const mediaLinks = extractMediaLinks(html);
    if (mediaLinks.length === 0) {
      console.log(`  SKIP: no Sinhala/English/Tamil links found`);
      skipped++;
      continue;
    }

    console.log(
      `  Mediums: ${[...new Set(mediaLinks.map((l) => l.medium))].join(", ")}`,
    );

    // ── Step 3: download each PDF ────────────────────────────────────────────
    const downloadedThisEntry = new Set();

    for (const { medium, id } of mediaLinks) {
      // Folder name consistent with Grade X Subject medium medium convention
      const folderName = `AL ${subject} ${medium.toLowerCase()} medium`;
      const folderPath = path.join(OUTPUT_DIR, folderName);
      fs.mkdirSync(folderPath, { recursive: true });

      const fileName = buildFileName(subject, medium, year);

      // Skip duplicates within the same paper entry (e.g. two links for same medium)
      if (downloadedThisEntry.has(fileName)) {
        skipped++;
        continue;
      }

      const filePath = path.join(folderPath, fileName);

      if (fs.existsSync(filePath)) {
        console.log(`  SKIP (exists): ${fileName}`);
        skipped++;
        continue;
      }

      process.stdout.write(`  Downloading [${medium}] ${fileName} ... `);

      try {
        // Try direct download first: /downloadFile/{id}
        const directUrl = `${BASE_URL}/downloadFile/${id}`;
        let ok = await downloadBinary(directUrl, filePath);

        if (!ok) {
          // Fallback: load the download landing page and parse the real URL
          const dlPage = await fetchHtml(`${BASE_URL}/download/${id}`);
          await sleep(DELAY_MS);
          const fileUrl = extractFileUrl(dlPage);
          if (!fileUrl)
            throw new Error("cannot find file URL on download page");
          const fullUrl = fileUrl.startsWith("http")
            ? fileUrl
            : `${BASE_URL}${fileUrl}`;
          ok = await downloadBinary(fullUrl, filePath);
          if (!ok) throw new Error("download page also returned HTML");
        }

        console.log("✓");
        downloadedThisEntry.add(fileName);
        downloaded++;
      } catch (err) {
        console.log(`✗ ${err.message}`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        errors++;
      }

      await sleep(DELAY_MS);
    }
  }

  console.log("\n=== Done ===");
  console.log(`  ✓ Downloaded : ${downloaded}`);
  console.log(`  ⚠ Skipped   : ${skipped}`);
  console.log(`  ✗ Errors    : ${errors}`);
  console.log(`\nFolders saved to: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
