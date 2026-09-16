/**
 * Flattens nested API validation trees (maps + sparse arrays) into dotted paths.
 * Example: `{ motors: [{ a: { b: "msg" } }] }` → `{ "motors.0.a.b": "msg" }`
 */
export function flattenValidationErrorTree(
  node: unknown,
  prefix = "",
): Record<string, string> {
  const out: Record<string, string> = {};

  if (node == null) {
    return out;
  }

  if (typeof node === "string") {
    if (prefix) {
      out[prefix] = node;
    }
    return out;
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      const next = prefix ? `${prefix}.${index}` : String(index);
      Object.assign(out, flattenValidationErrorTree(item, next));
    });
    return out;
  }

  if (typeof node === "object") {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      const next = prefix ? `${prefix}.${key}` : key;
      Object.assign(out, flattenValidationErrorTree(value, next));
    }
  }

  return out;
}
