import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { CheckoutPage } from "./CheckoutPage.jsx";
import "./styles.css";
import "./checkout.css";

const isCheckout = window.location.pathname.replace(/\/$/, '') === '/checkout';

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isCheckout ? <CheckoutPage /> : <App />}
  </React.StrictMode>,
);
