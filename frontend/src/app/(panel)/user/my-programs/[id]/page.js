import { lazyPage } from "@/lib/lazy-page";

const ProgramDetailsClient = lazyPage(() => import("../_components/ProgramDetailsClient"));

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function ProgramDetailsPage() {
  return <ProgramDetailsClient />;
}
