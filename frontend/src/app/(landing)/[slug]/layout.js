import Navbar from "@/app/(site)/_components/Navbar";

export default function CoachLandingLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Navbar />
      {children}
    </div>
  );
}
