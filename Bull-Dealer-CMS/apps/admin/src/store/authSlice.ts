import { createSlice } from "@reduxjs/toolkit";
let saved: any = null;
try {
  saved = JSON.parse(sessionStorage.getItem("bull-session") || "null");
} catch {}
const slice = createSlice({
  name: "auth",
  initialState: { token: saved?.token || "", user: saved?.user || null },
  reducers: {
    signedIn: (s, a) => {
      s.token = a.payload.token;
      s.user = a.payload.user;
    },
    signedOut: (s) => {
      s.token = "";
      s.user = null;
    },
  },
});
export const { signedIn, signedOut } = slice.actions;
export default slice.reducer;
