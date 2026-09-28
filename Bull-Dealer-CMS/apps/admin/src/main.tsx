import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./store";
import { AppRoutes } from "./routes/AppRoutes";
import "./styles/admin.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter basename="/admin">
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
import "./styles/dashboard.css";
import "./styles/editor.css";
