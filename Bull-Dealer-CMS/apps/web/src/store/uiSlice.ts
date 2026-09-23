import { createSlice, PayloadAction } from "@reduxjs/toolkit";
const ui = createSlice({
  name: "ui",
  initialState: {
    category: "All equipment",
    query: "",
    enquiryOpen: false,
    selectedProduct: "",
    menuOpen: false,
  },
  reducers: {
    setCategory: (s, a: PayloadAction<string>) => {
      s.category = a.payload;
    },
    setQuery: (s, a: PayloadAction<string>) => {
      s.query = a.payload;
    },
    openEnquiry: (s, a: PayloadAction<string>) => {
      s.enquiryOpen = true;
      s.selectedProduct = a.payload;
      s.menuOpen = false;
    },
    closeEnquiry: (s) => {
      s.enquiryOpen = false;
    },
    toggleMenu: (s) => {
      s.menuOpen = !s.menuOpen;
    },
    closeMenu: (s) => {
      s.menuOpen = false;
    },
  },
});

export const actions = ui.actions;
export default ui.reducer;
