type ClassValue = string | number | bigint | boolean | null | undefined;

/**
 * Joins conditional class names, dropping anything that isn't a non-empty
 * string. Guard expressions like `count && "mt-2"` are safe to pass directly.
 */
export function cn(...classes: ClassValue[]): string {
  return classes
    .filter((value): value is string => typeof value === "string" && value !== "")
    .join(" ");
}
