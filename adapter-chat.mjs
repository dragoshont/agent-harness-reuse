export function decodeChat(reply) {
  const text = reply?.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("Expected Chat Completions text");
  return JSON.parse(text);
}
