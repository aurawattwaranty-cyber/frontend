import { ChevronDownIcon } from "@/components/icons";
import { SectionHeading } from "@/components/public/SectionHeading";

const FAQS = [
  {
    q: "Where can I find my serial number?",
    a: "Your inverter’s serial number can be found on the product label. Keep it handy while registering your product.",
  },
  {
    q: "What information is required for registration?",
    a: "You may need your product and installation details to complete the warranty registration.",
  },
  {
    q: "Do I need to upload installation photos?",
    a: "If installation photos are requested during registration, please keep clear and relevant photos ready.",
  },
  {
    q: "How do I know if my registration is complete?",
    a: "Once your registration is submitted, you can check the status through the warranty management system.",
  },
  {
    q: "What if I enter incorrect information?",
    a: "If any registration details need to be corrected, contact Aurawatt support for assistance.",
  },
  {
    q: "How can I check my warranty details?",
    a: "Use the warranty management system to view your registered product and available warranty information.",
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
