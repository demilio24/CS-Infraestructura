from PIL import Image, ImageOps

src = Image.open(r'f:/GitHub/Websites/Josie-David_CenterLaneSwim/3 LANE ROPE OUTLINE.png').convert('RGBA')
w, h = src.size
print(f"Source: {w} x {h}")

# Crop the left half of a single-buoy tile:
#   left edge  = x=329 (bottom of the dip between buoy 1 and buoy 2 — y≈79)
#   right edge = x=582 (center of buoy 2)
# The crop contains: rising rope from dip + left half of buoy 2.
LEFT, RIGHT = 329, 582
left_half = src.crop((LEFT, 0, RIGHT, h))
print(f"Left half: {left_half.size}")

# Mirror it to create the right half: buoy-2-right-half + descending rope to dip.
right_half = ImageOps.mirror(left_half)

# Combine into one symmetric tile.
tile_w = (RIGHT - LEFT) * 2
tile = Image.new('RGBA', (tile_w, h), (0, 0, 0, 0))
tile.paste(left_half, (0, 0))
tile.paste(right_half, (RIGHT - LEFT, 0))
print(f"Symmetric tile: {tile.size}")

# When this tile repeats, both seams meet at "middle of the dip" — same y on both sides.
out = r'f:/GitHub/Websites/Josie-David_CenterLaneSwim/3-lane-rope-tile.png'
tile.save(out, 'PNG', optimize=True)
print(f"Saved: {out}")
