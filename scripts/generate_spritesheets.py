import os
from PIL import Image, ImageDraw

MONSTERS_DIR = "webview/monsters"
OUTPUT_DIR = "webview/monsters"

# ─── Monster Configurations ────────────────────────────────────────────────────
# eye: (x, y) pixel on the ORIGINAL 1024x1024 image used for the blink effect
# eye_color: approximate skin/scale color around the eye to "close" it
# leg_y_pct: vertical fraction where the body splits into torso vs. legs
# leg_w_pct: horizontal fraction for left/right leg split
MONSTER_CONFIGS = {
    'godzilla': {
        'is_flyer': False,
        'eye': (320, 240),
        'eye_color': (43, 46, 51),
        'leg_y_pct': 0.65,
        'leg_w_pct': 0.5
    },
    'kong': {
        'is_flyer': False,
        'eye': (340, 280),
        'eye_color': (58, 43, 37),
        'leg_y_pct': 0.68,
        'leg_w_pct': 0.5
    },
    'ghidorah': {
        'is_flyer': True,
        'eye': (240, 220),
        'eye_color': (205, 164, 52),
        'leg_y_pct': 0.65,
        'leg_w_pct': 0.5
    },
    'rodan': {
        'is_flyer': True,
        'eye': (290, 250),
        'eye_color': (92, 26, 26),
        'leg_y_pct': 0.65,
        'leg_w_pct': 0.5
    },
    'mechagodzilla': {
        'is_flyer': False,
        'eye': (512, 512),
        'eye_color': (255, 0, 0),
        'leg_y_pct': 0.65,
        'leg_w_pct': 0.5
    },
    'muto': {
        'is_flyer': False,
        'eye': (512, 512),
        'eye_color': (255, 0, 0),
        'leg_y_pct': 0.65,
        'leg_w_pct': 0.5
    },
    'scylla': {
        'is_flyer': False,
        'eye': (512, 512),
        'eye_color': (0, 255, 255),
        'leg_y_pct': 0.5,
        'leg_w_pct': 0.5
    }
}

# ─── Spritesheet Layout ────────────────────────────────────────────────────────
# Row 0 → idle   (panel.js renderState: 'idle' / 'hover')
# Row 1 → walk   (panel.js renderState: 'walk' / 'flying')
# Row 2 → react  (panel.js renderState: 'react')
# Row 3 → (reserved / empty — kept so output stays 1024×1024)
ACTIONS = ['idle', 'walk', 'react']


def transparentize(img):
    """
    Remove the solid background using an edge-connected flood fill.
    Seeds from every border pixel so only background pixels that are
    *reachable from the edges* are removed — the monster body is preserved
    even where its colour happens to be close to the background.
    """
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # Background colour sampled from the top-left corner
    bg_r, bg_g, bg_b, _ = pixels[0, 0]
    tolerance = 22

    def is_bg(px):
        r, g, b, a = px
        return (a > 0 and
                abs(r - bg_r) <= tolerance and
                abs(g - bg_g) <= tolerance and
                abs(b - bg_b) <= tolerance)

    # ── Seed the flood fill from every border pixel ──────────────────────────
    visited = set()
    stack = []

    def try_seed(x, y):
        if (x, y) not in visited and is_bg(pixels[x, y]):
            visited.add((x, y))
            stack.append((x, y))

    for x in range(width):
        try_seed(x, 0)
        try_seed(x, height - 1)
    for y in range(1, height - 1):
        try_seed(0, y)
        try_seed(width - 1, y)

    # ── Flood fill (4-connected) ─────────────────────────────────────────────
    while stack:
        x, y = stack.pop()
        pixels[x, y] = (0, 0, 0, 0)          # make transparent

        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height:
                if (nx, ny) not in visited and is_bg(pixels[nx, ny]):
                    visited.add((nx, ny))
                    stack.append((nx, ny))

    return img


def resize_img(img, scale_x, scale_y):
    new_w = max(1, int(img.width * scale_x))
    new_h = max(1, int(img.height * scale_y))
    return img.resize((new_w, new_h), Image.Resampling.LANCZOS)


def create_frame(base_img, config, action, frame_idx):
    """Composite a single 256×256 animation frame from the pre-cropped monster."""
    w_m, h_m = base_img.size
    frame = Image.new("RGBA", (256, 256), (0, 0, 0, 0))

    # Scale so the monster fits comfortably inside 200 px
    scale = min(200.0 / h_m, 200.0 / w_m)

    body_bob = 0
    body_tilt = 0.0
    leg_offset = 0
    wing_flap = 0
    breath_scale_y = 1.0

    if action == 'idle':
        if frame_idx == 1:
            breath_scale_y = 1.03
        elif frame_idx == 3:
            breath_scale_y = 0.97

    elif action == 'walk':
        if config['is_flyer']:
            if frame_idx == 0:
                wing_flap = -12
            elif frame_idx == 2:
                wing_flap = 12
        else:
            if frame_idx == 0:
                leg_offset = 8
                body_bob = -4
                body_tilt = 2.0
            elif frame_idx == 2:
                leg_offset = -8
                body_bob = -4
                body_tilt = -2.0

    elif action == 'react':
        if frame_idx % 2 == 0:
            body_bob = -20
            body_tilt = 4.0
            if config['is_flyer']:
                wing_flap = -15
        else:
            body_bob = -5
            breath_scale_y = 0.94
            body_tilt = -4.0
            if config['is_flyer']:
                wing_flap = 15

    # ── Body / Leg slice positions ──────────────────────────────────────────
    leg_y = int(h_m * config['leg_y_pct'])
    leg_h = h_m - leg_y
    leg_w = int(w_m * config['leg_w_pct'])
    overlap = 8          # extra pixels to prevent a visible seam

    body      = base_img.crop((0,          0,              w_m,  leg_y + overlap))
    left_leg  = base_img.crop((0,          leg_y - overlap, leg_w, h_m))
    right_leg = base_img.crop((leg_w,      leg_y - overlap, w_m,  h_m))

    s_body      = resize_img(body,      scale, scale * breath_scale_y)
    s_left_leg  = resize_img(left_leg,  scale, scale)
    s_right_leg = resize_img(right_leg, scale, scale)

    cx      = 128    # horizontal centre of the 256 px frame
    floor_y = 225    # y-coordinate of the "ground"

    # ── Draw legs ────────────────────────────────────────────────────────────
    if config['is_flyer']:
        tuck = -4 if action == 'walk' else 0
        leg_pos_y = floor_y - int(leg_h * scale) + tuck
        frame.alpha_composite(s_right_leg,
            (cx - int(w_m * scale / 2) + int(leg_w * scale), leg_pos_y))
        frame.alpha_composite(s_left_leg,
            (cx - int(w_m * scale / 2), leg_pos_y))
    else:
        rl_y = floor_y - int(leg_h * scale) - int(leg_offset * scale)
        ll_y = floor_y - int(leg_h * scale) + int(leg_offset * scale)
        frame.alpha_composite(s_right_leg,
            (cx - int(w_m * scale / 2) + int(leg_w * scale), rl_y))
        frame.alpha_composite(s_left_leg,
            (cx - int(w_m * scale / 2), ll_y))

    # ── Draw body ────────────────────────────────────────────────────────────
    if config['is_flyer'] and action == 'walk':
        # Wing-flap: slice body vertically and shift alternate slices
        slices = 5
        bw = s_body.width // slices
        bh = s_body.height
        for i in range(slices):
            sx = i * bw
            slice_img = s_body.crop((sx, 0, min(s_body.width, sx + bw + 1), bh))
            dy = int(wing_flap * scale) if (i == 1 or i == 3) else 0
            if body_tilt != 0:
                slice_img = slice_img.rotate(body_tilt,
                    resample=Image.Resampling.BICUBIC, expand=True)
            bx = cx - s_body.width // 2 + sx
            by = floor_y - int(leg_h * scale) - bh + int(body_bob * scale) + dy + overlap
            frame.alpha_composite(slice_img, (bx, by))
    else:
        r_body = (s_body.rotate(body_tilt, resample=Image.Resampling.BICUBIC, expand=True)
                  if body_tilt != 0 else s_body)
        bx = cx - r_body.width // 2
        by = (floor_y - int(leg_h * scale) - r_body.height
              + int(body_bob * scale) + overlap)
        frame.alpha_composite(r_body, (bx, by))

    return frame


def generate_spritesheet(monster_id):
    print(f"Generating spritesheet for '{monster_id}' ...")

    src_path = os.path.join(MONSTERS_DIR, f"{monster_id}.png")
    if not os.path.exists(src_path):
        print(f"  ✗  Source not found: {src_path}")
        return

    orig_img = Image.open(src_path)

    # ── Remove background ────────────────────────────────────────────────────
    trans_img = transparentize(orig_img)

    # ── Blink frame (idle col 3): paint the eye shut ─────────────────────────
    config = MONSTER_CONFIGS[monster_id]
    eye_x, eye_y = config['eye']
    blink_base = trans_img.copy()
    draw = ImageDraw.Draw(blink_base)
    draw.ellipse(
        [eye_x - 12, eye_y - 12, eye_x + 12, eye_y + 12],
        fill=(*config['eye_color'], 255)
    )

    # ── Crop away empty margins ──────────────────────────────────────────────
    bbox = trans_img.getbbox() or (0, 0, orig_img.width, orig_img.height)
    cropped_base  = trans_img.crop(bbox)
    cropped_blink = blink_base.crop(bbox)

    # ── Assemble 1024×1024 spritesheet (4 cols × 4 rows, 256 px each) ───────
    # Row 0 = idle | Row 1 = walk | Row 2 = react | Row 3 = empty (reserved)
    spritesheet = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))

    for row_idx, action in enumerate(ACTIONS):
        for col_idx in range(4):
            use_base = (cropped_blink
                        if action == 'idle' and col_idx == 3
                        else cropped_base)
            frame = create_frame(use_base, config, action, col_idx)
            spritesheet.paste(frame, (col_idx * 256, row_idx * 256))

    dest_path = os.path.join(OUTPUT_DIR, f"{monster_id}_spritesheet.png")
    spritesheet.save(dest_path, "PNG")
    print(f"  ✓  Saved → {dest_path}")


if __name__ == "__main__":
    print("Monsterverse Spritesheet Generator")
    print("=" * 40)
    for m_id in MONSTER_CONFIGS:
        generate_spritesheet(m_id)
    print("=" * 40)
    print("Done!")
