import UserPanelLayout from "./_components/UserPanelLayout";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return <UserPanelLayout>{children}</UserPanelLayout>;
}
