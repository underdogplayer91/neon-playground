import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { CheckoutPage } from "./CheckoutPage.jsx";
import { PaymentStatusPage } from "./PaymentStatusPage.jsx";
import { initMetaPixel } from "./metaPixel.js";
import "./styles.css";
import "./checkout.css";

const isCheckout = window.location.pathname.replace(/\/$/, '') === '/checkout';
const isPaymentStatus = window.location.pathname.replace(/\/$/, '') === '/payment-status';

initMetaPixel();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isPaymentStatus ? <PaymentStatusPage /> : isCheckout ? <CheckoutPage /> : <App />}
  </React.StrictMode>,
);
