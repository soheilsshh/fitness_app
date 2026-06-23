import { notFound } from "next/navigation";
import { isReservedPublicSlug } from "@/lib/routes/reserved-slugs";
import { lazyPage } from "@/lib/lazy-page";

const CoachLandingClient = lazyPage(() => import("./_components/CoachLandingClient"));

export async function generateStaticParams() {
  return [{ slug: "placeholder" }];
}

export default async function PublicCoachLandingPage({ params }) {
  const { slug } = await params;

  if (isReservedPublicSlug(slug)) {
    notFound();
  }

  return <CoachLandingClient slug={slug} />;
}