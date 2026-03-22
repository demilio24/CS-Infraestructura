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

3. **Generate the image** — Call Google Imagen via Vertex AI:
   ```bash
   curl -X POST \
     "https://us-central1-aiplatform.googleapis.com/v1/projects/{GOOGLE_PROJECT_ID}/locations/us-central1/publishers/google/models/imagen-3.0-generate-001:predict" \
     -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     -H "Content-Type: application/json" \
     -d '{
       "instances": [{"prompt": "{USER_PROMPT}"}],
       "parameters": {"sampleCount": 1, "aspectRatio": "{RATIO}"}
     }'
   ```

4. **Save the image** — Decode the base64 response and save to `uploads/generated-{timestamp}.png`.

5. **Upload to GHL (optional)** — Ask if they want to upload it to GHL now. If yes, follow the `/upload-to-ghl` workflow for that file and return the CDN URL.

6. **Return result** — Output the local file path and/or the GHL CDN URL.
