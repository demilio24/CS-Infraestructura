# Systema Floyd Billing — Invited Editor Auth Fix (RESOLVED 2026-05-23)

Continuation doc. The GCP-side block has been resolved — see
"Resolution (2026-05-23)" below. Remaining work is local cleanup
(smoke-test row delete + commit) plus an end-to-end verification.

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

## Resolution (2026-05-23)

GCP project `systema-floyd-billing` (`469572225768`) OAuth consent
screen is now **In Production**. 2SV was enabled on
`systemafloydsheets@gmail.com` (Authenticator app added + final
"Turn on 2-Step Verification" button clicked — both steps are
required, adding the authenticator alone doesn't activate 2SV).
Claude Chrome then ran the publish flow cleanly: confirmed correct
project (NOT "Nils Digital"), clicked "Publish app", clicked
"Confirm" in the dialog (NOT "Submit for verification"), final
state shows Publishing status: In Production with a "Back to
testing" button visible.

What's left:
- Verify the fix end-to-end via incognito sign-in (see "Verifying
  the fix works" section below).
- Delete the smoke-test row at Manual Items row 2
  (`dialog-test@example.com`).
- Commit the two Apps Script files (`BillingFromSheets.js`,
  `RemoteTrigger.js`) — still uncommitted on `main`.
- Update `App_documentation/billing_dashboard.md` if it covers the
  dialog flow.

## Historical: Where we were (now resolved)

**Blocked on 2SV/MFA enrollment for `systemafloydsheets@gmail.com`
(2026-05-23).** Claude Chrome was already signed in as that account
and confirmed: project shown is `systema-floyd-billing` / project
number `469572225768` (correct project, NOT "Nils Digital"); on the
one page that loaded, Publishing status was **Testing** with a
"Publish app" button visible. But every subsequent navigation
redirects to https://console.cloud.google.com/enable-mfa with the
banner:

> Google Cloud access blocked. Effective May 20, 2026, Google Cloud
> has begun to enforce 2-step verification (2SV), also called
> multi-factor authentication (MFA). Go to your security settings
> to turn on 2-step verification.

`systemafloydsheets@gmail.com` does not yet have 2SV enabled, so no
console actions can be taken from it. Until 2SV is on, the publish
step cannot proceed. The PUBLISH button itself was NOT clicked.
Nothing was changed in either project.

Key facts (still valid):
- Linked GCP project number: **469572225768** (`systema-floyd-billing`)
- Linked GCP project owner account: **systemafloydsheets@gmail.com**
- OAuth consent screen URL:
  https://console.cloud.google.com/apis/credentials/consent?project=469572225768
- Publishing status on that project: **Testing** (confirmed by Claude
  Chrome before MFA wall blocked further navigation).

A different GCP project, "Nils Digital" (`gen-lang-client-0258434629`),
came up first by accident in the prior session. It is **in Production**
and unrelated. Do NOT touch its publishing status or test users.

Account state in the GCP console:
- `emilio@nilsdigital.com` lacks IAM on project 469572225768
  (missing `oauthconfig.testusers.get`, `oauthconfig.verification.get`,
  `resourcemanager.projects.get`). Adding IAM is itself a console
  action subject to the same MFA wall, so this is not a viable
  workaround.
- The path forward is to enable 2SV on `systemafloydsheets@gmail.com`
  and resume the publish from that account.

## Next step (resume here)

**Blocker (2026-05-23):** before running the Claude Chrome prompt
below, enable 2-Step Verification on `systemafloydsheets@gmail.com`:

1. Sign into https://myaccount.google.com/security as
   `systemafloydsheets@gmail.com` (an ordinary browser session — not
   the GCP console).
2. Under "How you sign in to Google" → "2-Step Verification", click
   "Get started" and complete the flow. Phone-number SMS is the
   simplest factor; an authenticator app is fine too. Save the
   backup codes somewhere durable (1Password, etc.).
3. Wait ~60s, then refresh the GCP console. The
   `console.cloud.google.com/enable-mfa` redirect should stop firing.

Caveats:
- `systemafloydsheets@gmail.com` is the file-owner/permission anchor
  for the Floyd Sheets + Drive folders + Apps Script projects. It is
  not actively logged into by a human in normal operation. Already-
  issued OAuth tokens (n8n refresh cron, the deployed webapps) are
  not revoked by enabling 2SV — only future password logins to that
  account will require the second factor.
- Recovery options: confirm the phone number / recovery email on
  that account before enabling 2SV. If recovery is uncertain, set
  up the Authenticator app + print backup codes first.

Once 2SV is on, fire the Claude Chrome prompt below.

**Decision update (2026-05-22):** The Billing Dashboard
(`1VKwy29-ah7AznrcKs5aGqVKdIuOkCWO6JMUfonas2bM`) is shared as
**`anyone` with `writer` role** — link-based access. There is no
discrete editor list to harvest for the Test users field, so adding
individual test users does not solve the problem (we don't know which
Google accounts the Floyd team is signed in as when they open the
dialog).

New path: **publish the OAuth consent screen to Production.** App
keeps the "Google hasn't verified this app" warning, but any signed-in
Google user hitting the dialog can self-bypass via Advanced → Go to
app (unsafe). That scales to unknown users, unlike the test-user
approach.

Tell Claude Chrome:

```
Switch GCP console accounts to systemafloydsheets@gmail.com, then
publish the OAuth consent screen for project 469572225768 from
Testing to Production.

1. Click the avatar in the top-right of the GCP console.
2. If systemafloydsheets@gmail.com is in the account list, pick it.
   If not, click "Add account" and sign in. I'll provide the password
   if you prompt me.
3. Once switched, open:
   https://console.cloud.google.com/apis/credentials/consent?project=469572225768
4. CRITICAL SAFETY CHECK before doing anything: confirm the page
   header shows project number 469572225768 and the app name is
   "Systema Floyd Billing CLI" (or similar — NOT "Nils Digital").
   If the project shown is "Nils Digital" or
   gen-lang-client-0258434629, STOP and report. Do not click any
   buttons on the wrong project.
5. Confirm Publishing status currently shows: Testing.
6. Click the "PUBLISH APP" button. A confirmation dialog will appear
   warning that the app will be available to all users and that
   sensitive scopes may require verification.
7. Click "CONFIRM" in that dialog. Do NOT click any "Submit for
   verification" / "Prepare for verification" button — we only want
   to move to Production, not start the verification flow.
8. Verify the page now shows Publishing status: In Production.
9. Screenshot the final state of the OAuth consent screen page
   showing the new Publishing status.

If publishing fails, requires verification before completing, or
shows any unexpected error, STOP and report the exact error text and
a screenshot. Do not retry. Do not touch IAM. Do not touch the "Nils
Digital" project.
```

Notes:
- Publishing to Production does NOT auto-submit for verification.
  Until verified by Google, end users still see the "unverified app"
  warning and self-bypass via Advanced → "Go to ... (unsafe)". That
  warning is acceptable for an internal tool.
- The 100-test-user cap no longer applies once published.

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
