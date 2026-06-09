import { createSelector, createSlice } from "@reduxjs/toolkit";

const initialState = {
  coachId: null,
  coachName: "",
  coachSlug: "",
  items: [], // max 1 plan: { id, planId, title, price, coachId, coachName, coachSlug }
};

function calcTotal(items) {
  return items.reduce((acc, it) => acc + (it.price || 0), 0);
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action) {
      const p = action.payload;
      const planId = String(p.planId ?? p.id);
      const coachId = p.coachId ? String(p.coachId) : null;

      if (state.items.length > 0 && coachId && state.coachId && state.coachId !== coachId) {
        return;
      }

      const existing = state.items.find((x) => x.id === planId);
      if (existing) return;

      if (coachId) {
        state.coachId = coachId;
        state.coachName = p.coachName || state.coachName || "";
        state.coachSlug = p.coachSlug || state.coachSlug || "";
      }

      state.items = [
        {
          id: planId,
          planId: Number(p.planId ?? p.id),
          title: p.title,
          price: p.price,
          coachId: coachId || state.coachId,
          coachName: p.coachName || state.coachName,
          coachSlug: p.coachSlug || state.coachSlug,
        },
      ];
    },
    removeFromCart(state, action) {
      const id = action.payload;
      state.items = state.items.filter((x) => x.id !== id);
      if (state.items.length === 0) {
        state.coachId = null;
        state.coachName = "";
        state.coachSlug = "";
      }
    },
    clearCart(state) {
      state.items = [];
      state.coachId = null;
      state.coachName = "";
      state.coachSlug = "";
    },
  },
});

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;

export const selectCartItems = (s) => s.cart.items;

const selectCartCoachId = (s) => s.cart.coachId;
const selectCartCoachName = (s) => s.cart.coachName;
const selectCartCoachSlug = (s) => s.cart.coachSlug;

export const selectCartCoach = createSelector(
  [selectCartCoachId, selectCartCoachName, selectCartCoachSlug],
  (coachId, coachName, coachSlug) => ({ coachId, coachName, coachSlug })
);

export const selectCartCount = (s) => s.cart.items.length;
export const selectCartTotal = (s) => calcTotal(s.cart.items);

export default cartSlice.reducer;
