#!/usr/bin/env bash
set -e
GOOGLE_KEY=$(grep '^GOOGLE_API_KEY=' .claude/.env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
TS=$(date +%Y%m%d-%H%M%S)
SLUG=$1
PROMPT=$2
OUT="uploads/charles-notary-v${SLUG}-${TS}.png"

curl -sS -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GOOGLE_KEY}" \
  -H "Content-Type: application/json" \
  --data-binary @- <<JSON | node -e "
const c=[]; process.stdin.on('data',d=>c.push(d)); process.stdin.on('end',()=>{
  const txt=Buffer.concat(c).toString();
  let r; try{ r=JSON.parse(txt);}catch(e){console.error('Non-JSON:',txt.slice(0,400));process.exit(1);}
  if(r.error){console.error('API error:', JSON.stringify(r.error));process.exit(1);}
  if(!r.predictions||!r.predictions[0]){console.error('No predictions:', JSON.stringify(r).slice(0,400));process.exit(1);}
  const p=r.predictions[0];
  const b=p.bytesBase64Encoded||p.imageBytes;
  if(!b){console.error('No bytes');process.exit(1);}
  require('fs').writeFileSync('${OUT}', Buffer.from(b,'base64'));
  console.log('${OUT}');
});"
{"instances":[{"prompt": $(node -e "process.stdout.write(JSON.stringify(process.argv[1]))" "$PROMPT")}],"parameters":{"sampleCount":1,"aspectRatio":"1:1","personGeneration":"ALLOW_ADULT"}}
JSON
