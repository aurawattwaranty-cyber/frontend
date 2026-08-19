"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { cn } from "@/lib/utils/cn";
import type { PhotoRequirement, WarrantyPhoto } from "@/lib/types";
import {
  ACCEPTED_IMAGE_TYPES,
  formatFileSize,
  deleteEvidencePhoto,
  MAX_UPLOAD_BYTES,
  uploadEvidencePhoto,
} from "@/lib/services/uploads";
import { toUserMessage } from "@/lib/services/errors";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EvidenceImage } from "@/components/ui/EvidenceImage";
import { CameraIcon, TrashIcon, UploadIcon } from "@/components/icons";

export interface FileUploaderProps {
  requirement: PhotoRequirement;
  photo?: WarrantyPhoto;
  onUploaded: (photo: WarrantyPhoto) => void;
  onRemove: () => void;
  /** Highlights requirements an admin asked the customer to redo. */
  highlighted?: boolean;
}

export function FileUploader({
  requirement,
  photo,
  onUploaded,
  onRemove,
  highlighted,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploading = progress !== null;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      const uploaded = await uploadEvidencePhoto(file, requirement, {
        onProgress: setProgress,
      });
      if (photo?.storageId && photo.storageId !== uploaded.storageId) {
        void deleteEvidencePhoto(photo.storageId).catch(() => undefined);
      }
      onUploaded(uploaded);
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (uploading) return;
    void handleFile(event.dataTransfer.files?.[0]);
  }

  async function handleRemove() {
    if (photo?.storageId) {
      await deleteEvidencePhoto(photo.storageId).catch(() => undefined);
    }
    onRemove();
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-surface p-4 transition-colors",
        highlighted ? "border-info-line bg-info-bg/40" : "border-line",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[14px] font-semibold text-ink">
              {requirement.label}
            </h3>
            {requirement.required ? (
              <Badge tone="brand">Required</Badge>
            ) : (
              <Badge tone="neutral">Optional</Badge>
            )}
            {photo ? <Badge tone="success">Uploaded</Badge> : null}
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            {requirement.instructions}
          </p>
        </div>
      </div>

      {photo ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-canvas-soft p-3">
          <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md border border-line bg-surface">
            <EvidenceImage
              src={photo.url}
              alt={`${requirement.label} evidence photo`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">
              {photo.fileName}
            </p>
            <p className="text-xs text-muted">
              {formatFileSize(photo.sizeBytes)} · ready to submit
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleRemove()}
              icon={<TrashIcon />}
              aria-label={`Remove ${requirement.label} photo`}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!uploading) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "mt-3 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
            dragging
              ? "border-brand-400 bg-brand-50"
              : error
                ? "border-danger-line bg-danger-bg/30"
                : "border-line-strong bg-canvas-soft",
          )}
        >
          {uploading ? (
            <div className="w-full max-w-xs">
              <p className="text-[13px] font-medium text-ink">Uploading…</p>
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line"
                role="progressbar"
                aria-valuenow={progress ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Uploading ${requirement.label}`}
              >
                <div
                  className="h-full rounded-full bg-brand-500 transition-[width] duration-200"
                  style={{ width: `${progress ?? 0}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted tabular-nums">
                {progress ?? 0}%
              </p>
            </div>
          ) : (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-base text-faint shadow-card">
                <CameraIcon />
              </span>
              <p className="text-[13px] text-ink-soft">
                Drag a photo here, or
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                icon={<UploadIcon />}
              >
                Browse files
              </Button>
              <p className="text-xs text-faint">
                JPG, PNG or WEBP · up to {formatFileSize(MAX_UPLOAD_BYTES)}
              </p>
            </>
          )}
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-2 text-xs text-danger-fg">
          {error}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        capture="environment"
        className="sr-only"
        aria-label={`Upload ${requirement.label}`}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
