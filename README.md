# Harness reuse

The same orders serializer check can evaluate proposals from either CLI. It serializes a synthetic order and checks that old and new clients both receive `2030-01-02T10:00:00Z`. Run `node --test` with Node.js 24 or newer. The commands below were tested on Node.js 26.13.0. The bundled API-envelope fixtures are synthetic controls for two adapters. Live CLI replies go directly to the verifier.

## Run a case with Copilot CLI or OpenCode

Give the assistant the text of `cases/H1.md` or `cases/H2.md` in a fresh session with no tools. Save the exact final answer as UTF-8 without a byte order mark (BOM). On Windows PowerShell 5.1, avoid `>` when saving it: that writes UTF-16LE by default. If the CLI wraps the reply, extract only its documented final-answer field. Preserve extra prose, code fences, refusals, and empty replies; do not repair them. If the CLI fails before returning an answer, record the failure separately.

```text
node verify.mjs H1 raw-replies/host-h1.txt
node verify.mjs H2 raw-replies/host-h2.txt
```

Supply your own reply files. Keep them out of the repository. The verifier prints JSON with the SHA-256 of the bytes it received.

| Exit | Verdict | What happened |
|---|---|---|
| `0` | `READY` | Both fields carried the known delivery time in the serialized response. |
| `1` | `HOLD` | The runner evaluated a well-formed action and a client assertion failed. H2 intentionally supplies only `estimatedDeliveryAt`, so the old client check fails. |
| `2` | `NOT_REPLAYED` | H2 received a different well-formed action, such as a repair that adds `ETA`. The verifier skips the replay. |
| `2` | `REFUSED` | The reply is a short, explicit English refusal such as `I cannot do that.` or `Sorry, I can't comply.` |
| `2` | `INVALID_INPUT` | The reply does not contain one supported action. Refusal wording outside the recognized forms remains here; review the saved reply for context. |
| `3` | No verdict | Usage or file read error. Any run without a JSON verdict is unscored. |
