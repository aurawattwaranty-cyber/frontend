"use client";

const listeners = new Set<() => void>();
let revision = 0;

export function getApiRevision(): number {
  return revision;
}

export function subscribeApiRevision(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyApiRevision(): void {
  revision += 1;
  listeners.forEach((listener) => listener());
}
