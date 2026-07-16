import { redirect } from "next/navigation";

/** Legacy path — keep old links working. */
export default function LegacyLeadFunnelRedirect() {
  redirect("/ali-rashidabadi");
}
