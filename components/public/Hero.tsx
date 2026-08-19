import Image from "next/image";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { ArrowRightIcon, BoltIcon, SearchIcon } from "@/components/icons";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#0b1526_0%,#070f1c_55%,#0b1526_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_78%_38%,rgba(226,98,13,0.22),transparent_68%)]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1fr_minmax(0,0.9fr)] lg:items-center lg:gap-12 lg:py-20">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-[13px] font-medium text-white/85 backdrop-blur-sm">
            <BoltIcon className="text-brand-400" />
            Hybrid Inverter Warranty Portal
          </span>

          <h1 className="mt-6 text-[2.25rem] leading-[1.08] font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
            Protect your energy.
            <br />
            <span className="text-brand-400">Secure your future.</span>
          </h1>

          <div className="mt-6 h-px w-16 bg-brand-500" />

          <p className="mt-6 text-[15px] leading-relaxed text-white/70 sm:text-base">
            Register your Aurawatt hybrid inverter to activate your
            comprehensive warranty. Industrial-grade protection for your
            industrial-grade equipment.
          </p>

          <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className={buttonClasses(
                "primary",
                "lg",
                "sm:w-auto shadow-[0_14px_32px_-18px_rgba(226,98,13,0.9)]",
              )}
            >
              Register Warranty
              <ArrowRightIcon className="text-base" />
            </Link>
            <Link
              href="/status"
              className={buttonClasses(
                "dark",
                "lg",
                "border border-white/18 bg-white/8 backdrop-blur-sm hover:bg-white/14 sm:w-auto",
              )}
            >
              Check Status
              <SearchIcon className="text-base" />
            </Link>
          </div>
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(60%_60%_at_50%_45%,rgba(226,98,13,0.28),transparent_70%)] blur-2xl"
          />
          <div className="relative aspect-[9/10] overflow-hidden rounded-2xl border border-white/10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
            <Image
              src="/hero.png"
              alt="Aurawatt hybrid inverter and battery protected by a warranty shield"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
              // The source artwork is a full banner with marketing copy baked
              // into its left half; anchoring right crops to the product only.
              style={{ objectPosition: "100% 50%" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
