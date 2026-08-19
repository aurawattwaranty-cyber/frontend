const STORAGE_KEY = "aurawatt.sessionToken";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredSessionToken(): string | null {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredSessionToken(token: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Ignore storage failures and fall back to the cookie/session cache.
  }
}

export function clearStoredSessionToken(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures and fall back to the cookie/session cache.
  }
}
