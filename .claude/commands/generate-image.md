Generate an image using Google Imagen (Vertex AI) and optionally upload it to GoHighLevel.

## Steps

1. **Load credentials** — Read `.env` file and extract:
   - `GOOGLE_API_KEY`
   - `GOOGLE_PROJECT_ID`
   If missing, stop and ask the user to add them to `.env`.

2. **Get prompt** — Ask the user:
   - What should the image look like? (detailed description)
   - Aspect ratio: square (1:1), landscape (16:9), or portrait (9:16)?
   - Style: photorealistic, illustration, abstract, professional/corporate?

3. **Generate the image** — Use Google Imagen (default) or DALL-E 3 (fallback/alternative).

   **Option A — Google Imagen (default, photorealistic, best for backgrounds and scenes):**
   ```bash
   GOOGLE_KEY=$(grep GOOGLE_API_KEY .env | cut -d '=' -f2)
   curl -s -X POST \
     "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GOOGLE_KEY}" \
     -H "Content-Type: application/json" \
     -d '{
       "instances": [{"prompt": "{USER_PROMPT}"}],
       "parameters": {"sampleCount": 1, "aspectRatio": "{RATIO}", "personGeneration": "DONT_ALLOW"}
     }' | node -e "
const c=[]; process.stdin.on('data',d=>c.push(d)); process.stdin.on('end',()=>{
  const r=JSON.parse(Buffer.concat(c));
  if(r.error){console.error(r.error.message);process.exit(1);}
  require('fs').writeFileSync('{OUTPUT_PATH}', Buffer.from(r.predictions[0].bytesBase64Encoded,'base64'));
  console.log('Image saved to {OUTPUT_PATH}');
});"
   ```
   Available models (check with: `curl "https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_KEY}" | node -e "..."`):
   - `imagen-4.0-generate-001` — standard quality
   - `imagen-4.0-fast-generate-001` — faster
   - `imagen-4.0-ultra-generate-001` — highest quality

   **Option B — DALL-E 3 (alternative, better for illustrations and stylized images):**
   ```bash
   OPENAI_KEY=$(grep OPENAI_API_KEY .env | cut -d '=' -f2)
   curl -X POST "https://api.openai.com/v1/images/generations" \
     -H "Authorization: Bearer ${OPENAI_KEY}" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "dall-e-3",
       "prompt": "{USER_PROMPT}",
       "n": 1,
       "size": "{SIZE}",
       "quality": "hd",
       "style": "natural"
     }'
   ```
   Size options: `1024x1024` (square), `1792x1024` (landscape), `1024x1792` (portrait).

4. **Save the image** — Decode the base64 response and save to `uploads/generated-{timestamp}.png`.

5. **Upload to GHL (optional)** — Ask if they want to upload it to GHL now. If yes, follow the `/upload-to-ghl` workflow for that file and return the CDN URL.

6. **Return result** — Output the local file path and/or the GHL CDN URL.
