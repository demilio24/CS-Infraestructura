# Apply plan — Systema Floyd Summer 2026 rosters

**Source**: 12 updated CSV rosters from `systemafloyd@gmail.com` email `Updated csv files for summer` (2026-05-08).

**Targets**:
- Upper Campus sheet `1qejcgNQt3sS_UZ9Gl9Txr8TOocw3LzK5PjPICqnRrGA`
- Lower Campus sheet `18A_sc917xnxYo3UQ8_cGogqg46Im6qUQlakOC9Oc-Fs`

## Dedup rule

For each weekly tab, build a set of existing keys = `normalize(Student Name) + '|' + normalize(Email)`. Normalize = trim, lowercase, collapse whitespace. A new candidate row is **skipped** if its key is already in the existing set for the SAME tab on the SAME campus.

## Campus assignment

- Week 1 CSV `Group` column wins (Upper / Lower / Mini → Upper / Lower / Lower)
- Else `Additional Notes` containing 'Upper Campus' or 'Lower Campus' wins
- Else age ≥ 6 → Upper, age < 6 → Lower (age unknown → Lower)

## Summary

- Total candidate rows from CSVs: **228**
- Already present (skipped): **69**
- New rows to append to Upper: **36**
- New rows to append to Lower: **123**
- Tabs missing: **0**

## Self-check

- Within each week+campus, NO planned-new key matches a skipped-already-present key: **PASS**

## Per-week plan

### Week 1 — June 1-5  (Upper tab `6/1-6/5`, Lower tab `6/1-6/5`)

- Existing keys on Upper tab: **7** | Existing on Lower tab: **8**
- Candidates: **16**, already present: **2**, +Upper: **2**, +Lower: **12**

**Appending to Upper Campus → `6/1-6/5` (2):**

  - Jacob Perna (age 9, jinglejudi@gmail.com)
  - Tevet Topor (age 8, kedem.shinar@gmail.com)

**Appending to Lower Campus → `6/1-6/5` (12):**

  - Aria Falzone (age 4, marilyn@thefalzones.net)
  - Campbell Rathlev (age 5, lrathlev@gmail.com)
  - Dawson Denney (age 5, tdenney138@me.com)
  - Georgie Wright (age 2, lmw340@gmail.com)
  - Lotan Topor (age 5, kedem.shinar@gmail.com)
  - Paul McIntosh (age 4, lpratka@pm.me)
  - Reagan Olowin (age 4, amandaolowin@gmail.com)
  - Ryder Tarantino (age 5, ryan.t76@icloud.com)
  - Theo Wright (age 4, lmw340@gmail.com)
  - Wyld Torrealba (age 3, laurenmusselman84@gmail.com)
  - Wheeler Wilson (age 3, zaneywilson@aol.com)
  - Luka DeAraujo (age 5, till.amanda@yahoo.com)

**Skipping (2, already present in tab):**

  - Akasha Smith (age 8, thereginasmith@gmail.com) — match in upper
  - Vladimir Aheyev (age 9, mperla0605@gmail.com) — match in upper

### Week 2 — June 8-12  (Upper tab `6/8-6/12`, Lower tab `6/8-6/12`)

- Existing keys on Upper tab: **13** | Existing on Lower tab: **9**
- Candidates: **18**, already present: **7**, +Upper: **6**, +Lower: **5**

**Appending to Upper Campus → `6/8-6/12` (6):**

  - Lyla Falzone (age 6.0, marilyn@thefalzones.net)
  - Matias McCollum (age 6.0, mparloc0505@gmail.com)
  - Vladimir Aheyev (age 9.0, 1nemayynyr@gmail.com)
  - Nelson Gonzalez (age 7.0, kedem.shinar@gmail.com)
  - Hawthorn Fennell (age 9.0, fennelljason42@gmail.com)
  - Hope Jean-Francois (age 7.0, daphne&Jean_francois@gmail.com)

**Appending to Lower Campus → `6/8-6/12` (5):**

  - Aria Falzone (age 4.0, marilyn@thefalzones.net)
  - Campbell Rathlev (age 5.0, lrathlev@gmail.com)
  - Paul McIntosh (age 4.0, lpratka@pm.me)
  - Lotan Topor (age 5.0, kedem.shinar@gmail.com)
  - Dawson Denney (age 5.0, tdenney138@me.com)

**Skipping (7, already present in tab):**

  - Marsano Spinelli (age 5.0, TAYLOR.MATERIO@GMAIL.COM) — match in lower
  - Luka DeAraujo (age 5.0, till.amanda@yahoo.com) — match in lower
  - Austin Shue (age 4.0, agarver2@gmail.com) — match in lower
  - Iyar Topor (age 2.5, kedem.shinar@gmail.com) — match in lower
  - Cort Pond (age 7.0, brittanypond@yahoo.com) — match in upper
  - Colton Hendrix (age 10.0, jhendrix75@icloud.com) — match in upper
  - Wiley Lakow (age 4.0, sandra.lakow@gmail.com) — match in lower

### Week 3 — June 15-19  (Upper tab `6/15-6/19`, Lower tab `6/15-6/19`)

- Existing keys on Upper tab: **5** | Existing on Lower tab: **17**
- Candidates: **30**, already present: **8**, +Upper: **11**, +Lower: **11**

**Appending to Upper Campus → `6/15-6/19` (11):**

  - Akasha Smith (age 8.0, thereginasmith@gmail.com)
  - Benjamin Mosst (age 8.0, jennifermosst@gmail.com)
  - Hawthorn Fennell (age 9.0, fennelljason42@gmail.com)
  - Lyla Falzone (age 6.0, marilyn@thefalzones.net)
  - Nelson Gonzalez (age 7.0, 1nemayynyr@gmail.com)
  - Tevet Topor (age 8.0, kedem.shinar@gmail.com)
  - Vladimir Aheyev (age 9.0, mperla0605@gmail.com)
  - Wilder Scott (age 4.0, farrahkscott@gmail.com)
  - Jacob Perna (age 9.0, jinglejudi@gmail.com)
  - Madelyn Rogers (age 6.0, jgwenberry@yahoo.com)
  - Taavi Horn (age 7.0, phoebehorn87@gmail.com)

**Appending to Lower Campus → `6/15-6/19` (11):**

  - Aria Falzone (age 4.0, marilyn@thefalzones.net)
  - Campbell Rathlev (age 5.0, lrathlev@gmail.com)
  - Dawson Denney (age 5.0, tdenney138@me.com)
  - Iyar Topor (age 2.5, kedem.shinar@gmail.com)
  - LJ Howe (age 5.0, howewedding17@gmail.com)
  - Lotan Topor (age 5.0, kedem.shinar@gmail.com)
  - Luka DeAraujo (age 5.0, till.amanda@yahoo.com)
  - Reagan Olowin (age 4.0, amandaolowin@gmail.com)
  - Ryder Tarantino (age 5.0, ryan.t76@icloud.com)
  - Wyld Torrealba (age 3.0, laurenmusselman84@gmail.com)
  - Wheeler Wilson (age 3.0, zaneywilson@aol.com)

**Skipping (8, already present in tab):**

  - Ellie Bennett (age 3.0, savannahhuizenga@icloud.com) — match in lower
  - Harrison Galligan (age 2.0, virginia.elizabeth.grace@gmail.com) — match in lower
  - JJ Molinari (age 3.5, l.molinari5588@gmail.com) — match in lower
  - Jayden Vititoe (age 5.0, sherylmendez22@yahoo.com) — match in lower
  - Vincent Molinari (age 4.0, l.molinari5588@gmail.com) — match in lower
  - Wells Corbat (age 2.0, epompea@gmail.com) — match in lower
  - Theo Wright (age 4.0, lmw340@gmail.com) — match in lower
  - Georgie Wright (age 2.0, lmw340@gmail.com) — match in lower

### Week 4 — June 22-26  (Upper tab `6/22-6/26`, Lower tab `6/22-6/26`)

- Existing keys on Upper tab: **9** | Existing on Lower tab: **6**
- Candidates: **15**, already present: **4**, +Upper: **1**, +Lower: **10**

**Appending to Upper Campus → `6/22-6/26` (1):**

  - Nelson Gonzalez (age 7.0, 1nemayynyr@gmail.com)

**Appending to Lower Campus → `6/22-6/26` (10):**

  - JJ Molinari (age 3.5, l.molinari5588@gmail.com)
  - LJ Howe (age 5.0, howewedding17@gmail.com)
  - Reagan Olowin (age 4.0, amandaolowin@gmail.com)
  - Graham Olowin (age 2.0, amandaolowin@gmail.com)
  - Grant 'Geo' Olowin (age 2.0, amandaolowin@gmail.com)
  - Ryder Tarantino (age 5.0, ryan.t76@icloud.com)
  - Aria Falzone (age 4.0, marilyn@thefalzones.net)
  - Dawson Denney (age 5.0, tdenney138@me.com)
  - Theo Wright (age 4.0, lmw340@gmail.com)
  - Georgie Wright (age 2.0, lmw340@gmail.com)

**Skipping (4, already present in tab):**

  - Jayden Vititoe (age 5.0, sherylmendez22@yahoo.com) — match in lower
  - Hudson Horta (age 6.0, kellyhorta@aol.com) — match in upper
  - Vincent Molinari (age 4.0, l.molinari5588@gmail.com) — match in lower
  - Jayden Vititoe (age 5.0, sherylmendez22@yahoo.com) — match in lower

### Week 5 — June 29-July 3  (Upper tab `6/29-7/3`, Lower tab `6/29-7/3`)

- Existing keys on Upper tab: **5** | Existing on Lower tab: **5**
- Candidates: **18**, already present: **5**, +Upper: **4**, +Lower: **9**

**Appending to Upper Campus → `6/29-7/3` (4):**

  - Matias McCollum (age 6, jerlmccollum@gmail.com)
  - Hawthorn Fennell (age 9, fennelljason42@gmail.com)
  - Jacob Perna (age 9, jinglejudi@gmail.com)
  - Wilder Scott (age 4, farrahkscott@gmail.com)

**Appending to Lower Campus → `6/29-7/3` (9):**

  - LJ Howe (age 5, howewedding17@gmail.com)
  - Reagan Olowin (age 4, amandaolowin@gmail.com)
  - Graham Olowin (age 2, amandaolowin@gmail.com)
  - Grant 'Geo' Olowin (age 2, amandaolowin@gmail.com)
  - Austin Shue (age 4, agarver2@gmail.com)
  - Vincent Molinari (age 4, l.molinari5588@gmail.com)
  - Aria Falzone (age 4, marilyn@thefalzones.net)
  - Dawson Denney (age 5, tdenney138@me.com)
  - Ryder Tarantino (age 5, ryan.t76@icloud.com)

**Skipping (5, already present in tab):**

  - Nelson Gonzalez (age 7, 1nemayynyr@gmail.com) — match in upper
  - Sloane Deady-Laakso (age 7, edeady5180@att.net) — match in upper
  - Tripp Hall (age 6, shall@sourceonespares.com) — match in upper
  - Remy Sned (age 4, nikisned@gmail.com) — match in lower
  - Teddy Grace (age 4, kellyannvitko@gmail.com) — match in lower

### Week 6 — July 6-10  (Upper tab `7/6-7/10`, Lower tab `7/6-7/10`)

- Existing keys on Upper tab: **8** | Existing on Lower tab: **10**
- Candidates: **24**, already present: **7**, +Upper: **4**, +Lower: **13**

**Appending to Upper Campus → `7/6-7/10` (4):**

  - Matias McCollum (age 6, jerlmccollum@gmail.com)
  - Hawthorn Fennell (age 9, fennelljason42@gmail.com)
  - Jacob Perna (age 9, jinglejudi@gmail.com)
  - Wilder Scott (age 4, farrahkscott@gmail.com)

**Appending to Lower Campus → `7/6-7/10` (13):**

  - Lilly Heyes (age 4, priscilla-ten@hotmail.com)
  - Sebastian Martinat (age 5, danelamartinat@gmail.com)
  - Vincent Vallier (age 5, mollyvallier@gmail.com)
  - Austin Shue (age 4, agarver2@gmail.com)
  - LJ Howe (age 5, howewedding17@gmail.com)
  - Reagan Olowin (age 4, amandaolowin@gmail.com)
  - Graham Olowin (age 2, amandaolowin@gmail.com)
  - Grant 'Geo' Olowin (age 2, amandaolowin@gmail.com)
  - Wyld Torrealba (age 3, laurenmusselman84@gmail.com)
  - Aria Falzone (age 4, marilyn@thefalzones.net)
  - Dawson Denney (age 5, tdenney138@me.com)
  - Vincent Molinari (age 4, l.molinari5588@gmail.com)
  - Ryder Tarantino (age 5, ryan.t76@icloud.com)

**Skipping (7, already present in tab):**

  - Nelson Gonzalez (age 7, 1nemayynyr@gmail.com) — match in upper
  - Olive White (age 2, kellyklainewhite@gmail.com) — match in lower
  - Ozzie White (age 2, kellyklainewhite@gmail.com) — match in lower
  - Owen Grant (age 2, ggrant0508@gmail.com) — match in lower
  - Luka DeAraujo (age 5, till.amanda@yahoo.com) — match in lower
  - Jayden Vititoe (age 5, sherylmendez22@yahoo.com) — match in lower
  - Wheeler Wilson (age 3, zaneywilson@aol.com) — match in lower

### Week 7 — July 13-17  (Upper tab `7/13-7/17`, Lower tab `7/13-7/17`)

- Existing keys on Upper tab: **4** | Existing on Lower tab: **11**
- Candidates: **21**, already present: **6**, +Upper: **2**, +Lower: **13**

**Appending to Upper Campus → `7/13-7/17` (2):**

  - Jacob Perna (age 9, jinglejudi@gmail.com)
  - Wilder Scott (age 4, farrahkscott@gmail.com)

**Appending to Lower Campus → `7/13-7/17` (13):**

  - Lilly Heyes (age 4, priscilla-ten@hotmail.com)
  - Theo Trochet (age 3, susan.trochez@gmail.com)
  - Ainslee Sheridan (age 2, susan.trochez@gmail.com)
  - Beckham Fox (age 3, briafoca@gmail.com)
  - LJ Howe (age 5, howewedding17@gmail.com)
  - Reagan Olowin (age 4, amandaolowin@gmail.com)
  - Graham Olowin (age 2, amandaolowin@gmail.com)
  - Grant 'Geo' Olowin (age 2, amandaolowin@gmail.com)
  - Wyld Torrealba (age 3, laurenmusselman84@gmail.com)
  - Aria Falzone (age 4, marilyn@thefalzones.net)
  - Dawson Denney (age 5, tdenney138@me.com)
  - Jayden Vititoe (age 5, sherylmendez22@yahoo.com)
  - Ryder Tarantino (age 5, ryan.t76@icloud.com)

**Skipping (6, already present in tab):**

  - Nelson Gonzalez (age 7, 1nemayynyr@gmail.com) — match in upper
  - Olive White (age 2, kellyklainewhite@gmail.com) — match in lower
  - Ozzie White (age 2, kellyklainewhite@gmail.com) — match in lower
  - Owen Grant (age 2, ggrant0508@gmail.com) — match in lower
  - Taavi Horn (age 7, phoebehorn87@gmail.com) — match in upper
  - Wheeler Wilson (age 3, zaneywilson@aol.com) — match in lower

### Week 8 — July 20-24  (Upper tab `7/20-7/24`, Lower tab `7/20-7/24`)

- Existing keys on Upper tab: **10** | Existing on Lower tab: **10**
- Candidates: **23**, already present: **9**, +Upper: **2**, +Lower: **12**

**Appending to Upper Campus → `7/20-7/24` (2):**

  - Jacob Perna (age 9, jinglejudi@gmail.com)
  - Wilder Scott (age 4, farrahkscott@gmail.com)

**Appending to Lower Campus → `7/20-7/24` (12):**

  - Lilly Heyes (age 4, priscilla-ten@hotmail.com)
  - James 'Duncan' Zahringer III (age 5, ashleezahringer@gmail.com)
  - Isaiah Plummer (age 5, mplummer@gunster.com)
  - Vincent Vallier (age 5, mollyvallier@gmail.com)
  - Luka DeAraujo (age 5, till.amanda@yahoo.com)
  - LJ Howe (age 5, howewedding17@gmail.com)
  - Reagan Olowin (age 4, amandaolowin@gmail.com)
  - Graham Olowin (age 2, amandaolowin@gmail.com)
  - Grant 'Geo' Olowin (age 2, amandaolowin@gmail.com)
  - Aria Falzone (age 4, marilyn@thefalzones.net)
  - Vincent Molinari (age 4, l.molinari5588@gmail.com)
  - Ryder Tarantino (age 5, ryan.t76@icloud.com)

**Skipping (9, already present in tab):**

  - Ira Skaletsky (age 9, iamsam1018@yahoo.com) — match in upper
  - Teddy Thomason (age 6, olivia.b.thomason@gmail.com) — match in upper
  - Griffin McCauley (age 4, laurenjhooks@gmail.com) — match in lower
  - Avery McCauley (age 2, laurenjhooks@gmail.com) — match in lower
  - Nelson Gonzalez (age 7, 1nemayynyr@gmail.com) — match in upper
  - Beckham Fox (age 3, brilafoca@gmail.com) — match in lower
  - Olive White (age 2, kellyklainewhite@gmail.com) — match in lower
  - Ozzie White (age 2, kellyklainewhite@gmail.com) — match in lower
  - Wheeler Wilson (age 3, zaneywilson@aol.com) — match in lower

### Week 9 — July 27-31  (Upper tab `7/27-7/31`, Lower tab `7/27-7/31`)

- Existing keys on Upper tab: **7** | Existing on Lower tab: **8**
- Candidates: **19**, already present: **8**, +Upper: **2**, +Lower: **9**

**Appending to Upper Campus → `7/27-7/31` (2):**

  - Jacob Perna (age 9, jinglejudi@gmail.com)
  - Wilder Scott (age 4, farrahkscott@gmail.com)

**Appending to Lower Campus → `7/27-7/31` (9):**

  - Lilly Heyes (age 4, priscilla-ten@hotmail.com)
  - Olive White (age 2, kellyklainewhite@gmail.com)
  - Ozzie White (age 2, kellyklainewhite@gmail.com)
  - Vincent Vallier (age 5, mollyvallier@gmail.com)
  - LJ Howe (age 5, howewedding17@gmail.com)
  - Dawson Denney (age 5, tdenney138@me.com)
  - Aria Falzone (age 4, marilyn@thefalzones.net)
  - Jayden Vititoe (age 5, sherylmendez22@yahoo.com)
  - Ryder Tarantino (age 5, ryan.t76@icloud.com)

**Skipping (8, already present in tab):**

  - Ira Skaletsky (age 9, iamsam1018@yahoo.com) — match in upper
  - Truett Rogers (age 4, jgwenberry@yahoo.com) — match in lower
  - Madelyn Rogers (age 6, jgwenberry@yahoo.com) — match in upper
  - Matias McCollum (age 6, jerlmccollum@gmail.com) — match in upper
  - Taavi Horn (age 7, phoebehorn87@gmail.com) — match in upper
  - Annabelle Dockus (age 4, jessica.dockus@gmail.com) — match in lower
  - Akasha Smith (age 8, thereginasmith@gmail.com) — match in upper
  - Wiley Lakow (age 4, sandra.lakow@gmail.com) — match in lower

### Week 10 — Aug 3-7  (Upper tab `8/3-8/7`, Lower tab `8/3-8/7`)

- Existing keys on Upper tab: **6** | Existing on Lower tab: **13**
- Candidates: **20**, already present: **4**, +Upper: **0**, +Lower: **16**

**Appending to Lower Campus → `8/3-8/7` (16):**

  - Grant 'Geo' Olowin (age 2, amandaolowin@gmail.com)
  - Carter Grant (age 5, ggrant0508@gmail.com)
  - Owen Grant (age 2, ggrant0508@gmail.com)
  - LJ Howe (age 5, howewedding17@gmail.com)
  - Charlotte Eady (age , ashleyeady@gmail.com)
  - Liam Eady (age , ashleyeady@gmail.com)
  - Henry Reynolds (age , )
  - Jack Morrison (age , )
  - Lydia Gioia (age , )
  - Alex Gioia (age , )
  - Aria Falzone (age 4, marilyn@thefalzones.net)
  - Collyn (age , )
  - Hunter (age , )
  - Ballapiatt Ryan (age 5, ballapiatt25@hotmail.com)
  - Scott Wilder (age 4, farrahkscott@gmail.com)
  - Lakow Wiley (age 4, sandra.lakow@gmail.com)

**Skipping (4, already present in tab):**

  - Graham Olowin (age 2, amandaolowin@gmail.com) — match in lower
  - Matias McCollum (age 6, jerlmccollum@gmail.com) — match in upper
  - Wells Corbat (age 2, epompea@gmail.com) — match in lower
  - Luka DeAraujo (age 5, till.amanda@yahoo.com) — match in lower

### Week 11 — Aug 10-14  (Upper tab `8/10-8/14`, Lower tab `8/10-8/14`)

- Existing keys on Upper tab: **4** | Existing on Lower tab: **7**
- Candidates: **11**, already present: **5**, +Upper: **0**, +Lower: **6**

**Appending to Lower Campus → `8/10-8/14` (6):**

  - Tilly Robinson (age 5, jvrobinson@gmail.com)
  - Cosmo Robinson (age 2, jvrobinson@gmail.com)
  - Maciej Kozakowski (age 5, jvrobinson@gmail.com)
  - Julia Kozakowska (age 3, jvrobinson@gmail.com)
  - Marlow Rollins (age 4, kristh.h.rollins@gmail.com)
  - Wyld Torrealba (age 3, laurenmusselman84@gmail.com)

**Skipping (5, already present in tab):**

  - Truett Rogers (age 4, jgwenberry@yahoo.com) — match in lower
  - Madelyn Rogers (age 6, jgwenberry@yahoo.com) — match in upper
  - Sloane Deady-Laakso (age 7, edeady5180@att.net) — match in upper
  - Reagan Olowin (age 4, amandaolowin@gmail.com) — match in lower
  - Wilder Scott (age 4, farrahkscott@gmail.com) — match in lower

### Week 12 — Aug 17-21  (Upper tab `8/17-8/21`, Lower tab `8/17-8/21`)

- Existing keys on Upper tab: **9** | Existing on Lower tab: **6**
- Candidates: **13**, already present: **4**, +Upper: **2**, +Lower: **7**

**Appending to Upper Campus → `8/17-8/21` (2):**

  - Herbst Capri (age 10, bg03interiors@aol.com)
  - Hawthorn Fennell (age 9, fennelljason42@gmail.com)

**Appending to Lower Campus → `8/17-8/21` (7):**

  - Marlow Rollins (age 4, kristh.h.rollins@gmail.com)
  - Lily Johnson (age 4, chanemurphy@gmail.com)
  - August Johnson (age 2, chanemurphy@gmail.com)
  - Reagan Olowin (age 4, amandaolowin@gmail.com)
  - Wyld Torrealba (age 3, laurenmusselman84@gmail.com)
  - Leo Hamric (age 5, email.mlafuente@gmail.com)
  - Truett Rogers (age 4, jgwenberry@yahoo.com)

**Skipping (4, already present in tab):**

  - Madelyn Rogers (age 6, jgwenberry@yahoo.com) — match in upper
  - Remy Zimmer (age 6, ericapaigezimmer@gmail.com) — match in upper
  - Zoey Zimmer (age 8, ericapaigezimmer@gmail.com) — match in upper
  - Wilder Scott (age 4, farrahkscott@gmail.com) — match in lower

