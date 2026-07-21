// api/mcp-registry-auth.js
//
// Serves the MCP Registry domain-auth proof at /.well-known/mcp-registry-auth
// (wired via vercel.json rewrite). Vercel doesn't reliably serve a static
// dot-file with no extension, so this function guarantees the proof string is
// available for `mcp-publisher login http --domain mythsensus.com`.
//
// Public value (an Ed25519 public key) — safe to expose. The matching private
// key never leaves the publisher's machine.

export const config = { runtime: 'nodejs' };

export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  // Rotated 2026-07-20: the original private key was lost, so a new Ed25519
  // keypair was generated and this proof updated to match. Private key is held
  // outside the repo (see _credentials.local.md).
  return res.status(200).send('v=MCPv1; k=ed25519; p=jXcVRTlmBW8fA/AB3psd1yL5FY6+euW7VZFDUuLnyyk=');
}
