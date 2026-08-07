/**
 * Keep only a valid numeric draft while typing (optional leading "-", digits, one ".").
 * Rejects letters and other characters (e.g. "1c", "12e3").
 */
export const sanitizeNumericInput = (raw: string): string => {
  const cleaned = String(raw).replace(/[^\d.-]/g, "");
  let sign = "";
  let body = cleaned;
  if (body.startsWith("-")) {
    sign = "-";
    body = body.slice(1);
  }
  body = body.replace(/-/g, "");
  const dotIndex = body.indexOf(".");
  if (dotIndex === -1) return sign + body;
  const intPart = body.slice(0, dotIndex);
  const fracPart = body.slice(dotIndex + 1).replace(/\./g, "");
  return `${sign}${intPart}.${fracPart}`;
};
