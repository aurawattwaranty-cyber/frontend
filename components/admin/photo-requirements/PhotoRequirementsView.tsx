"use client";

import { useState } from "react";
import type { DragEvent } from "react";
import type { PhotoRequirement } from "@/lib/types";
import {
  createPhotoRequirement,
  deletePhotoRequirement,
  getPhotoRequirements,
  movePhotoRequirement,
  updatePhotoRequirement,
} from "@/lib/services/photo-requirements";
import { useAsync, useMutation } from "@/lib/hooks/useAsync";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PhotoRequirementCard } from "@/components/admin/PhotoRequirementCard";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Input, Textarea } from "@/components/ui/Field";
import { Alert, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { CameraIcon, PlusIcon } from "@/components/icons";

interface FormState {
  label: string;
  instructions: string;
  required: boolean;
}

const EMPTY_FORM: FormState = { label: "", instructions: "", required: true };

export function PhotoRequirementsView() {
  const toast = useToast();
  const requirements = useAsync<PhotoRequirement[]>(
    () => getPhotoRequirements(),
    [],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PhotoRequirement | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [pendingDelete, setPendingDelete] = useState<PhotoRequirement | null>(
    null,
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const create = useMutation(createPhotoRequirement);
  const update = useMutation(updatePhotoRequirement);
  const remove = useMutation(deletePhotoRequirement);
  const move = useMutation(movePhotoRequirement);
  const saving = create.pending || update.pending;

  const list = requirements.data ?? [];

  /** Both entry points fully seed the form, so closing needs no cleanup. */
  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    create.clearError();
    update.clearError();
    setFormOpen(true);
  }

  function openEdit(requirement: PhotoRequirement) {
    setEditing(requirement);
    setErrors({});
    create.clearError();
    update.clearError();
    setForm({
      label: requirement.label,
      instructions: requirement.instructions,
      required: requirement.required,
    });
    setFormOpen(true);
  }

  async function handleSave() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {
      label: form.label.trim() ? undefined : "Enter a label for this photo.",
      instructions:
        form.instructions.trim().length >= 10
          ? undefined
          : "Add instructions of at least 10 characters.",
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const saved = editing
      ? await update.run(editing.id, form)
      : await create.run(form);

    if (saved) {
      toast.success(
        editing ? "Requirement updated" : "Requirement added",
        `${saved.label} saved.`,
      );
      setFormOpen(false);
      requirements.refresh();
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    const result = await remove.run(pendingDelete.id);
    if (result !== null) {
      toast.success("Requirement removed", `${pendingDelete.label} deleted.`);
      setPendingDelete(null);
      requirements.refresh();
    }
  }

  async function reorder(id: string, direction: "up" | "down") {
    const result = await move.run(id, direction);
    if (result) requirements.refresh();
  }

  async function handleDropOn(targetId: string) {
    const sourceId = draggingId;
    setDraggingId(null);
    setDropTargetId(null);
    if (!sourceId || sourceId === targetId) return;

    const fromIndex = list.findIndex((entry) => entry.id === sourceId);
    const toIndex = list.findIndex((entry) => entry.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    // The service moves one position at a time, which keeps ordering
    // consistent whether it came from a drag or the keyboard controls.
    const direction = toIndex > fromIndex ? "down" : "up";
    const steps = Math.abs(toIndex - fromIndex);
    for (let step = 0; step < steps; step += 1) {
      await move.run(sourceId, direction);
    }
    requirements.refresh();
  }

  return (
    <>
      <AdminPageHeader
        title="Photo Requirements"
        description="Configure the evidence photos required during warranty registration."
        actions={
          formOpen ? null : (
            <Button onClick={openCreate} icon={<PlusIcon />}>
              Add Requirement
            </Button>
          )
        }
      />

      {formOpen ? (
        <Card className="mb-4 border-brand-200 ring-1 ring-brand-100">
          <CardHeader
            title={editing ? "Edit Photo Requirement" : "New Photo Requirement"}
            description={
              editing
                ? "Changes apply to new registrations immediately."
                : "Add a new step to the photo upload phase."
            }
            className="bg-brand-50/60"
          />
          <CardBody className="flex flex-col gap-4">
            {create.error || update.error ? (
              <Alert tone="danger">{create.error ?? update.error}</Alert>
            ) : null}

            <Input
              label="Label (e.g. Inverter Installation)"
              value={form.label}
              onChange={(event) => {
                setForm((current) => ({ ...current, label: event.target.value }));
                if (errors.label) setErrors((e) => ({ ...e, label: undefined }));
              }}
              error={errors.label}
              autoFocus
              required
            />

            <Textarea
              label="Instructions for the customer"
              rows={3}
              value={form.instructions}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  instructions: event.target.value,
                }));
                if (errors.instructions) {
                  setErrors((e) => ({ ...e, instructions: undefined }));
                }
              }}
              error={errors.instructions}
              placeholder="Take a clear photo showing the entire inverter mounted on the wall…"
              required
            />

            <Checkbox
              label="This photo is mandatory for registration"
              checked={form.required}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  required: event.target.checked,
                }))
              }
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={() => void handleSave()} loading={saving}>
                Save Requirement
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {requirements.initialLoading ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : requirements.error ? (
        <Alert tone="danger" title="Couldn't load photo requirements">
          {requirements.error}
        </Alert>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CameraIcon />}
            title="No photo requirements configured"
            description="Customers won't be asked for installation evidence until you add at least one requirement."
            action={
              <Button size="sm" onClick={openCreate} icon={<PlusIcon />}>
                Add Requirement
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {list.map((requirement, index) => (
              <PhotoRequirementCard
                key={requirement.id}
                requirement={requirement}
                index={index}
                total={list.length}
                dragging={draggingId === requirement.id}
                dropTarget={
                  dropTargetId === requirement.id && draggingId !== requirement.id
                }
                onEdit={() => openEdit(requirement)}
                onDelete={() => setPendingDelete(requirement)}
                onMove={(direction) => void reorder(requirement.id, direction)}
                onDragStart={() => setDraggingId(requirement.id)}
                onDragOver={(event: DragEvent<HTMLLIElement>) => {
                  event.preventDefault();
                  setDropTargetId(requirement.id);
                }}
                onDrop={() => void handleDropOn(requirement.id)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDropTargetId(null);
                }}
              />
            ))}
          </ul>

          <p className="mt-4 text-[12px] text-faint">
            Drag a requirement, or use the arrow buttons, to change the order
            customers see during registration.
          </p>
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete this requirement?"
        description={pendingDelete?.label}
        confirmLabel="Delete requirement"
        tone="danger"
        loading={remove.pending}
      >
        <p className="text-[13px] leading-relaxed text-muted">
          New registrations will no longer ask for this photo. Evidence already
          submitted stays attached to existing registrations.
        </p>
        {remove.error ? (
          <Alert tone="danger" className="mt-3">
            {remove.error}
          </Alert>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
