import { redirect } from "next/navigation";

export default function UserPanelIndex() {
  redirect("/admin/dashboard");
}
