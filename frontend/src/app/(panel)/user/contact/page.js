import { lazyPage } from "@/lib/lazy-page";

const ContactClient = lazyPage(() => import("./_components/ContactClient"));

export default function ContactToCoachPage() {
  return <ContactClient />;
}