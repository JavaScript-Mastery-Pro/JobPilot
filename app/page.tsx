import { getCurrentUser } from "@/lib/auth";
import { Features } from "@/components/homepage/Features";
import { Hero } from "@/components/homepage/Hero";
import { HowItWorks } from "@/components/homepage/HowItWorks";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export default async function Home() {
  const user = await getCurrentUser();
  const isLoggedIn = Boolean(user);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-base pt-16">
        <Hero isLoggedIn={isLoggedIn} />
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </>
  );
}
