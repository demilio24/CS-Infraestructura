from PIL import Image

src = Image.open(r'f:/GitHub/Websites/Josie-David_CenterLaneSwim/3 LANE ROPE OUTLINE.png').convert('RGBA')
w, h = src.size
print(f"Source: {w} x {h}")

# Buoy centers found at x ~= 77, 582, 1088
left = 77
right = 1088
crop = src.crop((left, 0, right, h))
print(f"Crop: {crop.size}")

out = r'f:/GitHub/Websites/Josie-David_CenterLaneSwim/3-lane-rope-tile.png'
crop.save(out, 'PNG', optimize=True)
print(f"Saved: {out}")
