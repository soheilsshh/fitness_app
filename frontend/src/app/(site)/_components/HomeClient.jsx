"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/axios/client";
import Hero from "./Hero";
import { SectionLoader } from "@/components/ui/page-loader";

// These render real page content (H1/H2s, coach links, contact info) so they
// must be part of the initial static HTML for crawlers — ssr:false previously
// meant the whole homepage below the fold was invisible to Googlebot.
const MotionConfig = dynamic(() =>
  import("framer-motion").then((mod) => mod.MotionConfig)
);

// Pure decoration (scroll-position bar), reads window only inside an effect.
// Must stay ssr:true like its siblings — mixing ssr:false with ssr:true
// dynamic() imports at the same tree level shifts React's useId() sequence
// between the server and client render, breaking hydration for any sibling
// that calls useId() (e.g. ContactSection's form field ids).
const ScrollProgress = dynamic(() =>
  import("./landingEffects").then((mod) => mod.ScrollProgress)
);

const ProgramsSection = dynamic(() => import("./ProgramsSection"), {
  loading: () => <SectionLoader />,
});

const RecordsSection = dynamic(() => import("./RecordsSection"), {
  loading: () => <SectionLoader className="min-h-[420px]" />,
});

const AboutSection = dynamic(() => import("./AboutSection"), {
  loading: () => <SectionLoader className="min-h-[360px]" />,
});

const ContactSection = dynamic(() => import("./ContactSection"), {
  loading: () => <SectionLoader className="min-h-[320px]" />,
});

const Footer = dynamic(() => import("./Footer"), {
  loading: () => <SectionLoader className="min-h-[200px]" />,
});

export default function HomeClient({ initialSettings = null, initialCoaches = [] }) {
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/site-settings");
        if (!cancelled) setSettings(res.data);
      } catch {
        if (!cancelled && !initialSettings) setSettings(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative overflow-x-hidden bg-background text-foreground">
        <ScrollProgress />
        <section id="home" className="scroll-mt-24">
          <Hero />
        </section>
        {settings?.showCoachesSection ? (
          <ProgramsSection initialCoaches={initialCoaches} />
        ) : null}
        <RecordsSection />
        <AboutSection />
        <ContactSection contactInfo={settings?.contactInfo} />
        <Footer />
      </main>
    </MotionConfig>
  );
}
