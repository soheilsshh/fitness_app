import { createSlice } from "@reduxjs/toolkit";

const initialState = { value: 0 };

const exampleSlice = createSlice({
  name: "example",
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    addBy: (state, action) => {
      state.value += action.payload;
    },
  },
});

export const { increment, addBy } = exampleSlice.actions;
export default exampleSlice.reducer;
