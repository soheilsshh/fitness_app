"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function PanelShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-8xl md:pl-12 md:pr-5">
        <div className="flex">
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />

          <div className="min-w-0 flex-1">
            <Topbar
              onOpenMobile={() => setMobileOpen(true)}
              collapsed={collapsed}
            />

            <main className="px-4 pb-10 pt-6 md:px-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
