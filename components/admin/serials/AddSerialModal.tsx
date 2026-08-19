"use client";

import { useMemo, useState } from "react";
import type { ProductModel } from "@/lib/types";
import { createSerial, normaliseSerial } from "@/lib/services/serials";
import { getProductModels } from "@/lib/services/products";
import { useAsync, useMutation } from "@/lib/hooks/useAsync";
import { formatCapacity } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

/**
 * Rendered only while open — unmounting on close is what resets the form, so
 * there is no state-syncing effect here.
 */
export function AddSerialModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const models = useAsync<ProductModel[]>(
    () => getProductModels({ activeOnly: true }),
    [],
  );

  const [serial, setSerial] = useState("");
  const [series, setSeries] = useState("");
  const [modelId, setModelId] = useState("");
  const [serialError, setSerialError] = useState<string | undefined>();
  const [modelError, setModelError] = useState<string | undefined>();

  const create = useMutation(createSerial);

  const seriesOptions = useMemo(
    () =>
      [...new Set((models.data ?? []).map((model) => model.series))]
        .sort()
        .map((entry) => ({ value: entry, label: entry })),
    [models.data],
  );

  const modelOptions = useMemo(
    () =>
      (models.data ?? [])
        .filter((model) => !series || model.series === series)
        .map((model) => ({
          value: model.id,
          label: model.name,
        })),
    [models.data, series],
  );

  const selectedModel = (models.data ?? []).find((model) => model.id === modelId);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = normaliseSerial(serial);

    const nextSerialError = value ? undefined : "Enter a serial number.";
    const nextModelError = modelId ? undefined : "Select a product model.";
    setSerialError(nextSerialError);
    setModelError(nextModelError);
    if (nextSerialError || nextModelError) return;

    const created = await create.run({ serial: value, modelId });
    if (created) {
      toast.success("Serial added", `${created.serial} is now available.`);
      onCreated();
      onClose();
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Add serial number"
      description="Add a single unit to the inventory so it can be registered."
      busy={create.pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.pending}>
            Cancel
          </Button>
          <Button
            onClick={(event) => handleSubmit(event as unknown as React.FormEvent)}
            loading={create.pending}
          >
            Add Serial
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {create.error ? <Alert tone="danger">{create.error}</Alert> : null}

        <Input
          label="Serial Number"
          value={serial}
          onChange={(event) => {
            setSerial(event.target.value.toUpperCase());
            if (serialError) setSerialError(undefined);
            create.clearError();
          }}
          error={serialError}
          placeholder="AW-HI-5KW-24001"
          monospace
          autoFocus
          required
        />

        <Select
          label="Product Series"
          value={series}
          onChange={(event) => {
            setSeries(event.target.value);
            setModelId("");
          }}
          options={seriesOptions}
          placeholder={models.loading ? "Loading…" : "All series"}
          disabled={models.loading}
        />

        <Select
          label="Model"
          value={modelId}
          onChange={(event) => {
            setModelId(event.target.value);
            if (modelError) setModelError(undefined);
          }}
          options={modelOptions}
          placeholder={models.loading ? "Loading…" : "Select a model"}
          error={modelError}
          disabled={models.loading}
          required
        />

        {selectedModel ? (
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-line bg-canvas-soft px-4 py-3">
            <div>
              <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
                Capacity
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-ink">
                {formatCapacity(
                  selectedModel.capacityKw,
                  selectedModel.productType,
                )}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
                Product Type
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-ink capitalize">
                {selectedModel.productType}
              </p>
            </div>
          </div>
        ) : null}

        {/* Enables Enter-to-submit without a duplicate visible button. */}
        <button type="submit" className="sr-only" tabIndex={-1}>
          Add Serial
        </button>
      </form>
    </Modal>
  );
}
