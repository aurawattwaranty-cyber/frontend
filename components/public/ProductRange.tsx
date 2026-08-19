import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/icons";
import { SectionHeading } from "@/components/public/SectionHeading";

interface Series {
  name: string;
  range: string;
  term: string;
  body: string;
  serialPrefix: string;
  featured?: boolean;
}

const SERIES: Series[] = [
  {
    name: "HybridPro",
    range: "3kW · 5kW · 7.5kW",
    term: "60 months",
    body: "Residential rooftops and small commercial sites. Single-phase hybrid inverters with battery-ready DC coupling.",
    serialPrefix: "AW-HI-3KW / 5KW / 7KW",
  },
  {
    name: "HybridMax",
    range: "10kW · 15kW",
    term: "84 months",
    body: "Larger homes, farmhouses and light industrial loads. Three-phase output with higher surge headroom.",
    serialPrefix: "AW-HI-10KW / 15KW",
    featured: true,
  },
  {
    name: "HybridUltra",
    range: "20kW",
    term: "120 months",
    body: "Industrial installations running continuous critical loads, with the longest coverage term Aurawatt offers.",
    serialPrefix: "AW-HI-20KW",
  },
];

export function ProductRange() {
  return (
    <section className="border-y border-line bg-canvas-soft">
      <div className="mx-auto w-full max-w-6xl px-4 py-18 sm:px-6 sm:py-24">
        <SectionHeading
          eyebrow="The range"
          title="Every Aurawatt hybrid inverter is covered."
          description="Your coverage term is set by the series you own. The serial number on the side of the unit tells you which one it is."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {SERIES.map((series) => (
            <article
              key={series.name}
              className={
                series.featured
                  ? "relative flex flex-col rounded-2xl border border-brand-200 bg-surface p-6 shadow-raised"
                  : "relative flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-card"
              }
            >
              {series.featured ? (
                <span className="absolute -top-2.5 left-6 rounded-full bg-brand-500 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase">
                  Most installed
                </span>
              ) : null}

              <h3 className="font-display text-xl font-bold tracking-tight">
                AuraWatt {series.name}
              </h3>
              <p className="mt-1 font-mono text-[13px] text-brand-600">
                {series.range}
              </p>

              <p className="mt-4 flex-1 text-[14px] leading-relaxed text-pretty text-muted">
                {series.body}
              </p>

              <dl className="mt-6 grid gap-3 border-t border-line pt-5">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[12px] tracking-wide text-muted uppercase">
                    Warranty term
                  </dt>
                  <dd className="font-display text-lg font-bold tracking-tight text-ink">
                    {series.term}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] tracking-wide text-muted uppercase">
                    Serial starts with
                  </dt>
                  <dd className="mt-1 font-mono text-[12px] break-all text-ink-soft">
                    {series.serialPrefix}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/register" className={buttonClasses("primary", "lg")}>
            Register your inverter
            <ArrowRightIcon className="text-base" />
          </Link>
        </div>
      </div>
    </section>
  );
}
