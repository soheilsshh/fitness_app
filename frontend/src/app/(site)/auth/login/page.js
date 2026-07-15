import { redirect } from "next/navigation";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params?.next) qs.set("next", params.next);
  if (params?.redirect) qs.set("redirect", params.redirect);
  const suffix = qs.toString();
  redirect(suffix ? `/auth?${suffix}` : "/auth");
}
