from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path("/home/lahainalindsay9111/soulscope")
CHART_PATH = ROOT / "frontend/public/cymatics/piano-cymatics.png"
OUTPUT_DIR = ROOT / "frontend/public/cymatics/notes"

NATURAL_NOTES = ["C", "D", "E", "F", "G", "A", "B"]
BRIDGE_NOTES = [
    ("C-sharp", "C", "D"),
    ("D-sharp", "D", "E"),
    ("F-sharp", "F", "G"),
    ("G-sharp", "G", "A"),
    ("A-sharp", "A", "B"),
]

ROW_Y = 366
FIRST_X = 160
STEP = 64
CROP_SIZE = 56
OUTPUT_SIZE = 220


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    image = Image.open(CHART_PATH).convert("RGB")
    natural_crops: dict[str, Image.Image] = {}

    for index, note_file in enumerate(NATURAL_NOTES):
        x = FIRST_X + STEP * index
        crop = image.crop((x, ROW_Y, x + CROP_SIZE, ROW_Y + CROP_SIZE))
        natural_crops[note_file] = crop
        crop.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.Resampling.LANCZOS).save(
            OUTPUT_DIR / f"{note_file}.png",
            format="PNG",
            optimize=True,
        )

    natural_crops["C-high"] = image.crop(
        (FIRST_X + STEP * 7, ROW_Y, FIRST_X + STEP * 7 + CROP_SIZE, ROW_Y + CROP_SIZE)
    )

    for note_file, left_note, right_note in BRIDGE_NOTES:
        left = natural_crops[left_note]
        right = natural_crops[right_note]
        composite = Image.new("RGB", (CROP_SIZE, CROP_SIZE), "white")
        composite.paste(left.crop((0, 0, CROP_SIZE // 2, CROP_SIZE)), (0, 0))
        composite.paste(right.crop((CROP_SIZE // 2, 0, CROP_SIZE, CROP_SIZE)), (CROP_SIZE // 2, 0))
        draw = ImageDraw.Draw(composite)
        draw.line(
            [(CROP_SIZE // 2, 4), (CROP_SIZE // 2, CROP_SIZE - 4)],
            fill=(120, 120, 120),
            width=1,
        )
        composite.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.Resampling.LANCZOS).save(
            OUTPUT_DIR / f"{note_file}.png",
            format="PNG",
            optimize=True,
        )


if __name__ == "__main__":
    main()
