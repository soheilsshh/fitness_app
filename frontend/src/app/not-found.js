import Navbar from "./(site)/_components/Navbar";
import Footer from "./(site)/_components/Footer";
import NotFoundView from "./(site)/_components/NotFoundView";

export const metadata = {
  title: "صفحه پیدا نشد | فیتینو",
  description: "این صفحه در فیتینو وجود ندارد.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <Navbar />
      <NotFoundView />
      <Footer />
    </div>
  );
}
