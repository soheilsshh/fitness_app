"use client";

import { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";
import { api } from "@/lib/axios/client";
import Hero from "./Hero";
import ProgramsSection from "./ProgramsSection";
import RecordsSection from "./RecordsSection";
import AboutSection from "./AboutSection";
import ContactSection from "./ContactSection";
import Footer from "./Footer";
import { ScrollProgress } from "./landingEffects";

export default function HomeClient() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/site-settings");
        if (!cancelled) setSettings(res.data);
      } catch {
        if (!cancelled) setSettings(null);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative overflow-x-hidden bg-background text-foreground">
        <ScrollProgress />
        <section id="home" className="scroll-mt-24">
          <Hero settings={settings} />
        </section>
        <ProgramsSection />
        <RecordsSection stats={settings?.stats} />
        <AboutSection steps={settings?.steps} />
        <ContactSection contactInfo={settings?.contactInfo} />
        <Footer />
      </main>
    </MotionConfig>
  );
}
