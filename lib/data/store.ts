import { createSeedDatabase, DB_VERSION, type Database } from "./seed";

/**
 * Browser-persisted demo datastore.
 *
 * Everything the services read and write goes through here, so swapping the
 * services over to the Node/Express API is a change to `lib/services/*` only —
 * no page or component touches this module directly.
 */

const STORAGE_KEY = "aurawatt.wms.db.v1";

let cache: Database | null = null;
let revision = 0;
let persistenceDisabled = false;
const listeners = new Set<() => void>();

function canPersist(): boolean {
  return typeof window !== "undefined" && !persistenceDisabled;
}

function load(): Database {
  if (typeof window === "undefined") {
    // Server render: hand back a fresh seed. Client components re-read after
    // mount, so persisted demo state always wins in the browser.
    return createSeedDatabase();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Database;
      if (parsed?.version === DB_VERSION && Array.isArray(parsed.registrations)) {
        return parsed;
      }
    }
  } catch {
    // Corrupt or unreadable storage — fall through to a clean seed.
  }

  const seeded = createSeedDatabase();
  persist(seeded);
  return seeded;
}

function persist(db: Database): void {
  if (!canPersist()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Typically a storage quota error from photo data URLs. Continue in memory
    // so the session stays usable; state simply won't survive a reload.
    persistenceDisabled = true;
  }
}

/** Current database snapshot. Treat the result as read-only. */
export function getDatabase(): Database {
  if (!cache) cache = load();
  return cache;
}

/** Applies a mutation, persists it, and notifies subscribers. */
export function mutate<T>(mutator: (db: Database) => T): T {
  const db = getDatabase();
  const result = mutator(db);
  revision += 1;
  persist(db);
  listeners.forEach((listener) => listener());
  return result;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Monotonic revision counter — lets hooks refetch after any mutation. */
export function getRevision(): number {
  return revision;
}

/** Restores the demo dataset. Exposed through the admin shell. */
export function resetDatabase(): void {
  cache = createSeedDatabase();
  revision += 1;
  persistenceDisabled = false;
  persist(cache);
  listeners.forEach((listener) => listener());
}

/** Deep clone so callers can never mutate stored records by reference. */
export function clone<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);
}

let idCounter = 0;

export function createId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${idCounter.toString(36)}`;
}

/** Simulated network latency so loading states are exercised realistically. */
export function delay(ms = 260): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
