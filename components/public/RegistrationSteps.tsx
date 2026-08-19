import Link from "next/link";

const STEPS = [
  {
    number: "1",
    title: "Verify Serial",
    body: "Enter your Aurawatt hybrid inverter serial number. Our system instantly verifies the model and capacity to begin registration.",
  },
  {
    number: "2",
    title: "Installation Details",
    body: "Provide customer information and details about your certified Aurawatt installer. This links the equipment to your property.",
  },
  {
    number: "3",
    title: "Photo Upload",
    body: "Upload required photos of the installation, wiring and site. Our engineers review these to ensure compliance and safety.",
  },
] as const;

export function RegistrationSteps() {
  return (
    <section className="bg-canvas-soft">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">
            Registration Process
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Activate your warranty in three simple steps. Ensure you have your
            serial number and installation photos ready.
          </p>
        </div>

        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="rounded-xl border border-line bg-surface p-5 shadow-card transition-shadow hover:shadow-raised"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-[13px] font-semibold text-brand-600">
                {step.number}
              </span>
              <h3 className="mt-4 text-[15px] font-semibold">{step.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-center text-[13px] text-muted">
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
