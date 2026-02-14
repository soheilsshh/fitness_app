import { configureStore } from "@reduxjs/toolkit";
import exampleReducer from "./slices/exampleSlice";
import cartReducer from "./slices/cartSlice";

export const store = configureStore({
  reducer: {
    example: exampleReducer,
    cart: cartReducer,
  },
});
