export function decodeMessages(reply) {
  const text = reply?.content?.[0];
  if (text?.type !== "text" || typeof text.text !== "string") {
    throw new Error("Expected a Messages text block");
  }
  return JSON.parse(text.text);
}
