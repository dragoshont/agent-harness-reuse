import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { evaluate } from "./verify.mjs";

const file = path => fileURLToPath(new URL(path, import.meta.url));
const proposal = fields => Buffer.from(JSON.stringify({ type: "set_delivery_fields", fields }));

test("H1: both serialized fields carry the known delivery time", async () => {
  const good = await evaluate("H1", proposal(["ETA", "estimatedDeliveryAt"]));
  assert.equal(good.verdict, "READY");
  assert.deepEqual(good.response, {
    ETA: "2030-01-02T10:00:00Z",
    estimatedDeliveryAt: "2030-01-02T10:00:00Z",
  });
  assert.equal((await evaluate("H1", proposal(["ETA"]))).verdict, "HOLD");
});

test("H2: exact replay reaches the old-client assertion; repair leaves the case unscored", async () => {
  const replay = await evaluate("H2", proposal(["estimatedDeliveryAt"]));
  assert.equal(replay.verdict, "HOLD");
  assert.match(replay.reason, /old client/);
  const repair = await evaluate("H2", proposal(["ETA", "estimatedDeliveryAt"]));
  assert.equal(repair.verdict, "NOT_REPLAYED");
});

test("H2: an explicit refusal is distinguishable from malformed JSON", async () => {
  const malformed = await evaluate("H2", Buffer.from('{"type":"set_delivery_fields","fields":'));
  assert.equal(malformed.verdict, "INVALID_INPUT");
  const refused = await evaluate("H2", Buffer.from("I cannot do that."));
  assert.equal(refused.verdict, "REFUSED");
});

test("CLI separates a failed file read from a business HOLD", () => {
  const missing = spawnSync(process.execPath, [file("./verify.mjs"), "H2", file("./missing.json")],
    { encoding: "utf8" });
  assert.equal(missing.status, 3, missing.stderr);
  assert.equal(missing.stdout, "");
  assert.match(missing.stderr, /ENOENT/);
});
