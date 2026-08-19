import Link from "next/link";
import { BarcodeIcon, CameraIcon, FileTextIcon } from "@/components/icons";
import { SectionHeading } from "@/components/public/SectionHeading";

const STEPS = [
  {
    number: "01",
    icon: <BarcodeIcon />,
    title: "Verify Serial",
    body: "Enter your Aurawatt hybrid inverter serial number. Our system instantly verifies the model and capacity to begin registration.",
  },
  {
    number: "02",
    icon: <FileTextIcon />,
    title: "Installation Details",
    body: "Provide customer information and details about your certified Aurawatt installer. This links the equipment to your property.",
  },
  {
    number: "03",
    icon: <CameraIcon />,
    title: "Photo Upload",
    body: "Upload required photos of the installation, wiring and site. Our engineers review these to ensure compliance and safety.",
  },
] as const;

export function RegistrationSteps() {
  return (
    <section className="bg-canvas-soft">
      <div className="mx-auto w-full max-w-6xl px-4 py-18 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow="How it works"
          title="Registration Process"
          description="Activate your warranty in three simple steps. Ensure you have your serial number and installation photos ready."
        />

        <ol className="relative mt-12 grid gap-5 lg:grid-cols-3">
          {/* Connector rail — the three steps are one sequence, not three cards. */}
          <span
            aria-hidden="true"
            className="absolute top-0 left-6 hidden h-px w-[calc(100%-3rem)] translate-y-11 bg-gradient-to-r from-brand-200 via-brand-200 to-transparent lg:block"
          />

          {STEPS.map((step) => (
            <li
              key={step.number}
              className="relative rounded-2xl border border-line bg-surface p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-raised"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-xl text-white shadow-[0_10px_24px_-12px_rgba(226,98,13,0.9)]">
                  {step.icon}
                </span>
                <span className="font-display text-2xl font-bold tracking-tight text-line-strong">
                  {step.number}
                </span>
              </div>

              <h3 className="mt-5 font-display text-[17px] font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-pretty text-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-10 text-center text-[13px] text-muted">
          Already registered?{" "}
          <Link
            href="/status"
            className="rounded font-medium text-brand-600 underline-offset-4 hover:underline"
          >
            Check your warranty status
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
