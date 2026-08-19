"use client";

import { useState } from "react";
import type { ProductModel, ProductType } from "@/lib/types";
import {
  createProductModel,
  getProductModels,
  updateProductModel,
} from "@/lib/services/products";
import { useAsync, useMutation } from "@/lib/hooks/useAsync";
import { formatCapacity, formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Input, Select } from "@/components/ui/Field";
import { Alert, EmptyState, TableSkeleton } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import {
  Table,
  TableScroll,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { PackageIcon, PencilIcon, PlusIcon } from "@/components/icons";

const TYPE_OPTIONS = [
  { value: "inverter", label: "Hybrid Inverter" },
  { value: "battery", label: "Battery" },
];

interface ModelForm {
  series: string;
  name: string;
  capacityKw: string;
  productType: ProductType;
  warrantyMonths: string;
  active: boolean;
}

const EMPTY_FORM: ModelForm = {
  series: "",
  name: "",
  capacityKw: "",
  productType: "inverter",
  warrantyMonths: "60",
  active: true,
};

export function ProductModelsPanel() {
  const toast = useToast();
  const models = useAsync<ProductModel[]>(() => getProductModels(), []);

  const [editing, setEditing] = useState<ProductModel | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ModelForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ModelForm, string>>>(
    {},
  );

  const create = useMutation(createProductModel);
  const update = useMutation(updateProductModel);
  const pending = create.pending || update.pending;

  /** Both entry points fully seed the form, so closing needs no cleanup. */
  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    create.clearError();
    update.clearError();
    setOpen(true);
  }

  function openEdit(model: ProductModel) {
    setEditing(model);
    setErrors({});
    create.clearError();
    update.clearError();
    setForm({
      series: model.series,
      name: model.name,
      capacityKw: String(model.capacityKw),
      productType: model.productType,
      warrantyMonths: String(model.warrantyMonths),
      active: model.active,
    });
    setOpen(true);
  }

  async function handleSubmit() {
    const capacity = Number(form.capacityKw);
    const months = Number(form.warrantyMonths);

    const nextErrors: Partial<Record<keyof ModelForm, string>> = {
      series: form.series.trim() ? undefined : "Series is required.",
      name: form.name.trim() ? undefined : "Model name is required.",
      capacityKw:
        form.capacityKw && capacity > 0 ? undefined : "Enter a capacity above 0.",
      warrantyMonths:
        form.warrantyMonths && months > 0
          ? undefined
          : "Enter the warranty term in months.",
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const payload = {
      series: form.series.trim(),
      name: form.name.trim(),
      capacityKw: capacity,
      productType: form.productType,
      warrantyMonths: months,
      active: form.active,
    };

    const saved = editing
      ? await update.run(editing.id, payload)
      : await create.run(payload);

    if (saved) {
      toast.success(
        editing ? "Model updated" : "Model added",
        `${saved.name} saved.`,
      );
      setOpen(false);
      models.refresh();
    }
  }

  const list = models.data ?? [];

  return (
    <>
      <Card>
        <CardHeader
          title="Product Series & Models"
          description="Models determine the capacity and warranty term applied on activation."
          action={
            <Button size="sm" onClick={openCreate} icon={<PlusIcon />}>
              Add Model
            </Button>
          }
        />

        {models.initialLoading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : models.error ? (
          <CardBody>
            <Alert tone="danger">{models.error}</Alert>
          </CardBody>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<PackageIcon />}
            title="No product models configured"
            description="Add a model before importing serial numbers."
            action={
              <Button size="sm" onClick={openCreate}>
                Add Model
              </Button>
            }
          />
        ) : (
          <TableScroll>
            <Table className="min-w-[720px]">
              <THead>
                <TR>
                  <TH>Series</TH>
                  <TH>Model</TH>
                  <TH>Capacity</TH>
                  <TH>Type</TH>
                  <TH>Warranty</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Action</TH>
                </TR>
              </THead>
              <TBody>
                {list.map((model) => (
                  <TR key={model.id}>
                    <TD>{model.series}</TD>
                    <TD className="font-medium text-ink">{model.name}</TD>
                    <TD>
                      {formatCapacity(model.capacityKw, model.productType)}
                    </TD>
                    <TD className="capitalize">{model.productType}</TD>
                    <TD>{model.warrantyMonths} months</TD>
                    <TD>
                      {model.active ? (
                        <Badge tone="success">Active</Badge>
                      ) : (
                        <Badge tone="neutral">Inactive</Badge>
                      )}
                    </TD>
                    <TD className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(model)}
                        icon={<PencilIcon />}
                        aria-label={`Edit ${model.name}`}
                      >
                        Edit
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableScroll>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Add product model"}
        description="Models are shared by serial inventory and the activation calculation."
        busy={pending}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} loading={pending}>
              {editing ? "Save changes" : "Add Model"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {create.error || update.error ? (
            <Alert tone="danger">{create.error ?? update.error}</Alert>
          ) : null}

          <Input
            label="Product Series"
            value={form.series}
            onChange={(event) =>
              setForm((current) => ({ ...current, series: event.target.value }))
            }
            error={errors.series}
            placeholder="AuraWatt HybridPro"
            required
          />
          <Input
            label="Model Name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            error={errors.name}
            placeholder="AuraWatt HybridPro 5kW"
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Capacity"
              type="number"
              step="0.1"
              min="0.1"
              value={form.capacityKw}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  capacityKw: event.target.value,
                }))
              }
              error={errors.capacityKw}
              hint={form.productType === "battery" ? "In kWh" : "In kW"}
              required
            />
            <Select
              label="Product Type"
              value={form.productType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  productType: event.target.value as ProductType,
                }))
              }
              options={TYPE_OPTIONS}
            />
          </div>
          <Input
            label="Warranty term (months)"
            type="number"
            min="1"
            max="360"
            value={form.warrantyMonths}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                warrantyMonths: event.target.value,
              }))
            }
            error={errors.warrantyMonths}
            required
          />
          <Checkbox
            label="Active"
            hint="Inactive models stay on existing records but can't be selected for new serials."
            checked={form.active}
            onChange={(event) =>
              setForm((current) => ({ ...current, active: event.target.checked }))
            }
          />

          {editing ? (
            <p className="text-[12px] text-faint">
              Added {formatDate(editing.createdAt)}
            </p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
