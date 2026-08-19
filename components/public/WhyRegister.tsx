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
    title: "Full-term coverage",
    body: "Registration activates the complete warranty term for your inverter — parts, labour and replacement — counted from the day it was installed.",
  },
  {
    icon: <FileTextIcon />,
    title: "A certificate on record",
    body: "Once approved you get a downloadable warranty certificate carrying your serial number, model and coverage window.",
  },
  {
    icon: <QrIcon />,
    title: "Verifiable anywhere",
    body: "Every certificate carries a public verification link and QR code, so a service engineer can confirm coverage on the spot.",
  },
  {
    icon: <ClockIcon />,
    title: "Faster service claims",
    body: "With your installation already on file, a support request skips the paperwork and goes straight to the engineering queue.",
  },
];

export function WhyRegister() {
  return (
    <section className="bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-18 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow="Why it matters"
          title="Registration is what turns a purchase into a warranty."
          description="An unregistered inverter is still a good inverter. It just isn't a covered one. Registering takes a few minutes and stays on record for the life of the unit."
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
