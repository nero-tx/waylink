import { createHash } from "node:crypto";

type QueryInput = URLSearchParams | string | Record<string, unknown>;

// Locale-independent ordering (localeCompare varies by runtime/ICU)
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

function stableStringify(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const body = Object.keys(obj)
      .filter((key) => obj[key] !== undefined)
      .sort(compare)
      .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`);
    return `{${body.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function stringifyValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (value !== null && typeof value === "object")
    return stableStringify(value);
  return String(value);
}

function parseString(input: string): URLSearchParams {
  const trimmed = input.trim();

  // Full URL, protocol-relative URL, or path: let URL extract the query
  // the URL that used 'localhost' is a healper to create the signature
  if (/^([a-z][a-z\d+.-]*:)?\/\//i.test(trimmed) || trimmed.startsWith("/")) {
    return new URL(trimmed, "http://localhost").searchParams;
  }

  // Raw query string, with or without a leading "?" and with any #hash removed
  const raw = trimmed.split("#")[0];
  return new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
}

function toEntries(input: QueryInput): [string, string][] {
  if (typeof input === "string") return [...parseString(input).entries()];
  if (input instanceof URLSearchParams) return [...input.entries()];

  const entries: [string, string][] = [];
  for (const [key, value] of Object.entries(input)) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (item === undefined || item === null) continue;
      entries.push([key, stringifyValue(item)]);
    }
  }
  return entries;
}

export function createQueryCacheKey(input: QueryInput): string {
  const entries = toEntries(input).sort(
    ([keyA, valueA], [keyB, valueB]) =>
      compare(keyA, keyB) || compare(valueA, valueB),
  );

  return createHash("sha256").update(JSON.stringify(entries)).digest("hex");
}
