// The critic. It is plain code, not an AI. It reads an explanation and checks
// that every number in it exists in the facts the engine calculated. Any number
// the AI made up is reported, and the caller then discards the AI's text.
//
// Known limits (documented honestly):
//   - numbers written as words ("two hours") are not detected;
//   - ids such as D1 or R2 are ignored, so a wrong id is NOT caught here;
//   - it checks numbers, not whether the sentences are wise.

const ID_PATTERN = /\b[A-Z]{1,3}\d+\b/g; // D1, R2, N10 ...
const NUMBER_PATTERN = /\d+(?:\.\d+)?/g;

export function extractNumbers(text) {
  const cleaned = String(text)
    .replace(ID_PATTERN, " ")
    .replace(/(\d),(?=\d{3}\b)/g, "$1"); // 1,200 -> 1200
  return (cleaned.match(NUMBER_PATTERN) ?? []).map(Number);
}

function collectStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

export function reviewExplanation(explanation, facts) {
  const allowed = extractNumbers(JSON.stringify(facts));
  const isAllowed = (n) => allowed.some((a) => Math.abs(a - n) < 0.01);

  const used = extractNumbers(collectStrings(explanation).join(" "));
  const unsupportedNumbers = [...new Set(used.filter((n) => !isAllowed(n)))];

  return { ok: unsupportedNumbers.length === 0, unsupportedNumbers };
}
