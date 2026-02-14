import UserDetailsClient from "./_components/UserDetailsClient";

export default async function AdminUserDetailsPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  console.log("AdminUserDetailsPage params:", id);

  return <UserDetailsClient id={id} />;
}
