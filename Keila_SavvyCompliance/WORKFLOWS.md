# Savvy Compliance — n8n + Supabase Architecture

End-to-end documentation of the Savvy Compliance automation pipeline: every n8n workflow that powers the platform, every Supabase table it reads/writes, and how the pieces fit together.

> Scope: only the **Savvy Compliance** project. For the standalone AML logger + search frontend, see [README.md](./README.md) — this doc references it but does not duplicate it.

---

## 1. High-level architecture

```
┌────────────────────┐   ┌────────────────────────────────────────────┐   ┌────────────────────┐
│  Portal & GHL      │   │             n8n (nilsdigital.app.n8n.cloud)│   │  External services │
│  ───────────────   │   │  ─────────────────────────────────────────│   │  ──────────────── │
│  portal.html       │──▶│  • SC ACCOUNT UPSERT       (subacct setup)│──▶│  GoHighLevel       │
│  (admin tools)     │   │  • 1. NEW - Min Dilligence (form webhook) │──▶│  services.lead-    │
│                    │   │  • 2. NEW - Risk Analysis  (form webhook) │   │  connectorhq.com   │
│  GHL subaccounts   │──▶│  • 3. NEW - LEGAL          (form webhook) │──▶│                    │
│  forms / contacts  │   │  • Contacts SubAcc → ADMIN (sync webhook) │   │  RiskTech AML      │
│                    │   │  • IMPORT FORM → Subaccount (sync webhook)│──▶│  savvylink.amlrisk │
│                    │   │  • 1. Updates All Tokens — 3 AM (cron)    │   │  .com              │
│                    │   │  • RiskTech AML Logger       (5-min cron) │   │                    │
│                    │   │  • Savvy email → Generate draft  (Gmail)  │──▶│  Gmail             │
│                    │   └────────────────┬───────────────────────────┘   └────────────────────┘
│                    │                    │                                          ▲
│                    │                    ▼                                          │
│  aml-search.html   │   ┌────────────────────────────────────────────┐              │
│  (public AML hist) │◀──│  Supabase — project "Zona Libre"           │              │
│                    │   │  nroeiabeirifurdaybyo.supabase.co          │──────────────┘
└────────────────────┘   └────────────────────────────────────────────┘
```

The platform layers, in plain terms:

1. **Portal & GHL forms** — the entry points. The admin uses [portal.html](./portal.html) to spin up new subaccounts; end-clients fill GHL forms (minimum-, basic-, or legal-diligence) inside their subaccount.
2. **n8n** — every workflow that runs the business. Three categories:
   - **Diligence workflows** — receive a form submission, screen the person against AML lists, score risk, and write a risk report back into GHL.
   - **Account/contact plumbing** — onboard new subaccounts, sync contacts between the SL Admin location and individual subaccounts.
   - **Maintenance crons** — refresh OAuth tokens nightly and log every AML lookup for audit.
3. **Supabase (project: `Zona Libre`)** — system of record for OAuth tokens, risk-scoring lookup tables, AML lookup history, GHL location metadata, and error log.

---

## 2. The 12 workflows

All workflows live under `nilsdigital.app.n8n.cloud`. Click any ID to open it.

### 2.1 Diligence / risk-analysis workflows (3 active)

These are the heart of the product. Each one is fronted by a webhook that a GHL form fires into, runs the same compliance-screening logic, and writes a risk classification back to the contact via the GoHighLevel API.

#### [`kSUQeSVrTC6ihO0E`](https://nilsdigital.app.n8n.cloud/workflow/kSUQeSVrTC6ihO0E) — **1. NEW - Min Dilligence**

- **Trigger:** `POST /webhook/form`
- **Purpose:** **Minimum diligence** screening. Lookup-only — checks the person against the RiskTech AML database and flags them as Alto / Medio / Bajo. No risk-factor calculator.
- **Node count:** 51 (the workflow contains the Min flow plus a duplicate retry branch — `Parse doc ID & country1`, `Code1`, etc.)
- **Flow:**
  1. `Webhook` receives the form payload (`body.location.id`, `body.contact.id`, name, doc id, nationality).
  2. `Parse doc ID & country` normalizes the document type and resolves the ISO country code (e.g., `PA` → `Panamá`).
  3. `Get refresh_token` → `Get Location access token` mints a location-scoped GHL access token (full OAuth chain: refresh → company token → location token, with the new tokens written back to `ghl_tokens`).
  4. `RiskTech API1` POSTs to `https://savvylink.amlrisk.com/gestion/main/listasServiceRest`.
  5. `PEP & List logic1` (Code) classifies the result — see §3.
  6. `Get SubAccount Custom Fields` resolves the field-IDs for the `Riesgo Mínimo` / `riesgo` fields.
  7. `Subacc-Upsert Contact` writes the classification back to the contact in the subaccount.
  8. `Upsert Explicación to document` writes a human-readable summary into a Note/document field.
- **Secondary mirror:** `Subacc-Upsert Contact1` upserts the same contact into the **SL Admin location** (`kPVZCNKrF6l1XnIZB15I`) so the head office sees every screened person.

#### [`es5AjKam0yy4RxTz`](https://nilsdigital.app.n8n.cloud/workflow/es5AjKam0yy4RxTz) — **2. NEW - Risk Analysis (BASIC DILIGENCE)**

- **Trigger:** `POST /webhook/basica-formulario`
- **Purpose:** **Basic diligence** — full risk-factor scoring across 5 families (cliente, servicios, geografía, canales, transaccionalidad). Produces an inherent-risk number plus a segment classification (Alto / Medio / Bajo).
- **Node count:** 31
- **Flow:**
  1. `Webhook1` receives the form payload (≈30 risk-factor answers per submission).
  2. **OAuth chain** (Get refresh_token → Get Location Details → Get Location access token) — mints a per-location token.
  3. `Parse` normalizes the form payload.
  4. `Get many rows` queries the `segments` table to discover which **commercial-activity sub-table** to load (one of 14: `1VehiculosEquipos…` through `14Juguetes`).
  5. `Loop Over Items` + `Supabase HTTP` pulls the corresponding lookup rows; `Merge into single JSON` flattens them.
  6. `Risk assessment fuzzy matching` does Levenshtein-distance matching of every form answer against the lookup options (60% threshold) — produces `peso_*`, `probabilidad_*`, `impacto_*` for every factor (see §4).
  7. `Risk calculator1` applies the formula `Σ(prob × impacto × peso_var) × peso_grupo` per family, sums to `riesgoInherenteTotal`, and bins to a segment.
  8. `RiskTech API` runs the AML screening in parallel.
  9. `PEP & List logic` overrides the inherent risk with **Alto** if the person hits OFAC/UN/PEP/Europol; with **Medio** if they hit other lists or come from a high-risk country.
  10. `Riesgo field IDs` extracts GHL custom-field IDs for `Riesgo Inherente`, `Segmento de Riesgo`, etc.
  11. `Subacc-Upsert Contact` + `Subacc-Upsert Report` write the full risk report back to GHL.

#### [`nXcMAq87HqrwD7xy`](https://nilsdigital.app.n8n.cloud/workflow/nXcMAq87HqrwD7xy) — **3. NEW - LEGAL**

- **Trigger:** `POST /webhook/abogados`
- **Purpose:** **Lawyer-specific** diligence variant. Same shape as the Basic flow, but uses the `ABOGADOS` Supabase table instead of the per-segment commercial-activity tables.
- **Node count:** 27
- **Flow:**
  1. `Webhook2` receives the form payload.
  2. OAuth chain (same pattern).
  3. `GET Abogados table` (`Supabase: ABOGADOS getAll`) loads the lawyer-specific risk-factor catalogue.
  4. `Risk assessment fuzzy matching1` + `Risk calculator` produce the inherent-risk score.
  5. `RiskTech API2` + `PEP & List logic2` run the AML screening overlay.
  6. `ID & Explanation Generator` builds the report.
  7. `Subacc-Upsert Contact2` / `Subacc-Upsert Contact3` write back to both the subaccount AND the SL Admin location.
  8. `Wait` adds a small delay before the second upsert (rate-limit safety).

### 2.2 Legacy diligence workflows (3 inactive — kept for reference)

| ID | Name | Webhook path | Status |
|---|---|---|---|
| [`sij5q5Mu5f6GOfin`](https://nilsdigital.app.n8n.cloud/workflow/sij5q5Mu5f6GOfin) | `1. Risk Analysis (MIN DILLIGENCE)` | `POST /webhook/form` | Inactive — superseded by NEW Min |
| [`vWOrKGtBYpbmDeHz`](https://nilsdigital.app.n8n.cloud/workflow/vWOrKGtBYpbmDeHz) | `2. Risk Analysis (BASIC DILIGENCE)` | `POST /webhook/basica-formulario` | Inactive — superseded by NEW Basic |
| [`SyQKFPkT67yn1SG6`](https://nilsdigital.app.n8n.cloud/workflow/SyQKFPkT67yn1SG6) | `Duplicate- Risk Analysis (BASIC DILIGENCE) copy 3` | `POST /webhook/{form,basica-formulario,abogados,…}` + 4× schedule triggers | Inactive — used historically as a monolithic combined workflow (122 nodes — all three diligence flows in one file) |

> Webhook paths on the inactive workflows collide with the active ones on purpose: deactivation makes n8n route the path to the active workflow. Re-activating a legacy workflow would conflict — don't.

### 2.3 Account & contact plumbing (3 active)

#### [`RhIAru27X6p1HnWY`](https://nilsdigital.app.n8n.cloud/workflow/RhIAru27X6p1HnWY) — **SC ACCOUNT UPSERT ->**

- **Purpose:** Triggered by the **"Crear Cuenta"** form in `portal.html` (GHL form `GuC8AHs8jD2UjItpkXSu`). Provisions a new Savvy Compliance subaccount from a snapshot, registers it in Supabase, sets up its OAuth tokens.
- **MCP access:** disabled, so the internals can't be auto-introspected. Behaviour reconstructed from error logs + the portal's form metadata.
- **Failure mode seen:** `duplicate key value violates unique constraint "ghl_tokens_pkey"` when the same `locationId` is upserted twice. The pkey is `ghl_tokens.locationId`, so retries must use `update` not `insert`.

#### [`SYQ9LFylvuqBYB2A`](https://nilsdigital.app.n8n.cloud/workflow/SYQ9LFylvuqBYB2A) — **1. Contacts from Sub Account -> Upsert in ADMIN Account**

- **Trigger:** `POST /webhook/sub-main-userupdate`
- **Purpose:** When a contact is updated in a **subaccount**, mirror the contact (and custom-field values) into the **SL Admin location** (`kPVZCNKrF6l1XnIZB15I`), translating field IDs by **field name** (because subaccount field IDs ≠ admin field IDs).
- **Node count:** 55 (two parallel branches — a primary and a duplicate hardened branch with `Webhook2`).
- **Flow:**
  1. Webhook receives the contact-update event from GHL.
  2. OAuth chain refreshes the subaccount's tokens in `ghl_tokens`.
  3. **3-input Merge** — combines: (a) the SubAccount's custom-field definitions, (b) the SL Admin's custom-field definitions, (c) the contact's current values.
  4. `UCode` (Code) maps subaccount fieldId → field name → admin fieldId, builds one upsert payload per custom field.
  5. `SL ADMIN Upsert Contact` writes each mapped field to the admin contact via GHL `POST /contacts/upsert`.
  6. `Normalize Location Name` + `Company Name` set a clean account-name custom field on the admin record.

#### [`gDcYPwepaAVxk4Ug`](https://nilsdigital.app.n8n.cloud/workflow/gDcYPwepaAVxk4Ug) — **2. IMPORT FORM | Send SL Admin Contact -> Subaccount**

- **Trigger:** `POST /webhook/importar-contactos`
- **Purpose:** Reverse direction of the previous flow — when the admin wants to **import** a contact from the SL Admin location **down to a subaccount** (e.g., for bulk onboarding).
- **Node count:** 19
- **Flow:**
  1. Webhook receives `{ContactID, location.id, location.companyId}`.
  2. `ADMIN - GET CONTACT` fetches the contact from `kPVZCNKrF6l1XnIZB15I` (the SL Admin/Repo location) using a static bearer token.
  3. `ADMIN - GET FIELDS` fetches the admin's custom-field definitions.
  4. OAuth chain mints a location token for the destination subaccount.
  5. `Get SubAccount Custom Fields` fetches the subaccount's field definitions.
  6. `Merge` (3 inputs) + `Code in JavaScript` map admin fieldId → field name → subaccount fieldId, build one upsert per field.
  7. `Subacc-Upsert Contact` (in a `Loop Over Items`) writes the mapped fields back to the subaccount contact, plus `name`, `email`, `phone`, and ISO country (if valid 2-letter).

### 2.4 Maintenance crons (3 workflows)

#### [`s1Z2H8GwdaU7n2kG`](https://nilsdigital.app.n8n.cloud/workflow/s1Z2H8GwdaU7n2kG) — **1. Updates All Tokens - 3 AM**

- **Trigger:** Cron at 03:01 daily + manual trigger
- **Purpose:** Pre-emptively refresh every GHL access token in `ghl_tokens` so the diligence workflows never hit a 401 mid-execution.
- **Flow:**
  1. `Get refresh_token3` reads the Agency-level token row (`locationId = 2F57AEbpqBa9dMLf1qLT1f`).
  2. `GetAccessTokens2` exchanges the refresh-token for a fresh company-level access token.
  3. `Update access_token2` writes both new tokens back to that row.
  4. `Get many rows2` loads **all** subaccount rows from `ghl_tokens`.
  5. `Filter` excludes the agency-row itself.
  6. `Loop Over Items1` (batchSize=25) iterates each subaccount, mints a fresh location-scoped token via `POST /oauth/locationToken`, and updates the row. A `Wait` node throttles between batches.
- **OAuth client:** `68334ff3222aadb0b7062c18-mbdajx5l` (hard-coded in `GetAccessTokens` node).
- **Error workflow:** wired to `Ju2VIBNpO21er8KA` (the centralized error reporter that writes to `error_events`).
- **Sticky note on the manual branch:** "Manual update. Replace the target locationId in `Get Location Details` and `Update Location access_token` nodes" — i.e., the manual branch is a one-shot fix-it tool for a single location.

#### [`EE5YEALMVbebJlFh`](https://nilsdigital.app.n8n.cloud/workflow/EE5YEALMVbebJlFh) — **RiskTech AML Logger**

- **Trigger:** Cron every 5 minutes + manual `Run Test`
- **Purpose:** Persist every RiskTech AML lookup made anywhere in n8n into Supabase for audit/search. **No source workflow needs to change** — this is a fully universal logger.
- **Detail:** see [README.md §1A](./README.md) for the full design, OOM hardening, and dedup constraint.

#### [`htryN61HXWvxwiQV`](https://nilsdigital.app.n8n.cloud/workflow/htryN61HXWvxwiQV) — **Savvy email -> Generate draft**

- **MCP access:** disabled, so internals can't be introspected here. Active, has 1 trigger.
- **Inferred purpose:** Listens to inbound Gmail messages addressed to a Savvy Compliance mailbox and creates a draft reply. Likely uses the Gmail node + an LLM step (consistent with global `/get-attachments` skill stack but in the outbound direction).
- **Action item:** enable MCP access on this workflow if/when it needs to be audited or modified programmatically.

---

## 3. The compliance-screening logic (`PEP & List logic*` code nodes)

Identical implementation across all three active diligence workflows. Codified at the top of each `PEP & List logic*` Code node:

```
1. Collect input data (name, document ID, nationality) from webhook and API
2. Normalize all names and documents (lowercase, remove accents/special chars)
3. For each person in database:
   - Check if ALL words from input name appear in their database name (any order)
   - If name matches → check if document ID matches exactly
4. Risk classification (only if BOTH name AND document match):
   - Alto:  Person on OFAC, UN, PEP, or Europol lists
   - Medio: Person on other lists OR from high-risk country
   - Bajo:  Person only on non-binding/informational lists
5. Return detailed results showing all comparisons and matches
```

Implementation notes worth remembering:

- **Name match is partial, document match is exact.** Every word of the form-entered name must appear in the DB name (any order). Documents must match byte-for-byte after stripping `-`/`.`/` ` — **leading zeros are preserved** (a past bug stripped them).
- **The "block" flag from RiskTech is only a hint** — final classification uses only entries that match **both** name AND document. This was a deliberate fix; an earlier version used `listas_raw` from the raw API response, which could include lists belonging to a different person with the same name.
- **High-risk countries (hard-coded):** `Haiti, Colombia, Mexico, Nicaragua, Cuba, Venezuela` (mirrors the `paises` table).
- **High-risk list codes (hard-coded in each Code node, also mirrored in `listas`):** OFAC (3765), UN (2723), Europol (3766), Panamá (7264), + 89 PEP codes. Full list in [README.md §3](./README.md).
- **Non-binding list codes (also hard-coded + mirrored in `listas`):** 33 codes including Panama Papers, Bahamas Leaks, AML News, supersociedades, ministerios. Per Keila's guidance: for Panamá specifically, ampliate diligence even for NEWS lists.

---

## 4. The risk-factor calculator (`Risk calculator*` code node — Basic & Legal flows only)

The Min flow skips this; Basic and Legal both run it.

**Formula:**

```
group_score   = Σ over factors of  (probabilidad × impacto × peso_var)
final_score   = Σ over groups of   group_score × peso_grupo
```

The score is a weighted aggregate across **5 risk families** (groups):

| # | Group | Factors |
|---|---|---|
| 1 | Cliente | tipo personería, tipo persona natural, clasificación persona jurídica, PEP, notificaciones rojas, asalariado/independiente, profesión, actividad económica, bolsa de valores, acciones al portador |
| 2 | Servicios | servicios, accionistas nominales, directores nominales, consejo fundacional |
| 3 | Geografía | nacionalidad, lista GAFI, provincias Panamá, zonas especiales, origen fondos, destino fondos, origen fondos tipo, fuente ingreso otra |
| 4 | Canales | método transacción, canal clientes, años relación |
| 5 | Transaccionalidad | volumen operaciones |

Expected `peso_grupo` total: ~0.9. Group weights live in the lookup table under `categoria = '0.1_peso_factores'`.

**Family-1 redistribution:** factors `1.4 clasificacion_persona_juridica` and `1.91 bolsa_valores` only apply to some persons (juridical vs. natural). When absent, their weight is redistributed evenly across the present factors so the family weights still sum to 1.0.

**Segment classification (after the calculator):**

```
if  total ≥ 6.0  OR  riesgoMinimo == "Alto"  → Alto
if  total ≥ 3.0  OR  riesgoMinimo == "Medio" → Medio
else                                          → Bajo
```

`riesgoMinimo` is the floor from the AML screening — so a low-scoring person who hits OFAC still ends up Alto.

---

## 5. Supabase project — `Zona Libre`

- **Project ID:** `nroeiabeirifurdaybyo`
- **URL:** `https://nroeiabeirifurdaybyo.supabase.co`
- **Region:** us-east-2 · Postgres 17
- This project is **shared across multiple Nils-Digital products** (Systema Floyd lives here too). Savvy Compliance owns the tables below.

### 5.1 Risk-scoring lookup tables

These are the option/weight catalogues that drive the fuzzy matching and the risk calculator.

| Table | Rows | Used by | Notes |
|---|---:|---|---|
| `segments` | 14 | Basic flow | One row per commercial-activity segment. Columns: `field_key`, `name`, `field_id` (GHL custom-field ID), `Table` (name of the per-segment table to load). |
| `1VehiculosEquiposYRepuestos` … `14Juguetes` | ~813 each | Basic flow | One per business segment. Columns: `id`, `categoria`, `opcion`, `peso`, `impacto`, `probabilidad`. Loaded dynamically based on the contact's `actividad económica`. |
| `ABOGADOS` | 1050 | Legal flow | Same shape as the segment tables but lawyer-specific factors. Categorías include `0.0_peso_tablas`, `0.1_peso_factores`, `1.1_tipo_personeria` through `5.1_volumen_operaciones`. |
| `paises` | 6 | All diligence flows | High-risk countries with `Riesgo minimo`: Haiti, Colombia, Mexico, Nicaragua, Cuba, Venezuela — all `Medio`. |
| `listas` | 124 | Reference / `aml-search.html` | RiskTech list-code dictionary. Columns: `list_id`, `name`, `category` (`Relevante` \| `No Vinculante`), `list_description`. Hard-coded copies live inside each `PEP & List logic*` code node — keep both in sync. |

### 5.2 OAuth / GHL state

| Table | Rows | Purpose |
|---|---:|---|
| `ghl_tokens` | 407 | The OAuth state machine for **every** GHL location Nils Digital connects to (Savvy + Systema Floyd + others). PK is `locationId`. Columns: `locationId`, `acces_token` *(sic)*, `refresh_token`, `companyId`, `userId`, `userType`, `scopes`, `account_name`, `token_lock_until`, `token_lock_by`, `created_at`, `updated_at`. RLS enabled. |
| `ghl_tokens_duplicate` | 14 | Marked "This is a duplicate of ghl_tokens". Looks like a backup/staging copy. |
| `ghl_locations` | 100 | GHL location metadata snapshot. Columns: `location_id`, `business_name`, `snapshot`, `address`, `first_name`, `last_name`, `email`, `business_phone`, `stripe_vinculation`, `time_zone`, `status`, `assigned_to_email`. |
| `ghl_locations_ssu` | 100 | Same shape as `ghl_locations` but with `blank_snapshot` instead of `snapshot`. The "SSU" (sub-snapshot? sub-stage upload?) variant — likely populated during account creation before the snapshot is applied. |

**Magic location IDs used in the workflows:**

| Location ID | Role |
|---|---|
| `2F57AEbpqBa9dMLf1qLT1f` | Agency / Company-level OAuth row. Holds the refresh-token used to mint per-location tokens. |
| `kPVZCNKrF6l1XnIZB15I` | **SL Admin location** — the head-office repo where every screened person also lands. Receives mirrored writes from all diligence flows + the contact-sync workflows. |
| `iDjjtExR2G2BLiERUSGp` | Default target of the manual-trigger branch in the token refresher. Replace the literal in `Get Location Details` and `Update Location access_token` when one-shotting a different location. |
| `pH8fZCSUImJfCmdPHTrS`, `0l5oFFrqQjr4l8o3XO6l`, `guAhn503jjOIKhP5Pa9e` | Hard-coded targets inside the legacy `SyQKFPkT67yn1SG6` workflow. Not in active use. |

### 5.3 AML lookup log

| Table | Rows | Purpose |
|---|---:|---|
| `risktech_aml_results` | 61 | Append-only log of every RiskTech AML call captured by the `RiskTech AML Logger` workflow. PK `id`, unique constraint `(execution_id, node_name)`. **See [README.md §1B](./README.md) for the full schema, indexes, RLS policy, and how the logger populates it.** |

The companion view `risktech_max_execution_id` (created during initial backfill) is the cursor helper for resuming.

### 5.4 Operational

| Table | Rows | Purpose |
|---|---:|---|
| `error_events` | 441 | Centralized error log. Columns: `unique_error_id`, `timestamp`, `workflow_name`, `error_message`, `error_stack`. Populated by the shared error workflow `Ju2VIBNpO21er8KA` (which every Savvy workflow lists as its `errorWorkflow`). |

Recent error counts per Savvy workflow give a quick health snapshot:

| Workflow | Last error | Notes |
|---|---|---|
| `1. NEW - Min Dilligence` | 2026-05-13 | "request is invalid or could not be processed" — usually a malformed form payload or a GHL rate-limit |
| `SC ACCOUNT UPSERT ->` | 2026-05-06 | "duplicate key value violates ghl_tokens_pkey" — retry race on subaccount creation |
| `1. Contacts from Sub Account -> Upsert in ADMIN Account` | 2026-04-28 (16×) | "Bad request" bursts — typically a contact missing a required field on the admin side |

---

## 6. Operational notes

### Adding a new client (subaccount)

1. Admin opens [portal.html](./portal.html) → **Crear Cuenta** tab, fills out the GHL form (`GuC8AHs8jD2UjItpkXSu`).
2. The `SC ACCOUNT UPSERT ->` workflow fires, creates the GHL subaccount from the standard snapshot, and inserts a row into `ghl_tokens` (PK = new `locationId`).
3. The 03:01 cron will pick up the new row on the next run and keep its tokens fresh from then on.

### Adding a new AML list (RiskTech adds a new código)

Both the in-code hard-coded list arrays (in each `PEP & List logic*` node) AND the `listas` Supabase table need the new ID. Keep them in sync, otherwise the frontend will show a code without a friendly name (or vice versa).

### Adding a new commercial-activity segment

1. Create a new Supabase table with the segment's risk options (same schema as `1VehiculosEquiposYRepuestos`).
2. Add a row to `segments` with the GHL custom-field ID for the segment's checkbox in the form.
3. The Basic Diligence workflow discovers it dynamically — no n8n changes needed.

### Credentials gotcha

> **⚠ Don't update workflows via the n8n SDK** if you can avoid it. The SDK regenerates node IDs on every update, and n8n binds credentials by **node ID**, not by name. You'll have to reattach the n8n API + Supabase credentials in the UI every time. This bit us 5+ times when iterating on the RiskTech AML Logger — see [README.md §6](./README.md).

### Security advisory (acknowledged, not blocking)

20 public tables have **RLS disabled**, including the entire 14-table commercial-activity catalogue, `ABOGADOS`, `listas`, `paises`, `error_events`, `ghl_locations`, `ghl_locations_ssu`. These tables are exposed to the `anon` and `authenticated` roles. They are essentially read-only reference data, but anyone with the project's anon key can read/modify rows. Enable RLS + add a read-only `anon` policy if/when client-facing UIs (beyond the existing static `aml-search.html`) need direct table access. The remediation SQL is in `supabase advisor` output if needed.

---

## 7. File map for this folder

| File | What it is |
|---|---|
| [`portal.html`](./portal.html) | Admin portal — Crear Cuenta, Agregar Miembros, Guía Completa, Onboarding. Password-gated. Embeds GHL forms `GuC8AHs8jD2UjItpkXSu` (account creation) + `iSWfLX9YvzqS485xjHCJ` (add team members). |
| [`aml-search.html`](./aml-search.html) | Standalone AML history search UI backed by `risktech_aml_results`. See [README.md §1C](./README.md). |
| [`README.md`](./README.md) | AML logger / search-UI focused docs (Spanish). Authoritative for that component. |
| [`WORKFLOWS.md`](./WORKFLOWS.md) | This file — system-wide architecture. |

---

_Last updated: 2026-05-15_
