"use client";

import { useMemo, useState } from "react";
import type { PhotoRequirement, WarrantyPhoto } from "@/lib/types";
import { getPhotoRequirements } from "@/lib/services/photo-requirements";
import { useAsync } from "@/lib/hooks/useAsync";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Alert, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { FileUploader } from "@/components/public/FileUploader";
import { ArrowLeftIcon, CameraIcon, ChevronRightIcon } from "@/components/icons";

export function PhotosStep({
  photos,
  onPhotosChange,
  onBack,
  onContinue,
}: {
  photos: Record<string, WarrantyPhoto>;
  onPhotosChange: (photos: Record<string, WarrantyPhoto>) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [showMissing, setShowMissing] = useState(false);
  const requirements = useAsync<PhotoRequirement[]>(
    () => getPhotoRequirements(),
    [],
  );

  const list = useMemo(() => requirements.data ?? [], [requirements.data]);
  const missing = useMemo(
    () => list.filter((entry) => entry.required && !photos[entry.id]),
    [list, photos],
  );

  const requiredCount = list.filter((entry) => entry.required).length;
  const uploadedRequired = requiredCount - missing.length;

  function handleContinue() {
    if (missing.length > 0) {
      setShowMissing(true);
      return;
    }
    onContinue();
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader
          title="Installation Photos"
          description="Our engineers review these photos to verify the installation before the warranty is activated."
          action={
            requirements.loading ? null : (
              <span className="text-[13px] font-medium text-muted tabular-nums">
                {uploadedRequired} / {requiredCount} required
              </span>
            )
          }
        />
        <CardBody className="flex flex-col gap-3">
          {requirements.initialLoading ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-line p-4"
                >
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-2 h-3 w-full max-w-md" />
                  <Skeleton className="mt-3 h-24 w-full" />
                </div>
              ))}
            </div>
          ) : requirements.error ? (
            <Alert tone="danger" title="Couldn't load the photo checklist">
              {requirements.error}
            </Alert>
          ) : list.length === 0 ? (
            <EmptyState
              icon={<CameraIcon />}
              title="No photo requirements configured"
              description="Aurawatt has not published a photo checklist yet. You can continue without uploading photos."
              compact
            />
          ) : (
            <>
              {showMissing && missing.length > 0 ? (
                <Alert
                  tone="warning"
                  title={`${missing.length} required photo${missing.length === 1 ? "" : "s"} still missing`}
                >
                  Please upload: {missing.map((entry) => entry.label).join(", ")}.
                </Alert>
              ) : null}

              {list.map((requirement) => (
                <FileUploader
                  key={requirement.id}
                  requirement={requirement}
                  photo={photos[requirement.id]}
                  highlighted={
                    showMissing && missing.some((entry) => entry.id === requirement.id)
                  }
                  onUploaded={(photo) =>
                    onPhotosChange({ ...photos, [requirement.id]: photo })
                  }
                  onRemove={() => {
                    const next = { ...photos };
                    delete next[requirement.id];
                    onPhotosChange(next);
                  }}
                />
              ))}
            </>
          )}
        </CardBody>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button
          variant="secondary"
          size="lg"
          onClick={onBack}
          icon={<ArrowLeftIcon className="text-base" />}
        >
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={requirements.initialLoading}
          iconAfter={<ChevronRightIcon className="text-base" />}
        >
          Review Registration
        </Button>
      </div>
    </div>
  );
}
