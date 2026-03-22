Upload images from the `uploads/` folder to the GoHighLevel media library and return CDN URLs.

## Steps

1. **Load credentials** — Read `.env` file in the repo root and extract:
   - `GHL_API_KEY`
   - `GHL_LOCATION_ID`
   If either is missing, stop and ask the user to add them to `.env` (see `.env.example`).

2. **Find images** — List all image files in the `uploads/` folder (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`).
   If the folder is empty, ask the user to drop images in there first.

3. **Upload each image** — For each file, run a curl command:
   ```bash
   curl -X POST "https://services.leadconnectorhq.com/medias/upload-file" \
     -H "Authorization: Bearer {GHL_API_KEY}" \
     -H "Version: 2021-07-28" \
     -F "file=@uploads/{filename}" \
     -F "locationId={GHL_LOCATION_ID}"
   ```

4. **Return URLs** — Parse the response and output a clean list of CDN URLs, ready to paste into HTML `src` attributes:
   ```
   filename.jpg → https://assets.cdn.filesafe.space/.../filename.jpg
   ```

5. **Optionally clean up** — Ask the user if they want to delete the files from `uploads/` after a successful upload.
