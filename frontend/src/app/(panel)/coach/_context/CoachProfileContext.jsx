"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getCoachProfile } from "@/lib/api/coach";

const CoachProfileContext = createContext(null);

export function isCoachApproved(status) {
  return status === "approved";
}

export function isCoachRestricted(status) {
  return status === "pending" || status === "reviewing";
}

export function CoachProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCoachProfile();
      setProfile(data);
      return data;
    } catch {
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const value = useMemo(
    () => ({
      profile,
      status: profile?.status || "pending",
      loading,
      refreshProfile,
      isApproved: isCoachApproved(profile?.status),
      isRestricted: isCoachRestricted(profile?.status),
    }),
    [profile, loading, refreshProfile],
  );

  return (
    <CoachProfileContext.Provider value={value}>
      {children}
    </CoachProfileContext.Provider>
  );
}

export function useCoachProfile() {
  const ctx = useContext(CoachProfileContext);
  if (!ctx) {
    throw new Error("useCoachProfile must be used within CoachProfileProvider");
  }
  return ctx;
}
