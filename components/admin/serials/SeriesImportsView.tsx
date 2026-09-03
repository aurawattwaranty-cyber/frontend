"use client";

import { useState } from "react";
import type { ProductSeries, SerialImportFile } from "@/lib/types";
import { createSeries, deleteSeries, getSeries } from "@/lib/services/series";
import { useAsync, useMutation } from "@/lib/hooks/useAsync";
import { formatDate } from "@/lib/utils/format";
import { Alert, EmptyState, TableSkeleton } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { UploadIcon, PlusIcon, PackageIcon } from "@/components/icons";
import { useToast } from "@/components/ui/Toast";
import { BulkImportModal } from "./BulkImportModal";
import { ConfirmDialog } from "@/components/ui/Modal";
import { TrashIcon } from "@/components/icons";

export function SeriesImportsView() {
  const toast = useToast();
  const seriesResult = useAsync<{ series: ProductSeries[]; files: SerialImportFile[] }>(getSeries, []);
  const create = useMutation(createSeries);
  const remove = useMutation(deleteSeries);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<{ seriesId: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductSeries | null>(null);
  const [confirmationName, setConfirmationName] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    const created = await create.run(name.trim());
    if (created) {
      setName("");
      await seriesResult.refresh();
      toast.success("Series added", `${created.name} is ready for serial uploads.`);
    }
  }

  function filesFor(seriesId: string) {
    return (seriesResult.data?.files ?? []).filter((file) => file.seriesId === seriesId);
  }

  const series = seriesResult.data?.series ?? [];

  return (
    <>
      <Card className="mb-5">
        <CardHeader
          title="Create a product series"
          description="Create the series first, then attach one or more serial files to it."
        />
        <CardBody className="flex flex-wrap items-end gap-3">
          <Input
            label="Series name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. AuraWatt HybridPro"
            containerClassName="min-w-[260px] flex-1"
          />
          <Button onClick={() => void handleCreate()} loading={create.pending} icon={<PlusIcon />}>
            Add Series
          </Button>
        </CardBody>
        {create.error ? <CardBody className="pt-0"><Alert tone="danger">{create.error}</Alert></CardBody> : null}
      </Card>

      {seriesResult.initialLoading ? <TableSkeleton rows={4} columns={3} /> : seriesResult.error ? (
        <Alert tone="danger" title="Couldn't load series">{seriesResult.error}</Alert>
      ) : series.length === 0 ? (
        <Card><EmptyState icon={<PackageIcon />} title="No series configured" description="Add a series above to start mapping serial files." /></Card>
      ) : (
        <div className="flex flex-col gap-4">
          {series.map((entry) => {
            const files = filesFor(entry.id);
            return (
              <Card key={entry.id}>
                <CardHeader
                  title={entry.name}
                  description={`${files.reduce((total, file) => total + file.importedCount, 0)} serials mapped from ${files.length} file${files.length === 1 ? "" : "s"}.`}
                  action={
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        size="sm"
                        icon={<UploadIcon />}
                        onClick={() => setSelected({ seriesId: entry.id })}
                      >
                        Upload serial file
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<TrashIcon />}
                        onClick={() => {
                          setDeleteTarget(entry);
                          setConfirmationName("");
                          remove.clearError();
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  }
                />
                <CardBody>
                  <p className="mb-4 text-[13px] text-muted">Model assignment happens during warranty activation after the customer submits a claim.</p>
                  {files.length === 0 ? <p className="text-[13px] text-muted">No files uploaded for this series yet.</p> : (
                    <ul className="divide-y divide-line rounded-lg border border-line">
                      {files.map((file) => (
                        <li key={file.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-[13px]">
                          <span className="font-medium text-ink">{file.fileName}</span>
                          <span className="text-muted">{file.importedCount} serials · {formatDate(file.uploadedAt)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {selected ? (
        <BulkImportModal
          seriesId={selected.seriesId}
          onClose={() => setSelected(null)}
          onImported={() => {
            setSelected(null);
            void seriesResult.refresh();
          }}
        />
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          open
          onClose={() => {
            if (!remove.pending) setDeleteTarget(null);
          }}
          onConfirm={async () => {
            const deleted = await remove.run(deleteTarget.id, confirmationName);
            if (deleted) {
              await seriesResult.refresh();
              setDeleteTarget(null);
              toast.success("Series deleted", `${deleteTarget.name} and its unregistered serials were removed.`);
            }
          }}
          title={`Delete ${deleteTarget.name}?`}
          description="This permanently removes the series, its upload history, and its unregistered serials. Registered warranty serials are protected."
          confirmLabel="Delete series"
          tone="danger"
          loading={remove.pending}
          confirmDisabled={confirmationName !== deleteTarget.name}
        >
          {remove.error ? <Alert tone="danger">{remove.error}</Alert> : null}
          <Input
            label={`Type “${deleteTarget.name}” to confirm`}
            value={confirmationName}
            onChange={(event) => setConfirmationName(event.target.value)}
            placeholder={deleteTarget.name}
            autoFocus
          />
        </ConfirmDialog>
      ) : null}
    </>
  );
}
