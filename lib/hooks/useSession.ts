"use client";

import { useSyncExternalStore } from "react";
import type { AdminUser } from "@/lib/types";
import { getSession, subscribeToSession } from "@/lib/services/auth";

/**
 * Current admin session.
 *
 * Returns `undefined` until the browser snapshot is available (server render
 * and first hydration pass), then `AdminUser | null`. Callers must treat
 * `undefined` as "still checking" rather than "signed out".
 */
export function useSession(): AdminUser | null | undefined {
  return useSyncExternalStore(
    subscribeToSession,
    getSession,
    () => undefined,
  );
}
