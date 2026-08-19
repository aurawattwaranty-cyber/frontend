import { ChevronDownIcon } from "@/components/icons";
import { SectionHeading } from "@/components/public/SectionHeading";

const FAQS = [
  {
    q: "Where do I find my serial number?",
    a: "It is printed on a label on the side of the inverter, and repeated on the box and the delivery invoice. Aurawatt serials start with AW-HI- followed by the capacity, for example AW-HI-5KW-24001.",
  },
  {
    q: "How long do I have to register?",
    a: "Register as soon as the installation is complete. Coverage is calculated from the installation date you enter, not from the date you register, so a late registration does not extend your term.",
  },
  {
    q: "What photos do I need to upload?",
    a: "Six required photos: the inverter front, the serial number label, the battery connection, the solar DC input, the AC grid connection and a wide shot of the site. Earthing and installer photos are optional but speed up review.",
  },
  {
    q: "How long does approval take?",
    a: "Most registrations are reviewed within two working days. If something in the evidence is unclear, we ask for a correction rather than rejecting it, and you can re-upload from the status page.",
  },
  {
    q: "What if my registration needs a correction?",
    a: "Look up your warranty ID on Check Status. The page lists exactly what needs re-uploading, and resubmitting puts you straight back into the review queue.",
  },
  {
    q: "Can someone else verify my warranty?",
    a: "Yes. Every approved certificate carries a public verification link and QR code that shows the coverage status without exposing your personal details.",
  },
] as const;

export function WarrantyFaq() {
  return (
    <section className="bg-surface">
      <div className="mx-auto w-full max-w-3xl px-4 py-18 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow="Questions"
          title="Before you register"
          description="The things installers and customers ask us most often."
        />

        <div className="mt-10 divide-y divide-line border-y border-line">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left">
                <span className="text-[15px] font-medium text-balance text-ink">
                  {faq.q}
                </span>
                <ChevronDownIcon className="shrink-0 text-base text-muted transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-[14px] leading-relaxed text-pretty text-muted">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
