import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const inputPath = path.join(rootDir, "ploegen.csv");
const outputDir = path.join(rootDir, "imports");
const outputPath = path.join(outputDir, "teams.cleaned.csv");
const supabaseStoragePublicBaseUrl = "https://dpyorduplcscyziaeaoq.supabase.co/storage/v1/object/public/";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(value);
      value = "";
      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    if (row.some((cell) => cell !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function normalizeBoolean(value) {
  const trimmed = String(value || "").trim();
  if (trimmed === "1") return "true";
  if (trimmed === "0") return "false";
  return "";
}

function normalizeInteger(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed === "0") return trimmed === "0" ? "0" : "";

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? "" : String(parsed);
}

function normalizeDecimal(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  const parsed = Number.parseFloat(trimmed);
  return Number.isNaN(parsed) ? "" : String(parsed);
}

function normalizePhotoPath(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  return trimmed.replace(/^BASICSMELSELE\/?/i, supabaseStoragePublicBaseUrl);
}

function normalizeDate(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed === "0000 00 00") return "";

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 3) return "";

  const [year, month, day] = parts;
  if (year === "0000" || month === "00" || day === "00") return "";

  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const raw = fs.readFileSync(inputPath, "utf8");
const rows = parseCsv(raw);

if (rows.length < 2) {
  throw new Error("CSV bevat geen bruikbare rijen.");
}

const header = rows[0].map((cell) => cell.trim());
const headerIndex = new Map(header.map((cell, index) => [cell, index]));

const columnConfig = [
  ["Nr", "source_team_id", (value) => value.trim()],
  ["Seizoen", "season", (value) => value.trim()],
  ["Categorie", "category", (value) => value.trim()],
  ["Ploeg", "team_name", (value) => value.trim()],
  ["Rang", "rank", normalizeInteger],
  ["Foto", "photo_path", normalizePhotoPath],
  ["Geslacht", "gender", (value) => value.trim()],
  ["Lidgeld", "membership_fee", normalizeDecimal],
  ["Leeftijdcat", "age_category", (value) => value.trim()],
];

const missingHeaders = columnConfig
  .map(([sourceHeader]) => sourceHeader)
  .filter((sourceHeader) => !headerIndex.has(sourceHeader));

if (missingHeaders.length > 0) {
  throw new Error(`Ontbrekende kolommen in ploegen.csv: ${missingHeaders.join(", ")}`);
}

const cleanedHeader = columnConfig.map(([, targetHeader]) => targetHeader);

const dataRows = rows.slice(1).map((row) => {
  const cells = [...row];
  while (cells.length < header.length) cells.push("");

  return columnConfig.map(([sourceHeader, , transform]) => {
    const sourceIndex = headerIndex.get(sourceHeader);
    return transform(cells[sourceIndex] || "");
  });
});

fs.mkdirSync(outputDir, { recursive: true });
const cleanedCsv = [cleanedHeader, ...dataRows]
  .map((row) => row.map(escapeCsv).join(","))
  .join("\n");

fs.writeFileSync(outputPath, `${cleanedCsv}\n`, "utf8");

console.log(`Prepared cleaned CSV at ${outputPath}`);
console.log(`Rows ready for import: ${dataRows.length}`);