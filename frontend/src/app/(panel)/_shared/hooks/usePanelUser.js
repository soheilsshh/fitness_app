"use client";

import { useEffect, useState } from "react";
import { getAuthSession } from "@/lib/auth/session";
import { api } from "@/lib/axios/client";

function getInitials(name) {
  if (!name) return "؟";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0] || ""}${parts[1][0] || ""}`;
}

export function usePanelUser({ fetchProfile = true } = {}) {
  const [user, setUser] = useState(() => {
    const session = getAuthSession();
    if (!session) return null;
    return {
      name: session.name || "کاربر",
      email: "",
      avatar: "",
      role: session.role || "",
      initials: getInitials(session.name),
    };
  });

  useEffect(() => {
    if (!fetchProfile) return;

    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await api.get("/auth/me");
        if (cancelled) return;

        const data = res.data || {};
        const session = getAuthSession();
        const name = data.name || session?.name || "کاربر";

        setUser({
          name,
          email: data.email || data.phone || "",
          avatar: data.avatarUrl || data.avatar || "",
          role: data.role || session?.role || "",
          initials: getInitials(name),
        });
      } catch {
        // keep session fallback when profile fetch fails
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [fetchProfile]);

  return user;
}
