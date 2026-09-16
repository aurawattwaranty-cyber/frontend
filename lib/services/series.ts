import { apiRequest } from "@/lib/api/client";
import { notifyApiRevision } from "@/lib/api/revision";
import type {
  ProductModel,
  ProductSeries,
  ProductType,
  SerialImportFile,
  SeriesWithModels,
} from "@/lib/types";

export interface SeriesOverview {
  series: SeriesWithModels[];
  files: SerialImportFile[];
  /** Catalogue models with no uploaded series of the same name. */
  unmatchedModels: ProductModel[];
}

export async function getSeries(): Promise<SeriesOverview> {
  return apiRequest("/series");
}

export async function createSeries(
  name: string,
  productType: ProductType,
): Promise<ProductSeries> {
  const response = await apiRequest<{ item: ProductSeries }>("/series", {
    method: "POST",
    body: JSON.stringify({ name, productType }),
  });
  notifyApiRevision();
  return response.item;
}

export async function deleteSeries(
  id: string,
  confirmationName: string,
): Promise<boolean> {
  await apiRequest<void>(`/series/${encodeURIComponent(id)}`, {
    method: "DELETE",
    body: JSON.stringify({ confirmationName }),
  });
  notifyApiRevision();
  return true;
}

/* ------------------------------------------------------------------ *
 * Models within a series
 *
 * Series → Model → Warranty period. Each model carries its own term, so two
 * models in the same series can differ.
 * ------------------------------------------------------------------ */

export interface SeriesModelInput {
  name: string;
  capacityKw: number;
  warrantyMonths: number;
}

export async function createSeriesModel(
  seriesId: string,
  input: SeriesModelInput,
): Promise<ProductModel> {
  const response = await apiRequest<{ item: ProductModel }>(
    `/series/${encodeURIComponent(seriesId)}/models`,
    { method: "POST", body: JSON.stringify(input) },
  );
  notifyApiRevision();
  return response.item;
}

export async function updateSeriesModel(
  seriesId: string,
  modelId: string,
  input: Partial<SeriesModelInput>,
): Promise<ProductModel> {
  const response = await apiRequest<{ item: ProductModel }>(
    `/series/${encodeURIComponent(seriesId)}/models/${encodeURIComponent(modelId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  notifyApiRevision();
  return response.item;
}

export async function deleteSeriesModel(
  seriesId: string,
  modelId: string,
): Promise<boolean> {
  await apiRequest<void>(
    `/series/${encodeURIComponent(seriesId)}/models/${encodeURIComponent(modelId)}`,
    { method: "DELETE" },
  );
  notifyApiRevision();
  return true;
}

/**
 * Creates the missing series for catalogue models that name one, and binds
 * them, so nothing sits outside Series → Model → Warranty period.
 */
export async function adoptOrphanModels(): Promise<{
  createdSeries: ProductSeries[];
  attachedModels: number;
  skipped: { series: string; reason: string }[];
}> {
  const response = await apiRequest<{
    createdSeries: ProductSeries[];
    attachedModels: number;
    skipped: { series: string; reason: string }[];
  }>("/series/adopt-orphans", { method: "POST" });
  notifyApiRevision();
  return response;
}
