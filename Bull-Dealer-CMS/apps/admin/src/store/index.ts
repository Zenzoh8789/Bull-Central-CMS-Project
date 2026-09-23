import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import auth from "./authSlice";
import { api } from "../services/api";
export const store = configureStore({
  reducer: { auth, [api.reducerPath]: api.reducer },
  middleware: (g) => g().concat(api.middleware),
});
store.subscribe(() => {
  const auth = store.getState().auth;
  if (auth.token) sessionStorage.setItem("bull-session", JSON.stringify(auth));
  else sessionStorage.removeItem("bull-session");
});
export const useAppSelector =
  useSelector.withTypes<ReturnType<typeof store.getState>>();
export const useAppDispatch = useDispatch.withTypes<typeof store.dispatch>();
