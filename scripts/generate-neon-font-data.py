"""Generate the browser sizing database from the authoritative Excel workbook."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd


def clean(value):
    if pd.isna(value):
        return None
    if hasattr(value, "item"):
        return value.item()
    return value


def main() -> None:
    if len(sys.argv) not in (3, 4):
        raise SystemExit("Usage: generate-neon-font-data.py <source.xlsx> <output.js> [--append-only]")

    source = Path(sys.argv[1]).resolve()
    output = Path(sys.argv[2]).resolve()
    append_only = len(sys.argv) == 4 and sys.argv[3] == "--append-only"
    if len(sys.argv) == 4 and not append_only:
        raise SystemExit(f"Unknown option: {sys.argv[3]}")
    font_dir = output.parents[2] / "public" / "fonts"

    fonts_frame = pd.read_excel(source, sheet_name="fonts")
    glyphs_frame = pd.read_excel(source, sheet_name="glyphs")
    kerning_frame = pd.read_excel(source, sheet_name="kerning_pairs")
    rules_frame = pd.read_excel(source, sheet_name="neon_rules")

    payload = None
    existing_font_ids = set()
    if append_only:
        if not output.is_file():
            raise SystemExit(f"Cannot append: {output} does not exist")
        generated = output.read_text(encoding="utf-8")
        payload = json.loads(generated.split("export default ", 1)[1].rsplit(";", 1)[0])
        existing_font_ids = {str(font["id"]) for font in payload["fonts"]}

    fonts = []
    for row in fonts_frame.to_dict("records"):
        if str(row["font_id"]) in existing_font_ids:
            continue
        file_name = str(row["file_name"])
        font_path = font_dir / file_name
        fonts.append({
            "id": str(row["font_id"]),
            "name": str(row["font_name"]).replace("_CN", ""),
            "fileName": file_name,
            "family": f"Neon-{Path(file_name).stem}",
            "unitsPerEm": clean(row["units_per_em"]),
            "capHeightUnits": clean(row["cap_height_units"]),
            "xHeightUnits": clean(row["x_height_units"]),
            "referenceHeightUnits": clean(row["reference_height_units"]),
            "referenceHeightMethod": str(row["reference_height_method"]),
            "available": font_path.is_file(),
        })

    glyphs = {}
    for row in glyphs_frame.to_dict("records"):
        font_id = str(row["font_id"])
        if font_id in existing_font_ids:
            continue
        glyphs.setdefault(font_id, {})[str(row["character"])] = [
            clean(row["advance_width_units"]),
            clean(row["glyph_width_units"]),
            clean(row["glyph_height_units"]),
            clean(row["x_min"]),
            clean(row["y_min"]),
            clean(row["x_max"]),
            clean(row["y_max"]),
            bool(row["supported"]),
        ]

    kerning = {}
    for row in kerning_frame.to_dict("records"):
        font_id = str(row["font_id"])
        if font_id in existing_font_ids:
            continue
        pair_key = f'{row["left_character"]}{row["right_character"]}'
        kerning.setdefault(font_id, {})[pair_key] = clean(row["kerning_units"])

    rules = {
        str(row["rule_key"]): clean(row["value"])
        for row in rules_frame.to_dict("records")
    }

    if append_only:
        payload["fonts"].extend(fonts)
        payload["glyphs"].update(glyphs)
        payload["kerning"].update(kerning)
        payload.setdefault("additionalSources", []).append(source.name)
    else:
        payload = {
            "source": source.name,
            "schemaVersion": 1,
            "fonts": fonts,
            "glyphs": glyphs,
            "kerning": kerning,
            "rules": rules,
        }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        "// Generated from the authoritative neon font measurement workbook(s). Do not hand-edit.\n"
        f"export default {json.dumps(payload, ensure_ascii=False, separators=(',', ':'))};\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
