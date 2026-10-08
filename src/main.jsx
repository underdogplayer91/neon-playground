import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { getMetaAttribution, initMetaPixel } from "./metaPixel.js";
import { resolvePage } from './landingRoutes.js';

const pages = {
  home: lazy(() => import('./HomePage.jsx').then((module) => ({ default: module.HomePage }))),
  playground: lazy(() => import('./App.jsx').then((module) => ({ default: module.App }))),
  'neon-classic': lazy(() => import('./ClassicPage.jsx').then((module) => ({ default: module.ClassicPage }))),
  checkout: lazy(() => import('./CheckoutPage.jsx').then((module) => ({ default: module.CheckoutPage }))),
  'payment-status': lazy(() => import('./PaymentStatusPage.jsx').then((module) => ({ default: module.PaymentStatusPage }))),
};
const page = resolvePage(window.location);
if (page === 'playground' && window.location.pathname === '/') {
  window.history.replaceState(null, '', `/playground${window.location.search}${window.location.hash}`);
}
getMetaAttribution();
const Page = pages[page];

initMetaPixel();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense fallback={<div role="status" style={{ minHeight: '100vh', background: '#090b10', color: 'white', padding: 32 }}>Memuatkan halaman…</div>}>
      {Page ? <Page /> : <main><h1>Halaman tidak dijumpai</h1><a href="/">Kembali ke homepage</a></main>}
    </Suspense>
    <Analytics />
    <SpeedInsights />
  </React.StrictMode>,
);
