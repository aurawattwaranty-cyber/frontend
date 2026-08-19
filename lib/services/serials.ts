import { apiRequest } from "@/lib/api/client";
import { notifyApiRevision } from "@/lib/api/revision";
import type {
  BulkImportPreview,
  BulkImportResult,
  BulkImportRow,
  Paginated,
  ProductType,
  SerialNumber,
  SerialStatus,
  SerialValidationResult,
} from "@/lib/types";
import { ServiceError } from "./errors";

const SERIAL_PATTERN = /^[A-Z0-9][A-Z0-9-]{5,31}$/;

export function normaliseSerial(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

/** Format check only — availability is decided by `validateSerial`. */
export function isSerialFormatValid(value: string): boolean {
  return SERIAL_PATTERN.test(normaliseSerial(value));
}

/**
 * Step 1 of the registration flow: confirm the serial exists in Aurawatt's
 * inventory and has not already been used for a warranty.
 */
export async function validateSerial(
  input: string,
): Promise<SerialValidationResult> {
  return apiRequest<SerialValidationResult>("/serials/validate", {
    method: "POST",
    body: JSON.stringify({ serial: input }),
  });
}

export interface SerialQuery {
  search?: string;
  status?: SerialStatus | "all";
  page?: number;
  pageSize?: number;
}

function buildQuery(query: SerialQuery = {}): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  const out = params.toString();
  return out ? `?${out}` : "";
}

export async function getSerials(
  query: SerialQuery = {},
): Promise<Paginated<SerialNumber>> {
  return apiRequest<Paginated<SerialNumber>>(`/serials${buildQuery(query)}`);
}

export async function getSerialCounts(): Promise<{
  available: number;
  registered: number;
}> {
  return apiRequest<{ available: number; registered: number }>("/serials/counts");
}

export interface CreateSerialInput {
  serial: string;
  modelId: string;
}

export async function createSerial(
  input: CreateSerialInput,
): Promise<SerialNumber> {
  const response = await apiRequest<{ item: SerialNumber }>("/serials", {
    method: "POST",
    body: JSON.stringify(input),
  });
  notifyApiRevision();
  return response.item;
}

export const BULK_IMPORT_COLUMNS = [
  "serial_number",
  "model_name",
  "capacity_kw",
  "product_type",
] as const;

export const BULK_IMPORT_TEMPLATE = [
  BULK_IMPORT_COLUMNS.join(","),
  "AW-HI-5KW-24101,AuraWatt HybridPro 5kW,5,inverter",
  "AW-HI-10KW-24101,AuraWatt HybridMax 10kW,10,inverter",
  "AW-BT-51-24101,AuraWatt PowerCell 5.1kWh,5.1,battery",
].join("\n");

/** Reads a binary file as base64 without pulling the whole string onto the stack. */
async function toBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/**
 * Validates an upload before anything is written.
 *
 * Spreadsheets are sent as base64 and opened by the API; CSV/TSV exports are
 * sent as text. Both come back as the same preview shape.
 */
export async function parseBulkImportFile(
  file: File,
): Promise<BulkImportPreview> {
  const name = file.name.toLowerCase();
  const isWorkbook = /\.(xlsx|xls)$/.test(name);

  if (!isWorkbook && !/\.(csv|tsv|txt)$/.test(name)) {
    throw new ServiceError(
      "Unsupported file type. Upload a .csv, .tsv, .txt, .xlsx or .xls file.",
      "unsupported_file",
    );
  }

  if (file.size > 2_000_000) {
    throw new ServiceError(
      "That file is larger than 2 MB. Split the sheet and import it in batches.",
      "file_too_large",
    );
  }

  const content = isWorkbook ? await toBase64(file) : await file.text();

  return apiRequest<BulkImportPreview>("/serials/bulk/preview", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      content,
      encoding: isWorkbook ? "base64" : "text",
    }),
  });
}

/** Commits the valid rows of a validated preview. */
export async function bulkImportSerials(
  preview: BulkImportPreview,
): Promise<BulkImportResult> {
  const result = await apiRequest<BulkImportResult>("/serials/bulk/import", {
    method: "POST",
    body: JSON.stringify(preview),
  });
  notifyApiRevision();
  return result;
}

export type { ProductType };
