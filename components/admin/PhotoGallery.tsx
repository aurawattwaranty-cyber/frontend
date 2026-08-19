"use client";

import { useCallback, useEffect, useState } from "react";
import type { WarrantyPhoto } from "@/lib/types";
import { formatFileSize } from "@/lib/services/uploads";
import { formatDateTime } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/Feedback";
import { EvidenceImage } from "@/components/ui/EvidenceImage";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon } from "@/components/icons";

/**
 * Evidence viewer for the admin review screen: thumbnail grid plus a lightbox
 * with keyboard paging.
 */
export function PhotoGallery({ photos }: { photos: WarrantyPhoto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const step = useCallback(
    (delta: number) => {
      setOpenIndex((current) => {
        if (current === null || photos.length === 0) return current;
        return (current + delta + photos.length) % photos.length;
      });
    },
    [photos.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openIndex, step]);

  if (photos.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon />}
        title="No photos uploaded for this registration"
        description="The customer submitted this registration without installation evidence."
      />
    );
  }

  const active = openIndex === null ? null : photos[openIndex];

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, index) => (
          <li key={`${photo.requirementId}-${index}`}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group block w-full overflow-hidden rounded-lg border border-line text-left transition-shadow hover:shadow-raised"
            >
              <span className="block aspect-4/3 bg-canvas">
                <EvidenceImage
                  src={photo.url}
                  alt={`${photo.requirementLabel} — installation evidence`}
                  className="transition-transform duration-200 group-hover:scale-[1.02]"
                />
              </span>
              <span className="block px-2.5 py-2">
                <span className="block truncate text-[12px] font-medium text-ink">
                  {photo.requirementLabel}
                </span>
                <span className="block truncate text-[11px] text-muted">
                  {photo.fileName}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={active !== null}
        onClose={() => setOpenIndex(null)}
        title={active?.requirementLabel ?? ""}
        description={
          active
            ? `${active.fileName} · ${formatFileSize(active.sizeBytes)} · uploaded ${formatDateTime(active.uploadedAt)}`
            : undefined
        }
        size="xl"
        footer={
          photos.length > 1 ? (
            <div className="flex w-full items-center justify-between">
              <span className="text-[13px] text-muted tabular-nums">
                {(openIndex ?? 0) + 1} of {photos.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => step(-1)}
                  icon={<ChevronLeftIcon />}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => step(1)}
                  iconAfter={<ChevronRightIcon />}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {active ? (
          <div className="flex items-center justify-center rounded-lg bg-navy-950/95 p-2">
            <EvidenceImage
              src={active.url}
              alt={`${active.requirementLabel} — enlarged installation evidence`}
              className="max-h-[62vh] w-auto object-contain"
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
