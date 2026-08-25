import { redirect } from "next/navigation";
import { FUNNEL_PATH } from "@/lib/funnel/offer";

/** Legacy path — keep old links working. */
export default function LegacyLeadFunnelRedirect() {
  redirect(FUNNEL_PATH);
}
