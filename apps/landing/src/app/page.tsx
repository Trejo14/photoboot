import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Logos } from "@/components/logos";
import { Features } from "@/components/features";
import { Download } from "@/components/download";
import { HowItWorks } from "@/components/how-it-works";
import { Pricing } from "@/components/pricing";
import { Testimonials } from "@/components/testimonials";
import { Faq } from "@/components/faq";
import { FinalCta } from "@/components/final-cta";
import { Footer } from "@/components/footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Logos />
        <Features />
        <Download />
        <HowItWorks />
        <Pricing />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}