import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const rootDir = process.cwd();
const inputPath = path.join(rootDir, "ploegen_spelers.xlsx");
const outputDir = path.join(rootDir, "imports");
const outputPath = path.join(outputDir, "team_players.cleaned.csv");
const sheetName = "ploegen_spelers";

function escapeCsv(value) {
  const text = String(value ?? "");
  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function normalizeInteger(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? "" : String(parsed);
}

function normalizeDecimal(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";

  const parsed = Number.parseFloat(trimmed.replace(",", "."));
  return Number.isNaN(parsed) ? "" : String(parsed);
}

const workbook = XLSX.readFile(inputPath);
const worksheet = workbook.Sheets[sheetName];

if (!worksheet) {
  throw new Error(`Werkblad niet gevonden: ${sheetName}`);
}

const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

if (rows.length < 2) {
  throw new Error("Excelbestand bevat geen bruikbare rijen.");
}

const header = rows[0].map((cell) => String(cell).trim());
const headerIndex = new Map(header.map((cell, index) => [cell, index]));

const columnConfig = [
  ["nr", "source_team_player_id", normalizeInteger],
  ["ploegnr", "source_team_id", normalizeInteger],
  ["ploegnr_oms", "team_name", (value) => String(value ?? "").trim()],
  ["clublidnr", "source_member_id", normalizeInteger],
  ["clublidnr_oms", "member_name", (value) => String(value ?? "").trim()],
  ["shirt", "shirt_number", normalizeInteger],
  ["functie", "role_primary", (value) => String(value ?? "").trim()],
  ["functie2", "role_secondary", (value) => String(value ?? "").trim()],
  ["functie3", "role_tertiary", (value) => String(value ?? "").trim()],
  ["positie", "position_primary", (value) => String(value ?? "").trim()],
  ["positie2", "position_secondary", (value) => String(value ?? "").trim()],
  ["lidgeldkorting", "membership_discount", normalizeDecimal],
];

const missingHeaders = columnConfig
  .map(([sourceHeader]) => sourceHeader)
  .filter((sourceHeader) => !headerIndex.has(sourceHeader));

if (missingHeaders.length > 0) {
  throw new Error(`Ontbrekende kolommen in ploegen_spelers.xlsx: ${missingHeaders.join(", ")}`);
}

const cleanedHeader = columnConfig.map(([, targetHeader]) => targetHeader);

const dataRows = rows.slice(1).map((row) => {
  const cells = [...row];
  while (cells.length < header.length) cells.push("");

  return columnConfig.map(([sourceHeader, , transform]) => {
    const sourceIndex = headerIndex.get(sourceHeader);
    return transform(cells[sourceIndex]);
  });
});

fs.mkdirSync(outputDir, { recursive: true });
const cleanedCsv = [cleanedHeader, ...dataRows]
  .map((row) => row.map(escapeCsv).join(","))
  .join("\n");

fs.writeFileSync(outputPath, `${cleanedCsv}\n`, "utf8");

console.log(`Prepared cleaned CSV at ${outputPath}`);
console.log(`Rows ready for import: ${dataRows.length}`);
