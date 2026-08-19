import { apiRequest } from "@/lib/api/client";
import type { PhotoRequirement, WarrantyPhoto } from "@/lib/types";
import { ServiceError } from "./errors";

/**
 * Evidence upload abstraction.
 *
 * The browser still validates and downsizes the image for a quick UX, but the
 * actual upload now goes through the backend so Cloudinary credentials stay
 * server-side.
 */

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_STORED_EDGE = 1280;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImageFile(file: File): void {
  const isImage =
    file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic)$/i.test(file.name);
  if (!isImage) {
    throw new ServiceError(
      `"${file.name}" isn't an image. Upload a JPG, PNG or WEBP photo.`,
      "invalid_file_type",
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ServiceError(
      `"${file.name}" is ${formatFileSize(file.size)}. Photos must be under ${formatFileSize(MAX_UPLOAD_BYTES)}.`,
      "file_too_large",
    );
  }
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new ServiceError("That photo couldn't be read.", "read_failed"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Shrinks the long edge to keep evidence photos light before uploading.
 */
async function resizeForStorage(
  file: File,
): Promise<{ url: string; sizeBytes: number }> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    const url = await readAsDataUrl(file);
    return { url, sizeBytes: file.size };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_STORED_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("no 2d context");
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const url = canvas.toDataURL("image/jpeg", 0.72);
    return { url, sizeBytes: Math.round((url.length - 22) * 0.75) };
  } catch {
    const url = await readAsDataUrl(file);
    return { url, sizeBytes: file.size };
  }
}

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export async function uploadEvidencePhoto(
  file: File,
  requirement: Pick<PhotoRequirement, "id" | "label">,
  options: UploadOptions = {},
): Promise<WarrantyPhoto> {
  validateImageFile(file);
  const { onProgress, signal } = options;

  onProgress?.(8);
  const processed = await resizeForStorage(file);
  onProgress?.(45);

  const uploadPromise = apiRequest<{ item: WarrantyPhoto }>("/uploads/photos", {
    method: "POST",
    signal,
    body: JSON.stringify({
      requirementId: requirement.id,
      requirementLabel: requirement.label,
      fileName: file.name,
      dataUrl: processed.url,
    }),
  });

  let percent = 45;
  const timer = window.setInterval(() => {
    percent = Math.min(92, percent + 12);
    onProgress?.(percent);
  }, 120);

  try {
    const response = await uploadPromise;
    onProgress?.(100);
    return response.item;
  } finally {
    window.clearInterval(timer);
  }
}

export async function deleteEvidencePhoto(storageId: string): Promise<void> {
  if (!storageId.trim()) return;
  await apiRequest<void>(
    `/uploads/photos/${encodeURIComponent(storageId.trim())}`,
    { method: "DELETE" },
  );
}
