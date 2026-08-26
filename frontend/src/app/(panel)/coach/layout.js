import CoachPanelLayout from "./_components/CoachPanelLayout";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function CoachLayout({ children }) {
  return <CoachPanelLayout>{children}</CoachPanelLayout>;
}
