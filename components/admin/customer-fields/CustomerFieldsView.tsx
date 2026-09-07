"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CustomerExperienceConfig,
  CustomerFieldConfig,
  CustomerFieldSection,
  CustomerSectionConfig,
  PhotoRequirement,
  StatusBlockConfig,
} from "@/lib/types";
import {
  getCustomerExperienceForAdmin,
  resetCustomerExperience,
  saveCustomerExperience,
} from "@/lib/services/customer-experience";
import { useAsync, useMutation } from "@/lib/hooks/useAsync";
import { useSession } from "@/lib/hooks/useSession";
import { formatDateTime } from "@/lib/utils/format";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert, CardSkeleton, EmptyState } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { getPhotoRequirements } from "@/lib/services/photo-requirements";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  PlusIcon,
  RefreshIcon,
  SlidersIcon,
  TrashIcon,
} from "@/components/icons";

const SECTION_ORDER: CustomerFieldSection[] = [
  "customer",
  "installer",
  "installation",
];

/** Moves an entry within its own group and renumbers `order` across the list. */
function reorder<T extends { id: string; order: number }>(
  items: T[],
  group: T[],
  id: string,
  direction: -1 | 1,
): T[] {
  const sorted = [...group].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((entry) => entry.id === id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= sorted.length) return items;

  const orders = sorted.map((entry) => entry.order);
  const swapped = [...sorted];
  const a = swapped[index]!;
  const b = swapped[target]!;
  swapped[index] = b;
  swapped[target] = a;

  const nextOrder = new Map(
    swapped.map((entry, position) => [entry.id, orders[position]!]),
  );
  return items.map((entry) =>
    nextOrder.has(entry.id)
      ? { ...entry, order: nextOrder.get(entry.id)! }
      : entry,
  );
}

export function CustomerFieldsView() {
  const user = useSession();
  const toast = useToast();
  const remote = useAsync<CustomerExperienceConfig>(
    getCustomerExperienceForAdmin,
    [],
    { enabled: user?.role === "superadmin" },
  );
  const photoRequirements = useAsync<PhotoRequirement[]>(
    getPhotoRequirements,
    [],
    { enabled: user?.role === "superadmin" },
  );

  const [draft, setDraft] = useState<CustomerExperienceConfig | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deletedFieldIds, setDeletedFieldIds] = useState<string[]>([]);
  const [newField, setNewField] = useState({
    label: "",
    section: "customer" as CustomerFieldSection,
    inputType: "text" as CustomerFieldConfig["inputType"],
    required: false,
  });

  const save = useMutation(saveCustomerExperience);
  const reset = useMutation(resetCustomerExperience);

  // The editor works on a local copy so nothing is written until Save.
  useEffect(() => {
    if (!remote.data) return;
    const timer = window.setTimeout(() => {
      setDraft(structuredClone(remote.data));
      setDeletedFieldIds([]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [remote.data]);

  const dirty = useMemo(
    () =>
      Boolean(
        draft && remote.data && JSON.stringify(draft) !== JSON.stringify(remote.data),
      ),
    [draft, remote.data],
  );

  if (user && user.role !== "superadmin") {
    return (
      <EmptyState
        icon={<SlidersIcon />}
        title="Super admin only"
        description="Only a super admin can change the fields customers see. Ask your super admin for access."
      />
    );
  }

  if (remote.initialLoading || !draft) {
    return (
      <div className="flex flex-col gap-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (remote.error) {
    return <Alert tone="danger" title="Couldn't load configuration">{remote.error}</Alert>;
  }

  function patchField(id: string, patch: Partial<CustomerFieldConfig>) {
    setDraft((current) =>
      current
        ? {
            ...current,
            register: {
              ...current.register,
              fields: current.register.fields.map((field) =>
                field.id === id ? { ...field, ...patch } : field,
              ),
            },
          }
        : current,
    );
  }

  function patchSection(
    id: CustomerFieldSection,
    patch: Partial<CustomerSectionConfig>,
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            register: {
              ...current.register,
              sections: current.register.sections.map((section) =>
                section.id === id ? { ...section, ...patch } : section,
              ),
            },
          }
        : current,
    );
  }

  function patchBlock(id: string, patch: Partial<StatusBlockConfig>) {
    setDraft((current) =>
      current
        ? {
            ...current,
            status: {
              ...current.status,
              blocks: current.status.blocks.map((block) =>
                block.id === id ? { ...block, ...patch } : block,
              ),
            },
          }
        : current,
    );
  }

  function moveField(section: CustomerFieldSection, id: string, direction: -1 | 1) {
    setDraft((current) => {
      if (!current) return current;
      const group = current.register.fields.filter(
        (field) => field.section === section,
      );
      return {
        ...current,
        register: {
          ...current.register,
          fields: reorder(current.register.fields, group, id, direction),
        },
      };
    });
  }

  function moveBlock(id: string, direction: -1 | 1) {
    setDraft((current) =>
      current
        ? {
            ...current,
            status: {
              ...current.status,
              blocks: reorder(
                current.status.blocks,
                current.status.blocks,
                id,
                direction,
              ),
            },
          }
        : current,
    );
  }

  async function handleSave() {
    if (!draft) return;
    const result = await save.run({
      register: {
        heading: draft.register.heading,
        subheading: draft.register.subheading,
        sections: draft.register.sections,
        fields: draft.register.fields,
        deletedFieldIds,
      },
      status: {
        heading: draft.status.heading,
        subheading: draft.status.subheading,
        searchPlaceholder: draft.status.searchPlaceholder,
        helpText: draft.status.helpText,
        blocks: draft.status.blocks,
      },
    });

    if (result) {
      setDraft(result);
      remote.refresh();
      toast.success(
        "Customer view updated",
        "The public pages now show your changes.",
      );
    }
  }

  function addCustomField() {
    if (!draft || !newField.label.trim()) return;
    const slug = newField.label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug) return;
    const baseId = `custom.${slug}`;
    let id = baseId;
    let suffix = 2;
    while (draft.register.fields.some((field) => field.id === id)) {
      id = `${baseId}-${suffix++}`;
    }
    const sectionFields = draft.register.fields.filter(
      (field) => field.section === newField.section,
    );
    setDraft({
      ...draft,
      register: {
        ...draft.register,
        fields: [
          ...draft.register.fields,
          {
            id,
            section: newField.section,
            label: newField.label.trim(),
            inputType: newField.inputType ?? "text",
            placeholder: "",
            hint: "",
            required: newField.required,
            visible: true,
            order: sectionFields.length + 1,
            locked: false,
          },
        ],
      },
    });
    setNewField({ label: "", section: "customer", inputType: "text", required: false });
    setAddOpen(false);
  }

  function removeCustomField(field: CustomerFieldConfig) {
    if (!draft) return;
    setDraft({
      ...draft,
      register: {
        ...draft.register,
        fields: draft.register.fields.map((entry) =>
          entry.id === field.id
            ? { ...entry, visible: false, required: false }
            : entry,
        ),
      },
    });
    setDeletedFieldIds((ids) => [...new Set([...ids, field.id])]);
  }

  async function handleReset() {
    const result = await reset.run();
    if (result) {
      setDraft(result);
      remote.refresh();
      setResetOpen(false);
      toast.success("Configuration cleared", "The customer view is back to a blank slate.");
    }
  }

  const registerCopy = draft.register;
  const statusCopy = draft.status;
  const sortedBlocks = [...statusCopy.blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col">
      <AdminPageHeader
        title="Customer Fields"
        description={`What customers see on Register Warranty and Check Status. Last updated ${formatDateTime(draft.updatedAt)} by ${draft.updatedBy}.`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setAddOpen(true)}
              icon={<PlusIcon />}
            >
              Add custom field
            </Button>
            <Button
              variant="secondary"
              onClick={() => setResetOpen(true)}
              icon={<RefreshIcon className="text-base" />}
            >
              Clear configuration
            </Button>
            <Button
              onClick={handleSave}
              disabled={!dirty}
              loading={save.pending}
              loadingText="Saving…"
            >
              Save changes
            </Button>
          </>
        }
      />

      {save.error ? (
        <Alert tone="danger" title="Couldn't save" className="mb-4">
          {save.error}
        </Alert>
      ) : null}

      {dirty ? (
        <Alert tone="warning" title="Unsaved changes" className="mb-4">
          These edits are not live yet. Save to publish them to the public pages.
        </Alert>
      ) : null}

      <div className="flex flex-col gap-5">
        <CustomerJourneyPreview
          config={draft}
          photoRequirements={photoRequirements.data ?? []}
          onPatchField={patchField}
          onRemoveField={removeCustomField}
          onAddField={() => setAddOpen(true)}
        />

        <details hidden className="group rounded-xl border border-line bg-surface shadow-card">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <span>
              Advanced configuration
              <span className="ml-2 text-[13px] font-normal text-muted">
                Page copy, visibility, ordering and status result fields
              </span>
            </span>
            <ChevronDownIcon className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-5 border-t border-line p-5">
          <Card>
          <CardHeader
            title="Register Warranty — page copy"
            description="Shown above the three-step wizard."
          />
          <CardBody className="grid gap-4 sm:grid-cols-2">
                          <Input
              label="Heading"
              value={registerCopy.heading}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  register: { ...registerCopy, heading: event.target.value },
                })
              }
              required
            />
            <Textarea
              label="Sub-heading"
              rows={2}
              value={registerCopy.subheading}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  register: { ...registerCopy, subheading: event.target.value },
                })
              }
            />
          </CardBody>
        </Card>

        {SECTION_ORDER.map((sectionId) => {
          const section = registerCopy.sections.find(
            (entry) => entry.id === sectionId,
          );
          const fields = registerCopy.fields
            .filter((field) => field.section === sectionId)
            .sort((a, b) => a.order - b.order);
          if (!section) return null;

          return (
            <Card key={sectionId}>
              <CardHeader
                title={section.title || "Untitled section"}
                description={`${fields.filter((f) => f.visible).length} of ${fields.length} fields shown to customers`}
              />
              <CardBody className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Section title"
                    value={section.title}
                    onChange={(event) =>
                      patchSection(sectionId, { title: event.target.value })
                    }
                    required
                  />
                  <Input
                    label="Section description"
                    value={section.description}
                    onChange={(event) =>
                      patchSection(sectionId, {
                        description: event.target.value,
                      })
                    }
                  />
                </div>

                <ul className="flex flex-col gap-3">
                  {fields.map((field, index) => (
                    <li
                      key={field.id}
                      className="rounded-xl border border-line bg-canvas-soft p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted">
                            {field.id}
                          </code>
                          {field.locked ? (
                            <Badge tone="info">Always required</Badge>
                          ) : null}
                          {!field.visible ? (
                            <Badge tone="neutral">Hidden</Badge>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1">
                          <IconButton
                            label={`Move ${field.label} up`}
                            disabled={index === 0}
                            onClick={() => moveField(sectionId, field.id, -1)}
                          >
                            <ChevronUpIcon />
                          </IconButton>
                          <IconButton
                            label={`Move ${field.label} down`}
                            disabled={index === fields.length - 1}
                            onClick={() => moveField(sectionId, field.id, 1)}
                          >
                            <ChevronDownIcon />
                          </IconButton>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <Input
                          label="Label"
                          value={field.label}
                          onChange={(event) =>
                            patchField(field.id, { label: event.target.value })
                          }
                          required
                        />
                        <Input
                          label="Placeholder"
                          value={field.placeholder}
                          onChange={(event) =>
                            patchField(field.id, {
                              placeholder: event.target.value,
                            })
                          }
                        />
                        <Input
                          label="Help text"
                          value={field.hint}
                          onChange={(event) =>
                            patchField(field.id, { hint: event.target.value })
                          }
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-5">
                        <Checkbox
                          label="Show to customer"
                          checked={field.visible}
                          disabled={field.locked}
                          onChange={(event) =>
                            patchField(field.id, {
                              visible: event.target.checked,
                            })
                          }
                        />
                        <Checkbox
                          label="Required"
                          checked={field.required}
                          disabled={field.locked || !field.visible}
                          onChange={(event) =>
                            patchField(field.id, {
                              required: event.target.checked,
                            })
                          }
                        />
                        {!field.locked ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-sm text-danger-fg hover:underline"
                            onClick={() => removeCustomField(field)}
                          >
                            <TrashIcon />
                            Delete field
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          );
        })}

        <Card>
          <CardHeader
            title="Check Status — page copy"
            description="Shown on the public warranty lookup page."
          />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Heading"
              value={statusCopy.heading}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  status: { ...statusCopy, heading: event.target.value },
                })
              }
              required
            />
            <Input
              label="Search box placeholder"
              value={statusCopy.searchPlaceholder}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  status: {
                    ...statusCopy,
                    searchPlaceholder: event.target.value,
                  },
                })
              }
            />
            <Textarea
              label="Sub-heading"
              rows={2}
              value={statusCopy.subheading}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  status: { ...statusCopy, subheading: event.target.value },
                })
              }
            />
            <Textarea
              label="Help text under the search box"
              rows={2}
              value={statusCopy.helpText}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  status: { ...statusCopy, helpText: event.target.value },
                })
              }
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Installation Photos — customer requirements"
            description="These are the same photo cards customers see in step 3 of Register Warranty. Edit or reorder them from Photo Requirements in the sidebar."
          />
          <CardBody>
            {photoRequirements.initialLoading ? (
              <p className="text-sm text-muted">Loading photo requirements…</p>
            ) : photoRequirements.error ? (
              <Alert tone="danger" title="Couldn't load photo requirements">
                {photoRequirements.error}
              </Alert>
            ) : photoRequirements.data?.length ? (
              <ul className="grid gap-3 sm:grid-cols-3">
                {[...photoRequirements.data]
                  .sort((a, b) => a.order - b.order)
                  .map((requirement) => (
                    <li
                      key={requirement.id}
                      className="rounded-xl border border-line bg-canvas-soft p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">
                          {requirement.label}
                        </p>
                        <Badge tone={requirement.required ? "warning" : "neutral"}>
                          {requirement.required ? "Required" : "Optional"}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-muted">
                        {requirement.instructions}
                      </p>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                No photo requirements configured. Add them from Photo Requirements.
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Check Status — result details"
            description="Which rows a customer sees after looking up a warranty, and what they are called."
          />
          <CardBody>
            <ul className="flex flex-col gap-2">
              {sortedBlocks.map((block, index) => (
                <li
                  key={block.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas-soft px-4 py-3"
                >
                  <Input
                    label="Label"
                    value={block.label}
                    onChange={(event) =>
                      patchBlock(block.id, { label: event.target.value })
                    }
                    containerClassName="min-w-48 flex-1"
                    required
                  />
                  <Checkbox
                    label="Visible"
                    checked={block.visible}
                    disabled={block.locked}
                    onChange={(event) =>
                      patchBlock(block.id, { visible: event.target.checked })
                    }
                  />
                  <div className="flex items-center gap-1">
                    <IconButton
                      label={`Move ${block.label} up`}
                      disabled={index === 0}
                      onClick={() => moveBlock(block.id, -1)}
                    >
                      <ChevronUpIcon />
                    </IconButton>
                    <IconButton
                      label={`Move ${block.label} down`}
                      disabled={index === sortedBlocks.length - 1}
                      onClick={() => moveBlock(block.id, 1)}
                    >
                      <ChevronDownIcon />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
          </div>
        </details>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add custom customer field"
        description="This field will appear in the selected section of the public registration form."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addCustomField} disabled={!newField.label.trim()}>
              Add field
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Field label"
            value={newField.label}
            onChange={(event) =>
              setNewField({ ...newField, label: event.target.value })
            }
            placeholder="e.g. Customer GST Number"
            required
          />
          <Select
            label="Section"
            value={newField.section}
            onChange={(event) =>
              setNewField({
                ...newField,
                section: event.target.value as CustomerFieldSection,
              })
            }
            options={SECTION_ORDER.map((section) => ({
              value: section,
              label: section[0].toUpperCase() + section.slice(1),
            }))}
          />
          <Select
            label="Input type"
            value={newField.inputType}
            onChange={(event) =>
              setNewField({
                ...newField,
                inputType: event.target.value as CustomerFieldConfig["inputType"],
              })
            }
            options={[
              { value: "text", label: "Single line text" },
              { value: "textarea", label: "Long text" },
              { value: "date", label: "Date" },
            ]}
          />
          <Checkbox
            label="Required field"
            checked={newField.required}
            onChange={(event) =>
              setNewField({ ...newField, required: event.target.checked })
            }
          />
        </div>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Clear customer configuration?"
        description="Every label, placeholder, help text, visibility and order returns to a blank configuration. This cannot be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReset}
              loading={reset.pending}
              loadingText="Clearing…"
            >
              Clear configuration
            </Button>
          </>
        }
      >
        {reset.error ? (
          <Alert tone="danger" title="Couldn't clear">
            {reset.error}
          </Alert>
        ) : null}
      </Modal>
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-line bg-surface p-1.5 text-sm text-ink-soft transition-colors hover:bg-canvas disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function CustomerJourneyPreview({
  config,
  photoRequirements,
  onPatchField,
  onRemoveField,
  onAddField,
}: {
  config: CustomerExperienceConfig;
  photoRequirements: PhotoRequirement[];
  onPatchField: (id: string, patch: Partial<CustomerFieldConfig>) => void;
  onRemoveField: (field: CustomerFieldConfig) => void;
  onAddField: () => void;
}) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const steps = ["Verify", "Details", "Photos"];
  const sections = [...config.register.sections].sort((a, b) => a.order - b.order);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-canvas shadow-card">
      <PublicHeader />
      <main className="bg-canvas-soft px-3 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5 flex items-center justify-center gap-2 sm:gap-5">
            {steps.map((label, index) => (
              <div key={label} className="flex min-w-0 flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(index as 0 | 1 | 2)}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                    index === step
                      ? "border-brand-500 bg-brand-500 text-white"
                      : index < step
                        ? "border-success-line bg-success-bg text-success-fg"
                        : "border-line-strong bg-surface text-muted"
                  }`}
                >
                  {index < step ? <CheckIcon /> : index + 1}
                </button>
                <span
                  className={`hidden text-xs font-medium sm:block ${
                    index === step ? "text-ink" : "text-muted"
                  }`}
                >
                  {label}
                </span>
                {index < steps.length - 1 ? (
                  <span className="h-px flex-1 bg-line" />
                ) : null}
              </div>
            ))}
          </div>

          <div className="mx-auto max-w-xl">

            {step === 0 ? <PreviewVerifyScreen /> : null}
            {step === 1 ? (
              <PreviewDetailsScreen
                config={config}
                sections={sections}
                onPatchField={onPatchField}
                onRemoveField={onRemoveField}
                onAddField={onAddField}
              />
            ) : null}
            {step === 2 ? (
              <PreviewPhotosScreen requirements={photoRequirements} />
            ) : null}

            <div className="mt-5 flex justify-between gap-3">
              {step > 0 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setStep((current) => (current - 1) as 0 | 1 | 2)}
                  icon={<ArrowLeftIcon />}
                >
                  Back
                </Button>
              ) : <span />}
              <Button
                size="sm"
                onClick={() => {
                  if (step < 2) setStep((current) => (current + 1) as 0 | 1 | 2);
                }}
                iconAfter={<ChevronRightIcon />}
              >
                {step === 0
                  ? "Continue to Details"
                  : step === 1
                    ? "Continue to Photos"
                    : "Review Registration"}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

function PreviewVerifyScreen() {
  return (
    <Card className="shadow-none">
      <CardBody>
        <h4 className="text-base font-semibold text-ink">Verify Inverter Serial Number</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Enter the serial number found on the side of your Aurawatt inverter.
        </p>
        <Input
          className="mt-4"
          label="Serial Number"
          value="AW-LFP-51210086-10"
          placeholder="E.G. AW-8K-23X991"
          disabled
          monospace
        />
        <p className="mt-3 text-center text-[11px] text-faint">
          The serial number is printed on the side label of the inverter.
        </p>
      </CardBody>
    </Card>
  );
}

function PreviewDetailsScreen({
  config,
  sections,
  onPatchField,
  onRemoveField,
  onAddField,
}: {
  config: CustomerExperienceConfig;
  sections: CustomerExperienceConfig["register"]["sections"];
  onPatchField: (id: string, patch: Partial<CustomerFieldConfig>) => void;
  onRemoveField: (field: CustomerFieldConfig) => void;
  onAddField: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => {
        const fields = config.register.fields
          .filter((field) => field.section === section.id && field.visible)
          .sort((a, b) => a.order - b.order);
        return (
          <Card key={section.id} className="shadow-none">
            <CardHeader
              title={section.title || "Untitled section"}
              description={section.description}
              action={
                <Button variant="ghost" size="sm" onClick={onAddField} icon={<PlusIcon />}>
                  Add field
                </Button>
              }
            />
            <CardBody className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) =>
                <div
                  key={field.id}
                  className={field.inputType === "textarea" || field.id.includes("address") ? "sm:col-span-2" : undefined}
                >
                  {field.inputType === "textarea" ? (
                    <Textarea
                      label={field.label}
                      hint={field.hint}
                      placeholder={field.placeholder}
                      value=""
                      disabled
                      rows={2}
                      required={field.required}
                    />
                  ) : (
                    <Input
                      label={field.label}
                      hint={field.hint}
                      placeholder={field.placeholder}
                      value=""
                      disabled
                      type={field.inputType === "date" ? "date" : "text"}
                      required={field.required}
                    />
                  )}
                  <div className="mt-2 rounded-lg border border-dashed border-brand-200 bg-brand-50/40 p-2.5">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        label="Edit label"
                        value={field.label}
                        onChange={(event) =>
                          onPatchField(field.id, { label: event.target.value })
                        }
                      />
                      <Input
                        label="Placeholder"
                        value={field.placeholder}
                        onChange={(event) =>
                          onPatchField(field.id, { placeholder: event.target.value })
                        }
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <Checkbox
                        label="Required"
                        checked={field.required}
                        onChange={(event) =>
                          onPatchField(field.id, { required: event.target.checked })
                        }
                      />
                      <div className="flex items-center gap-2">
                        <Badge tone={field.locked ? "info" : "neutral"}>
                          {field.locked ? "Built-in field" : "Custom field"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveField(field)}
                          icon={<TrashIcon />}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>,
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

function PreviewPhotosScreen({
  requirements,
}: {
  requirements: PhotoRequirement[];
}) {
  return (
    <Card className="shadow-none">
      <CardHeader
        title="Installation Photos"
        description="Our engineers review these photos before the warranty is activated."
        action={
          <span className="text-xs font-medium text-muted">
            0 / {requirements.filter((item) => item.required).length} required
          </span>
        }
      />
      <CardBody className="flex flex-col gap-3">
        {[...requirements]
          .sort((a, b) => a.order - b.order)
          .map((requirement) => (
            <div key={requirement.id} className="rounded-xl border border-line p-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">{requirement.label}</p>
                {requirement.required ? <Badge tone="warning">Required</Badge> : null}
              </div>
              <p className="mt-1 text-xs text-muted">{requirement.instructions}</p>
              <div className="mt-3 flex min-h-24 flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-canvas-soft text-center">
                <CameraIcon className="text-muted" />
                <p className="mt-1 text-xs text-muted">Drag a photo here, or Browse files</p>
                <p className="mt-1 text-[10px] text-faint">JPG, PNG or WEBP · up to 10.0 MB</p>
              </div>
            </div>
          ))}
        {requirements.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong p-5 text-center text-xs text-muted">
            No photo requirements configured.
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
