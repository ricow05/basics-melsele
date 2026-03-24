import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const inputPath = path.join(rootDir, "Basics Melsele-Beveren  sportadministratie.csv");
const outputDir = path.join(rootDir, "imports");
const outputPath = path.join(outputDir, "club_members.cleaned.csv");

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

function normalizeDate(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed === "00/00/0000") return "";

  const parts = trimmed.split("/");
  if (parts.length !== 3) return "";

  const [day, month, year] = parts;
  if (day === "00" || month === "00" || year === "0000") return "";

  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const raw = fs.readFileSync(inputPath, "utf8");
const rows = parseCsv(raw);

if (rows.length < 2) {
  throw new Error("CSV bevat geen bruikbare rijen.");
}

const cleanedHeader = [
  "source_member_id",
  "first_name",
  "last_name",
  "member_number",
  "birth_date",
  "gender",
  "membership_role",
  "postcode",
  "email_primary",
  "email_secondary",
  "relations",
  "joined_at",
];

const dataRows = rows.slice(1).map((row) => {
  const cells = [...row];
  while (cells.length < 13) cells.push("");

  return [
    cells[0]?.trim() || "",
    cells[1]?.trim() || "",
    cells[2]?.trim() || "",
    cells[3]?.trim() || "",
    normalizeDate(cells[4]),
    cells[5]?.trim() || "",
    cells[6]?.trim() || "",
    cells[7]?.trim() || "",
    cells[8]?.trim() || "",
    cells[9]?.trim() || "",
    cells[10]?.trim() || "",
    normalizeDate(cells[11]),
  ];
});

fs.mkdirSync(outputDir, { recursive: true });
const cleanedCsv = [cleanedHeader, ...dataRows]
  .map((row) => row.map(escapeCsv).join(","))
  .join("\n");

fs.writeFileSync(outputPath, `${cleanedCsv}\n`, "utf8");

console.log(`Prepared cleaned CSV at ${outputPath}`);
console.log(`Rows ready for import: ${dataRows.length}`);