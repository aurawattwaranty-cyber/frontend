import { cn } from "@/lib/utils/cn";
import { ShieldCheckIcon } from "@/components/icons";

/**
 * Aurawatt wordmark. The trailing full stop is part of the mark.
 */
export function Logo({
  className,
  size = "md",
  tone = "brand",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  tone?: "brand" | "light";
}) {
  const sizes = {
    sm: { text: "text-[15px]", icon: "text-base" },
    md: { text: "text-lg", icon: "text-xl" },
    lg: { text: "text-2xl", icon: "text-2xl" },
  }[size];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-display font-bold tracking-tight",
        tone === "brand" ? "text-brand-500" : "text-white",
        sizes.text,
        className,
      )}
    >
      <ShieldCheckIcon className={cn("shrink-0", sizes.icon)} strokeWidth={2} />
      <span>
        Aurawatt<span className="text-brand-400">.</span>
      </span>
    </span>
  );
}
