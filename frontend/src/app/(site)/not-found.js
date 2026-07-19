import Footer from "./_components/Footer";
import NotFoundView from "./_components/NotFoundView";

export const metadata = {
  title: "صفحه پیدا نشد | فیتینو",
  description: "این صفحه در فیتینو وجود ندارد.",
};

/** Used when notFound() is called inside (site) — Navbar comes from site layout. */
export default function SiteNotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <NotFoundView />
      <Footer />
    </div>
  );
}
