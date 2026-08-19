"use client";

import { useAsync } from "@/lib/hooks/useAsync";
import { getCustomerExperience } from "@/lib/services/customer-experience";
import type { CustomerExperienceConfig } from "@/lib/types";

/**
 * Loads the super-admin-managed configuration for the public pages.
 *
 * Returns `null` while in flight or if the request fails — every caller falls
 * back to its own built-in copy, so the form is never blocked on this.
 */
export function useCustomerExperience(): CustomerExperienceConfig | null {
  return useAsync<CustomerExperienceConfig>(getCustomerExperience, []).data;
}
