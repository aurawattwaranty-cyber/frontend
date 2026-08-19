import { apiRequest } from "@/lib/api/client";
import { notifyApiRevision } from "@/lib/api/revision";
import type { PhotoRequirement } from "@/lib/types";

export interface PhotoRequirementInput {
  label: string;
  instructions: string;
  required: boolean;
}

function sortByOrder(requirements: PhotoRequirement[]): PhotoRequirement[] {
  return [...requirements].sort((a, b) => a.order - b.order);
}

export async function getPhotoRequirements(): Promise<PhotoRequirement[]> {
  const response = await apiRequest<{ items: PhotoRequirement[] }>(
    "/photo-requirements",
  );
  return sortByOrder(response.items);
}

export async function createPhotoRequirement(
  input: PhotoRequirementInput,
): Promise<PhotoRequirement> {
  const response = await apiRequest<{ item: PhotoRequirement }>(
    "/photo-requirements",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  notifyApiRevision();
  return response.item;
}

export async function updatePhotoRequirement(
  id: string,
  input: Partial<PhotoRequirementInput>,
): Promise<PhotoRequirement> {
  const response = await apiRequest<{ item: PhotoRequirement }>(
    `/photo-requirements/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
  notifyApiRevision();
  return response.item;
}

export async function deletePhotoRequirement(id: string): Promise<void> {
  await apiRequest<{ ok: boolean }>(`/photo-requirements/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  notifyApiRevision();
}

/** Moves a requirement one position up or down in the customer-facing order. */
export async function movePhotoRequirement(
  id: string,
  direction: "up" | "down",
): Promise<PhotoRequirement[]> {
  const response = await apiRequest<{ items: PhotoRequirement[] }>(
    `/photo-requirements/${encodeURIComponent(id)}/move`,
    {
      method: "POST",
      body: JSON.stringify({ direction }),
    },
  );
  notifyApiRevision();
  return sortByOrder(response.items);
}
