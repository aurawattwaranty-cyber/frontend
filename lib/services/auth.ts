import { apiRequest, registerApiErrorHandler } from "@/lib/api/client";
import type { AdminUser } from "@/lib/types";
import {
  clearStoredSessionToken,
  setStoredSessionToken,
} from "@/lib/services/session-token";

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

export interface CreateAdminInput {
  name: string;
  email: string;
  password: string;
  role: "admin" | "verifier";
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

function setCachedSession(next: AdminUser | null): void {
  cachedSession = next;
  notify();
}

export function invalidateSession(): void {
  sessionRequestId += 1;
  sessionLoadPromise = null;
  cachedSession = null;
  clearStoredSessionToken();
  notify();
}

async function syncSessionFromApi(): Promise<void> {
  if (sessionLoadPromise) return sessionLoadPromise;
  const requestId = ++sessionRequestId;
  sessionLoadPromise = apiRequest<{ user: AdminUser | null }>("/auth/session", {
    method: "GET",
  })
    .then((response) => {
      if (requestId !== sessionRequestId) return;
      if (response.user) {
        setCachedSession(response.user);
        return;
      }
      invalidateSession();
    })
    .catch(() => {
      if (requestId !== sessionRequestId) return;
      if (cachedSession === undefined) {
        invalidateSession();
      }
    })
    .finally(() => {
      if (requestId === sessionRequestId) notify();
      sessionLoadPromise = null;
    });
  return sessionLoadPromise;
}

registerApiErrorHandler((error, path) => {
  if (error.code !== "session_expired" && error.code !== "unauthorized") {
    return;
  }
  if (path === "/auth/login") return;
  invalidateSession();
});

if (typeof window !== "undefined") {
  void syncSessionFromApi();
}

export function getSession(): AdminUser | null | undefined {
  return cachedSession;
}

export async function refreshSession(): Promise<AdminUser | null> {
  await syncSessionFromApi();
  return cachedSession ?? null;
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
  setStoredSessionToken(response.token);
  setCachedSession(response.user);
  return response.user;
}

export async function logout(): Promise<void> {
  try {
    // Keep the token in place until the API receives the logout request.
    await apiRequest<{ ok: boolean }>("/auth/logout", { method: "POST" });
  } catch {
    // Local sign-out must still succeed if the server is currently unreachable.
  } finally {
    invalidateSession();
  }
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await apiRequest<{ items: AdminUser[] }>("/auth/users");
  return response.items;
}

export async function requestAdminAccess(
  input: CreateAdminInput,
): Promise<AdminUser> {
  const response = await apiRequest<{ item: AdminUser }>("/auth/access-requests", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.item;
}

export async function createAdminUser(input: CreateAdminInput): Promise<AdminUser> {
  const response = await apiRequest<{ item: AdminUser }>("/auth/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.item;
}

export async function authorizeAdminUser(id: string, active: boolean): Promise<AdminUser> {
  const response = await apiRequest<{ item: AdminUser }>(
    `/auth/users/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ active }) },
  );
  return response.item;
}
