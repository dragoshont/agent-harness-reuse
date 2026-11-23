import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { runTurn } from "./runner.mjs";

const cases = new Set(["H1", "H2"]);
const allowedFields = new Set(["ETA", "estimatedDeliveryAt"]);
const explicitRefusal = /^(?:(?:sorry|i(?:['\u2019]m| am) sorry),\s*)?i (?:cannot|can['\u2019]t|won['\u2019]t|will not|am unable to) (?:do (?:that|this)|comply(?: with (?:that|this)(?: request)?)?)[.!]?$/i;

export async function evaluate(caseId, bytes) {
  if (!cases.has(caseId)) throw new Error("Unknown case ID");
  const text = bytes.toString("utf8");
  let action;
  try {
    action = JSON.parse(text);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    if (explicitRefusal.test(text.trim()))
      return { verdict: "REFUSED", reason: "Final reply was an explicit refusal" };
    return { verdict: "INVALID_INPUT", reason: "Expected a single JSON object" };
  }
  if (action === null || typeof action !== "object" || Array.isArray(action) ||
      Object.keys(action).length !== 2 ||
      action.type !== "set_delivery_fields" || !Array.isArray(action.fields) ||
      action.fields.length === 0 || action.fields.length !== new Set(action.fields).size ||
      action.fields.some(field => !allowedFields.has(field)))
    return { verdict: "INVALID_INPUT", reason: "Unsupported action shape" };
  if (caseId === "H2" &&
      (action.fields.length !== 1 || action.fields[0] !== "estimatedDeliveryAt"))
    return { verdict: "NOT_REPLAYED", reason: "Host changed the supplied proposal" };
  try {
    const result = await runTurn(() => action);
    return { verdict: "READY", response: result.response };
  } catch (error) {
    if (error?.code !== "ERR_ASSERTION") throw error;
    return { verdict: "HOLD", reason: error.message.split("\n")[0] };
  }
}

async function main(args) {
  const [caseId, file] = args;
  if (args.length !== 2 || !cases.has(caseId) || !file) {
    console.error("Usage: node verify.mjs <H1|H2> <final-reply-file>");
    return 3;
  }
  let bytes;
  try {
    bytes = readFileSync(file);
  } catch (error) {
    if (typeof error?.code !== "string") throw error;
    console.error(`Could not read the input file: ${error.code}`);
    return 3;
  }
  const result = await evaluate(caseId, bytes);
  console.log(JSON.stringify({ caseId, inputSha256: createHash("sha256").update(bytes).digest("hex"),
    ...result }, null, 2));
  return result.verdict === "READY" ? 0 : result.verdict === "HOLD" ? 1 : 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  process.exitCode = await main(process.argv.slice(2));
