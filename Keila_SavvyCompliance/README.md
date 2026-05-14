# Savvy Compliance — Sistema de Logging y Consulta AML

Pipeline end-to-end para capturar el historial completo de consultas AML (RiskTech / AMLRISK) ejecutadas por los workflows de n8n y permitir su búsqueda + auditoría desde una interfaz web.

```
┌──────────────────┐    ┌──────────────────────┐    ┌────────────────────┐
│  n8n workflows   │───▶│  RiskTech AML Logger │───▶│  Supabase          │
│  (los 6 de AML)  │    │  (cada 5 min)        │    │  risktech_aml_     │
└──────────────────┘    └──────────────────────┘    │  results           │
                                                    └─────────┬──────────┘
                                                              │
                                                              ▼
                                                    ┌────────────────────┐
                                                    │  aml-search.html   │
                                                    │  (Frontend Spanish)│
                                                    └────────────────────┘
```

---

## 1. Componentes

### A. Workflow logger en n8n
- **ID:** `EE5YEALMVbebJlFh`
- **Nombre:** `RiskTech AML Logger`
- **Ubicación:** Compliance / Savvy Compliance
- **URL:** https://nilsdigital.app.n8n.cloud/workflow/EE5YEALMVbebJlFh

**Cómo funciona** (diseño universal v3):
1. **Schedule cada 5 minutos** + trigger manual (`Run Test`) para correr a demanda
2. **List Recent Executions** — fetch liviano (sin `includeData`) de las últimas 20 ejecuciones exitosas globalmente
3. **Flatten + Loop Each Execution** — itera una por una (`batchSize=1`) para evitar OOM
4. **Get Execution Detail** — fetch del detalle completo por ejecución individual
5. **Extract RiskTech Rows** (Code node) — detecta nodos AML por:
   - nombre del nodo que matchee `/risktech/i`
   - URL/cuerpo que contenga `amlrisk.com` o `listasServiceRest`
   - Para cada match, extrae una fila por persona consultada (campo `results[]` de la respuesta)
6. **Insert RiskTech Row** (Supabase node) — inserta en `risktech_aml_results`. Dedup automático vía constraint UNIQUE `(execution_id, node_name)` + `onError: continueRegularOutput`.

**Por qué este diseño:**
- **Detección universal:** funciona para cualquier workflow actual o futuro que use RiskTech, sin necesidad de mantener una lista de workflowIds.
- **Sin OOM:** procesa una ejecución a la vez (`batch=1`), payload por nodo se mantiene chico.
- **Idempotente:** correr el mismo execution_id dos veces no duplica filas.

**Credenciales necesarias** (configuradas en la UI de n8n):
| Nodo | Tipo | Credencial |
|------|------|------------|
| `List Recent Executions` | n8n API | `nils n8n account` |
| `Get Execution Detail`   | n8n API | `nils n8n account` |
| `Insert RiskTech Row`    | Supabase API | `Zona Libre` |

**⚠️ Nota crítica sobre credenciales:** cada vez que se actualiza el workflow vía el SDK de n8n, los IDs de nodos se regeneran y las credenciales se desvinculan. Hay que reattachar manualmente en la UI después de cada update. Mantener el diseño actual estable para evitar este problema.

### B. Supabase
- **Proyecto:** Zona Libre (`nroeiabeirifurdaybyo.supabase.co`)
- **Tabla:** `public.risktech_aml_results`
- **Vista:** `public.risktech_max_execution_id` (helper para queries de cursor incremental)

**Esquema de la tabla:**
```sql
create table public.risktech_aml_results (
  id bigserial primary key,
  execution_id text not null,        -- ID de la ejecución en n8n
  workflow_id text not null,         -- ID del workflow padre
  workflow_name text,
  node_name text not null default 'RiskTech API',
  executed_at timestamptz,           -- cuándo se hizo la consulta
  status text,                       -- 'success' | 'error'
  person_name text,                  -- nombre de la persona consultada
  doc_id text,                       -- documento/pasaporte
  has_match boolean,                 -- ¿coincidió con alguna lista?
  match_count int,                   -- cuántas coincidencias reales
  ghl_contact_id text,
  ghl_location_id text,
  request_payload jsonb,             -- {name, doc_id, item_no}
  response_payload jsonb,            -- respuesta cruda de RiskTech
  source text default 'backfill',    -- 'backfill' | 'incremental' | 'test'
  created_at timestamptz not null default now(),
  unique (execution_id, node_name)   -- dedup automático
);

-- Índices
create index idx_risktech_workflow on public.risktech_aml_results (workflow_id, executed_at desc);
create index idx_risktech_doc_id on public.risktech_aml_results (doc_id);
create index idx_risktech_person on public.risktech_aml_results (person_name);
create index idx_risktech_has_match on public.risktech_aml_results (has_match) where has_match = true;
```

**RLS (Row Level Security):**
```sql
alter table public.risktech_aml_results enable row level security;
create policy "public read" on public.risktech_aml_results
  for select to anon, authenticated using (true);
```
Solo lectura para anon/authenticated. Inserts vienen del workflow con la `service_role` key.

### C. Frontend
- **Archivo:** [`aml-search.html`](./aml-search.html)
- **Stack:** HTML estático + Vanilla JS + Supabase JS client desde CDN. Sin build, sin servidor.
- **Branding:** mismo logo, fuente Inter, paleta azul (#2563eb) que `portal.html`.
- **Idioma:** español, locale `es-PA`.

**3 pestañas:**

1. **Búsqueda** — autocomplete por nombre con typeahead (mínimo 2 caracteres, ↑/↓/Enter/Esc para navegar). Al seleccionar una persona, muestra:
   - Stats pills: total consultas, coincidencias, documentos, primera, última
   - Botón "Descargar historial CSV" (solo de esa persona)
   - Lista de tarjetas expandibles por consulta
   - Por cada coincidencia muestra: badge ALTO RIESGO / INFORMATIVA, categoría, país, nombre en la lista, descripción contextual de qué es esa lista, y enlace a la fuente
2. **Listas AML** — explicación de:
   - Cómo funciona la API de RiskTech (campos `block`, `datos_listas`, `datos_tsti`)
   - Las 4 etiquetas (PEPS / Sancionados / Informativas / News)
   - Clasificación de riesgo (Alto Riesgo vs No Vinculantes)
   - Listas de Alto Riesgo: OFAC (3765), ONU (2723), Europol (3766), Panamá (7264), + 89 códigos PEP
   - Listas Informativas: 33 listas (Aml_News por país, ministerios, superintendencias, Panama Papers, etc.)
3. **Exportar** — CSV con filtros:
   - Rango de fechas (default últimos 90 días)
   - Filtro de nombre opcional
   - "Solo coincidencias" checkbox
   - "Incluir JSON completo" checkbox
   - Previsualiza primero (cuenta filas), luego descarga con BOM UTF-8 para que Excel lo abra limpio

---

## 2. Estado actual

**Datos en Supabase a la fecha:**
- 61 filas históricas
- 4 coincidencias AML reales detectadas:
  - **ANDRES LOPEZ** (`8NT2723945DV86`) — 7 listas: Panama Papers, Bahamas Leaks, PEPS Colombia, Ministerio Público
  - **DANIEL SALOMON** (`8836860`) — Panama Papers México
  - **Doris Espinoza** (`E0718686`) — PEP Perú (Fiscal Provincial)
  - **Mariana Herrera** (`A9421490`) — Sancionados Colombia (narcotráfico)
- 54 personas distintas consultadas
- Rango de fechas: 16-abr-2026 a 13-may-2026

**Workflows AML monitoreados** (los 6 que detectamos en n8n):
| Workflow ID | Nombre | Estado |
|---|---|---|
| `kSUQeSVrTC6ihO0E` | 1. NEW - Min Dilligence | Activo, 82 ejecuciones visibles |
| `es5AjKam0yy4RxTz` | 2. NEW - Risk Analysis (BASIC) | Activo, 0 ejecuciones visibles |
| `nXcMAq87HqrwD7xy` | 3. NEW - LEGAL | Activo, 0 ejecuciones visibles |
| `sij5q5Mu5f6GOfin` | 1. Risk Analysis (MIN) [OLD] | Inactivo, 0 ejecuciones |
| `vWOrKGtBYpbmDeHz` | 2. Risk Analysis (BASIC) [OLD] | Inactivo, 0 ejecuciones |
| `SyQKFPkT67yn1SG6` | BASIC copy 3 [OLD] | Inactivo, 0 ejecuciones |

> n8n Cloud podó las ejecuciones más antiguas (retención por defecto ~30-90 días), por eso solo recuperamos historia de `kSUQeSVrTC6ihO0E`. Las consultas hechas a partir de ahora se logean automáticamente.

---

## 3. Clasificación de listas (fuente: correos Harold Marín + Keila Mulero)

### Etiquetas de listas (Harold Marín, RiskTech, junio 2025)

RiskTech agrupa las listas con etiquetas según su naturaleza:
- **PEPS** (verde) — Personas Expuestas Políticamente
- **Sancionados** (rojo) — sanciones de OFAC, ONU, Europol, ministerios públicos
- **Informativas** (negro) — filtraciones (Panama Papers, Bahamas Leaks), procuradurías
- **News** (marrón) — noticias periodísticas relacionadas con AML

El campo `datos_listas` (string de códigos separados por comas) NO son coincidencias — son los códigos de las listas donde se BUSCÓ a la persona. Las coincidencias reales viven en `datos_tsti`, `datos_pro`, `datos_ramajudicial`, `datos_amlnews`.

### Listas de Alto Riesgo (Vinculantes / Críticas) — clasificación de Keila, 7 sept 2025

Una coincidencia en estas listas requiere diligencia ampliada inmediata:

| Código | Lista | Tipo |
|---|---|---|
| `3765` | OFAC | Sanciones EE.UU. (Tesoro) |
| `2723` | ONU | Sanciones Consejo Seguridad ONU |
| `3766` | Europol | Sanciones Unión Europea |
| `7264` | Panamá | Lista consolidada Panamá |
| **89 códigos** | PEPS | Personas Expuestas Políticamente |

PEP codes: `1124, 1155, 1211, 1265, 1427, 1461, 1467, 1497, 1572, 1611, 1634, 1636, 1675, 1749, 1755, 1835, 1851, 1892, 1914, 1969, 1994, 1995, 2124, 2138, 2151, 2166, 2179, 2181, 2258, 2384, 2422, 2474, 2489, 2491, 2518, 2547, 2575, 2651, 2653, 2668, 2675, 2725, 2751, 2753, 2817, 2859, 3122, 3124, 3126, 3154, 3192, 3273, 3278, 3285, 3291, 3319, 3342, 3348, 3369, 3395, 3411, 3433, 3439, 3494, 3498, 3523, 3564, 3583, 3625, 3728, 3774, 3791, 3813, 3825, 3877, 3923, 4128, 4145, 4191, 4211, 4223, 4259, 4366, 4368, 4429, 4457, 4466`.

### Listas No Vinculantes (Informativas / Periodísticas)

Evaluar contexto antes de bloquear, pero documentar siempre. **Nota especial de Keila:** para Panamá (el país que se evalúa), ampliar diligencia incluso para coincidencias en listas NEWS, ya que cualquier información local es relevante para el riesgo de blanqueo/financiación del terrorismo.

| Código | Lista |
|---|---|
| `1189` | Aml_News Paraguay |
| `1313` | Aml_News Chile |
| `1395` | Policía Nacional Colombia |
| `1422` | Sanciones en Firme Superintendencia Financiera Colombia |
| `1627` | Entidades en Acuerdo de Reestructuración Supersalud |
| `1692` | Ministerio público Colombia |
| `1871` | Ejercicio ilegal de actividad Financiera Superfinanciera |
| `1976` | Entidades en Medida Cautelar Vigilancia Especial Supersalud |
| `2375` | Banco Mundial |
| `2464` | DGII (R. Dominicana) |
| `2487` | Boletines Procuraduría Colombia |
| `2637` | European Bank for Reconstruction and Development |
| `2776` | Bureau of Industry and Security (BIS) |
| `2887` | Aml_News Puerto Rico |
| `2889` | Aml_News R. Dominicana |
| `2955` | Bahamas leaks |
| `3113` | OSFI (Canadá) |
| `3241` | Funcionarios y Contratistas Contraloría |
| `3356` | Aml_News Venezuela |
| `3417` | GREATER VICTORIA CRIME STOPPERS |
| `3423` | E en Medida Cautelar En Recuperación Supersalud |
| `3699` | Ministerio público República Dominicana |
| `3754` | Contratistas sancionados Panamá |
| `3787` | Ministerio público Panamá |
| `3861` | Liquidación Judicial Supersociedades |
| `3875` | Aml_News Colombia |
| `3889` | Junta Central de Contadores |
| `3982` | Sociedades en Liquidación Obligatoria Supersociedades |
| `4144` | ASIAN BANK Anticorruption and Integrity |
| `4193` | Immigration and Customs Enforcement (ICE) |
| `4297` | Aml_News Panamá |
| `4298` | Offshore leaks |
| `4454` | AUSTRALIAN FOREIGN AFFAIRS |

---

## 4. Operación

### Ejecutar manualmente
1. Abrir [el workflow](https://nilsdigital.app.n8n.cloud/workflow/EE5YEALMVbebJlFh)
2. Click en el botón ▶️ del trigger `Run Test`

### Ver consultas / búsqueda
Abrir [`aml-search.html`](./aml-search.html) directamente en el navegador (no requiere servidor).

### Si el workflow falla
1. Revisar Executions tab del workflow
2. Errores típicos:
   - `Credentials not found` → reattachar credenciales en los nodos afectados
   - `out of memory` → reducir `limit` en `List Recent Executions` o agregar filtro por `workflowId`
   - `getaddrinfo ENOTFOUND mpszonr...` → la credencial Supabase apunta a un proyecto muerto. Cambiarla a `Zona Libre`.

### Agregar un nuevo workflow AML
**Nada que hacer.** El logger detecta cualquier nodo cuyo nombre matchee `/risktech/i` o cuya URL contenga `amlrisk.com` / `listasServiceRest`. Se descubre automáticamente la próxima vez que corra el schedule.

---

## 5. Integración futura al portal

El frontend está pensado para vivir en el portal de Savvy Compliance cuando el cliente pague. Para integrarlo:
1. Tomar el `<style>` + `<main>` markup + `<script type="module">` de `aml-search.html`
2. Pegarlo dentro de una nueva pestaña en `portal.html`
3. Agregar un nuevo `<button class="tab-btn" data-tab="aml-historial">` al `<nav class="tab-nav">`
4. La URL de Supabase y la anon key ya están hardcodeadas — funciona directo

> Por ahora **NO integrar** — mantener `aml-search.html` como archivo separado hasta confirmación explícita.

---

## 6. Histórico de decisiones técnicas

### ¿Por qué un workflow polling cada 5 min en lugar de modificar cada workflow AML para que escriba a Supabase directamente?
Decisión del usuario: **no tocar los workflows existentes**. El logger es independiente, lee de la API de ejecuciones de n8n.

### ¿Por qué `includeData=true` causaba OOM al principio?
n8n Cloud tiene heap limitado (~256MB). Cuando un workflow no-AML (ej. el de upsert masivo de contactos en GHL) corre 20× por minuto, sus payloads de ejecución son enormes. Combinar 5 o más de esos en una sola respuesta hacía crash.

**Solución actual:** 2-step — listar liviano (sin includeData), luego fetch detallado uno por uno con `batch=1`.

### ¿Por qué hubo que recargar credenciales 5+ veces?
El SDK de n8n regenera los IDs internos de los nodos en cada `update_workflow`. n8n vincula credenciales por ID de nodo, no por nombre, así que se pierden. **Conclusión:** una vez que el workflow está estable, no modificarlo via SDK.

### ¿Por qué falta historia anterior a abril 2026?
n8n Cloud purga ejecuciones después de su período de retención. Las consultas anteriores ya no existen en n8n. **De aquí en adelante**, todo queda persistido en Supabase.

---

## 7. Archivos

| Archivo | Propósito |
|---|---|
| `portal.html` | Portal Savvy Compliance existente — **no tocar** |
| `aml-search.html` | Frontend de búsqueda AML — independiente del portal |
| `README.md` | Este documento |

---

_Última actualización: 14-may-2026_
