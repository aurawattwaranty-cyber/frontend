import { apiRequest } from "@/lib/api/client";
import { notifyApiRevision } from "@/lib/api/revision";
import type {
  DashboardStats,
  Paginated,
  RegistrationDraft,
  WarrantyEvent,
  WarrantyEventType,
  WarrantyRegistration,
  WarrantyStatus,
  WarrantyQuery,
} from "@/lib/types";

function makeEvent(
  type: WarrantyEventType,
  label: string,
  actor: string,
  note?: string,
): WarrantyEvent {
  const at = new Date().toISOString();
  return {
    id: `${type}-${at}`,
    type,
    label,
    actor,
    at,
    ...(note ? { note } : {}),
  };
}

function buildQuery(query: WarrantyQuery = {}): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.modelId && query.modelId !== "all") params.set("modelId", query.modelId);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortDir) params.set("sortDir", query.sortDir);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  const out = params.toString();
  return out ? `?${out}` : "";
}

/* ------------------------------------------------------------------ */
/* Public flows                                                        */
/* ------------------------------------------------------------------ */

export async function createWarrantyRegistration(
  draft: RegistrationDraft,
): Promise<WarrantyRegistration> {
  const response = await apiRequest<{ item: WarrantyRegistration }>("/warranties", {
    method: "POST",
    body: JSON.stringify(draft),
  });
  notifyApiRevision();
  return response.item;
}

/** Public lookup used by `/status` and the QR verification page. */
export async function getWarrantyStatus(
  warrantyId: string,
): Promise<WarrantyRegistration> {
  const response = await apiRequest<{ item: WarrantyRegistration }>(
    `/warranties/${encodeURIComponent(warrantyId)}/status`,
  );
  return response.item;
}

/** Customer response to a correction request. */
export async function resubmitWarranty(
  warrantyId: string,
  note?: string,
): Promise<WarrantyRegistration> {
  const response = await apiRequest<{ item: WarrantyRegistration }>(
    `/warranties/${encodeURIComponent(warrantyId)}/resubmit`,
    {
      method: "POST",
      body: JSON.stringify({ note }),
    },
  );
  notifyApiRevision();
  return response.item;
}

/* ------------------------------------------------------------------ */
/* Admin flows                                                         */
/* ------------------------------------------------------------------ */

export type WarrantySortField = "id" | "customer" | "submittedAt";

export async function getWarrantyRegistrations(
  query: WarrantyQuery = {},
): Promise<Paginated<WarrantyRegistration>> {
  return apiRequest<Paginated<WarrantyRegistration>>(
    `/warranties${buildQuery(query)}`,
  );
}

export async function getWarrantyById(
  id: string,
): Promise<WarrantyRegistration> {
  const response = await apiRequest<{ item: WarrantyRegistration }>(
    `/warranties/${encodeURIComponent(id)}`,
  );
  return response.item;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiRequest<DashboardStats>("/warranties/dashboard/stats");
}

export async function getRecentRegistrations(
  limit = 5,
): Promise<WarrantyRegistration[]> {
  const response = await apiRequest<{ items: WarrantyRegistration[] }>(
    `/warranties/recent?limit=${encodeURIComponent(String(limit))}`,
  );
  return response.items;
}

export interface ApproveWarrantyInput {
  /** Model confirmed by the admin during verification. */
  modelId: string;
  /** Coverage start — defaults to the installation date. */
  startDate?: string;
  /** Overrides the model's standard term when set. */
  durationMonths?: number;
  note?: string;
}

/**
 * Approves a registration and activates the warranty in one transition, which
 * mirrors stages 04–05 of the core workflow.
 */
export async function approveWarranty(
  id: string,
  input: ApproveWarrantyInput,
): Promise<WarrantyRegistration> {
  const response = await apiRequest<{ item: WarrantyRegistration }>(
    `/warranties/${encodeURIComponent(id)}/approve`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  notifyApiRevision();
  return response.item;
}

export interface CorrectionInput {
  message: string;
  items?: string[];
}

export async function requestCorrection(
  id: string,
  input: CorrectionInput,
): Promise<WarrantyRegistration> {
  const response = await apiRequest<{ item: WarrantyRegistration }>(
    `/warranties/${encodeURIComponent(id)}/correction`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  notifyApiRevision();
  return response.item;
}

export async function rejectWarranty(
  id: string,
  reason: string,
): Promise<WarrantyRegistration> {
  const response = await apiRequest<{ item: WarrantyRegistration }>(
    `/warranties/${encodeURIComponent(id)}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
  );
  notifyApiRevision();
  return response.item;
}

export { makeEvent };
