import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Shared eyebrow + title + lede used by every marketing section, so the home
 * page reads as one rhythm rather than a stack of one-off headers.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className,
      )}
    >
      {eyebrow ? (
        <span
          className={cn(
            "text-[11px] font-semibold tracking-[0.16em] uppercase",
            tone === "dark" ? "text-brand-400" : "text-brand-600",
          )}
        >
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={cn(
          "font-display text-[26px] leading-tight font-bold tracking-tight text-balance sm:text-[34px]",
          tone === "dark" && "text-white",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "text-[15px] leading-relaxed text-pretty",
            tone === "dark" ? "text-white/65" : "text-muted",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
