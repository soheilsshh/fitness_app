import { useEffect, useRef, useState } from "react";

export interface JourneyStep {
  id: string;
  label: string;
}

interface JourneyRailProps {
  steps: JourneyStep[];
}

const JourneyRail = ({ steps }: JourneyRailProps) => {
  const [activeId, setActiveId] = useState(steps[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const elements = steps
      .map((step) => document.getElementById(step.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.25, 0.5, 0.75] }
    );

    elements.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, [steps]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="مسیر صفحه"
      className="fixed end-6 top-1/2 z-30 hidden -translate-y-1/2 xl:flex"
    >
      <ol className="relative flex flex-col items-end">
        <span className="rail-line absolute end-[7px] top-2 bottom-2" aria-hidden />
        {steps.map((step) => {
          const isActive = step.id === activeId;
          return (
            <li key={step.id} className="group relative flex items-center gap-3 py-2.5">
              <span
                className={`pointer-events-none whitespace-nowrap rounded-full border border-white/10 bg-[#0e0e0e]/80 px-3 py-1 text-xs font-semibold backdrop-blur-md transition-all duration-300 ${
                  isActive
                    ? "translate-x-0 text-[#26fce3] opacity-100"
                    : "translate-x-2 text-muted-foreground opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                }`}
              >
                {step.label}
              </span>
              <button
                type="button"
                onClick={() => scrollTo(step.id)}
                aria-current={isActive}
                aria-label={step.label}
                className="relative flex h-4 w-4 cursor-pointer items-center justify-center"
              >
                <span className={`rail-dot ${isActive ? "is-active" : ""}`} />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default JourneyRail;
