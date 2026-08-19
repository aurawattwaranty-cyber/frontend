import { ServiceError } from "@/lib/services/errors";

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(
  /\/$/,
  "",
);
const developmentApiBaseUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4000/api"
    : undefined;

export const API_BASE_URL = configuredApiBaseUrl ?? developmentApiBaseUrl;

function assertApiBaseUrl(): string {
  if (API_BASE_URL) return API_BASE_URL;
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is not configured. Set it to your deployed backend URL, for example https://api.example.com/api.",
  );
}

export function buildApiUrl(path: string): string {
  const baseUrl = assertApiBaseUrl();
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readErrorMessage(response: Response): Promise<{
  message: string;
  code?: string;
}> {
  const fallback = {
    message:
      "Something went wrong on our side. Please try again in a moment.",
    code: undefined,
  };

  try {
    const raw = await response.text();
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as {
      error?: { message?: string; code?: string };
      message?: string;
      code?: string;
    };
    const error = parsed.error;
    return {
      message: error?.message ?? parsed.message ?? fallback.message,
      code: error?.code ?? parsed.code,
    };
  } catch {
    return fallback;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    credentials: "include",
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const error = await readErrorMessage(response);
    throw new ServiceError(error.message, error.code ?? "api_error");
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

export async function apiBlob(
  path: string,
  init: RequestInit = {},
): Promise<Blob> {
  const response = await fetch(buildApiUrl(path), {
    credentials: "include",
    ...init,
    headers: {
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const error = await readErrorMessage(response);
    throw new ServiceError(error.message, error.code ?? "api_error");
  }

  return response.blob();
}
