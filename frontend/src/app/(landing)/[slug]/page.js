import { notFound } from "next/navigation";
import { isReservedPublicSlug } from "@/lib/routes/reserved-slugs";
import CoachLandingClient from "./_components/CoachLandingClient";

export default async function PublicCoachLandingPage({ params }) {
  const { slug } = await params;

  if (isReservedPublicSlug(slug)) {
    notFound();
  }

  return <CoachLandingClient slug={slug} />;
}