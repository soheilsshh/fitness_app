import { redirect } from "next/navigation";

/**
 * Legacy/shadcn demo route — duplicated `(site)/auth/register`. Real signup
 * lives at /auth. Keep this redirect so bookmarks and mistaken /signup links
 * still work, and to avoid duplicate-content pages.
 */
export default function SignupAliasPage() {
  redirect("/auth");
}
