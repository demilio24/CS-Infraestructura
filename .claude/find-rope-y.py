from PIL import Image
import numpy as np

img = Image.open(r'f:/GitHub/Websites/Josie-David_CenterLaneSwim/3 LANE ROPE OUTLINE.png').convert('RGBA')
arr = np.array(img)
h, w = arr.shape[:2]
alpha = arr[:, :, 3]

# Buoy centers found at x ~= 77, 582, 1088
# Inter-buoy regions: x in [143..515] (between buoy 1 right edge and buoy 2 left edge)
#                     x in [657..1014] (between buoy 2 right edge and buoy 3 left edge)
# In these regions only the rope is inked; find the centroid Y of inked pixels per column.

def rope_y_at(x):
    col = alpha[:, x] > 50
    if col.sum() == 0:
        return None
    ys = np.where(col)[0]
    return float(ys.mean())

# Print Y of rope across both inter-buoy regions for symmetry check
print("=== Region between buoy 1 and 2 (x=143..515) ===")
for x in range(150, 515, 30):
    y = rope_y_at(x)
    print(f"  x={x}: rope_y={y}")

print()
print("=== Region between buoy 2 and 3 (x=657..1014) ===")
for x in range(660, 1014, 30):
    y = rope_y_at(x)
    print(f"  x={x}: rope_y={y}")

# We want a single-buoy tile centered on buoy 2 (x=582).
# Tile width should equal the buoy-to-buoy spacing in the source: ~505px.
# So tile spans x = 582 - 252 = 330  to  x = 582 + 253 = 835
# Check that rope_y at x=330 (left edge) equals rope_y at x=835 (right edge).
print()
print("=== Tile boundary candidates ===")
for left, right in [(329, 835), (300, 864), (350, 814), (250, 914)]:
    yl = rope_y_at(left)
    yr = rope_y_at(right)
    print(f"  L={left} (y={yl}), R={right} (y={yr}), diff={yr-yl if yl and yr else 'N/A'}, width={right-left}")
