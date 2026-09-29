# content-transfer

Tooling for moving the ps-shared sites from one SitecoreAI environment to another.
The full procedure, including provisioning the new project and wiring editing hosts,
is in [docs/sitecoreai-org-migration.md](../../docs/sitecoreai-org-migration.md).

| File | Purpose |
| --- | --- |
| `transfer.mjs` | Drives the Content Transfer API (source) and Item Transfer API (destination). `discover`, `plan`, `run`, `status`, `load`. |
| `manifest.ps-shared.json` | The trees to move, grouped and ordered. Edit after `discover`. |
| `set-editing-host-vars.mjs` | Upserts editing-host variables through the Sitecore CLI from a JSON matrix. |
| `workflow-approve.mjs` | Moves every item version left in a Draft state to the final state (dry run by default; `--apply`, `--force` to bypass validation). Needed after a transfer because only master moves: anything that was Draft in the old org had an older *published* version there that never came across, so it cannot reach Edge until approved. |
| `_authoring.mjs` | Tiny Authoring GraphQL client for the destination CM, shared by the ad-hoc scripts. |
| `editing-hosts.ps-shared.json` | Variable matrix per rendering host in `xmcloud.build.json`. Fill in `environmentId` values. |
| `.env.example` | Credentials template. Copy to `.env.local` (git-ignored). |
| `runs/` | JSON report per transfer group (git-ignored). |

Quick start once you have automation clients for both environments:

```bash
cd tools/content-transfer
cp .env.example .env.local   # fill in the four client values
node transfer.mjs discover
node transfer.mjs plan
node transfer.mjs run --dry-run
node transfer.mjs run
node transfer.mjs status
```

Requires Node 20 or newer. No npm install needed.
