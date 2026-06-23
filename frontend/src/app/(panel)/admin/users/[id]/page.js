import { lazyPage } from "@/lib/lazy-page";

const UserDetailsClient = lazyPage(() => import("./_components/UserDetailsClient"));

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default async function AdminUserDetailsPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  console.log("AdminUserDetailsPage params:", id);

  return <UserDetailsClient id={id} />;
}
