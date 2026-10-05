import {
  createEmptyCastingMotorData,
  parseCastingMotorDataFromApi,
  type CastingMotorData,
} from "@/data/models/user/CastingMotorDataModel";
import {
  createEmptyCuringMotorData,
  parseCuringMotorDataFromApi,
  type CuringMotorData,
} from "@/data/models/user/CuringMotorDataModel";
import { runValidation } from "../runValidation";
import {
  castingMotorValidationConfig,
  curingMotorValidationConfig,
} from "../configs/castingCuring.validation.config";
import type { ValidationTier, ValidationErrors } from "../submissionIntent";
import { focusFieldByDataAttr } from "../utils/focusFieldByDataAttr";

const normalizeCastingValidationData = (data: unknown): CastingMotorData => {
  if (!data || typeof data !== "object") {
    return createEmptyCastingMotorData();
  }

  const record = data as Record<string, unknown>;
  if (record.CASTING_PROCESS && typeof record.CASTING_PROCESS === "object") {
    return data as CastingMotorData;
  }

  if (
    record.castingProcess ||
    record.castingSections ||
    record.finalAssemblyDetails ||
    record.FINAL_ASSEMBLY_DETAILS
  ) {
    return parseCastingMotorDataFromApi(data);
  }

  return data as CastingMotorData;
};

const normalizeCuringValidationData = (data: unknown): CuringMotorData => {
  if (!data || typeof data !== "object") {
    return createEmptyCuringMotorData();
  }

  const record = data as Record<string, unknown>;
  if (record.CURING_CYCLES && typeof record.CURING_CYCLES === "object") {
    return data as CuringMotorData;
  }

  if (
    record.curingCycles ||
    record.curingSections ||
    record.postCuringDetails ||
    record.POST_CURING_DETAILS
  ) {
    return parseCuringMotorDataFromApi(data);
  }

  return data as CuringMotorData;
};

export function validateCastingMotor(data: unknown, tier: ValidationTier): ValidationErrors {
  return runValidation(normalizeCastingValidationData(data), tier, castingMotorValidationConfig);
}

export function validateCuringMotor(data: unknown, tier: ValidationTier): ValidationErrors {
  return runValidation(normalizeCuringValidationData(data), tier, curingMotorValidationConfig);
}

/** Validates casting + curing payloads together (legacy). Prefer scoped validators on submit. */
export function validateCastingCuring(data: unknown, tier: ValidationTier): ValidationErrors {
  return {
    ...validateCastingMotor(data, tier),
    ...validateCuringMotor(data, tier),
  };
}

const CURING_VALIDATION_PREFIXES = [
  "CURING_CYCLES.",
  "POST_CURING_DETAILS.",
  "DECORING_DETAILS.",
] as const;

export const isCuringValidationPath = (path: string) =>
  CURING_VALIDATION_PREFIXES.some((prefix) => path.startsWith(prefix));

export type CastingCuringProcessTab = "CASTING" | "CURING";

export type CastingCuringValidationFocusTarget = {
  fieldPath: string;
  processTab: CastingCuringProcessTab;
};

/** Prefer casting assembly → bowls → vacuum → slurry → post-cast → curing → post-curing → decoring. */
const CC_FOCUS_PATH_PRIORITY = (path: string): number => {
  if (path.startsWith("FINAL_ASSEMBLY_DETAILS.")) return 10;
  if (path.startsWith("CASTING_PROCESS.FINAL_MIX_BOWL_DETAILS.")) return 20;
  if (path.startsWith("CASTING_PROCESS.CASTING_FROM_BOWL_DETAILS.")) return 30;
  if (path.startsWith("CASTING_PROCESS.")) return 40;
  if (path.startsWith("SLURRY_CAST_DETAILS.")) return 50;
  if (path.startsWith("POST_CAST_OPERATIONS.")) return 60;
  if (path.startsWith("CURING_CYCLES.")) return 70;
  if (path.startsWith("POST_CURING_DETAILS.")) return 80;
  if (path.startsWith("DECORING_DETAILS.")) return 90;
  return 200;
};

const trimStr = (v: unknown) => (v == null ? "" : String(v)).trim();

/**
 * Combined start/end date-time widgets are tagged with START_DATE / END_DATE.
 * Map sister time paths so focus still lands on the shared control.
 */
const normalizeCcFocusPath = (path: string): string => {
  if (/\.START_TIME$/.test(path)) return path.replace(/\.START_TIME$/, ".START_DATE");
  if (/\.END_TIME$/.test(path)) return path.replace(/\.END_TIME$/, ".END_DATE");
  return path;
};

export function resolveProcessTabForValidationErrors(
  errors: ValidationErrors,
): CastingCuringProcessTab | null {
  const keys = Object.keys(errors).filter((key) => trimStr(errors[key]));
  if (keys.length === 0) return null;
  const hasCuring = keys.some(isCuringValidationPath);
  const hasCasting = keys.some((key) => !isCuringValidationPath(key));
  if (hasCuring && !hasCasting) return "CURING";
  if (hasCasting) return "CASTING";
  return "CURING";
}

export function resolveFirstCastingCuringValidationFocus(
  errors: ValidationErrors,
): CastingCuringValidationFocusTarget | null {
  const paths = Object.keys(errors).filter((key) => trimStr(errors[key]));
  if (!paths.length) return null;
  paths.sort((a, b) => {
    const pa = CC_FOCUS_PATH_PRIORITY(a);
    const pb = CC_FOCUS_PATH_PRIORITY(b);
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b, undefined, { numeric: true });
  });
  const rawPath = paths[0];
  const fieldPath = normalizeCcFocusPath(rawPath);
  return {
    fieldPath,
    processTab: isCuringValidationPath(rawPath) ? "CURING" : "CASTING",
  };
}

/** Scroll + focus the control tagged with `data-cc-field`. */
export function focusCcField(fieldPath: string, root: ParentNode = document): boolean {
  return focusFieldByDataAttr("cc-field", fieldPath, root);
}

export default validateCastingCuring;
