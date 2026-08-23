// One-off replacement for the `mcp-publisher` CLI (no npm package exists; the CLI is a
// Go binary on GitHub releases and we are avoiding a binary download).
// Does exactly what `mcp-publisher login http` + `publish` do, via the documented API:
//   POST /v0/auth/http  { domain, timestamp, signed_timestamp }  -> registry_token
//   POST /v0/publish    <server.json>  with Authorization: Bearer <token>
import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const REGISTRY = 'https://registry.modelcontextprotocol.io';
const DOMAIN = 'mythsensus.com';
const SEED_HEX = process.env.MCP_SEED_HEX;
const SERVER_JSON = process.argv[2];

if (!SEED_HEX || SEED_HEX.length !== 64) throw new Error('MCP_SEED_HEX must be 64 hex chars');

// Wrap the raw 32-byte Ed25519 seed in the minimal PKCS#8 DER envelope Node requires.
const key = createPrivateKey({
  key: Buffer.concat([
    Buffer.from('302e020100300506032b657004220420', 'hex'),
    Buffer.from(SEED_HEX, 'hex'),
  ]),
  format: 'der',
  type: 'pkcs8',
});

const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const signed_timestamp = sign(null, Buffer.from(timestamp), key).toString('hex');

const authRes = await fetch(`${REGISTRY}/v0/auth/http`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ domain: DOMAIN, timestamp, signed_timestamp }),
});
const authBody = await authRes.text();
if (!authRes.ok) throw new Error(`auth ${authRes.status}: ${authBody}`);
const { registry_token, expires_at } = JSON.parse(authBody);
console.log('auth OK — token expires', new Date(expires_at * 1000).toISOString());

const server = JSON.parse(readFileSync(SERVER_JSON, 'utf8'));
console.log('publishing', server.name, server.version);

const pubRes = await fetch(`${REGISTRY}/v0/publish`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${registry_token}` },
  body: JSON.stringify(server),
});
const pubBody = await pubRes.text();
console.log('publish', pubRes.status);
console.log(pubBody.slice(0, 1200));
if (!pubRes.ok) process.exit(1);
