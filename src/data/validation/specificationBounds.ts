/** Unwrap `{ source, parsedValue }` bounds from division-details / QC details specs. */
const resolveSpecBound = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "object" && !Array.isArray(value)) {
    const rec = value as Record<string, unknown>;
    const candidates = [rec.parsedValue, rec.source, rec.value];
    for (const candidate of candidates) {
      const text = String(candidate ?? "").trim();
      if (text) return text;
    }
    return "";
  }
  return String(value ?? "").trim();
};

export type MixingSpecificationBounds = {
  min?: number;
  max?: number;
  minExclusive?: boolean;
  maxExclusive?: boolean;
};

/**
 * Parse min/max from Mixing Cycle Master spec object or display string
 * (e.g. "1 - 100 mV", ">=40 KSC", "≥25", "≤0.5", ">8").
 */
export const parseMixingSpecificationBounds = (
  specification: unknown,
): MixingSpecificationBounds => {
  if (specification && typeof specification === "object" && !Array.isArray(specification)) {
    const rec = specification as Record<string, unknown>;
    const minRaw = resolveSpecBound(rec.minValue ?? rec.min);
    const maxRaw = resolveSpecBound(rec.maxValue ?? rec.max);
    const min = minRaw !== "" ? Number(minRaw) : NaN;
    const max = maxRaw !== "" ? Number(maxRaw) : NaN;
    return {
      ...(Number.isFinite(min) ? { min } : {}),
      ...(Number.isFinite(max) ? { max } : {}),
    };
  }
  const text = String(specification ?? "").trim();
  if (!text || /^na$/i.test(text)) return {};
  const range = text.match(/(-?\d+(?:\.\d+)?)\s*[-–—]\s*(-?\d+(?:\.\d+)?)/);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    return {
      ...(Number.isFinite(min) ? { min } : {}),
      ...(Number.isFinite(max) ? { max } : {}),
    };
  }

  const inclusiveMin = text.match(/(?:≥|>=|=>)\s*(-?\d+(?:\.\d+)?)/);
  if (inclusiveMin) {
    const min = Number(inclusiveMin[1]);
    return Number.isFinite(min) ? { min, minExclusive: false } : {};
  }
  const exclusiveMin = text.match(/(?<![=≥])>\s*(-?\d+(?:\.\d+)?)/);
  if (exclusiveMin) {
    const min = Number(exclusiveMin[1]);
    return Number.isFinite(min) ? { min, minExclusive: true } : {};
  }

  const inclusiveMax = text.match(/(?:≤|<=|=<)\s*(-?\d+(?:\.\d+)?)/);
  if (inclusiveMax) {
    const max = Number(inclusiveMax[1]);
    return Number.isFinite(max) ? { max, maxExclusive: false } : {};
  }
  const exclusiveMax = text.match(/(?<![=≤])<\s*(-?\d+(?:\.\d+)?)/);
  if (exclusiveMax) {
    const max = Number(exclusiveMax[1]);
    return Number.isFinite(max) ? { max, maxExclusive: true } : {};
  }

  return {};
};
