/* eslint-disable @next/next/no-img-element -- Evidence photos are client-side
   data URLs (and, once the storage API is connected, signed remote URLs). The
   Next image optimiser cannot process either, so a plain <img> is correct here. */

import { cn } from "@/lib/utils/cn";

export function EvidenceImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
