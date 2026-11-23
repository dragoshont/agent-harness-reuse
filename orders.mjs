export function orderResponse(fields, deliveryTime) {
  return JSON.stringify(Object.fromEntries(fields.map((key) => [key, deliveryTime])));
}
