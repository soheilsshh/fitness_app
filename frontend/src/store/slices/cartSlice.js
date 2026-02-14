import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [], // { id, title, price, qty }
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
      const p = action.payload; // {id,title,price}
      const found = state.items.find((x) => x.id === p.id);
      if (found) found.qty += 1;
      else state.items.push({ ...p, qty: 1 });
    },
    removeFromCart(state, action) {
      const id = action.payload;
      state.items = state.items.filter((x) => x.id !== id);
    },
    setQty(state, action) {
      const { id, qty } = action.payload;
      const found = state.items.find((x) => x.id === id);
      if (!found) return;
      found.qty = Math.max(1, Number(qty) || 1);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, setQty, clearCart } = cartSlice.actions;

export const selectCartItems = (s) => s.cart.items;
export const selectCartCount = (s) => calcQty(s.cart.items);
export const selectCartTotal = (s) => calcTotal(s.cart.items);

export default cartSlice.reducer;
