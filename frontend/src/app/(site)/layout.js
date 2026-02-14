import Navbar from "./_components/Navbar";

export default function SiteLayout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <Navbar />
      {children}
    </div>
  );
}
