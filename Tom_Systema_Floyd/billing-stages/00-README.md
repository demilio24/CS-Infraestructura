# Systema Floyd Billing Dashboard — Build Stages

> Five sequential prompts for the Claude Chrome extension. Run them one at a time. After each, paste the extension's report back into chat for review before moving to the next stage.

**Architecture spec:** [../billing-dashboard-plan.md](../billing-dashboard-plan.md)

---

## Stage files (run in order)

| # | File | Goal |
|---|---|---|
| Pre-flight | (this file, below) | Set up Script Properties with the three GHL tokens |
| 1 | [01-sheet-structure.md](01-sheet-structure.md) | Sheet tab + headers + conditional formatting + Configuration.gs |
| 2 | [02-helpers.md](02-helpers.md) | Pure helper functions + GHL API calls |
| 3 | [03-sheet-writes.md](03-sheet-writes.md) | Functions that write customers, sub-headers, tx rows, balances, groupings |
| 4 | [04-webhook.md](04-webhook.md) | `doPost(e)` webhook handler + `runFakeWebhook()` end-to-end test |
| 5 | [05-deployment.md](05-deployment.md) | onEdit trigger, Maintenance menu, deploy as Web App |
| **6** | **[06-migrate-to-polling.md](06-migrate-to-polling.md)** | **Migration: switch from webhook to 5-min polling against `/forms/submissions`. Adds Logs sheet for visible event tracking.** |

---

## Pre-flight (do this BEFORE Stage 1)

1. Create a new empty Google Sheet, name it **"Systema Floyd — Billing Dashboard"**
2. Bookmark the URL
3. Go to **Extensions → Apps Script** (opens the script editor in a new tab)
4. In Apps Script: **⚙ Project Settings** → scroll to **Script Properties** → click **Add script property** and add these three:

   | Property name | Value |
   |---|---|
   | `GHL_TOKEN_FLORIDA` | `pit-ba33c398-1647-41c9-9024-98f203d6b30c` |
   | `GHL_TOKEN_GEORGIA` | `pit-3896bf36-9322-43e0-bbfb-61120444008a` |
   | `GHL_TOKEN_VIRGINIA` | `pit-5c4b1eea-7980-462b-8cb4-aaf3c4546b2a` |

5. **Save Script Properties.** Tokens never appear in code.
6. With the Sheet tab active in Chrome, open **[01-sheet-structure.md](01-sheet-structure.md)**, copy the prompt block, paste into the Claude Chrome extension, and run.

---

## Workflow per stage

```
1. Open the stage's file (e.g. 01-sheet-structure.md)
2. Copy the prompt code block
3. Paste into Claude Chrome extension
4. Run
5. When extension finishes, copy the report it gives you
6. Paste the report into our chat
7. I review + give you the green light (or corrections)
8. Move to the next stage
```

Each stage prompt explicitly tells the extension **"do NOT proceed — wait for the next prompt"** so it doesn't overshoot.

---

## After Stage 5

Once Stage 5 reports success and you have the Web App URL:

1. Open each GHL subaccount (FL, GA, VA) → Settings → Workflows
2. Create the "Form/Survey Submitted → Webhook" workflow if it doesn't exist
3. Paste the Web App URL into the Webhook action's destination
4. Save and activate
5. Submit one real test form per subaccount → confirm a row appears in the Dashboard

That's the full build.

---

**Last updated:** 2026-05-01
**Document owner:** Emilio (Nils Digital)
