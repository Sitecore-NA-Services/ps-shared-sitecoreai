// Minimal Authoring GraphQL client for the destination (new-org) CM.
// Reads DST_CM_HOST / DST_CLIENT_ID / DST_CLIENT_SECRET from ./.env.local and
// exchanges them for a client_credentials token. Used by ad-hoc scripts such as
// workflow-approve.mjs; not part of the transfer driver itself.
import fs from 'node:fs';

const env = Object.fromEntries(
  fs
    .readFileSync(new URL('./.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), l.slice(i + 1).trim()];
    })
);

let host = env.DST_CM_HOST.replace(/\/$/, '');
if (!/^https?:/.test(host)) host = 'https://' + host;

let token;
async function getToken() {
  if (token) return token;
  const res = await fetch('https://auth.sitecorecloud.io/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      audience: 'https://api.sitecorecloud.io',
      client_id: env.DST_CLIENT_ID,
      client_secret: env.DST_CLIENT_SECRET,
    }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error('token request failed: ' + JSON.stringify(json));
  token = json.access_token;
  return token;
}

export async function gql(query, variables) {
  const res = await fetch(host + '/sitecore/api/authoring/graphql/v1', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (await getToken()) },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) console.error('GQL errors:', JSON.stringify(json.errors).slice(0, 600));
  return json.data;
}
