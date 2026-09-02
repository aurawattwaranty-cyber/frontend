import type { ReactNode } from "react";
import {
  ClockIcon,
  FileTextIcon,
  QrIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { SectionHeading } from "@/components/public/SectionHeading";

const BENEFITS: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <ShieldCheckIcon />,
    title: "Warranty Coverage",
    body: "Added assurance for your Aurawatt inverter.",
  },
  {
    icon: <FileTextIcon />,
    title: "Product on Record",
    body: "Keep your product details registered with Aurawatt.",
  },
  {
    icon: <QrIcon />,
    title: "Simple & Convenient",
    body: "A quick registration process for your peace of mind.",
  },
  {
    icon: <ClockIcon />,
    title: "Support When Needed",
    body: "Aurawatt support for your product and warranty needs.",
  },
];

export function WhyRegister() {
  return (
    <section className="bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-18 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow="Why it matters"
          title="Registration is what turns a purchase into a warranty."
          description="An unregistered inverter is still a quality Aurawatt inverter. Registration simply helps activate your warranty coverage and keeps your product details securely on record. It only takes a few minutes to complete."
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit.title}
              className="group relative overflow-hidden rounded-2xl border border-line bg-canvas-soft p-6 transition-colors hover:border-brand-200 hover:bg-surface"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
              />
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-600">
                {benefit.icon}
              </span>
              <h3 className="mt-5 font-display text-[17px] font-semibold tracking-tight">
                {benefit.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-pretty text-muted">
                {benefit.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
