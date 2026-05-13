import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/homepage/Hero";
import { HowItWorks } from "@/components/homepage/HowItWorks";
import { Features } from "@/components/homepage/Features";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 bg-base">
        <Hero />
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </>
  );
}
