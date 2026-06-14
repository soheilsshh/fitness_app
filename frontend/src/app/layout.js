import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Fitness Platform",
  description: "Fitness Platform",
}

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
