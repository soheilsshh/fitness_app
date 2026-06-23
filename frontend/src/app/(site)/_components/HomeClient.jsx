"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/axios/client";
import Hero from "./Hero";
import { SectionLoader } from "@/components/ui/page-loader";

const MotionConfig = dynamic(
  () => import("framer-motion").then((mod) => mod.MotionConfig),
  { ssr: false }
);

const ScrollProgress = dynamic(
  () => import("./landingEffects").then((mod) => mod.ScrollProgress),
  { ssr: false }
);

const ProgramsSection = dynamic(() => import("./ProgramsSection"), {
  loading: () => <SectionLoader />,
  ssr: false,
});

const RecordsSection = dynamic(() => import("./RecordsSection"), {
  loading: () => <SectionLoader className="min-h-[420px]" />,
  ssr: false,
});

const AboutSection = dynamic(() => import("./AboutSection"), {
  loading: () => <SectionLoader className="min-h-[360px]" />,
  ssr: false,
});

const ContactSection = dynamic(() => import("./ContactSection"), {
  loading: () => <SectionLoader className="min-h-[320px]" />,
  ssr: false,
});

const Footer = dynamic(() => import("./Footer"), {
  loading: () => <SectionLoader className="min-h-[200px]" />,
  ssr: false,
});

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
    return () => {
      cancelled = true;
    };
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
        <AboutSection steps={settings?.steps} pillars={settings?.pillars} />
        <ContactSection contactInfo={settings?.contactInfo} />
        <Footer />
      </main>
    </MotionConfig>
  );
}
