# Prototype Instructions

Serve one domain with route-separated landing pages: `/` is the general neon homepage without a configurator, `/playground` is the measured v2 configurator, and `/neon-classic` preserves the UI and purchase flow from tag `pre-neon-playground-v2-2026-09-28` (fed34bd). Both landing pages share current checkout/payment/email services. Classic alone retains its original 8/15-character packages and Custom Design deposit entry; those historical UI choices are intentional route-specific exceptions to the v2 rules below. The server must validate classic package amounts by counted characters. The homepage offers “Reka Tulisan Sendiri” and the existing Custom Logo lead modal. Persist landing source and campaign attribution through checkout and owner emails, and lazy-load route components so homepage never imports the configurator/font assets. Keep these changes local until explicitly approved for publication.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

For every neon artwork or customer mockup, follow `NEON_MANUFACTURING_GUIDELINES.md`. Trace the requested design first, then check and adjust it against the manufacturing limitations. Keep the result as visually similar to the requested design as production allows.

For real customer media on the landing page, only use assets from the Google Drive folder `MEDIA YH` inside `TESTIMONI`, `CONTOH SIAP` (including `TULISAN`), `Ready`, and `SEBELUM/SELEPAS`. Do not use assets from `AI IMAGE`, files explicitly named as ChatGPT/Gemini-generated, or other folders unless the user expands the approved source list. Customer testimonial wording must remain grounded in the original conversation; light formatting is allowed, but do not invent claims or quotes.

The Google Drive folder `SHORTLISTED PHOTO FOR WEBSITE` (`1LwMkQ0zqRLIxi9hKrqLhdtIV6ctCKBE_`) is approved for the “Hasil sebenar pelanggan” section. Use every image from that folder in one rotating poster; do not show the previous customer gallery grid or the separate copy-and-poster layout in that section.

Label that rotating customer-poster section “Hasil customer yang Custom Logo.” Do not show the former “Bukan gambar AI” heading or its explanatory paragraph.

In the “Sebelum dan selepas” section, show both customer images in full with `object-fit: contain`; never crop their edges to fill the cards. Use a dark neutral background for any unused card space.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

On tablet and mobile, keep the Neon Playground preview sticky only within the configurator while users scroll through its controls. It must stop before leaving the Playground configurator and must not float over later landing-page sections.

The Playground text field should prefer lowercase by disabling mobile auto-capitalization. Preserve the customer's exact casing when they deliberately type uppercase, and show a short recommendation that lowercase generally produces a cleaner result.

Keep the Playground preview at a stable physical zoom instead of fitting each phrase to the full canvas. A single word must not suddenly fill the preview; use a compact standard stage sized to accommodate roughly five ordinary words on one line before any overflow zoom-out is needed.

Changing Small, Medium, Large, or Custom updates physical measurements and pricing but must not visually resize the neon artwork in the preview. Dimension guides should follow the supplied reference: a clear vertical guide at the left and horizontal guide below the artwork, labelled in centimetres and inches.

Keep dimension labels outside the neon artwork and glow. Reserve extra viewport space so the vertical label sits clearly to the left and the horizontal label clearly below without clipping or obstructing the preview.

Preserve the customer's typed line breaks and initial word order in the Playground preview. Words on the same typed line use natural font spacing; a new typed line starts a new preview row. A word only leaves that automatic layout after the customer drags it. Do not place a drag-instruction overlay over the preview artwork.

Editing the Playground textarea resets manual drag coordinates and rebuilds the automatic layout from the box. Text typed on one line must render as one orderly line; only an explicit Enter creates another preview row.

Use one consistent visual word gap in the automatic preview layout instead of each font file's space-advance metric. Script fonts can contain unusually wide space glyphs; those metrics must not make typed words look scattered.

Within each automatic preview row, render every word inside the same target-height box so words share a stable visual baseline. Tapping a word must not create browser text selection or make the row appear vertically scattered.

The selected preview word uses a blue editor transformer like the supplied reference: a blue bounding box, four square corner resize anchors, and a connected top-center rotation handle. Every corner resizes around the word centre; the top handle rotates only that word. Combined sizing and pricing update live.

When a preview word is selected, show a compact measurement bubble for that word only. The bubble identifies the word and displays its live measured visual width and height in centimetres, updating continuously while its resize anchors are dragged.

The word measurement bubble and blue transformer are selection-only controls. Tapping or clicking any empty area of the Playground preview must deselect the word and hide its bubble, bounding box, resize anchors and rotation handle; tapping a word shows them again.

Customer-facing size changes use whole-centimetre steps. Dragging a word's resize anchor and using the Custom Size control must change target height in 1 cm increments, while per-word, combined-design and backboard dimension labels display whole centimetres. Keep the underlying glyph geometry and price calculations precise internally.

The font step includes one explicit “Gunakan font ini untuk semua perkataan” action. It copies the currently selected word's font to every word in one click while preserving each word's colour and position.

Do not offer a manual Single-line/Double-line production choice. Only the 18 fonts imported from `C:\Users\USER\Downloads\Double line font` use the editable double-line price multiplier; every pre-existing font uses single-line pricing automatically.

Do not show a Production Check step in the customer configurator. Custom text height normally starts at 10 cm and ends at 50 cm. If any word uses a double-line font, automatically raise every word to at least 15 cm, disable the Small preset, show “Tulisan ini tiada untuk Small”, and make Custom start at 15 cm.

Default single-line fonts to the Small 10 cm preset. Only double-line fonts default to Medium 15 cm; when a double-line selection automatically raised an otherwise default design, returning the design to single-line fonts returns it to Small unless the customer had chosen a larger size.

Black PVC foamboard has no board surcharge. Transparent acrylic adds RM10 per square foot, calculated from the measured combined backboard width times height converted from square centimetres to square feet.

Black PVC foamboard is the default Playground backboard choice. Keep the RM10/sqft acrylic rate internal; after the customer enters text, the Transparent acrylic card shows the calculated RM addition for that design instead of displaying the per-square-foot rate.

Every configured design starts at a minimum text price of RM150, even for one character. Acrylic area, the applicable double-line font share, and other configured additions apply after that RM150 floor. Multicolour has no surcharge.

Apply the double-line multiplier only to the measured visual-area share of words using fonts from the imported Double line font collection. Single-line words remain at 1.00, even in a mixed-font design, and acrylic/backboard charges must never be multiplied by a font multiplier.

Preserve the former calculated base price whenever it is below RM200. At RM200 and above, calculate the base from the overall combined backboard area: exactly 2.0 through 4.0 sqft is `area × RM100` with no deduction; above 4.0 and below 10 sqft is `(area × RM100) − RM50`; 10 to below 20 sqft is `(area × RM93) − RM80`; and 20 sqft or more is `(area × RM88) − RM80`. Keep the existing below-2.0-sqft behavior and RM150 minimum floor. Apply the existing measured double-line share multiplier after the base calculation, and add acrylic charges afterward without multiplying them.

Price the measured backboard area in nearest 0.1 sqft steps. Below 2.0 sqft, ignore area for the base price and use counted characters only: 1–7 characters RM150, 8–10 RM170, 11–14 RM190, and 15 or more RM200. Spaces and line breaks are not counted. At 2.0 sqft and above, use the area tiers. Display whole-ringgit prices only and round additions in RM20 steps anchored from the applicable base: a remainder of RM0–RM10 stays at the lower step, while RM11 or more advances to the next RM20 step.

Keep the square-foot area and tier rate internal to the pricing engine; do not show a “Keluasan & kadar” row to customers in the estimated-price panel.

Use an in-page expandable list for the Playground's additional fonts instead of a native mobile select. The list must open downward inside the controls, remain independently scrollable, and allow the sticky neon preview to stay visible while fonts are tried.

On narrow mobile screens, keep the complete hero copy and the “Reka · Sahkan · Baru kami hasilkan” note above the dark storefront portion of the hero image so all text remains readable in in-app browsers.

Keep the Playground preview card as a single live configurator view. Do not show the “Preview / Gambar Sebenar” toggle or a customer-photo mode inside this card.

Do not show the customer-facing character-count label such as “0 aksara dikira” beneath the Playground text field.

Keep the mobile floating “Tempah Sekarang” button visible even before a name is entered. When the name field is empty, tapping it must scroll to and focus the name field, briefly highlight that field, and must not open checkout. Checkout is enabled only after the visitor enters at least one counted character.

After the customer enters text, show the existing floating order panel on desktop and tablet too. It must display the live estimated price and either the payable full amount through RM250 or `Deposit RM100` only for estimates above RM250.

Keep the overall purchase flow simple: Step 1 is the Playground Configurator, Step 2 is the checkout confirmation page containing both customer fields and the order summary, and Step 3 is ToyyibPay payment. Do not add a separate customer-information step before confirmation. The checkout submit button must create the bill and go directly to ToyyibPay.

At the top of checkout, keep the honest running urgency message that orders are processed according to payment order and payment locks the customer's design slot. The checkout CTA should read “Tempah Untuk Slot Sekarang!” and continue directly to ToyyibPay.

Do not show or apply any checkout discount popup, countdown voucher, ten-percent discount, or extended-warranty offer. Do not display any warranty row or warranty copy on the checkout page. Keep any existing standard warranty metadata internal. Do not show shipping in the custom-size order summary because it will be discussed through WhatsApp.

The checkout order summary does not show the reference or package rows. Its Font row lists every unique font actually used by the stored preview layers, and its Harga Penuh row appears above the Harga Deposit total.

The checkout order-summary preview must provide enough vertical space and safe padding to show the customer's full composed neon design, including rotated words, glow, ascenders and descenders. It must preserve the Playground composition without cropping any edge.

The Neon Playground configurator uses an original Pakar LED & NEON two-column flow: live acrylic preview with physical dimensions on the left, and numbered text, font, colour, size, spacing, backboard, production check and live-price controls on the right. Size presets map to 10 cm, 15 cm and 20 cm target text heights, with Custom allowing 5–50 cm. Pricing must use measured glyph geometry rather than character count. The live price is informational only. Do not add a WhatsApp, checkout, payment or order-submission flow, and preserve every existing CTA, navigation item and purchase-flow button.

Use the configurator's measured live price as the single displayed estimated price everywhere, including the summary below the preview and checkout. For estimates up to and including RM250, charge the displayed amount in full. For estimates above RM250, charge only a RM100 design deposit during checkout and state that the team will contact the customer to confirm the design and final price; the deposit is deducted from the final total.

The checkout order-summary preview must reproduce the exact configurator design snapshot rather than rebuilding a single line from plain text. Preserve every word's line, position, font, colour, target height, letter spacing and rotation when moving from the Playground to checkout.

Show “Tulis Nama Anda” as the initial Playground preview in a clean Beachfront pink automatic row while keeping the customer textarea empty and ordering disabled. As soon as the customer types, replace the demo with a clean Beachfront pink design built from their text; clearing the textarea restores “Tulis Nama Anda”. The main Playground heading is “Reka Neon Anda”. Inside the control panel, keep “Custom Neon Studio” and show the white instruction “Tekan setiap huruf untuk gerakkan, besarkan, tukar warna dan pusingkan” as a small uppercase control label matching the “Enter Your Text” typography, not as a large condensed heading.

Keep design-capture testing isolated from production. The test flow is enabled only by Preview environment flags, uploads to the configured Cloudinary test folder, sends an email clearly prefixed `[TEST]`, and must never create a ToyyibPay bill or write an order to the live Supabase project.

Only show the order-processing progress modal after the customer submits the final checkout CTA, never when entering checkout from the Playground. Its status must follow real work: generate the snapshot, upload it to Cloudinary, save the pending order and create its ToyyibPay bill, then redirect. Preserve entered customer data on failure and offer retry. Store the Cloudinary image and per-word font, colour, size and rotation details in the Supabase order snapshot so both unpaid follow-up and paid-confirmation emails can display the same design.

The paid owner-notification email must show the saved overall backboard dimensions as “Saiz keseluruhan board”. Omit that row gracefully for legacy orders that do not have `backboardSizeNote`.

In the Playground preview, do not render transparent acrylic or black PVC as a visual board. Keep those as pricing/material choices only, and place the W × H dimension guides directly around the visible neon lettering using its visual glyph bounds.

The Playground automatically treats every typed word as a draggable object in the preview, without exposing a Layers panel or add, duplicate, delete, lock, visibility, or ordering controls. Tapping a word selects it for per-word font and colour changes. Size, letter spacing, and production mode remain global controls applied to every word. Preserve the original neon tube and glow effect while adding selection and dragging. Auto-size the acrylic from the combined word bounds plus 3 cm padding on every side and do not add any new purchase CTA.

Do not present the old ready-made 8-character or 15-character packages, or a choice between ready-made and custom packages. The separate package section contains only a Design Custom contact action for customers who already have a logo or require a custom size, symbol or special shape; do not show a price or deposit for it because all details and pricing are discussed through WhatsApp.

Do not show an “Apa yang anda dapat bila dah beli” package-includes section or its product-kit image anywhere on the landing page.

Fonts imported from the `Double line font` collection must render using the actual TTF glyph shape. Do not synthesize a double-line look with CSS stroke. Encode font filenames in browser URLs, including spaces and parentheses, and preserve the original neon glow on top of the font's native outline geometry.

When a customer types a phrase, show normal word spacing and keep the words in one automatic line. A word becomes independently positioned only after the customer drags it. Explain this directly in the preview with a short touch/drag hint; do not expose layer-management controls.

Do not include a Sketch pad or any freehand drawing function in the Playground. The configurator supports text words only.

Below the Playground, show an original Pakar LED & NEON comparison collage built only from matched Playground-preview and real-result pairs in the user-approved Drive folder. One touch-friendly horizontal range control moves a single vertical reveal line across the whole collage so customers can compare every Playground design with its corresponding finished neon photo.

On desktop, keep the comparison collage as a filled square 3 × 3 composition. Ady's Resort and Burger Kakza occupy adjacent tiles in its first row; preserve the dense layout so no empty cell appears.

Display the font with id `bouncy-personal-use-only` as `BOUNCY` in customer-facing UI and checkout summaries. Keep its internal id, file and measurement data unchanged.

Do not show the font with id `milford-hollow` in the Playground font choices. Keep its source measurement record intact unless explicitly asked to delete the underlying data.

Inside the Playground preview, show one compact real-customer result card using an approved matched comparison asset. It must stay clear of the neon artwork, dimensions and word-editing controls; activating it smooth-scrolls to the existing Playground-to-real comparison slider below.

Provide a clear Playground tutorial button near the configurator introduction. It opens the approved tutorial video in an in-page modal with native playback controls and a visible X close button; customers must remain on the Playground page while watching and be able to dismiss the modal by X, backdrop click, or Escape.

The Design Custom card is a lead-capture entry point, not a payment link. Do not show RM100 or any deposit for it. Open an in-page modal asking only for the customer's name and Malaysian phone number; submit it to the owner notification email for manual WhatsApp discussion of the design and price without creating a Supabase order, ToyyibPay bill, or customer email.
