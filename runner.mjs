import { checkEta } from "./check-eta.mjs";
import { orderResponse } from "./orders.mjs";

const allowedFields = new Set(["ETA", "estimatedDeliveryAt"]);

export async function runTurn(propose) {
  const action = await propose("Add estimatedDeliveryAt. Keep ETA for older clients.");
  const fields = action?.fields;
  if (action?.type !== "set_delivery_fields" ||
      !Array.isArray(fields) || fields.length === 0 ||
      new Set(fields).size !== fields.length ||
      fields.some((key) => !allowedFields.has(key))) {
    throw new Error("Unsupported action or delivery fields");
  }
  const deliveryTime = "2030-01-02T10:00:00Z";
  const body = orderResponse(fields, deliveryTime);
  checkEta(body, deliveryTime);
  return { status: "ready for review", response: JSON.parse(body) };
}
