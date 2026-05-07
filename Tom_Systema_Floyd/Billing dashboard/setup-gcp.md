# One-time GCP + OAuth setup for `clasp run` autonomy

> The prompt below is meant to be pasted into a Claude session that has browser-control tools (Chrome extension, Playwright MCP, etc.). It walks through the ~10 min of Google Cloud Console clicking required to enable `clasp run <functionName>` from the CLI — which is what gives the parent agent fully-autonomous test/edit/verify loops.

The output of running this prompt is the **Project Number** + the contents of an **OAuth client_secret JSON file**. Paste both back into the parent chat. The parent agent then writes the JSON to `.clasprc-creds.json` (gitignored), runs `clasp login --creds <path>`, and from then on can invoke `clasp run` without further user interaction.

**Run once.** Setup is durable; you won't need to repeat it unless you rotate credentials or migrate to a different Google account.

---

## The prompt

````
GOAL — One-time GCP + OAuth setup so a CLI tool (clasp) can
invoke functions in the user's Apps Script project directly.
The user is signed in to Google as the owner of the relevant
Apps Script project. Take screenshots when any step is
ambiguous and ask the user before proceeding past it.

CONTEXT
═══════════════════════════════════════════════════════════════════════
  Project name to create:    systema-floyd-billing
  Apps Script project (target — already exists, owned by user):
    Script ID: 19RyUD7iaxws4yM2OMMABHkDZQWIiPigEl3xFno_OoB04kEfbra86xenH
  OAuth consent app name:    Systema Floyd Billing CLI
  OAuth client ID name:      clasp local
  OAuth client type:         Desktop app
  APIs to enable:
    - Apps Script API
    - Google Sheets API

═══════════════════════════════════════════════════════════════════════
STEP 1 — Create a Standard GCP project
═══════════════════════════════════════════════════════════════════════

  a. Open https://console.cloud.google.com/projectcreate
  b. Enter project name: systema-floyd-billing
  c. Leave Organization as-is (whatever the default is for this user)
  d. Click "Create"
  e. Wait ~30 seconds for provisioning to complete (you'll see a
     toast notification when ready, OR the project becomes the
     active one in the project picker)
  f. With the new project selected/active, navigate to
     https://console.cloud.google.com/home/dashboard
  g. Find the "Project info" card and copy the value of
     "Project number" (12-digit numeric value)
  h. Save this number — you will report it back at the end

═══════════════════════════════════════════════════════════════════════
STEP 2 — Enable Apps Script API
═══════════════════════════════════════════════════════════════════════

  a. With the systema-floyd-billing project selected, open:
     https://console.cloud.google.com/apis/library/script.googleapis.com
  b. Click the blue "Enable" button
  c. Wait for the page to redirect to the API's management page
     (confirms enablement)

═══════════════════════════════════════════════════════════════════════
STEP 3 — Enable Google Sheets API
═══════════════════════════════════════════════════════════════════════

  a. Open
     https://console.cloud.google.com/apis/library/sheets.googleapis.com
  b. Click the blue "Enable" button
  c. Wait for redirect

═══════════════════════════════════════════════════════════════════════
STEP 4 — Configure OAuth consent screen
═══════════════════════════════════════════════════════════════════════

  a. Open
     https://console.cloud.google.com/apis/credentials/consent
  b. User Type:
       - If the user is on Google Workspace (a paid Workspace
         domain): pick "Internal"
       - Otherwise (personal Gmail): pick "External"
       If you can't tell from context, ask the user.
  c. Click "Create"
  d. Fill in App information:
       - App name: Systema Floyd Billing CLI
       - User support email: <use the signed-in account's email>
       - App logo: skip (leave blank)
  e. Developer contact information:
       - Email addresses: <use the signed-in account's email>
  f. Click "Save and Continue"
  g. Scopes screen: don't add anything. Click "Save and Continue".
  h. Test users screen (only appears if External in step b):
       - Click "Add Users"
       - Add the signed-in account's email
       - Save
       - Click "Save and Continue"
  i. Summary screen: click "Back to Dashboard"

═══════════════════════════════════════════════════════════════════════
STEP 5 — Create OAuth Client ID (Desktop app)
═══════════════════════════════════════════════════════════════════════

  a. Open https://console.cloud.google.com/apis/credentials
  b. Click "+ Create Credentials" at the top
  c. From the dropdown, pick "OAuth client ID"
  d. Application type: pick "Desktop app"
  e. Name: clasp local
  f. Click "Create"
  g. A popup appears titled "OAuth client created" with a Client
     ID and Client Secret. Click "Download JSON" in that popup
     (or the equivalent download button — sometimes labeled
     "DOWNLOAD JSON" with a small download icon).
  h. The browser will save a file to the default downloads folder.
     The filename looks like
       client_secret_<long-id>.apps.googleusercontent.com.json
  i. Open that file (Notepad, VS Code, or similar). Copy its
     ENTIRE contents.

═══════════════════════════════════════════════════════════════════════
STEP 6 — Link the Apps Script project to the new GCP project
═══════════════════════════════════════════════════════════════════════

  a. Open the Apps Script editor for the project:
     https://script.google.com/d/19RyUD7iaxws4yM2OMMABHkDZQWIiPigEl3xFno_OoB04kEfbra86xenH/edit
  b. Click the gear icon (Project Settings) in the left rail
  c. Scroll to the "Google Cloud Platform (GCP) Project" section
  d. Click "Change project"
  e. Paste the Project Number you saved in Step 1.h
  f. Click "Set project"
  g. Confirm the section now shows the new project name/number

═══════════════════════════════════════════════════════════════════════
WHAT TO REPORT BACK
═══════════════════════════════════════════════════════════════════════

Paste this into chat in this exact format so the parent agent
can pick it up cleanly:

  ## GCP SETUP COMPLETE

  Project Number: <12-digit number from Step 1.h>
  Project Name: systema-floyd-billing
  Apps Script API: enabled (yes/no)
  Sheets API: enabled (yes/no)
  OAuth consent: configured (Internal / External)
  Test user added: yes / no / N/A
  OAuth client created: clasp local (Desktop app)
  Apps Script linked to GCP: yes / no

  ### CREDENTIALS JSON (full file contents, paste below):
  ```json
  <paste the entire downloaded JSON file contents here>
  ```

  Issues / surprises / things you couldn't do:
  - <anything>

If at any step the page looks different from what's described
above, take a screenshot and ask the user before guessing your
way through. Google's UI gets refreshed periodically. STOP — do
NOT proceed past an ambiguous step without confirmation.
````

---

## After the agent reports back

The parent agent (Claude Code) will:

1. Save the credentials JSON contents to `Tom_Systema_Floyd/Billing dashboard/.clasprc-creds.json` (gitignored)
2. Add the file to `.gitignore`
3. Run `clasp login --creds <path>` to switch clasp to the new credentials
4. Add OAuth scopes to `appsscript.json` (the manifest)
5. `clasp push`
6. `clasp deploy` as API Executable
7. Test with `clasp run verifyStage9e`

After step 7 returns successfully, the parent agent has fully-autonomous test/edit/verify loops over the Apps Script project — no more "click Run, paste output."
