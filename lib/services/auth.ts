import { apiRequest } from "@/lib/api/client";
import type { AdminUser } from "@/lib/types";

/**
 * Admin session handling.
 *
 * The UI only ever asks this module whether a session exists, so moving to
 * httpOnly cookies + a real `/auth/login` endpoint is contained here. No
 * credentials or tokens are hard-coded into components.
 */

export interface LoginInput {
  email: string;
  password: string;
  remember: boolean;
}

/**
 * Cached snapshot so `useSyncExternalStore` sees a stable reference between
 * renders. `undefined` means "session not checked yet".
 */
let cachedSession: AdminUser | null | undefined;
let sessionLoadPromise: Promise<void> | null = null;
let sessionRequestId = 0;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

async function syncSessionFromApi(): Promise<void> {
  if (sessionLoadPromise) return sessionLoadPromise;
  const requestId = ++sessionRequestId;
  sessionLoadPromise = apiRequest<{ user: AdminUser | null }>("/auth/session", {
    method: "GET",
  })
    .then((response) => {
      if (requestId === sessionRequestId) {
        cachedSession = response.user;
      }
    })
    .catch(() => {
      if (requestId === sessionRequestId) {
        cachedSession = null;
      }
    })
    .finally(() => {
      if (requestId === sessionRequestId) {
        notify();
      }
      sessionLoadPromise = null;
    });
  return sessionLoadPromise;
}

if (typeof window !== "undefined") {
  void syncSessionFromApi();
}

export function getSession(): AdminUser | null | undefined {
  return cachedSession;
}

export function subscribeToSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function login(input: LoginInput): Promise<AdminUser> {
  const response = await apiRequest<{
    user: AdminUser;
    token: string;
    expiresAt: string;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      remember: input.remember,
    }),
  });
  sessionRequestId += 1;
  cachedSession = response.user;
  notify();
  return response.user;
}

export function logout(): Promise<void> {
  sessionRequestId += 1;
  cachedSession = null;
  notify();
  return apiRequest<{ ok: boolean }>("/auth/logout", {
    method: "POST",
  })
    .catch(() => undefined)
    .then(() => undefined);
}
