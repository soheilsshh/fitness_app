import { redirect } from "next/navigation";

/**
 * Legacy/shadcn demo route. Real auth lives at /auth.
 * Keep this redirect so bookmarks and mistaken /login links still work.
 */
export default function LoginAliasPage() {
  redirect("/auth");
}
