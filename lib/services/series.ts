import { apiRequest } from "@/lib/api/client";
import { notifyApiRevision } from "@/lib/api/revision";
import type { ProductSeries, ProductType, SerialImportFile } from "@/lib/types";

export async function getSeries(): Promise<{
  series: ProductSeries[];
  files: SerialImportFile[];
}> {
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
