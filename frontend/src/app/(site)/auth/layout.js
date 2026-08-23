import AuthShell from "./_components/AuthShell";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }) {
  return <AuthShell>{children}</AuthShell>;
}
