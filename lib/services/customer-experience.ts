import { apiRequest } from "@/lib/api/client";
import { notifyApiRevision } from "@/lib/api/revision";
import type {
  CustomerExperienceConfig,
  CustomerFieldConfig,
  CustomerFieldSection,
  CustomerSectionConfig,
  StatusBlockConfig,
} from "@/lib/types";

export interface CustomerExperienceUpdate {
  register?: {
    heading?: string;
    subheading?: string;
    sections?: Partial<CustomerSectionConfig>[];
    fields?: Partial<CustomerFieldConfig>[];
  };
  status?: {
    heading?: string;
    subheading?: string;
    searchPlaceholder?: string;
    helpText?: string;
    blocks?: Partial<StatusBlockConfig>[];
  };
}

/** Public config — visible entries only, already ordered by the API. */
export async function getCustomerExperience(): Promise<CustomerExperienceConfig> {
  const response = await apiRequest<{ item: CustomerExperienceConfig }>(
    "/customer-experience",
  );
  return response.item;
}

/** Full config including hidden entries — super admin only. */
export async function getCustomerExperienceForAdmin(): Promise<CustomerExperienceConfig> {
  const response = await apiRequest<{ item: CustomerExperienceConfig }>(
    "/customer-experience/admin",
  );
  return response.item;
}

export async function saveCustomerExperience(
  update: CustomerExperienceUpdate,
): Promise<CustomerExperienceConfig> {
  const response = await apiRequest<{ item: CustomerExperienceConfig }>(
    "/customer-experience",
    { method: "PUT", body: JSON.stringify(update) },
  );
  notifyApiRevision();
  return response.item;
}

export async function resetCustomerExperience(): Promise<CustomerExperienceConfig> {
  const response = await apiRequest<{ item: CustomerExperienceConfig }>(
    "/customer-experience/reset",
    { method: "POST" },
  );
  notifyApiRevision();
  return response.item;
}

/* ------------------------------------------------------------------ *
 * Render helpers shared by the public pages
 * ------------------------------------------------------------------ */

export type FieldLookup = (id: string) => CustomerFieldConfig | undefined;

export function buildFieldLookup(
  config: CustomerExperienceConfig | null,
): FieldLookup {
  if (!config) return () => undefined;
  const index = new Map(config.register.fields.map((f) => [f.id, f]));
  return (id) => index.get(id);
}

/**
 * Resolves what a field should render as, falling back to the component's own
 * defaults while the config request is still in flight.
 *
 * `props` is spreadable straight onto an Input/Select; `visible` is kept out of
 * it so it never reaches the DOM.
 */
export interface ResolvedField {
  visible: boolean;
  props: {
    label: string;
    placeholder?: string;
    hint?: string;
    required: boolean;
  };
}

export function fieldProps(
  lookup: FieldLookup,
  id: string,
  fallback: { label: string; placeholder?: string; hint?: string },
): ResolvedField {
  const config = lookup(id);

  if (!config) {
    return {
      visible: true,
      props: {
        label: fallback.label,
        ...(fallback.placeholder ? { placeholder: fallback.placeholder } : {}),
        ...(fallback.hint ? { hint: fallback.hint } : {}),
        required: true,
      },
    };
  }

  return {
    visible: config.visible || config.locked,
    props: {
      label: config.label,
      ...(config.placeholder ? { placeholder: config.placeholder } : {}),
      ...(config.hint ? { hint: config.hint } : {}),
      required: config.required,
    },
  };
}

export function sectionCopy(
  config: CustomerExperienceConfig | null,
  id: CustomerFieldSection,
  fallback: { title: string; description: string },
): { title: string; description: string } {
  const section = config?.register.sections.find((entry) => entry.id === id);
  return section
    ? { title: section.title, description: section.description }
    : fallback;
}

export function isBlockVisible(
  config: CustomerExperienceConfig | null,
  id: string,
): boolean {
  const block = config?.status.blocks.find((entry) => entry.id === id);
  return block ? block.visible || block.locked : true;
}

export function blockLabel(
  config: CustomerExperienceConfig | null,
  id: string,
  fallback: string,
): string {
  return config?.status.blocks.find((entry) => entry.id === id)?.label ?? fallback;
}
