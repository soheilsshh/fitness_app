"use client";

import PanelAuthGate from "@/app/(panel)/_shared/gates/PanelAuthGate";
import StudentOnboardingGate from "@/app/(panel)/_shared/gates/StudentOnboardingGate";
import { ROLES } from "@/lib/auth/roles";
import UserPanelShell from "./UserPanelShell";

export default function UserPanelLayout({ children }) {
  return (
    <PanelAuthGate requiredRole={ROLES.STUDENT}>
      <UserPanelShell gate={StudentOnboardingGate}>{children}</UserPanelShell>
    </PanelAuthGate>
  );
}
