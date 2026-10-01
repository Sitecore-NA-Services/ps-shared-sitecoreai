# AGENTS.md — XM Cloud Starter Kits Repository

## Repository Architecture

This is a **multi-starter monorepo** for Sitecore XM Cloud headless applications. Each starter in `/examples/` is an independent Next.js or SPA application with its own deployment lifecycle, but all share common patterns and conventions.

**Key Directories:**
- `/examples/` - Standalone front-end starter applications (Next.js App Router & SPA)
- `/authoring/` - Sitecore content items, templates, and C# deployment artifacts
- `/local-containers/` - Docker-based local Sitecore development environment (Windows only)
- `xmcloud.build.json` - XM Cloud deployment manifest (rendering hosts configuration)

**Active Starters:**
- `kit-nextjs-article-starter` - Editorial/lifestyle template (Solterra & Co.)
- `kit-nextjs-location-finder` - Automotive with location finder (Alaris)
- `kit-nextjs-product-listing` - Product showcase template (SYNC)
- `kit-nextjs-skate-park` - Component demo site
- `basic-nextjs` - Minimal Next.js starter (App Router)
- `basic-nextjs-pages-router` - Minimal Next.js starter (Pages Router)
- `basic-spa` - Angular Content SDK 1.0 SSR starter
- `lighthouse` - Lighthouse Lifestyle demo site
- `round-rock-sasquatch` - Second Lighthouse project site

## Critical Development Workflows

### Local Development Setup
Each starter is developed independently. Navigate to the starter directory first:

```bash
cd examples/kit-nextjs-article-starter

# Copy environment template
cp .env.remote.example .env.local

# Edit .env.local with required values:
# - SITECORE_EDGE_CONTEXT_ID
# - NEXT_PUBLIC_DEFAULT_SITE_NAME
# - NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID
# - SITECORE_EDITING_SECRET

# Install and run
npm install
npm run dev  # Development server at localhost:3000
```

### Build Commands (Next.js Starters)
All Next.js starters use a **multi-step build pipeline**:

```bash
npm run dev    # Development: generate component map → sitecore tools build → next dev
npm run build  # Production: sitecore-tools:generate-map → sitecore-tools:build → next build
npm run start  # Production server (runs build first, then next start)
```

**Critical:** Never run `next build` directly. Always use `npm run build` which includes Sitecore tooling steps:
1. `sitecore-tools:generate-map` - Generates component mapping from Sitecore
2. `sitecore-tools:build` - Builds Sitecore configuration
3. `next:build` - Builds Next.js application

### Build Commands (Angular Starter)
`examples/basic-spa` is a standalone Angular 21 Content SDK 1.0 SSR app (no Node proxy). Work from that directory:

```bash
cd examples/basic-spa
cp .env.example .env
npm install
npm run dev     # gen:env:dev → generate-map → ng serve
npm run build   # gen:env:prod → generate-map → sitecore-tools:build → ng build
npm start       # production build, then serve SSR bundle
```

**Critical:** Never run `ng build` directly. Always use `npm run build` which includes Sitecore tooling steps:
1. `gen:env:prod` - Writes browser-safe `CSDK_PUBLIC_*` values to `src/environments/environment.prod.ts`
2. `sitecore-tools:generate-map` - Generates `.sitecore/component-map.ts`
3. `sitecore-tools:build` - Generates `.sitecore/sites.json` and `metadata.json`
3. `ng build` - Builds the Angular SSR application

The XM Cloud editing host (`angularstarter`) uses `buildCommand: "build"` and `runCommand: "serve:ssr"`.

### Local Sitecore Container Development
**Windows-only** Docker setup for disconnected development:

```powershell
# Initialize repository (run once, requires elevated privileges)
./local-containers/scripts/init.ps1 -InitEnv -LicenseXmlPath "C:\path\to\license.xml" -AdminPassword "DesiredAdminPassword"

# Start containers
./local-containers/scripts/up.ps1

# Stop containers and cleanup
./local-containers/scripts/down.ps1
```

## Sitecore XM Cloud Integration Patterns

### Component Architecture (Locality of Behavior)
All Sitecore components follow this structure:

```typescript
// File: src/components/hero/Hero.tsx
import { ComponentProps } from '@/lib/component-props';
import { Text, Image, useSitecore, Field, ImageField } from '@sitecore-content-sdk/nextjs';

interface HeroFields {
  title?: { jsonValue: Field<string> };
  subtitle?: { jsonValue: Field<string> };
  backgroundImage?: { jsonValue: ImageField };
}

interface HeroProps extends ComponentProps {
  fields: {
    data: {
      datasource: HeroFields;
    };
  };
  isPageEditing?: boolean;
}

// Export named variants (Default required, others optional)
export const Default: React.FC<HeroProps> = (props) => {
  const { page } = useSitecore();
  const { isEditing } = page.mode;
  return <HeroDefault {...props} isPageEditing={isEditing} />;
};

export const ImageBottom: React.FC<HeroProps> = (props) => {
  const { page } = useSitecore();
  const { isEditing } = page.mode;
  return <HeroImageBottom {...props} isPageEditing={isEditing} />;
};

// Implementation components
const HeroDefault: React.FC<HeroProps> = ({ fields, isPageEditing }) => {
  // CRITICAL: Always validate datasource existence
  if (!fields?.data?.datasource) {
    return <NoDataFallback componentName="Hero" />;
  }

  // Safe destructuring with fallbacks
  const { title, subtitle, backgroundImage } = fields.data.datasource;

  return (
    <section className="hero">
      {/* Render fields even when empty in editing mode */}
      {(title?.jsonValue?.value || isPageEditing) && (
        <Text field={title?.jsonValue} tag="h1" />
      )}
      {(subtitle?.jsonValue?.value || isPageEditing) && (
        <Text field={subtitle?.jsonValue} tag="p" />
      )}
      {(backgroundImage?.jsonValue?.value?.src || isPageEditing) && (
        <Image field={backgroundImage?.jsonValue} />
      )}
    </section>
  );
};
```

**Key Patterns:**
- Always extend `ComponentProps` from `@/lib/component-props`
- Access fields via `fields.data.datasource` structure
- Export named variants: `Default`, `ThreeUp`, `Slider`, `ImageBottom`, etc.
- Check `isPageEditing` to show empty fields in authoring mode
- Use `NoDataFallback` component when datasource is missing
- Always use Sitecore field components (`Text`, `RichText`, `Image`) - never render raw values

### Environment Variables (Required)
Every starter needs these in `.env.local`:

```bash
SITECORE_EDGE_CONTEXT_ID=your-context-id-here
NEXT_PUBLIC_DEFAULT_SITE_NAME=your-site-name
NEXT_PUBLIC_SITECORE_EDGE_CONTEXT_ID=your-context-id-here
SITECORE_EDITING_SECRET=your-editing-secret
```

Get values from XM Cloud Portal → Environment → Site Settings → Developer Settings.

## TypeScript & Code Style

**Strict TypeScript:**
- Strict mode enabled in all projects
- Never use `any` - use explicit types or `unknown` with type guards
- Export types at module boundaries for reusability
- Define proper interfaces for all Sitecore data structures

**Naming Conventions:**
- Components/Classes: `PascalCase` (e.g., `HeroWithContent`, `ProductListing`)
- Variables/Functions: `camelCase` (e.g., `getUserData`, `isLoading`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_ENDPOINT`, `DEFAULT_TIMEOUT`)
- Directories: `kebab-case` (e.g., `src/components`, `api-clients`)

**React Patterns:**
- Functional components with hooks only
- Server Components by default (Next.js App Router)
- Client Components (`'use client'`) only for interactivity
- Use React.memo sparingly for expensive components

## XM Cloud Deployment

### Deployment Architecture
The repository is deployed to XM Cloud/Sitecore AI with a multi-environment architecture:
- **PS-Shared Authoring Environment** - Shared Sitecore content management environment
- **Editing Hosts** - Individual Next.js rendering hosts deployed per starter application
- Each enabled starter in `xmcloud.build.json` gets its own editing host deployment
- Editing hosts connect back to the shared authoring environment for content

### Editing Hosts Configuration
Deployment is controlled by `xmcloud.build.json`:

```json
{
  "renderingHosts": {
    "kit-nextjs-article-starter": {
      "path": "./examples/kit-nextjs-article-starter",
      "nodeVersion": "22.22.0",
      "enabled": true,
      "type": "sxa",
      "buildCommand": "build",
      "runCommand": "next:start"
    }
  }
}
```

- Only starters with `"enabled": true` are deployed as editing hosts
- `buildCommand` must be `"build"` (not `"next:build"`)
- `runCommand` must be `"next:start"` for Next.js starters
- Each editing host runs independently but shares the authoring environment

### Vercel Deployment

**Working Directory for Vercel CLI:**
All Vercel CLI commands must be run from the individual starter directory, not the repository root:

```bash
# Navigate to the starter directory FIRST
cd C:\Repo\xmcloud-starter-js\examples\kit-nextjs-article-starter

# Then run Vercel commands
vercel --prod          # Deploy to production
vercel ls              # List deployments
vercel logs <url>      # View logs for a deployment
```

**Important:** Running Vercel commands from the wrong directory will fail. Always `cd` to the specific starter directory first.

## Development Constraints

**Multi-Starter Independence:**
- Each starter maintains its own `package.json` and dependencies
- No monorepo linking or shared packages between starters
- Shared patterns are **copied**, not shared via imports
- Each starter can be developed and deployed independently

**Git Workflow — single branch:**
- One working branch per repository: `main`. Commit directly to it.
- Do not create feature branches or open PRs; it is a solo repo, so the
  branch-and-merge overhead buys nothing.
- Ask before pushing — pushing is the step that leaves the machine, and a push to
  the new repo's `main` auto-deploys seven editing hosts in the new org.
- `main` is always clean and deployable, so build before committing anything
  that ships (`npm run build` from the starter directory).

**File Safety:**
- Never edit compiled artifacts in `/dist`, `/build`, `.next`
- Never edit generated files in `.sitecore/`
- Never commit `.env.local` or secrets

## Testing Strategy

**Recommended Testing Stack:**
- Jest or Vitest for unit testing
- React Testing Library for component testing
- MSW (Mock Service Worker) for API mocking
- Playwright or Cypress for E2E testing

**Sitecore Component Testing:**
```typescript
// Always test with missing fields scenario
it('handles missing datasource gracefully', () => {
  render(<Hero fields={{}} />);
  expect(screen.getByText(/content not configured/i)).toBeInTheDocument();
});

// Test editing mode behavior
it('shows empty fields in editing mode', () => {
  render(<Hero fields={emptyFields} isPageEditing={true} />);
  expect(screen.getByRole('heading')).toBeInTheDocument(); // Field shown even when empty
});
```

## Development Tools

### Sitecore MCP Integration
- MCP (Model Context Protocol) server connected at `https://edge-platform.sitecorecloud.io/mcp/marketer-mcp-prod`
- Configured in `.vscode/mcp.json` as `sitecore-marketer`
- Provides AI agents with direct access to Sitecore XM Cloud operations
- Use for querying Sitecore content, pages, components, and site structure

### Sitecore CLI for Content Serialization
- CLI configuration is in `/authoring/sitecore.json`
- Module files are in `/authoring/items/*.module.json`
- Serialized items are stored in `/authoring/items/items/templates/items/`

```powershell
# Navigate to authoring folder first
cd authoring

# Initialize CLI (first time only)
dotnet sitecore init

# Install XM Cloud plugin (first time only)
dotnet sitecore plugin add -n Sitecore.DevEx.Extensibility.XMCloud

# Login to Sitecore Cloud
dotnet sitecore cloud login

# List projects
dotnet sitecore cloud project list

# List environments for ps-shared project
dotnet sitecore cloud environment list --project-id Uhoyk4uSHBdm0Fn2Da2aY

# Connect to ps-shared-dev environment with write access
dotnet sitecore cloud environment connect --environment-id 35yxRJsnSIqo3WAkXGkKp5 --allow-write

# Check serialization configuration
dotnet sitecore ser info

# Pull items from XM Cloud to local
dotnet sitecore ser pull

# Push items from local to XM Cloud
dotnet sitecore ser push

# Validate serialization (dry run)
dotnet sitecore ser validate
```

### XM Cloud Environment IDs (ps-shared project)
- Project ID: `Uhoyk4uSHBdm0Fn2Da2aY`
- ps-shared-dev (CM): `35yxRJsnSIqo3WAkXGkKp5` - `xmc-professionaad47-psshared23db-psshareddevad68.sitecorecloud.io`
- ps-shared-qa (CM): `3naHuQOe0onKH2lE4N374z`
- kit-nextjs-article-starter (EH): `5Ryb2qdWEc8OOohKAPhL5r`
- kit-nextjs-location-starter (EH): `55Rm61ljRcR6fe2tVR59nY`
- kit-nextjs-product-starter (EH): `wfSShGvbv6WWYpNclzjIe`
- nextjsstarter (EH): `27j6H8GdZVTINQrBke25RE`

### New SitecoreAI organization (migration in progress, 2026-09)
- The sites are being moved to a new org with embedded Personalization and Search. The old org above
  stays live until cutover. Runbook and tooling: `docs/sitecoreai-org-migration.md`,
  `tools/content-transfer/`.
- New org: `org_TvFDTrpQmCss41sM`, tenant `cvrams16ca6-psshared3bd6-psshareddev2678`,
  CM `xmc-cvrams16ca6-psshared3bd6-psshareddev2678.sitecorecloud.io`
- Deploy project `ps-shared`: `6ikKzMpIaafY5jyybdFX1Y`; CM environment ps-shared-dev: `3cwFfa5RDpiL0PdNAvl5Ct`
  (base image 1.10, region eus, repo Sitecore-NA-Services/xmcloud-starter-js on `main`, auto deploy)
- Context IDs: preview see Deploy > ps-shared-dev > Developer settings (Context: Preview), live `7ETztHPRuAjyzd6ySYVGFW`. The editing secret is on the
  environment's Developer settings page in Deploy; never commit it.
- Editing hosts (decoupled, one environment each): nextjsstarter `21Rvl0MjNU2dKFMoBk1OEP`,
  kit-nextjs-article-starter `2VkYzpKkVEbZABCP0qY4Hm`, kit-nextjs-location-starter `2Glrfu7E2l3rVDcJMl3WW6`,
  kit-nextjs-product-starter `2jv7ys3Oy79YPmUPRywHjR`, basic-nextjs `20RpOJMzqgt7eZvAaQcALE`,
  lighthouse `2DhihJITsVoBx35eJCagyO`, round-rock-sasquatch `4NToHFbiZDOUt9CymOzAtA`,
  angularstarter `1Ot6LCtpDnhUGX3nALZgon`
- CLI: `dotnet sitecore cloud login` is now against the new org and the `ps-shared-dev` endpoint in
  `authoring/.sitecore/user.json` points at the NEW CM. Re-run `cloud login` and `cloud environment connect`
  with the old IDs above if you need the old CM through the CLI again.
- **Two repositories since 2026-09-29.** The old org keeps building `Sitecore-NA-Services/xmcloud-starter-js`
  on `main` and is left as is. The new org's project (CM plus all eight editing hosts) is linked to
  `Sitecore-NA-Services/ps-shared-sitecoreai` on `main` (public, GitHub ID 1400635584; forked with full history, tag
  `old-org-cec-search` marks the split). All embedded-Search work goes to that repo. In this clone the
  remote is `sitecoreai` and the local branch `sitecoreai-embedded` tracks `sitecoreai/main`
  (`push.default=upstream`, so plain `git push` goes there); `origin` stays the old repo. Editing hosts
  other than `nextjsstarter` auto-deploy on every push to the new repo's `main`; the CM does not.
  Repository links were changed with `PUT /api/environments/v1/{id}/repository` on the Deploy API
  (unlink with `DELETE` first, body `{repository, repositoryId, integrationId, repositoryBranch,
  deployOnCommit}`); the CLI has no command for it.
- Vercel: `article-starter` (demo, old org, never redeploy from this code) and `article-starter-sai`
  (`prj_3eWSyjHllOqjReigIO0RwilqBX3q`, new org, embedded Search source `ea66061d-df98-4f10-9fe0-032e76e6713a`).
  Target Vercel projects by `VERCEL_PROJECT_ID`, never by relinking the starter dir.

## Additional Context

**Tailwind + Shadcn/ui:**
- All starters use Tailwind CSS with `@container` queries
- Shadcn/ui components for accessibility and consistency
- Framer Motion for animations
- Lucide React for icons

**Localization:**
- All starters support `en` and `en-CA` locales
- Use `next-intl` for internationalization
- Dictionary files in `src/i18n/` or `src/dictionaries/`

**Sitecore Content SDK:**
- The Next.js starters are on `@sitecore-content-sdk/nextjs` 2.3.0, except `kit-nextjs-article-starter`
  (2.4.0 plus `@sitecore-content-sdk/search` 0.5.0 for embedded Search). No starter depends on
  `@sitecore-jss/*` any more — field types (`Field`, `ImageField`, `LinkField`, etc.) and
  components (`Text`, `Image`, `Link`, `RichText`) both come from `@sitecore-content-sdk/nextjs`.
- SDK handles editing host integration and content fetching

**Deeper guidance:**
For audit-style checks beyond this file's scope — project structure, headless config,
GraphQL, editor experience, front-end performance, security, SXA — install
[sitecoreai-skills](https://github.com/kevin-buckley/sitecoreai-skills): `/plugin marketplace add
kevin-buckley/sitecoreai-skills` in Claude Code, or `gh skill install kevin-buckley/sitecoreai-skills`
for other agents. It's a separate, generically-maintained skill set — nothing repo- or
starter-specific belongs there; that stays here.

## Reference Files

**Essential Configuration:**
- `xmcloud.build.json` - Deployment manifest
- `.cursor/rules/` - Detailed AI coding guidelines (Cursor-specific)
- Each starter's `sitecore.config.ts` - Sitecore SDK configuration
- Each starter's `next.config.ts` - Next.js configuration

**Key Source Directories:**
- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - Sitecore components (organized by type)
- `src/lib/` - Utilities, helpers, and SDK configuration
- `src/types/` - TypeScript type definitions