import CoachLandingClient from "./_components/CoachLandingClient";

export default async function PublicCoachPage({ params }) {
  const { slug } = await params;
  return <CoachLandingClient slug={slug} />;
}
