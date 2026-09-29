# Moving ps-shared to the new SitecoreAI organization

**Status (2026-09-29, end of day): migrated.** In the new org: project, CM environment, eight editing
hosts (each redeployed after their variables were set), automation clients on both sides (secrets only in
`tools/content-transfer/.env.local`), the full transfer (7 packages, 12,545 items, only warning: duplicate
media blob IDs, media verified intact through Edge), Rendering Host items written by an authoring redeploy,
and a full publish. Verified: Edge lists the same 24 site definitions as the old org, home layouts resolve
for solterra, lighthouse-lifestyle, round-rock-sasquatch and angular-skate-park, and Pages edits Solterra
through its new editing host. Still to do: repoint local `.env.local` files when you want to develop
against the new org, Vercel cutover later, Search rework.

**Addendum (2026-09-29, evening): the first publish was incomplete.** The Solterra header on the new
org lacked its About Us and Articles links: those datasource items, and 331 other item versions across
19 sites (245 of them Solterra), had their latest master version in a Draft workflow state. The transfer
moves master only; in the old org an earlier *published* version of each was live in the web database,
which never came across, and publishing skips non-final versions, so a republish changes nothing. Fix:
`tools/content-transfer/workflow-approve.mjs` moved all 333 to Approved through the authoring API (275
via the workflow command, 58 forced by writing `__Workflow state` because the command refused
datasources with validation errors), followed by a smart publish. Consequence to know: where the Draft
was newer than the old published version, the new org now shows the Draft content. Do not read Edge's
`routes.total` as a page count: it counts published versions (Solterra reports 161 for 87 pages on both
orgs); compare the de-duplicated `routePath` lists instead, which match on every site.

The new SitecoreAI release ships Personalization and Search embedded in the platform. We are
moving every site from the old org to a new org/instance, keeping the old one running for now.
Search will be reworked later against the embedded Search, so the article starter keeps pointing
at the old Sitecore Search (CEC) domain until then.

## The two organizations

| | Old | New |
| --- | --- | --- |
| Organization | `org_N4UZdLq5TfZr8k48` | `org_TvFDTrpQmCss41sM` |
| Tenant | `professionaad47-psshared23db-psshareddevad68` | `cvrams16ca6-psshared3bd6-psshareddev2678` |
| CM host | `xmc-professionaad47-psshared23db-psshareddevad68.sitecorecloud.io` | `xmc-cvrams16ca6-psshared3bd6-psshareddev2678.sitecorecloud.io` (verified reachable) |
| Deploy project | `Uhoyk4uSHBdm0Fn2Da2aY` (ps-shared) | `6ikKzMpIaafY5jyybdFX1Y` (ps-shared, org name CVR AMS) |
| CM environment | `35yxRJsnSIqo3WAkXGkKp5` (ps-shared-dev) | `3cwFfa5RDpiL0PdNAvl5Ct` (ps-shared-dev, base image 1.10, eus) |
| Preview context ID | see the old org Deploy > Developer settings (Context: Preview) (in every starter's `.env.local`) | see Deploy > ps-shared-dev > Developer settings (Context: Preview) (live: `7ETztHPRuAjyzd6ySYVGFW`) |
| Editing hosts | one per enabled entry in `xmcloud.build.json` | all eight created 2026-09-29; IDs in `tools/content-transfer/editing-hosts.ps-shared.json` |

Portal links: [old org](https://app.sitecorecloud.io/?tenantName=professionaad47-psshared23db-psshareddevad68&organization=org_N4UZdLq5TfZr8k48),
[new org](https://app.sitecorecloud.io/?tenantName=cvrams16ca6-psshared3bd6-psshareddev2678&organization=org_TvFDTrpQmCss41sM).

## What moves, and how

| Thing | How it gets to the new org |
| --- | --- |
| Site collections, sites, pages, datasources, dictionaries, page/partial designs | Content Transfer API + Item Transfer API, driven by `tools/content-transfer/transfer.mjs` (`content` group) |
| Templates, branches, renderings, placeholder settings, layouts, headless module settings, SPE scripts | same tool, earlier groups |
| Media | same tool (`media` group); the API streams blobs, no size cap |
| Custom languages (`en-CA`, `es-MX`, `ja-JP`) | same tool, `languages` group with `KeepExistingItem` |
| Editing hosts | deploy this repo to a new Deploy project; `xmcloud.build.json` already declares all nine hosts |
| Editing-host variables | `tools/content-transfer/set-editing-host-vars.mjs` from `editing-hosts.ps-shared.json` |
| Rendering Host items under `/sitecore/system/Settings/Services/Rendering Hosts` | **not transferred**. Deploy regenerates them from `xmcloud.build.json`; the names match, so `Predefined application editing host` on each site keeps resolving |
| Users and roles | not supported by the transfer APIs. Invite people to the new org in the Cloud Portal |
| Sitecore Search (CEC) sources, widgets, Q&A | stay in the old org's Search tenant for now. Rework later against embedded Search |
| Personalize rules | embedded Personalize keys on page ID + language. Rules do not carry over across tenants; recreate the ones you care about |
| Edge API keys, editing secrets, automation clients, MCP credentials | per environment, recreate |
| Vercel production sites | keep pointing at the old context ID until the new org is verified; cutover is a Vercel env change |

## Step 0: what you need

- Organization Admin or Owner in **both** organizations (both transfer APIs check this role).
- Node 20+ and the Sitecore CLI already in `authoring/` (CLI 6.0.23, XM Cloud plugin 1.1.122).
- Two environment automation clients, created in Deploy > Credentials > Environment > Create credentials > Automation:
  - old org, environment ps-shared-dev
  - new org, the new CM environment (create the environment first, step 1)
- Optionally an organization automation client for the new org so the CLI can run non-interactively.

## Step 1: provision the new project and editing hosts

Fastest path is the Deploy app in the new org, connected to this GitHub repository on `main`:

1. Deploy > Projects > Create project > "Use your own code", pick this repo and `main`. Keep decoupled
   deployments on. Name the project `ps-shared`.
2. Create the authoring environment (`ps-shared-dev`, non-production). Deploy it once so the
   base image and the `authoring/` items are in place.
3. Editing hosts tab > Add editing host, once per **enabled** rendering host name in
   `xmcloud.build.json`: `nextjsstarter`, `angularstarter`, `kit-nextjs-article-starter`,
   `kit-nextjs-location-starter`, `kit-nextjs-product-starter`, `basic-nextjs`, `lighthouse`,
   `round-rock-sasquatch`. Link each to `ps-shared-dev`, same repo and branch.
4. Deploy the authoring environment again after the hosts exist. That deploy writes the Rendering
   Host items with the new hosts' URLs.

CLI equivalent, from `authoring/` after `dotnet sitecore cloud login` (device flow, choose the new org):

```bash
dotnet sitecore cloud project create --name ps-shared
dotnet sitecore cloud environment create --name ps-shared-dev --project-id <PROJECT_ID> --cm-only
dotnet sitecore cloud editinghost create --name nextjsstarter --cm-environment-id <CM_ID>
# ... repeat for each enabled rendering host name ...
dotnet sitecore cloud deployment create --environment-id <CM_ID> --upload --working-dir ..
dotnet sitecore cloud environment list --project-id <PROJECT_ID>   # record every environment ID
```

Record the new project ID, CM environment ID, editing-host environment IDs, and the preview
context ID (Deploy > environment > Developer settings, Context switch on Preview) in the table
above and in `AGENTS.md`.

## Step 2: discover and plan the transfer

```bash
cd tools/content-transfer
cp .env.example .env.local        # fill in SRC_* and DST_* client values
node transfer.mjs discover
node transfer.mjs plan
```

`discover` lists every child under the standard project roots on the old CM and marks whether
the same path exists on the new CM, flagging ID conflicts. Expect the new CM to be nearly empty
apart from whatever the starter deploy created. Compare the `/sitecore/content` list with the
site names in `examples/*/.sitecore/sites.json` and drop test sites you do not want to carry by
replacing the single `/sitecore/content` tree in `manifest.ps-shared.json` with the collections you
want. The default manifest moves everything, which is what was asked for.

Merge strategy is `OverrideExistingItem` everywhere except languages. Do not switch to
`OverrideExistingTree` unless you mean to delete the destination subtree first.

## Step 3: run the transfer

```bash
node transfer.mjs run --dry-run     # prints every request body, sends nothing
node transfer.mjs run               # one Content Transfer per group, in manifest order
node transfer.mjs status            # destination blobs and item-transfer jobs
```

Per group the tool creates the transfer on the source, waits for packaging, streams every chunk
(four in parallel), completes each chunk set into a `.raif`, deletes the source transfer, then
consumes the `.raif` on the destination and polls until `Finished`. Reports land in
`tools/content-transfer/runs/`. A failed group stops the run; fix and rerun with
`--only <group>`. `TransferredWithErrors` prints the validation errors; most are dangling
references to items you excluded.

Order matters: languages, templates, settings, layout, media, content, spe-scripts. Content last
so every template and rendering it references already exists.

## Step 4: publish and verify

1. In the new CM, open Content Editor and confirm each collection is under `/sitecore/content`
   and each site's `Settings/Site Grouping/<site>` still names its editing host.
2. Sites dashboard: every site listed. If a site is missing, its site grouping item did not arrive.
3. Approve what the transfer left in Draft: `node tools/content-transfer/workflow-approve.mjs` (dry
   run), then `--apply`, then `--apply --force` for datasources the command rejects on validation.
   Without this step every item whose latest master version was Draft in the old org stays off Edge,
   because its previously published version lived only in the old web database.
4. Publish everything, from `authoring/`: `dotnet sitecore publish -n <new-endpoint-name>` after
   `dotnet sitecore cloud environment connect --environment-id <CM_ID> --allow-write`. Compare the
   de-duplicated `routes.results.routePath` lists on the preview and live context IDs per site (the
   `total` counts versions, not pages); they should match.
5. Open Pages per site and load the home page through its editing host.

## Step 5: editing-host variables

Deploy injects the preview context ID and editing secret into managed editing hosts. What it does
not know is which site each host serves, plus the article starter's search and Azure OpenAI
settings. That matrix is `tools/content-transfer/editing-hosts.ps-shared.json`.

1. Fill in `environmentId` for each host from `cloud environment list`.
2. Put the new preview context ID in `.env.local` as `NEW_PREVIEW_CONTEXT_ID` (the Angular host
   needs the `CSDK_PUBLIC_` copy baked into its build).
3. Run it:

```bash
node set-editing-host-vars.mjs --dry-run
node set-editing-host-vars.mjs
```

Article-starter search and Azure values are read from
`examples/kit-nextjs-article-starter/.env.local`, so they are never committed. Redeploy each
editing host afterwards; Deploy only applies variables on the next build.
Editing hosts are their own environment type, so the redeploy command is
`dotnet sitecore cloud editinghost deploy -id <editing-host-id> --no-watch` (a plain
`cloud deployment create` is rejected with "Incorrect environment type"). The authoring environment
still uses `cloud deployment create`, and it must be redeployed once after adding editing hosts so the
Rendering Host items get written.

## Step 6: repoint local development and agents

For each starter, copy `.env.local` and swap the two context ID lines and the editing secret for
the new environment's values. Everything else stays. The Angular starter also has `.env`.

- `.vscode/mcp.json` now has a second server, `sitecore-community-mcp-new`, pointing at the new
  CM. It prompts for the new environment's automation client, Edge API key and SPE password.
- Update the environment ID table in `AGENTS.md` (section "XM Cloud Environment IDs") once known.
- Old-org access is kept as is. The old MCP server entry, CLI endpoint and `.env.local` values
  still work there after re-login.

## Step 7: Vercel cutover (later)

The nine Vercel projects read the old context ID from their own environment variables. When the
new org is verified, change `SITECORE_EDGE_CONTEXT_ID`, `NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID` and
`SITECORE_EDITING_SECRET` per project (`vercel env` from the starter directory) and redeploy.
Until then production traffic keeps flowing from the old org.

## Repository split (2026-09-29)

The new org no longer builds from this repository. `Sitecore-NA-Services/ps-shared-sitecoreai` was
created from the `sitecoreai-embedded` branch with full history (tag `old-org-cec-search` marks the
fork point) and every environment of the new org's Deploy project was relinked to it on `main`: the
authoring environment through Options > Edit environment details, the eight editing hosts through the
Deploy API (`DELETE` then `PUT /api/environments/v1/{id}/repository`, since the CLI cannot change a
repository and the endpoint returns 409 while a repository is linked). Auto-deploy flags were kept as
they were: on for every editing host except `nextjsstarter`, off for the CM. The old org stays on
`xmcloud-starter-js` `main`, untouched.

## Known gaps

- Search: `NEXT_PUBLIC_SEARCH_*` and `SITECORE_SEARCH_*` still target the old Search domain
  (`1260103` source). The old crawler indexes the old Vercel URLs. Rework tracked separately.
- Personalize scope: if pages were personalized with `NEXT_PUBLIC_PERSONALIZE_SCOPE` empty, set
  `PAGES_PERSONALIZE_SCOPE` on the new CM before anyone creates rules there, not after.
- The transfer APIs need the base image that shipped them (1.8.24 or later). Both CMs answered
  on the transfer endpoints today, so both are on a recent image.
- Two test sites differ from the old org on live Edge and were left alone: `thai-pathway-test` has 12
  routes live in the new org that were never live in the old one (published by the first full publish),
  and `brk` has one landing page (`5 Simple Wellness Habits...`) that is unpublished in both.
- Users, roles and the `powershell` service account used by the MCP server must be recreated;
  SPE remoting on the new CM needs `SITECORE_SPE_ELEVATION` and a remoting user just like the old one.

## Rollback

Nothing in this procedure writes to the old org except the transient transfer records, which the
tool deletes. If the new org is wrong, delete its project and start over; the old one is untouched.
