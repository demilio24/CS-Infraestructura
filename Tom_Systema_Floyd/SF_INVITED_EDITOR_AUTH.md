# Systema Floyd Billing — Invited Editor Auth Fix (in progress)

Continuation doc. Read this first, then resume from "Where we are now."

## The problem

Invited editors of the Systema Floyd Billing Dashboard spreadsheet
could not use the "+ New manual item" sidebar. Only `emilio@nilsdigital.com`
could. Other accounts hit:

> Access blocked: Systema Floyd Billing CLI has not completed the
> Google verification process. Error 403: access_denied.

That error means the linked GCP project's OAuth consent screen is in
**Testing mode**, which restricts OAuth to explicitly listed test users.

## What is already done (code side, complete)

The `+ New manual item` dialog no longer writes the sheet row or creates
the refresh trigger from the invited user's identity. It proxies the
submit via `UrlFetchApp.fetch` to the deployed RemoteTrigger webapp,
which executes as `USER_DEPLOYING` (owner). This sidesteps per-user
`script.scriptapp` and trigger-quota issues. It does NOT bypass the
initial OAuth consent screen, that is the GCP-side issue we are still
fixing.

Files touched:
- `Tom_Systema_Floyd/Billing dashboard/apps-script/BillingFromSheets.js`
  lines 3398 to 3539 — `manualItemDialog_submit` rewritten as a webapp
  proxy. New constant `MANUAL_ITEM_DIALOG_WEBAPP_URL` near the top of
  that section.
- `Tom_Systema_Floyd/Billing dashboard/apps-script/RemoteTrigger.js`
  lines 617 to 693 — `_rtAddManualItem_` now accepts `&refresh=1` to
  schedule a `buildAllBilling` trigger after writing. Whitelist
  description updated.

Deployment status:
- `clasp push` ran cleanly.
- `clasp version 21` created.
- `clasp deploy -i AKfycbxBFLqn4a4gKV5n6LjStI18fn0KnSO7kLdlkEMBXhYCXWjoaBolobKZsbpSaD7IUEgIag -V 21` succeeded.
- The `/exec` URL in `MANUAL_ITEM_DIALOG_WEBAPP_URL` now serves the
  updated code.
- End-to-end smoke test via curl passed (write + refresh trigger both
  fired).

Smoke-test residue to clean up:
- A dummy row sits at **Manual Items row 2**: `dialog-test@example.com`,
  amount $0.01, status canceled. Delete it in the editor. It will not
  affect billing because it is canceled, but on the next
  `buildAllBilling` it will produce a phantom customer header on the
  Dashboard.

Nothing has been committed to git yet. The changes are on `main`,
unstaged.

## Where we are now (in-progress, GCP side)

We are using Claude Chrome to add invited editor emails as Test users
in the linked GCP project's OAuth consent screen. Once they are added,
those editors stop hitting Error 403 and can use the dialog normally.

Key facts Claude Chrome already discovered:
- Linked GCP project number: **469572225768**
- Linked GCP project owner account: **systemafloydsheets@gmail.com**
- OAuth consent screen URL:
  https://console.cloud.google.com/apis/credentials/consent?project=469572225768
- Publishing status on that project: **Testing** (this is what causes
  Error 403 for non-test-user accounts).

A different GCP project, "Nils Digital" (`gen-lang-client-0258434629`),
came up first by accident. It is **in Production** and unrelated. Do
NOT touch its publishing status or test users.

Account state in the GCP console:
- `emilio@nilsdigital.com` lacks IAM on project 469572225768
  (missing `oauthconfig.testusers.get`, `oauthconfig.verification.get`,
  `resourcemanager.projects.get`).
- The path forward is to sign into the GCP console as
  `systemafloydsheets@gmail.com` instead (Option A). That account owns
  the project so it has full access.

## Next step (resume here)

Tell Claude Chrome:

```
Switch GCP console accounts to systemafloydsheets@gmail.com:

1. Click the avatar in the top-right of the GCP console.
2. If systemafloydsheets@gmail.com is in the account list, pick it.
   If not, click "Add account" and sign in. I'll provide the password
   if you prompt me.
3. Once switched, open:
   https://console.cloud.google.com/apis/credentials/consent?project=469572225768
4. Confirm the page loads without an "additional access" error and
   shows Publishing status: Testing.
5. Scroll to the "Test users" section, click "+ ADD USERS".
6. Get the editor list first:
   - Open the "Systema Floyd Billing Dashboard" spreadsheet in Google
     Drive.
   - Click the green Share button.
   - Read every row in "People with access" and collect every email
     whose role is Editor or Owner.
   - Skip emilio@nilsdigital.com and systemafloydsheets@gmail.com
     (both already have access as project members).
7. Paste the collected emails into the "+ ADD USERS" textarea, one per
   line. Click SAVE.
8. Screenshot the final Test users list. Report the count.

Do not change Publishing status. Do not modify IAM. Do not touch the
"Nils Digital" project. If anything is ambiguous, stop and ask.
```

Testing mode has a hard cap of 100 test users. Unlikely to be a
concern here, but flag it if it comes up.

## Verifying the fix works after Claude Chrome adds users

1. In an incognito window, sign in as one of the newly added test-user
   accounts (e.g. `emilionils24@gmail.com`).
2. Open the spreadsheet.
3. Add Item menu, "+ New manual item".
4. The OAuth consent screen will now show "Google hasn't verified this
   app" instead of Error 403. Click Advanced, then "Go to Systema Floyd
   Billing CLI (unsafe)", then Allow.
5. Dialog should open. Submit a real item.
6. Check the Manual Items tab. The new row should be there, written
   under the webapp owner's identity (not the test user's).

## Open follow-ups after the GCP fix lands

- Delete the smoke-test row at Manual Items row 2
  (`dialog-test@example.com`).
- Commit the code changes. Suggested message:
  `fix(sf-billing): route + new manual item dialog through webapp so invited editors can use it`
  Files in the commit: `BillingFromSheets.js`, `RemoteTrigger.js`.
- Update Tom_Systema_Floyd `App_documentation` if it covers the dialog
  flow (per the user's `feedback_doc_after_push` rule).
- Long term: if more invited editors join often, consider publishing
  the consent screen to Production so new users can self-bypass via
  the Advanced link instead of needing the owner to add them as test
  users. Not urgent.

## Key references

- Apps Script ID: `19RyUD7iaxws4yM2OMMABHkDZQWIiPigEl3xFno_OoB04kEfbra86xenH`
- Deployed `/exec` URL:
  https://script.google.com/macros/s/AKfycbxBFLqn4a4gKV5n6LjStI18fn0KnSO7kLdlkEMBXhYCXWjoaBolobKZsbpSaD7IUEgIag/exec
- Webapp token: in `.env` as `SF_BILLING_REMOTE_TRIGGER_TOKEN`. Also
  stored in Script Properties as `REMOTE_TRIGGER_TOKEN`.
- Webapp URL also lives in `.env` as `SF_BILLING_REMOTE_TRIGGER_URL`.
- Memory entry for this work:
  `~/.claude/projects/c--Users-emili-OneDrive-Documents-GitHub-Websites/memory/project_systema_floyd_dialog_webapp_delegation.md`
