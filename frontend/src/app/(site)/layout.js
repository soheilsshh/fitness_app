import Navbar from "./_components/Navbar";

export default function SiteLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Navbar />
      {children}
    </div>
  );
}
