import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Fitino",
  description: "پلتفرم مربیگری و تناسب اندام Fitino",
  other: {
    enamad: "780027",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body>
        <TooltipProvider>
        <Providers>{children}</Providers>
        </TooltipProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
