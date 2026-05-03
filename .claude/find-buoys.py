from PIL import Image
import numpy as np

img = Image.open(r'f:/GitHub/Websites/Josie-David_CenterLaneSwim/3 LANE ROPE OUTLINE.png').convert('RGBA')
arr = np.array(img)
h, w = arr.shape[:2]
print(f"Image: {w} x {h}")

# Use alpha channel to find inked columns
alpha = arr[:, :, 3]
col_ink = (alpha > 50).sum(axis=0)
print(f"Total inked rows per column - max: {col_ink.max()}")

# A buoy is much taller than rope. Find columns with high ink (buoy columns).
# Print histogram-ish info
threshold = col_ink.max() * 0.5
buoy_cols = np.where(col_ink > threshold)[0]
print(f"Columns with > {threshold:.0f} inked rows: count={len(buoy_cols)}")
print(f"  Range: {buoy_cols.min()} to {buoy_cols.max()}")

# Group consecutive runs
runs = []
start = buoy_cols[0]
prev = buoy_cols[0]
for c in buoy_cols[1:]:
    if c - prev > 5:
        runs.append((start, prev))
        start = c
    prev = c
runs.append((start, prev))
print(f"Buoy column runs: {runs}")
for i, (s, e) in enumerate(runs):
    center = (s + e) // 2
    print(f"  Buoy {i+1}: x={s}..{e}, center={center}")
