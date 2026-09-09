let csrfToken: string | null = null;

/**
 * This value is derived by the API from the HttpOnly JWT. It is intentionally
 * memory-only: it protects unsafe cookie-authenticated requests without
 * turning the browser into durable storage for credentials.
 */
export function getCsrfToken(): string | null {
  return csrfToken;
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}
