import { useMemo } from "react";
import { encodeQr, qrToSvgPath, type EccLevel } from "@/lib/qr/encoder";
import { cn } from "@/lib/utils/cn";

/**
 * Renders a scannable QR code as inline SVG — no network request, no canvas,
 * and it stays crisp when the certificate is printed.
 */
export function QrCode({
  value,
  size = 160,
  ecc = "M",
  margin = 2,
  className,
  title,
}: {
  value: string;
  /** Rendered edge length in pixels. */
  size?: number;
  ecc?: EccLevel;
  /** Quiet zone in modules. The spec requires at least 4 for standalone codes. */
  margin?: number;
  className?: string;
  title?: string;
}) {
  const { path, dimension } = useMemo(() => {
    const code = encodeQr(value, ecc);
    return {
      path: qrToSvgPath(code),
      dimension: code.size + margin * 2,
    };
  }, [value, ecc, margin]);

  return (
    <svg
      viewBox={`0 0 ${dimension} ${dimension}`}
      width={size}
      height={size}
      role="img"
      aria-label={title ?? `QR code for ${value}`}
      shapeRendering="crispEdges"
      className={cn("block", className)}
    >
      <rect width={dimension} height={dimension} fill="#ffffff" />
      <g transform={`translate(${margin} ${margin})`} fill="currentColor">
        <path d={path} />
      </g>
    </svg>
  );
}
