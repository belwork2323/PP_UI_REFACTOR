
import type { SchemaFormValues } from "@/schema-engine";
import type { QcDivisionEntry } from "@/hooks/user/qualityControl/qcDivisionEntryTypes";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { VALIDATIONSTRING } from "../configs/validationString";
import { validateQcRawMaterialValues } from "./qcRawMaterial.validation";
import { validateQcMixingValues } from "./qcMixing.validation";
import { validateQcHardwareValues } from "./qcHardware.validation";
import { validateQcCastingValues } from "./qcCasting.validation";
import { validateQcCuringValues } from "./qcCuring.validation";
import { validateQcDeCoringValues } from "./qcDeCoring.validation";
import { validateQcTrimmingValues } from "./qcTrimming.validation";
import { validateQcPostCureValues } from "./qcPostCure.validation";
import { validateQcNdtDivisionValues } from "./qcNdtDivision.validation";
import { validateQcPropellantValues } from "./qcPropellant.validation";
import { validateQcWeighmentValues } from "./qcWeighment.validation";

export type { ValidationErrors, ValidationTier };

const REQUIRED = VALIDATIONSTRING.FIELD_REQUIRED ?? "Field is required";

const META_KEYS = new Set([
  "id",
  "label",
  "metadata",
  "options",
  "kind",
  "SR_NO",
  "srNo",
  "_rowRole",
  "_groupId",
  "PROPERTY",
  "PARAMETER",
  "LOCATION", // static labels in some tables
]);

/** Recursive meaningful-value check (excludes known metadata keys). */
export const hasMeaningfulValue = (value: unknown, depth = 0): boolean => {
  if (depth > 8 || value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some((item) => hasMeaningfulValue(item, depth + 1));
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(
      ([key, child]) => !META_KEYS.has(key) && hasMeaningfulValue(child, depth + 1),
    );
  }
  return false;
};

export function validateQcDivisionEntry(
  entry: QcDivisionEntry,
  values: SchemaFormValues | null | undefined,
  tier: ValidationTier,
  options?: {
    finalMixDetailsValues?: SchemaFormValues | null;
    viscosityValues?: SchemaFormValues | null;
  },
): ValidationErrors {
  const entryId = entry.entryId;
  const kind = entry.kind;
  let errors: ValidationErrors = {};

  try {
    switch (kind) {
      case "REVALIDATION":
        errors = validateQcRawMaterialValues(values, tier, entryId);
        break;
      case "MIXING_PREMIX":
        errors = validateQcMixingValues(values, "premix", tier, entryId);
        break;
      case "MIXING_FINAL_MIX": {
        const details = options?.finalMixDetailsValues ?? values;
        const viscosity = options?.viscosityValues ?? values;
        errors = {
          ...validateQcMixingValues(details, "finalMix", tier, entryId),
          ...validateQcMixingValues(viscosity, "viscosity", tier, entryId),
        };
        break;
      }
      case "HARDWARE_PROCESS":
        errors = validateQcHardwareValues(values, String(entry.subType ?? ""), tier, entryId);
        break;
      case "CASTING_MOTOR":
        errors = validateQcCastingValues(values, tier, entryId);
        break;
      case "CURING_MOTOR":
        errors = validateQcCuringValues(values, tier, entryId);
        break;
      case "DE_CORING_MOTOR":
        errors = validateQcDeCoringValues(values, tier, entryId);
        break;
      case "TRIMMING_MOTOR":
        errors = validateQcTrimmingValues(values, tier, entryId);
        break;
      case "POST_CURE_MOTOR":
        errors = validateQcPostCureValues(values, tier, {
          entryId,
          subType: entry.subType,
          inhibitorType: entry.inhibitorType,
        });
        break;
      case "NDT_MOTOR":
        errors = validateQcNdtDivisionValues(values, tier, entryId);
        break;
      case "PROPELLANT_MOTOR":
      case "PROPELLANT_PROCESS":
        errors = validateQcPropellantValues(values, tier, entryId);
        break;
      case "WEIGHTMENT_MOTOR":
        errors = validateQcWeighmentValues(values, tier, entryId);
        break;
      case "BOTH_PREMIX":
      case "SOLID_PREMIX":
      case "LIQUID_PREMIX":
      case "PROCESSING_MATERIAL":
        // Schema-driven panels — enforce non-empty on SUBMIT only.
        // Schema-unavailable materials show weighment fallback (no editable schema values).
        if (kind === "PROCESSING_MATERIAL" && entry.schemaUnavailable) {
          break;
        }
        if (tier === "SUBMIT" && !hasMeaningfulValue(values)) {
          errors = { form: REQUIRED };
        }
        break;
      default:
        if (tier === "SUBMIT" && !hasMeaningfulValue(values)) {
          errors = { form: REQUIRED };
        }
        break;
    }
  } catch (error) {
    console.error("[QC validation] entry failed", kind, entryId, error);
    if (tier === "SUBMIT") {
      errors = { form: REQUIRED };
    }
  }

  // SUBMIT only: adapter returned no field errors but values are still empty
  if (tier === "SUBMIT" && Object.keys(errors).length === 0 && !hasMeaningfulValue(values)) {
    if (
      kind !== "SIMPLE" &&
      kind !== "STF" &&
      !(kind === "PROCESSING_MATERIAL" && entry.schemaUnavailable)
    ) {
      errors = { form: REQUIRED };
    }
  }

  return errors;
}

export function validateQcDivisionEntries(
  entries: QcDivisionEntry[],
  entryValues: Record<
    string,
    {
      schemaValues?: SchemaFormValues;
      liquidSchemaValues?: SchemaFormValues;
    }
  >,
  tier: ValidationTier,
  options?: {
    mixingFinalMixDetailsValues?: SchemaFormValues | null;
  },
): { ok: boolean; errorsByEntryId: Record<string, ValidationErrors> } {
  const errorsByEntryId: Record<string, ValidationErrors> = {};

  if ((tier === "SUBMIT" || tier === "UNIT") && (!entries || entries.length === 0)) {
    return {
      ok: false,
      errorsByEntryId: {
        _form: { form: REQUIRED },
      },
    };
  }

  for (const entry of entries) {
    const stored = entryValues[entry.entryId] ?? {};
    const schemaValues = stored.schemaValues ?? {};
    const liquidSchemaValues = stored.liquidSchemaValues;

    let errors = validateQcDivisionEntry(
      entry,
      schemaValues,
      tier,
      entry.kind === "MIXING_FINAL_MIX"
        ? {
            finalMixDetailsValues: options?.mixingFinalMixDetailsValues ?? schemaValues,
            viscosityValues: schemaValues,
          }
        : undefined,
    );

    // BOTH_PREMIX / liquid side — validate independently and merge errors (prefix liquid.)
    if (liquidSchemaValues && Object.keys(liquidSchemaValues).length >= 0) {
      if (entry.kind === "BOTH_PREMIX" || entry.kind === "LIQUID_PREMIX") {
        const liquidErrors = validateQcDivisionEntry(entry, liquidSchemaValues, tier);
        if (Object.keys(liquidErrors).length > 0) {
          const prefixed: ValidationErrors = {};
          Object.entries(liquidErrors).forEach(([path, msg]) => {
            prefixed[`liquid.${path}`] = msg;
          });
          errors = { ...errors, ...prefixed };
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      errorsByEntryId[entry.entryId] = errors;
    }
  }

  const ok = Object.keys(errorsByEntryId).length === 0;
  if (!ok) {
    console.warn(
      "[QC validation] blocked",
      tier,
      Object.fromEntries(
        Object.entries(errorsByEntryId).map(([id, e]) => [id, Object.keys(e)]),
      ),
    );
  }
  return { ok, errorsByEntryId };
}
