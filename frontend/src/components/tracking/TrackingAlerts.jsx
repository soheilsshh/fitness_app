"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function TrackingAlerts({ alerts = [], title = "هشدار پایش" }) {
  if (!alerts?.length) return null;

  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {alerts.map((alert, i) => (
        <Card
          key={`${alert.type}-${i}`}
          className="border-amber-500/40 bg-amber-500/10"
        >
          <CardContent className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-start">
              <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
                {title}
              </p>
              <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-100/90">
                {alert.message}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
