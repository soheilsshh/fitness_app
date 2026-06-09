import { createSelector, createSlice } from "@reduxjs/toolkit";

const initialState = {
  coachId: null,
  coachName: "",
  coachSlug: "",
  items: [], // { id, planId, title, price, qty, coachId, coachName, coachSlug }
};

function calcQty(items) {
  return items.reduce((acc, it) => acc + (it.qty || 0), 0);
}

function calcTotal(items) {
  return items.reduce((acc, it) => acc + (it.price || 0) * (it.qty || 0), 0);
}

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action) {
      const p = action.payload;
      // { id, planId, title, price, coachId, coachName?, coachSlug? }
      const planId = String(p.planId ?? p.id);
      const coachId = p.coachId ? String(p.coachId) : null;

      if (state.items.length > 0 && coachId && state.coachId && state.coachId !== coachId) {
        return;
      }

      if (coachId) {
        state.coachId = coachId;
        state.coachName = p.coachName || state.coachName || "";
        state.coachSlug = p.coachSlug || state.coachSlug || "";
      }

      const cartKey = planId;
      const found = state.items.find((x) => x.id === cartKey);
      if (found) found.qty += 1;
      else {
        state.items.push({
          id: cartKey,
          planId: Number(p.planId ?? p.id),
          title: p.title,
          price: p.price,
          qty: 1,
          coachId: coachId || state.coachId,
          coachName: p.coachName || state.coachName,
          coachSlug: p.coachSlug || state.coachSlug,
        });
      }
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
    setQty(state, action) {
      const { id, qty } = action.payload;
      const found = state.items.find((x) => x.id === id);
      if (!found) return;
      found.qty = Math.max(1, Number(qty) || 1);
    },
    clearCart(state) {
      state.items = [];
      state.coachId = null;
      state.coachName = "";
      state.coachSlug = "";
    },
  },
});

export const { addToCart, removeFromCart, setQty, clearCart } = cartSlice.actions;

export const selectCartItems = (s) => s.cart.items;

const selectCartCoachId = (s) => s.cart.coachId;
const selectCartCoachName = (s) => s.cart.coachName;
const selectCartCoachSlug = (s) => s.cart.coachSlug;

export const selectCartCoach = createSelector(
  [selectCartCoachId, selectCartCoachName, selectCartCoachSlug],
  (coachId, coachName, coachSlug) => ({ coachId, coachName, coachSlug })
);

export const selectCartCount = (s) => calcQty(s.cart.items);
export const selectCartTotal = (s) => calcTotal(s.cart.items);

export default cartSlice.reducer;
