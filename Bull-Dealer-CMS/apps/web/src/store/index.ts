import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice";
import { api } from "../services/siteApi";
export const store = configureStore({
  reducer: { ui: uiReducer, [api.reducerPath]: api.reducer },
  middleware: (g) => g().concat(api.middleware),
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
