"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CustomerExperienceConfig,
  CustomerFieldConfig,
  CustomerFieldSection,
  CustomerSectionConfig,
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
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Input, Textarea } from "@/components/ui/Field";
import { Alert, CardSkeleton, EmptyState } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  RefreshIcon,
  SlidersIcon,
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

  const [draft, setDraft] = useState<CustomerExperienceConfig | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const save = useMutation(saveCustomerExperience);
  const reset = useMutation(resetCustomerExperience);

  // The editor works on a local copy so nothing is written until Save.
  useEffect(() => {
    if (remote.data) setDraft(remote.data);
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

  async function handleReset() {
    const result = await reset.run();
    if (result) {
      setDraft(result);
      remote.refresh();
      setResetOpen(false);
      toast.success("Restored defaults", "The customer view is back to factory copy.");
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
              onClick={() => setResetOpen(true)}
              icon={<RefreshIcon className="text-base" />}
            >
              Restore defaults
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

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Restore default customer view?"
        description="Every label, placeholder, help text, visibility and order returns to the copy Aurawatt shipped. This cannot be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReset}
              loading={reset.pending}
              loadingText="Restoring…"
            >
              Restore defaults
            </Button>
          </>
        }
      >
        {reset.error ? (
          <Alert tone="danger" title="Couldn't restore">
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
