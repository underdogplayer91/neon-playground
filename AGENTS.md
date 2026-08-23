# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

For every neon artwork or customer mockup, follow `NEON_MANUFACTURING_GUIDELINES.md`. Trace the requested design first, then check and adjust it against the manufacturing limitations. Keep the result as visually similar to the requested design as production allows.

For real customer media on the landing page, only use assets from the Google Drive folder `MEDIA YH` inside `TESTIMONI`, `CONTOH SIAP` (including `TULISAN`), `Ready`, and `SEBELUM/SELEPAS`. Do not use assets from `AI IMAGE`, files explicitly named as ChatGPT/Gemini-generated, or other folders unless the user expands the approved source list. Customer testimonial wording must remain grounded in the original conversation; light formatting is allowed, but do not invent claims or quotes.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
