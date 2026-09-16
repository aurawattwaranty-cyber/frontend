"use client";

import { useState } from "react";
import type { ProductModel, ProductSeries, ProductType } from "@/lib/types";
import type { SeriesOverview } from "@/lib/services/series";
import {
  adoptOrphanModels,
  createSeries,
  createSeriesModel,
  deleteSeries,
  getSeries,
} from "@/lib/services/series";
import { deleteProductModel, updateProductModel } from "@/lib/services/products";
import { useAsync, useMutation } from "@/lib/hooks/useAsync";
import { formatCapacity, formatDate, formatWarrantyTerm } from "@/lib/utils/format";
import { Alert, EmptyState, TableSkeleton } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { UploadIcon, PlusIcon, PackageIcon } from "@/components/icons";
import { useToast } from "@/components/ui/Toast";
import { BulkImportModal } from "./BulkImportModal";
import { ConfirmDialog } from "@/components/ui/Modal";
import { TrashIcon } from "@/components/icons";

/* ------------------------------------------------------------------ *
 * Series → Model → Warranty period
 *
 * Models live under a series and each carries its own term, because two
 * models in one series can be covered for different lengths. This is the only
 * place a term is set — a reviewer never types a coverage window when
 * activating a claim.
 * ------------------------------------------------------------------ */

function summariseTerms(models: ProductModel[]): string {
  const months = models
    .map((model) => model.warrantyMonths)
    .filter((value) => Number.isFinite(value) && value > 0);
  if (months.length === 0) return "No warranty term set";
  const min = Math.min(...months);
  const max = Math.max(...months);
  return min === max
    ? `Warranty ${formatWarrantyTerm(min)}`
    : `Warranty ${formatWarrantyTerm(min)}–${formatWarrantyTerm(max)}`;
}

function AddModelRow({
  seriesId,
  onAdded,
}: {
  seriesId: string;
  onAdded: () => Promise<void> | void;
}) {
  const toast = useToast();
  const create = useMutation(createSeriesModel);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [months, setMonths] = useState("");

  const ready =
    name.trim().length > 0 && Number(capacity) > 0 && Number(months) >= 1;

  async function handleAdd() {
    if (!ready) return;
    const created = await create.run(seriesId, {
      name: name.trim(),
      capacityKw: Number(capacity),
      warrantyMonths: Math.round(Number(months)),
    });
    if (created) {
      setName("");
      setCapacity("");
      setMonths("");
      await onAdded();
      toast.success(
        "Model added",
        `${created.name} carries a ${formatWarrantyTerm(created.warrantyMonths)} warranty.`,
      );
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-dashed border-line-strong p-3">
      {create.error ? (
        <Alert tone="danger" className="mb-3">
          {create.error}
        </Alert>
      ) : null}
      <div className="flex flex-wrap items-end gap-2">
        <Input
          label="Model number"
          value={name}
          onChange={(event) => {
            create.clearError();
            setName(event.target.value);
          }}
          placeholder="e.g. AW-SP-5000"
          containerClassName="min-w-[200px] flex-1"
        />
        <Input
          label="Capacity"
          type="number"
          min={0}
          step="0.01"
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
          placeholder="5"
          trailing={<span className="pr-2 text-xs text-muted">kW</span>}
          className="pr-10"
          containerClassName="w-[130px]"
        />
        <Input
          label="Warranty period"
          type="number"
          min={1}
          max={600}
          value={months}
          onChange={(event) => setMonths(event.target.value)}
          placeholder="60"
          trailing={<span className="pr-2 text-xs text-muted">months</span>}
          className="pr-16"
          containerClassName="w-[170px]"
        />
        <Button
          size="sm"
          icon={<PlusIcon />}
          disabled={!ready}
          loading={create.pending}
          onClick={() => void handleAdd()}
        >
          Add Model
        </Button>
      </div>
    </div>
  );
}

function SeriesModelList({
  seriesId,
  models,
  showSeries,
  onChanged,
}: {
  /** Absent for catalogue models that sit outside every uploaded series. */
  seriesId?: string;
  models: ProductModel[];
  showSeries?: boolean;
  onChanged: () => Promise<void> | void;
}) {
  const toast = useToast();
  const update = useMutation(updateProductModel);
  const remove = useMutation(deleteProductModel);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductModel | null>(null);

  async function handleSave(model: ProductModel) {
    const months = Number(drafts[model.id]);
    if (!Number.isFinite(months) || months < 1) return;
    setBusyId(model.id);
    const saved = await update.run(model.id, { warrantyMonths: Math.round(months) });
    setBusyId(null);
    if (saved) {
      setDrafts((current) => {
        const next = { ...current };
        delete next[model.id];
        return next;
      });
      await onChanged();
      toast.success(
        "Warranty period updated",
        `${saved.name} now carries a ${formatWarrantyTerm(saved.warrantyMonths)} warranty.`,
      );
    }
  }

  return (
    <>
      {update.error ? (
        <Alert tone="danger" className="mb-3">
          {update.error}
        </Alert>
      ) : null}

      {models.length === 0 ? (
        <p className="text-[13px] text-muted">
          No models yet. Add the models this series covers, each with its own
          warranty period.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {models.map((model) => {
            const draft = drafts[model.id];
            const dirty =
              draft !== undefined && Number(draft) !== model.warrantyMonths;
            const value = draft ?? String(model.warrantyMonths || "");
            return (
              <li
                key={model.id}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink">{model.name}</p>
                  <p className="text-xs text-muted">
                    {showSeries ? `${model.series} · ` : ""}
                    {formatCapacity(model.capacityKw, model.productType)} ·{" "}
                    {formatWarrantyTerm(model.warrantyMonths)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={`Warranty period in months for ${model.name}`}
                    type="number"
                    min={1}
                    max={600}
                    value={value}
                    onChange={(event) => {
                      update.clearError();
                      setDrafts((current) => ({
                        ...current,
                        [model.id]: event.target.value,
                      }));
                    }}
                    trailing={
                      <span className="pr-2 text-xs text-muted">months</span>
                    }
                    className="pr-16"
                    containerClassName="w-[170px]"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!dirty}
                    loading={busyId === model.id}
                    onClick={() => void handleSave(model)}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Delete ${model.name}`}
                    icon={<TrashIcon />}
                    className="text-danger-fg"
                    onClick={() => {
                      remove.clearError();
                      setDeleteTarget(model);
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {seriesId ? <AddModelRow seriesId={seriesId} onAdded={onChanged} /> : null}

      {deleteTarget ? (
        <ConfirmDialog
          open
          onClose={() => {
            if (!remove.pending) setDeleteTarget(null);
          }}
          onConfirm={async () => {
            const deleted = await remove.run(deleteTarget.id);
            if (deleted !== null) {
              await onChanged();
              setDeleteTarget(null);
              toast.success("Model removed", `${deleteTarget.name} was deleted.`);
            }
          }}
          title={`Delete ${deleteTarget.name}?`}
          description="Serials uploaded under this series keep their series, but lose this model assignment. Models used by a registered warranty cannot be deleted."
          confirmLabel="Delete model"
          tone="danger"
          loading={remove.pending}
        >
          {remove.error ? <Alert tone="danger">{remove.error}</Alert> : null}
        </ConfirmDialog>
      ) : null}
    </>
  );
}

export function SeriesImportsView() {
  const toast = useToast();
  const seriesResult = useAsync<SeriesOverview>(getSeries, []);
  const create = useMutation(createSeries);
  const remove = useMutation(deleteSeries);
  const adopt = useMutation(adoptOrphanModels);
  const [name, setName] = useState("");
  const [productType, setProductType] = useState<ProductType>("inverter");
  const [selected, setSelected] = useState<{ seriesId: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductSeries | null>(null);
  const [confirmationName, setConfirmationName] = useState("");

  async function handleCreate() {
    if (!name.trim()) return;
    const created = await create.run(name.trim(), productType);
    if (created) {
      setName("");
      await seriesResult.refresh();
      toast.success("Series added", `${created.name} is ready for ${productType} serial uploads.`);
    }
  }

  function filesFor(seriesId: string) {
    return (seriesResult.data?.files ?? []).filter((file) => file.seriesId === seriesId);
  }

  const series = seriesResult.data?.series ?? [];
  const unmatchedModels = seriesResult.data?.unmatchedModels ?? [];

  return (
    <>
      <Card className="mb-5">
        <CardHeader
          title="Create a product series"
          description="Choose the product type first. Every serial uploaded to this series is classified the same way."
        />
        <CardBody className="flex flex-wrap items-end gap-3">
          <Input
            label="Series name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. AuraWatt HybridPro"
            containerClassName="min-w-[260px] flex-1"
          />
          <Select
            label="Serial product type"
            value={productType}
            onChange={(event) => setProductType(event.target.value as ProductType)}
            options={[
              { value: "inverter", label: "Inverter" },
              { value: "battery", label: "Battery" },
              { value: "combo", label: "All-in-one" },
            ]}
            containerClassName="min-w-[180px]"
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
                  description={`${entry.productType === "combo" ? "All-in-one" : entry.productType[0].toUpperCase() + entry.productType.slice(1)} serials · ${files.reduce((total, file) => total + file.importedCount, 0)} mapped from ${files.length} file${files.length === 1 ? "" : "s"} · ${summariseTerms(entry.models)}.`}
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
                <CardBody className="flex flex-col gap-5">
                  <section>
                    <h3 className="text-[13px] font-semibold text-ink">
                      Models and warranty period
                    </h3>
                    <p className="mt-0.5 mb-3 text-[13px] text-muted">
                      Each model under this series carries its own warranty period.
                      Coverage starts on the customer&apos;s installation date and runs
                      for the term of the model confirmed at activation, so a reviewer
                      never enters warranty dates by hand.
                    </p>
                    <SeriesModelList
                      seriesId={entry.id}
                      models={entry.models}
                      onChanged={() => seriesResult.refresh()}
                    />
                  </section>

                  <section>
                    <h3 className="text-[13px] font-semibold text-ink">Serial files</h3>
                    <p className="mt-0.5 mb-3 text-[13px] text-muted">All uploads here are saved as {entry.productType === "combo" ? "all-in-one" : entry.productType} serials. Model assignment happens during warranty activation after the customer submits a claim.</p>
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
                  </section>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {unmatchedModels.length > 0 ? (
        <Card className="mt-4">
          <CardHeader
            title="Models without a series"
            description="These models name a series that does not exist yet, so they sit outside the Series → Model → Warranty period structure. Create those series to bring them in — each model keeps its own warranty period."
            action={
              <Button
                size="sm"
                loading={adopt.pending}
                onClick={async () => {
                  const result = await adopt.run();
                  if (result) {
                    await seriesResult.refresh();
                    toast.success(
                      "Models organised",
                      `${result.attachedModels} model${result.attachedModels === 1 ? "" : "s"} moved under ${result.createdSeries.length} new series.`,
                    );
                  }
                }}
              >
                Create series and attach
              </Button>
            }
          />
          <CardBody>
            {adopt.error ? (
              <Alert tone="danger" className="mb-3">
                {adopt.error}
              </Alert>
            ) : null}
            <SeriesModelList
              models={unmatchedModels}
              showSeries
              onChanged={() => seriesResult.refresh()}
            />
          </CardBody>
        </Card>
      ) : null}

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
