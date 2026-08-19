import { Hero } from "@/components/public/Hero";
import { TrustStrip } from "@/components/public/TrustStrip";
import { WhyRegister } from "@/components/public/WhyRegister";
import { RegistrationSteps } from "@/components/public/RegistrationSteps";
import { ProductRange } from "@/components/public/ProductRange";
import { WarrantyFaq } from "@/components/public/WarrantyFaq";
import { HomeCta } from "@/components/public/HomeCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <WhyRegister />
      <RegistrationSteps />
      <ProductRange />
      <WarrantyFaq />
      <HomeCta />
    </>
  );
}
