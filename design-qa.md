# Design QA — Preview / Gambar Sebenar

## Comparison Target

- Source visual truth:
  - `C:\Users\Ryzen\Downloads\Capture.JPG`
  - `C:\Users\Ryzen\Downloads\Michael Jackson.JPG`
  - `C:\Users\Ryzen\Downloads\IMG_20260828_113449 (1).jpg`
  - `C:\Users\Ryzen\Downloads\IMG_20260828_113637 (1).jpg`
- Browser-rendered implementation:
  - `D:\Website\Salespage\Project\neon-playground\.codex-real-mobile-final.jpg`
  - `D:\Website\Salespage\Project\neon-playground\.codex-real-desktop-final.jpg`
- Combined focused comparison:
  - `D:\Website\Salespage\Project\neon-playground\.codex-design-qa-comparison.jpg`
- Route: `http://127.0.0.1:5173/#playground`
- State: Playground configurator with **Gambar Sebenar** selected; Haikal Feroz and Michael Jackson states both tested.

## Capture Normalization

- Source real-photo size: 4096 × 2304 px, 16:9.
- Mobile implementation capture: 455 × 891 px at device pixel ratio 1.
- Focused implementation crop: 405 × 260 px, resized only for the side-by-side comparison.
- Desktop implementation capture: 1265 × 889 px at device pixel ratio 1.
- The source photo and implementation crop were placed in one 1600 × 620 comparison board. The implementation deliberately includes its toggle and result caption; the source is shown without surrounding UI.

## Full-View Comparison Evidence

- The existing configurator remains intact and defaults to **Preview**, so visitor text, font and colour changes still appear live.
- **Gambar Sebenar** replaces the configurator artwork with the supplied real customer photos without changing the surrounding controls or checkout flow.
- On mobile, the complete sign remains visible and the toggle plus result caption stay inside the sticky preview card.
- On desktop, the full 16:9 photo is preserved with a subdued blurred extension from the same photo instead of cropping either end of the long neon sign.

## Focused Region Comparison Evidence

- The combined comparison image verifies the same Haikal Feroz sign, sofa background, lighting and framing are preserved.
- No logo, neon lettering or product artwork was redrawn in CSS or replaced with a placeholder.
- A focused comparison was necessary because image fidelity and crop were the main acceptance criteria; the surrounding landing-page sections were intentionally unchanged.

## Required Fidelity Surfaces

- Fonts and typography: Existing Manrope-based UI typography is preserved. Toggle labels and result names remain readable at desktop and mobile sizes.
- Spacing and layout rhythm: Toggle stays at the top-right; caption remains inset at the bottom; mobile padding was reduced proportionally without crowding the image.
- Colors and visual tokens: Existing black, white and coral visual system is unchanged. The real photo colours remain intact; the backdrop uses a darkened copy of the same image only to fill tall desktop space.
- Image quality and asset fidelity: Both real photos use the existing optimized 1920 × 1080 project assets. `object-fit: contain` prevents the long neon signs from being cut off.
- Copy and content: Labels are exactly **Preview**, **Gambar Sebenar** and **Hasil sebenar**, with the correct Haikal Feroz and Michael Jackson names.

## Interaction And Runtime Checks

- Preview toggle: passed; dynamic configurator wall and neon text reappear.
- Gambar Sebenar toggle: passed; real-photo gallery appears.
- Haikal Feroz selector: passed.
- Michael Jackson selector: passed.
- Automatic result rotation: passed.
- Responsive mobile and desktop rendering: passed.
- Production build: passed.
- Browser console: checked; no warning or error entries during the final run.

## Comparison History

- Initial P2: desktop real-photo mode left a visibly empty black area because the 16:9 photo was contained inside the taller configurator column.
- Fix: added a dark, blurred backdrop made from the same active customer photo while keeping the sharp foreground photo fully contained.
- Post-fix evidence: `.codex-real-desktop-final.jpg` shows the tall area filled without cropping the neon wording; `.codex-design-qa-comparison.jpg` confirms the focused source-image fidelity.

## Findings

- No actionable P0, P1 or P2 mismatch remains.
- P3 accepted: on very tall desktop configurator layouts, the foreground photo has more breathing room above and below than on mobile. This preserves the complete long sign and avoids destructive cropping.

## Implementation Checklist

- [x] Rename Siang to Preview.
- [x] Rename Malam to Gambar Sebenar.
- [x] Preserve live configurator behavior under Preview.
- [x] Add both supplied real customer results.
- [x] Add manual and automatic switching between real results.
- [x] Verify desktop, mobile, build and console.

final result: passed
