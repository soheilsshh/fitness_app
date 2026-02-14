import Hero from "./_components/Hero";
import ProgramsSection from "./_components/ProgramsSection";
import RecordsSection from "./_components/RecordsSection";
import AboutSection from "./_components/AboutSection";
import ContactSection from "./_components/ContactSection";
import Footer from "./_components/Footer";
import Navbar from "./_components/Navbar";

export default function HomePage() {
  return (
    <main className="relative bg-black text-white overflow-x-hidden">
      <Navbar />
      <section id="home" className="scroll-mt-24">
        <Hero />
      </section>

      <ProgramsSection />
      <RecordsSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
