import { Hero } from "@/components/public/Hero";
import { TrustStrip } from "@/components/public/TrustStrip";
import { WhyRegister } from "@/components/public/WhyRegister";
import { RegistrationSteps } from "@/components/public/RegistrationSteps";
import { WarrantyFaq } from "@/components/public/WarrantyFaq";
import { HomeCta } from "@/components/public/HomeCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <WhyRegister />
      <RegistrationSteps />
      <WarrantyFaq />
      <HomeCta />
    </>
  );
}
