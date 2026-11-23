import assert from "node:assert/strict";

export function checkEta(body, expected) {
  const response = JSON.parse(body);
  assert.equal(response.ETA, expected, "The old client expects its delivery time in ETA");
  assert.equal(response.estimatedDeliveryAt, expected, "The new field must carry the same time");
}
