import os
import math
from PIL import Image, ImageDraw

MONSTERS_DIR = "webview/monsters"
OUTPUT_DIR = "webview/monsters"

# Eye coordinates on the original 1024x1024 images
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

def transparentize(img):
    img = img.convert("RGBA")
    data = img.getdata()
    # background color at top-left
    bg_color = data[0]
    
    new_data = []
    tolerance = 12
    for item in data:
        r, g, b, a = item
        if a > 0 and \
           abs(r - bg_color[0]) <= tolerance and \
           abs(g - bg_color[1]) <= tolerance and \
           abs(b - bg_color[2]) <= tolerance:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    return img

def create_frame(base_img, config, action, frame_idx):
    # Dimensions of cropped monster
    w_m, h_m = base_img.size
    
    # Setup canvas
    frame = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    
    # Scale factor to comfortably fit
    scale = min(200.0 / h_m, 200.0 / w_m)
    
    # Render state variables
    body_bob = 0
    body_tilt = 0.0
    leg_offset = 0
    wing_flap = 0
    breath_scale_y = 1.0
    
    if action == 'idle':
        # Breathing cycle
        if frame_idx == 1:
            breath_scale_y = 1.03
        elif frame_idx == 3:
            breath_scale_y = 0.97
            
    elif action == 'walk':
        if config['is_flyer']:
            # Wing flap
            if frame_idx == 0:
                wing_flap = -12
            elif frame_idx == 2:
                wing_flap = 12
        else:
            # Leg swing
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
                
    elif action == 'sleep':
        body_tilt = -8.0
        body_bob = 10
        if frame_idx % 2 == 1:
            breath_scale_y = 0.95
        else:
            breath_scale_y = 1.02

    # Leg & Body Slicing
    leg_y = int(h_m * config['leg_y_pct'])
    leg_h = h_m - leg_y
    leg_w = int(w_m * config['leg_w_pct'])
    
    # Overlap to prevent seams
    overlap = 8
    
    body = base_img.crop((0, 0, w_m, leg_y + overlap))
    left_leg = base_img.crop((0, leg_y - overlap, leg_w, h_m))
    right_leg = base_img.crop((leg_w, leg_y - overlap, w_m, h_m))
    
    # Create scaled images using LANCZOS for high quality
    def resize_img(img, scale_x, scale_y):
        new_w = max(1, int(img.width * scale_x))
        new_w = max(1, int(img.width * scale_x))
        new_h = max(1, int(img.height * scale_y))
        return img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
    s_left_leg = resize_img(left_leg, scale, scale)
    s_right_leg = resize_img(right_leg, scale, scale)
    
    # Apply breathing scale to body
    s_body = resize_img(body, scale, scale * breath_scale_y)
    
    # Position calculations in 256x256 frame
    # Center X
    cx = 128
    # Bottom Y (floor is at y=225)
    floor_y = 225
    
    # Draw Legs (under the body)
    if config['is_flyer']:
        # Flyers: legs drawn tucked in slightly, no offset
        tuck = -4 if action == 'walk' else 0
        leg_pos_y = floor_y - int(leg_h * scale) + tuck
        
        # Draw right leg
        frame.alpha_composite(s_right_leg, (cx - int(w_m * scale / 2) + int(leg_w * scale), leg_pos_y))
        # Draw left leg
        frame.alpha_composite(s_left_leg, (cx - int(w_m * scale / 2), leg_pos_y))
    else:
        # Walkers: swing front and back legs
        # Back leg (right)
        rl_y = floor_y - int(leg_h * scale) - int(leg_offset * scale)
        frame.alpha_composite(s_right_leg, (cx - int(w_m * scale / 2) + int(leg_w * scale), rl_y))
        
        # Front leg (left)
        ll_y = floor_y - int(leg_h * scale) + int(leg_offset * scale)
        frame.alpha_composite(s_left_leg, (cx - int(w_m * scale / 2), ll_y))

    # Apply bobbing, tilt, and draw body
    # Rotated body
    if body_tilt != 0:
        r_body = s_body.rotate(body_tilt, resample=Image.Resampling.BICUBIC, expand=True)
    else:
        r_body = s_body
        
    body_y = floor_y - int(leg_h * scale) - int(body.height * scale * breath_scale_y) + int(body_bob * scale) + overlap
    
    # Draw body
    if config['is_flyer'] and action == 'walk':
        # Wing flap rendering for flyers (slice body into 5 vertical slices and flap 1 & 3)
        slices = 5
        bw = s_body.width // slices
        bh = s_body.height
        
        for i in range(slices):
            slice_x = i * bw
            slice_img = s_body.crop((slice_x, 0, min(s_body.width, slice_x + bw + 1), bh))
            
            dy = int(wing_flap * scale) if (i == 1 or i == 3) else 0
            
            bx = cx - s_body.width // 2 + slice_x
            by = floor_y - int(leg_h * scale) - bh + int(body_bob * scale) + dy + overlap
            
            # Apply slight rotation to slices if tilted
            if body_tilt != 0:
                slice_img = slice_img.rotate(body_tilt, resample=Image.Resampling.BICUBIC, expand=True)
                
            frame.alpha_composite(slice_img, (bx, by))
    else:
        # Regular body draw
        bx = cx - r_body.width // 2
        by = floor_y - int(leg_h * scale) - r_body.height + int(body_bob * scale) + overlap
        frame.alpha_composite(r_body, (bx, by))
        
    return frame

def generate_spritesheet(monster_id):
    print(f"Generating spritesheet for {monster_id}...")
    
    # Open original image
    src_path = os.path.join(MONSTERS_DIR, f"{monster_id}.png")
    if not os.path.exists(src_path):
        print(f"Error: {src_path} not found.")
        return
        
    orig_img = Image.open(src_path)
    
    # Transparentize
    trans_img = transparentize(orig_img)
    
    # Implement blink in frame 3 of idle
    config = MONSTER_CONFIGS[monster_id]
    eye_x, eye_y = config['eye']
    eye_color = config['eye_color']
    
    blink_base = trans_img.copy()
    draw = ImageDraw.Draw(blink_base)
    # Draw skin colored ellipse/rectangle to cover eye
    draw.ellipse([eye_x - 12, eye_y - 12, eye_x + 12, eye_y + 12], fill=eye_color)
    
    # Get bounding box of the transparent sprite to crop out empty margins
    bbox = trans_img.getbbox()
    if not bbox:
        bbox = (0, 0, 1024, 1024)
        
    cropped_base = trans_img.crop(bbox)
    cropped_blink = blink_base.crop(bbox)
    
    # Setup 4x4 Grid (1024x1024 output)
    spritesheet = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    
    actions = ['idle', 'walk', 'react', 'sleep']
    
    for row_idx, action in enumerate(actions):
        for col_idx in range(4):
            # Select correct base image (blink in idle frame 3)
            use_base = cropped_blink if (action == 'idle' and col_idx == 3) else cropped_base
            
            frame = create_frame(use_base, config, action, col_idx)
            
            # Paste into spritesheet
            px = col_idx * 256
            py = row_idx * 256
            spritesheet.paste(frame, (px, py))
            
    # Save the output
    dest_path = os.path.join(OUTPUT_DIR, f"{monster_id}_spritesheet.png")
    spritesheet.save(dest_path, "PNG")
    print(f"Saved {dest_path} OK")

if __name__ == "__main__":
    for m_id in MONSTER_CONFIGS:
        generate_spritesheet(m_id)
