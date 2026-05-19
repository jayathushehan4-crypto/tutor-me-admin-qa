/**
 * GovDoc.lk O/L Past Paper Scraper
 * Downloads all G.C.E. Ordinary Level past papers and organises them into folders.
 *
 * Usage:
 *   node scripts/scrape-ol-papers.mjs
 *
 * Output folder structure:
 *   {OUTPUT_DIR}/OL {Subject} {medium} medium/
 *     ol-{subject-slug}-{medium}-{year}.pdf
 */

import fs from "fs";
import path from "path";

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = "https://govdoc.lk";
const START_URL =
  "https://govdoc.lk/category/past-papers/gce-ordinary-level-exam";
const OUTPUT_DIR = process.env.PAPERS_DIR ?? "D:/Download/OL-Papers";
const DELAY_MS = 1500;

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
    if (ct.includes("text/html")) return false;

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

function extractPaperLinks(html) {
  const hrefRe = /class=custom-card\s+href=(https:\/\/govdoc\.lk\/[^\s>]+)/gi;
  const titleRe = /<h5[^>]*class=cate-title[^>]*>([\s\S]*?)<\/h5>/gi;
  const urls = [],
    titles = [];
  let m;
  while ((m = hrefRe.exec(html)) !== null) urls.push(m[1]);
  while ((m = titleRe.exec(html)) !== null)
    titles.push(m[1].replace(/<[^>]+>/g, "").trim());

  const results = [];
  for (let i = 0; i < Math.min(urls.length, titles.length); i++) {
    if (urls[i] && titles[i])
      results.push({ url: urls[i], title: decodeHtml(titles[i]) });
  }
  return [...new Map(results.map((r) => [r.url, r])).values()];
}

function buildPageUrl(pageNum) {
  return pageNum === 1 ? START_URL : `${START_URL}?page=${pageNum}`;
}

// "G.C.E. Ordinary Level Exam 2024 Mathematics Past Papers"
function parsePaperTitle(title) {
  const yearMatch = title.match(/(\d{4})/);
  const subjectMatch = title.match(/Exam\s+\d{4}\s+(.+?)\s+Past Papers?/i);
  if (!yearMatch || !subjectMatch) return null;
  return { year: yearMatch[1], subject: subjectMatch[1].trim() };
}

function extractMediaLinks(html) {
  const entries = [];
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

function buildFileName(subject, medium, year) {
  return `ol-${slugify(subject)}-${medium.toLowerCase()}-${year}.pdf`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== GovDoc O/L Paper Scraper ===");
  console.log(`Output : ${OUTPUT_DIR}\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const paperMap = new Map();
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

    if (links.length === 0) break;

    const prevSize = paperMap.size;
    for (const { url, title } of links) paperMap.set(url, title);

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

  let downloaded = 0,
    skipped = 0,
    errors = 0;

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

    const downloadedThisEntry = new Set();

    for (const { medium, id } of mediaLinks) {
      const folderName = `OL ${subject} ${medium.toLowerCase()} medium`;
      const folderPath = path.join(OUTPUT_DIR, folderName);
      fs.mkdirSync(folderPath, { recursive: true });

      const fileName = buildFileName(subject, medium, year);

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
        const directUrl = `${BASE_URL}/downloadFile/${id}`;
        let ok = await downloadBinary(directUrl, filePath);

        if (!ok) {
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
