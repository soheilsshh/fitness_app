import AdminPanelLayout from "./_components/AdminPanelLayout";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <AdminPanelLayout>{children}</AdminPanelLayout>;
}
