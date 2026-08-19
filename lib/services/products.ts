import { apiRequest } from "@/lib/api/client";
import { notifyApiRevision } from "@/lib/api/revision";
import type { ProductModel, ProductType } from "@/lib/types";

export interface ProductModelInput {
  series: string;
  name: string;
  capacityKw: number;
  productType: ProductType;
  warrantyMonths: number;
  active: boolean;
}

function buildQuery(options?: {
  activeOnly?: boolean;
  productType?: ProductType;
}): string {
  const params = new URLSearchParams();
  if (options?.activeOnly) params.set("activeOnly", "true");
  if (options?.productType) params.set("productType", options.productType);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getProductModels(options?: {
  activeOnly?: boolean;
  productType?: ProductType;
}): Promise<ProductModel[]> {
  const response = await apiRequest<{ items: ProductModel[] }>(
    `/models${buildQuery(options)}`,
  );
  return response.items;
}

export async function getProductSeries(): Promise<string[]> {
  const response = await apiRequest<{ items: string[] }>("/models/series");
  return response.items;
}

export async function createProductModel(
  input: ProductModelInput,
): Promise<ProductModel> {
  const response = await apiRequest<{ item: ProductModel }>("/models", {
    method: "POST",
    body: JSON.stringify(input),
  });
  notifyApiRevision();
  return response.item;
}

export async function updateProductModel(
  id: string,
  input: Partial<ProductModelInput>,
): Promise<ProductModel> {
  const response = await apiRequest<{ item: ProductModel }>(
    `/models/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  notifyApiRevision();
  return response.item;
}
