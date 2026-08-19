/**
 * Errors surfaced by the service layer.
 *
 * Every message is written for an end user — no stack traces, status codes or
 * internal identifiers ever reach the UI.
 */
export class ServiceError extends Error {
  readonly code: string;

  constructor(message: string, code = "service_error") {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}

const FALLBACK_MESSAGE =
  "Something went wrong on our side. Please try again in a moment.";

/** Converts anything thrown into a message that is safe to display. */
export function toUserMessage(error: unknown): string {
  if (error instanceof ServiceError) return error.message;
  if (error instanceof Error && error.message && error.message.length < 160) {
    return error.message;
  }
  return FALLBACK_MESSAGE;
}
