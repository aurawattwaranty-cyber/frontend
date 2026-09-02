import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * Shared Aurawatt logo used across the public experience and certificates.
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
    sm: { icon: 34, title: "text-[12px]", subtitle: "text-[8px]" },
    md: { icon: 44, title: "text-[17px]", subtitle: "text-[10px]" },
    lg: { icon: 56, title: "text-[22px]", subtitle: "text-[12px]" },
  }[size];

  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-2", className)}
    >
      <Image
        src="/aurawatt_logo.webp"
        alt="Aurawatt"
        width={sizes.icon}
        height={sizes.icon}
        priority={size !== "sm"}
        className="shrink-0 object-contain"
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display font-bold tracking-[0.12em]",
            sizes.title,
            tone === "brand" ? "text-navy-900" : "text-white",
          )}
        >
          AURAWATT
        </span>
        <span
          className={cn(
            "mt-1 font-medium tracking-wide",
            sizes.subtitle,
            tone === "brand" ? "text-navy-700" : "text-white/70",
          )}
        >
          Your Power Partner
        </span>
      </span>
    </span>
  );
}
