"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

const headerIconBtn =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-full " +
  "border border-border bg-card text-muted-foreground shadow-none " +
  "transition-[transform,background-color,border-color] duration-200 " +
  "hover:bg-muted/80 hover:text-foreground active:scale-[0.97] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PanelHeader({ title, subtitle }) {
  return (
    <header className="sticky top-0 z-40 flex h-(--header-height) shrink-0 items-center border-b bg-background/95 backdrop-blur transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-3 lg:px-6">
        <SidebarTrigger className="-ms-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-full"
        />
        <div className="min-w-0 flex-1 text-start">
          <h1 className="truncate text-base font-semibold">{title}</h1>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <ThemeToggle buttonClassName={headerIconBtn} />
      </div>
    </header>
  );
}
