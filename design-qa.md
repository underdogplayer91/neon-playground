# Design QA — Playground to Real Collage

## Evidence

- Reference image: `C:\Users\USER\.codex\visualizations\2026\09\23\01a0ccd5-e116-79b1-a0fe-9a1ff49b0e7c\qa-source.png`
- Final implementation screenshot: `C:\Users\USER\.codex\visualizations\2026\09\23\01a0ccd5-e116-79b1-a0fe-9a1ff49b0e7c\qa-implementation-final.png`
- Verified route: `http://127.0.0.1:5176/#playground`
- Mobile viewport checked at 390 × 844.

## Full-view comparison

The implementation keeps the reference concept of an image-led masonry collage while using the existing Pakar LED & NEON visual language. Six matched Playground/finished-neon pairs from the approved Drive folder fill the grid without an empty tile. A single vertical reveal line controls the comparison across the complete collage.

## Focused component checks

- The collage is placed directly below the Playground configurator.
- All six preview images have a corresponding real-result image.
- Desktop uses a dense three-column masonry layout.
- Mobile uses a dense two-column layout with readable captions.
- The transparent range covers the full collage and responds to touch/mouse drag.
- The blue reveal divider and handle track the range value continuously.
- “Playground” and “Hasil sebenar” labels remain visible at the top edges.
- No checkout or payment action was added or changed.

## Interaction and quality checks

- Slider verified at 50%, 75%, and 78%.
- Browser console: no warnings or errors.
- Production build: passed.
- Sizing and pricing tests: 19/19 passed.

## Comparison history

The first pass left an unused masonry cell. The final pass added the sixth matched pair and dense grid placement, removing the gap on desktop and mobile.

## Final result

passed

---

# Latest QA — Classic business hero (2026-10-09)

## Evidence and normalization

- Selected desktop visual: `C:/Users/USER/.codex/generated_images/01a0ccd5-e116-79b1-a0fe-9a1ff49b0e7c/exec-60cbf212-c0bb-47ba-91ba-b4b522cd6efb.png` (1499 × 1049).
- Latest user mobile-layout truth: `C:/Users/USER/AppData/Local/Temp/codex-clipboard-a71e6c63-5a33-424a-823b-e2a56e7a01b6.png` (799 × 875).
- Revised desktop capture: `C:/Users/USER/AppData/Local/Temp/classic-business-desktop-final.png`.
- Revised reference-width capture: `C:/Users/USER/AppData/Local/Temp/classic-business-reference-match.png` (793 × 875; header retained, so not an exact source crop).
- Final phone capture: `C:/Users/USER/AppData/Local/Temp/classic-business-checked.png` (380 × 812 rendered pixels, measured CSS viewport 395 × 844; capture scale approximately 0.962). Source and final phone capture were opened together in one comparison input. This is a responsive composition comparison, not a pixel-perfect same-density comparison: the user source excludes the header and represents a wider composition.
- Route/state: `/neon-classic#top`, empty customer input, header and existing floating order action visible. No production changes.

## Findings and comparison history

1. [P2, fixed] Initial desktop CTA and headline lacked the selected mock's hierarchy. Enlarged display type and CTA; desktop-final capture verifies revised hierarchy.
2. [P1, fixed] Initial phone layout stacked copy, photos and proof into separate sections. Removed that stacking. The final phone and reference-width captures retain one integrated hero with left copy, overlapping montage and right testimonial.
3. [P2, fixed] Description/note contrast over the dark montage. Added a white horizontal fade beneath the copy in addition to the requested diagonal fade. Final phone capture shows readable copy.
4. [P2, fixed] Excessive headline wrapping at 320px. Added a dedicated small-screen display-size rule; retains complete hook without horizontal overflow.
5. [P3] At narrow phone widths the original testimonial conversation is small. Its complete original image remains available through the clearly labelled enlarge link; deliberately no reconstructed bubbles or invented claims.

## Required fidelity surfaces

- Typography: condensed Bebas Neue display hierarchy, black headline/coral emphasis; small sans-serif description and labels. Responsive wrapping differs from the wider reference intentionally.
- Layout rhythm: one integrated composition on phone and desktop; three-column benefits retained. Existing header and floating order panel remain unchanged. CSS minimum phone height leaves more negative space than the wide source; acceptable responsive variation.
- Colors: white-to-dark diagonal overlay, coral CTA and headline accent, dark proof area. Extra horizontal fade is an intentional readability adjustment.
- Image fidelity: three exact approved customer JPEGs, not the generated mock's altered artwork. Daisy Coffee screenshot remains complete and unchanged. Actual customer signs and lettering are preserved.
- Copy: selected business hook, CTA, process note and benefit labels retained; actual testimonial text comes from the source screenshot.
- Focused evidence: original Daisy Coffee source was inspected separately for conversation and sign fidelity; complete media is linked for enlargement rather than treating unreadable tiny phone text as readable.

## Runtime and interaction checks

- All three hero images report complete loading with nonzero natural dimensions.
- Hero CTA verified after reload: scrollY 762, configurator top 25px; hash `#playground`.
- Header brand returns to `#top`, scrollY 0.
- Current body width 380px fits the measured 395px viewport.
- Historical Vite dependency/HMR error (`Invalid hook call` in the newly installed icon dependency) was captured at 15:29 UTC. Reload restores the page. No later console errors appeared in the checked log; npm dependency tree shows one deduplicated React/React DOM 19.2.0. This is a local development reload observation, not a production deployment claim.
- Landing tests 12/12, payment/email 35/35, sizing 23/23, Sites 4/4 and production build passed during this implementation.
- No real payment, email submission or Supabase write was performed for this hero-only change.

## Implementation checklist

- [x] Unified responsive hero and approved real media.
- [x] Original testimonial preserved with enlarge link.
- [x] CTA navigation and current runtime render verified.
- [x] Build and existing regression suites passed.
- [x] Local preview retained; no commit or push.

## Final result

passed
