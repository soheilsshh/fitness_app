"use client";

import { Provider } from "react-redux";
import { ThemeProvider } from "@/components/theme-provider";
import { DirectionProvider } from "@/components/ui/direction";
import { store } from "@/store/store";

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <DirectionProvider direction="rtl">{children}</DirectionProvider>
      </ThemeProvider>
    </Provider>
  );
}
