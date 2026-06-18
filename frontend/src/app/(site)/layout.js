import Navbar from "./_components/Navbar";

export default function SiteLayout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      {children}
    </div>
  );
}
