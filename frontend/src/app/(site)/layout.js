import Navbar from "./_components/Navbar";
import ScrollToTop from "./_components/ScrollToTop";

export default function SiteLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <Navbar />
      {children}
      <ScrollToTop />
    </div>
  );
}
