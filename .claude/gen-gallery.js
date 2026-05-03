const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, '..', 'Josie-David_CenterLaneSwim', 'home.html');
const BASE = 'https://assets.cdn.filesafe.space/JL5Xsreqcpi8naffNZWe/media/';
const PH   = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const row1 = [
  ['5e81a018-1d72-4b08-aad2-4a2557f3c79a.jpg', 'Center Lane Swim School storefront exterior'],
  ['d7ea3e0c-572d-4093-8e48-0038ffa41f92.jpg', 'Student leaping confidently off the pool edge'],
  ['a02a3221-e882-40d3-bc6f-1842433f92fe.jpg', 'Girl leaping off a foam slide into the pool'],
  ['10eb4245-2127-4b3c-9a58-e434c2db9676.jpg', 'Instructor watching proudly as a toddler reaches for the pool wall'],
  ['c5058fea-4875-420b-a9a3-f39ae0e59571.jpg', 'Instructor laughing as she reaches toward a toddler in the pool'],
  ['144ceba4-8bef-41b7-a595-8cbecab70ab1.jpg', 'Instructor hoisting a baby in a floral swim onesie high above the water'],
  ['7b3ce8fb-e5c1-412f-8dfe-aacc42f131de.jpg', 'Coach lifts a baby overhead in the pool, beaming up at the child'],
  ['2c7f0b30-0aa8-4c32-bec7-f360c0397c9a.jpg', 'Coach celebrating a triple high-five with her students'],
  ['c6e6c2a7-7077-46aa-bba7-01f155512793.jpg', 'Coach grinning at a baby during their first-time-in-the-water lesson'],
  ['428449af-ea05-42a3-b91a-fc31b4004739.jpg', 'Coach joyfully lifts a toddler out of the water with splashes flying'],
  ['86f4b95d-e7a7-42d6-8dd5-79966c8766fc.jpg', 'Instructor raising a smiling toddler above the water'],
  ['d2aca991-ab76-4386-9882-d81ec575c3d6.jpg', 'Laugh-out-loud handoff between two instructors as a baby is passed between them'],
  ['2690d6bd-5e5d-4858-85d2-e33f377d5db1.jpg', 'Blonde instructor laughing as a colleague hands her a baby in the pool'],
  ['e7621a47-1cad-490a-91a8-3cbe51c2a4f3.jpg', 'Teen instructor sharing a laughing, face-to-face moment with a toddler boy'],
  ['3b87cf67-7783-4231-9c71-3547ddd9cfc7.jpg', 'Two coaches working as a team with a baby in a floral swimsuit'],
  ['4e175ca9-9b2d-4d80-87c9-a08eaf026447.jpg', "Toddler's arms held up in a high-five victory pose at the pool ladder"],
];

const row2 = [
  ['c327a40b-75c3-4a12-b06e-bd8276f99fb8.jpg', 'Coach playing with two toddlers while a sibling looks on through pink goggles'],
  ['b726112b-3cba-49e4-be59-c643c2c5a330.jpg', 'Teen coach hoists a toddler high above the pool as splashes erupt'],
  ['bc52a211-ca6d-4ec1-97f8-a2eb4677f854.jpg', 'Staff member laughing with a toddler in the lobby retail area'],
  ['5eedf8ad-9805-46f6-912f-2a787df017c0.jpg', 'Staff cradling a smiling toddler in the retail corner'],
  ['ded237f5-f5f8-4cc3-9232-920ccc4570fc.jpg', 'Instructor holds a baby chest-to-chest as they watch a dive ring float by'],
  ['3f012ad6-174a-42c3-b08a-be30cdc5f214.jpg', 'Instructor supports a toddler practicing supported floating'],
  ['af2ebf06-25d3-4cc1-98a1-55d0df3d6e9d.jpg', 'Bearded instructor grins as he holds a small boy during a lesson'],
  ['3ed81b10-b70e-4236-b195-8ff70318239a.jpg', 'Two instructors work together: one holds a baby in a float position while the other extends a hand'],
  ['2e3aed80-4065-4bdd-affa-5aea9d4b83d0.jpg', 'Instructor reaches out with open hands as a colleague floats a baby gently by'],
  ['cfdf0ee0-a81f-4413-9e05-cf3afb20341b.jpg', 'Instructor touches fingers with a toddler girl in an eye-to-eye connection moment'],
  ['ee25f20e-4608-47df-a98b-e53131362df8.jpg', "Instructor kisses the top of a baby's head while a parent films in the background"],
  ['c9510ae6-addf-474c-8e5f-925766a53257.jpg', 'Instructor gently floats a baby on her back in the pool'],
  ['d9a5f7a3-d4c9-407a-8277-f63cc6066085.jpg', "Orange-shirted instructor shares a caring 'you've got this' moment with a toddler"],
  ['7fd7d5b0-da64-487a-9e89-29d519a87caf.jpg', 'Two instructors laughing together as they support a dark-haired swimmer'],
  ['7e5b01ce-6025-4642-858e-ff4593958123.jpg', 'Dad playing peekaboo with his baby in the family changing area mirror'],
  ['d91b6c1a-76db-4a57-8a1c-71fdfce00ee3.jpg', 'Group portrait of coach with three young swimmers'],
];

const zoomSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f3634" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/></svg>';

function slide(f, alt, dup){
  const url = BASE + f;
  const esc = alt.replace(/"/g, '&quot;');
  const ariaBits = dup ? ' aria-hidden="true" tabindex="-1"' : '';
  const imgAlt = dup ? '' : esc;
  return `        <div class="gallery-slide"${ariaBits} data-full="${url}" data-caption="${esc}"><img src="${PH}" data-src="${url}" alt="${imgAlt}" width="280" height="200" loading="lazy" decoding="async" fetchpriority="low"><span class="zoom-hint" aria-hidden="true">${zoomSvg}</span></div>`;
}

function rowBlock(items, rowIdx, extraClass){
  const unique = items.map(([f,a]) => slide(f, a, false)).join('\n');
  const dups   = items.map(([f,a]) => slide(f, a, true)).join('\n');
  return `      <div class="gallery-row${extraClass}">\n        <div class="gallery-track" data-row="${rowIdx}">\n${unique}\n${dups}\n        </div>\n      </div>`;
}

const newBlock =
`    <p class="section-sub anim" style="text-align:center;margin-top:8px;">Hover to pause. Click any photo to enlarge.</p>
    <div class="gallery-marquee anim" id="galleryMarquee">
      <!-- Row 1 — scrolls left -->
${rowBlock(row1, 1, '')}
      <!-- Row 2 — scrolls right -->
${rowBlock(row2, 2, ' reverse')}
    </div>`;

// Read file, find gallery block, replace
let src = fs.readFileSync(FILE, 'utf8');
const hadCRLF = /\r\n/.test(src);
if (hadCRLF) src = src.replace(/\r\n/g, '\n');

const startMarker = '    <p class="section-sub anim" style="text-align:center;margin-top:8px;">Hover to pause. Click any photo to enlarge.</p>';

const start = src.indexOf(startMarker);
if (start < 0) { console.error('START MARKER NOT FOUND'); process.exit(1); }
// Find the closing `</section>` that ends the gallery section
const afterStart = src.slice(start);
const secEnd = afterStart.indexOf('</section>');
if (secEnd < 0) { console.error('</section> NOT FOUND'); process.exit(1); }
// Walk back from </section> to find where the gallery content should end
// The container + section closes look like: "...\n    </div>\n  </div>\n</section>"
// We'll capture everything from start up to right before "    </div>\n  </div>\n</section>"
const tailPattern = '\n  </div>\n</section>';
const tailPos = afterStart.indexOf(tailPattern);
if (tailPos < 0) { console.error('TAIL NOT FOUND'); process.exit(1); }
// Find the preceding indented </div> just before "  </div>\n</section>"
// That closes the container, so we want to replace everything from `start` up to (but not including) that "  </div>"
const containerClose = afterStart.lastIndexOf('\n  </div>', tailPos + 1);
if (containerClose < 0) { console.error('CONTAINER CLOSE NOT FOUND'); process.exit(1); }

const end = start + containerClose;
const tail = src.slice(end);

const newSrc = src.slice(0, start) + newBlock + tail;
const out = hadCRLF ? newSrc.replace(/\n/g, '\r\n') : newSrc;
fs.writeFileSync(FILE, out, 'utf8');
console.log('Gallery rewritten. New file size:', out.length, 'CRLF:', hadCRLF);
