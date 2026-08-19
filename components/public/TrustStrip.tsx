const STATS = [
  { value: "Up to 10 yrs", label: "Warranty coverage" },
  { value: "3 steps", label: "To register online" },
  { value: "48 hrs", label: "Typical review time" },
  { value: "Pan-India", label: "Certified installer network" },
] as const;

/**
 * Sits directly beneath the hero and carries the weight of the fold — a plain
 * band of facts rather than another card grid, so it reads as substance.
 */
export function TrustStrip() {
  return (
    <section className="border-b border-line bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={[
                "px-5 py-7 text-center sm:py-9",
                // Interior rules only, so the band never shows a stray edge.
                index % 2 === 1 ? "border-l border-line" : "",
                index > 1 ? "border-t border-line" : "",
                "lg:border-t-0",
                index > 0 ? "lg:border-l" : "lg:border-l-0",
              ].join(" ")}
            >
              <dt className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                {stat.value}
              </dt>
              <dd className="mt-1.5 text-[12px] tracking-wide text-muted uppercase">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
