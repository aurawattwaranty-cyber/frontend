/**
 * Warranty certificate delivery.
 *
 * Production generates the PDF server-side (`GET /warranties/:id/certificate`).
 * Until that endpoint renders the designed certificate we open the print-ready
 * certificate route, which the browser saves as a PDF — the button is never
 * inert, and the saved file matches the certificate shown on screen.
 */

export function certificateUrl(warrantyId: string): string {
  return `/certificate/${encodeURIComponent(warrantyId)}`;
}

/** Certificate route that opens the print dialog once the sheet has rendered. */
export function certificatePrintUrl(warrantyId: string): string {
  return `${certificateUrl(warrantyId)}?print=1`;
}

export function verificationPath(warrantyId: string): string {
  return `/verify/${encodeURIComponent(warrantyId)}`;
}

/** Absolute URL printed on the certificate and encoded into the QR code. */
export function verificationUrl(warrantyId: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "https://warranty.aurawatt.in");
  return `${origin}${verificationPath(warrantyId)}`;
}

export async function downloadWarrantyCertificate(
  warrantyId: string,
): Promise<void> {
  if (typeof window === "undefined") return;

  const target = certificatePrintUrl(warrantyId);
  const tab = window.open(target, "_blank", "noopener,noreferrer");

  // Popup blockers hand back null — fall back to the current tab so the
  // button always ends at a printable certificate.
  if (!tab) window.location.assign(target);
}
