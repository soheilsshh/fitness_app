"use client";

import { useSyncExternalStore } from "react";
import { listPlansSnapshot, subscribePlans } from "./plansStore";

const EMPTY = [];

export function usePlans() {
  const plans = useSyncExternalStore(subscribePlans, listPlansSnapshot, () => EMPTY);
  return { plans };
}
