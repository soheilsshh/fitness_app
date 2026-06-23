"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from "@/components/theme-provider";
import { DirectionProvider } from "@/components/ui/direction";
import { store } from "@/store/store";
import { hydrateCart } from "@/store/slices/cartSlice";
import CoachLegacyUrlRedirect from "@/components/CoachLegacyUrlRedirect";

const CART_STORAGE_KEY = "fitino_cart_v1";

export default function Providers({ children }) {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        store.dispatch(hydrateCart(JSON.parse(raw)));
      }
    } catch {
      // ignore corrupt cart data
    }

    return store.subscribe(() => {
      try {
        const cart = store.getState().cart;
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch {
        // ignore quota / private mode errors
      }
    });
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider>
        <DirectionProvider direction="rtl">
          <CoachLegacyUrlRedirect />
          {children}
        </DirectionProvider>
      </ThemeProvider>
    </Provider>
  );
}
