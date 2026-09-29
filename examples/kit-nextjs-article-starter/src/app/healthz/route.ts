/**
 * Liveness/readiness endpoint for the SitecoreAI editing host.
 *
 * The platform probes `/healthz` while rolling out a deployment (the proxy
 * matcher already exempts it). Without this route the request fell through to
 * the `[site]/[locale]/[[...path]]` catch-all, which only answered after a
 * round trip to Sitecore. That was fine while Next streamed metadata (headers
 * went out at once), but `htmlLimitedBots` now makes metadata blocking for
 * every user agent, so the first byte waited on the fetch and the probe timed
 * out: the 2026-09-29 editing-host deployments failed after 20 minutes with a
 * successful build and no rendering-host log at all. Answer instantly instead.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return new Response('ok', {
    status: 200,
    headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' },
  });
}

export function HEAD() {
  return new Response(null, { status: 200, headers: { 'cache-control': 'no-store' } });
}
