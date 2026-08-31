# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

For every neon artwork or customer mockup, follow `NEON_MANUFACTURING_GUIDELINES.md`. Trace the requested design first, then check and adjust it against the manufacturing limitations. Keep the result as visually similar to the requested design as production allows.

For real customer media on the landing page, only use assets from the Google Drive folder `MEDIA YH` inside `TESTIMONI`, `CONTOH SIAP` (including `TULISAN`), `Ready`, and `SEBELUM/SELEPAS`. Do not use assets from `AI IMAGE`, files explicitly named as ChatGPT/Gemini-generated, or other folders unless the user expands the approved source list. Customer testimonial wording must remain grounded in the original conversation; light formatting is allowed, but do not invent claims or quotes.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

On tablet and mobile, keep the Neon Playground preview sticky only within the configurator while users scroll through its controls. It must stop before leaving the Playground configurator and must not float over later landing-page sections.

The Playground text field should prefer lowercase by disabling mobile auto-capitalization. Preserve the customer's exact casing when they deliberately type uppercase, and show a short recommendation that lowercase generally produces a cleaner result.

Use an in-page expandable list for the Playground's additional fonts instead of a native mobile select. The list must open downward inside the controls, remain independently scrollable, and allow the sticky neon preview to stay visible while fonts are tried.

On narrow mobile screens, keep the complete hero copy and the “Reka · Sahkan · Baru kami hasilkan” note above the dark storefront portion of the hero image so all text remains readable in in-app browsers.

In the Playground preview card, keep the two states named “Preview” and “Gambar Sebenar”. “Preview” must retain the live text, font and colour configurator; “Gambar Sebenar” must show real completed customer photos and preserve the full neon wording without cropping either end.

Keep the mobile floating “Tempah Sekarang” button visible even before a name is entered. When the name field is empty, tapping it must scroll to and focus the name field, briefly highlight that field, and must not open checkout. Checkout is enabled only after the visitor enters at least one counted character.

Keep the overall purchase flow simple: Step 1 is the Playground Configurator, Step 2 is the checkout confirmation page containing both customer fields and the order summary, and Step 3 is ToyyibPay payment. Do not add a separate customer-information step before confirmation. The checkout submit button must create the bill and go directly to ToyyibPay.

At the top of checkout, keep the honest running urgency message that orders are processed according to payment order and payment locks the customer's design slot. The checkout CTA should read “Tempah Untuk Slot Sekarang!” and continue directly to ToyyibPay.

Checkout may offer a genuine RM20 Free Shipping voucher plus a warranty extension from three months to six months after four seconds. Once claimed, its ten-minute expiry must be based on a stored claim timestamp rather than a resetting visual timer. Record the claim and its linked order in Supabase, show RM20 struck through and “PERCUMA” plus the six-month warranty while active, and keep the ToyyibPay product amount unchanged because shipping is handled separately.
