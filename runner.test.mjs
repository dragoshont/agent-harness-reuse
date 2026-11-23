import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { decodeChat } from "./adapter-chat.mjs";
import { decodeMessages } from "./adapter-messages.mjs";
import { checkEta } from "./check-eta.mjs";
import { runTurn } from "./runner.mjs";

async function fixture(name) {
  return JSON.parse(await readFile(new URL(`./fixtures/${name}.json`, import.meta.url), "utf8"));
}

test("both envelope adapters can propose the same compatible response", async () => {
  const chat = await fixture("chat");
  const messages = await fixture("messages");
  const a = await runTurn(() => decodeChat(chat));
  const b = await runTurn(() => decodeMessages(messages));
  assert.deepEqual(a, b);
  assert.equal(a.status, "ready for review");
  assert.equal(a.response.ETA, "2030-01-02T10:00:00Z");
  assert.equal(a.response.estimatedDeliveryAt, a.response.ETA);
});

test("well-formed proposal that drops ETA is held", async () => {
  const reply = await fixture("chat-replacement");
  await assert.rejects(runTurn(() => decodeChat(reply)), /old client/);
});

test("ETA present with an incorrect value is rejected", () => {
  assert.throws(() => checkEta('{"ETA":"wrong","estimatedDeliveryAt":"2030-01-02T10:00:00Z"}',
    "2030-01-02T10:00:00Z"), /old client/);
});

test("an unsupported action is refused before checking the response", async () => {
  await assert.rejects(runTurn(() => ({ type: "write_file", fields: ["ETA"] })), /Unsupported/);
});
