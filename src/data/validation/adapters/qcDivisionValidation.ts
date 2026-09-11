

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

const REQUIRED = VALIDATIONSTRING.FIELD_REQUIRED ?? "This field is required";

const hasMeaningfulValues = (values: SchemaFormValues | null | undefined): boolean => {
  if (!values || typeof values !== "object") return false;
  const raw = JSON.stringify(values);
  // ignore empty objects/arrays and nullish
  return /"[^"]{1,}"/.test(raw) && !/^\{\}s*$/.test(raw.trim());
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
      default:
        // SIMPLE / STF / PROCESSING etc. — no table config yet
        if (tier === "SUBMIT" && !hasMeaningfulValues(values)) {
          errors = { _form: REQUIRED };
        }
        break;
    }
  } catch (error) {
    console.error("[QC validation] entry failed", kind, entryId, error);
    if (tier === "SUBMIT" || tier === "UNIT") {
      errors = { _form: REQUIRED };
    }
  }

  // SUBMIT safety: adapter returned no paths/errors but form is still empty
  if (
    (tier === "SUBMIT" || tier === "UNIT") &&
    Object.keys(errors).length === 0 &&
    !hasMeaningfulValues(values) &&
    kind !== "SIMPLE"
  ) {
    errors = { _form: REQUIRED };
  }

  return errors;
}

export function validateQcDivisionEntries(
  entries: QcDivisionEntry[],
  entryValues: Record<
    string,
    { schemaValues?: SchemaFormValues; liquidSchemaValues?: SchemaFormValues }
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
    const vals = entryValues[entry.entryId]?.schemaValues;
    let errs: ValidationErrors;

    if (entry.kind === "MIXING_FINAL_MIX") {
      errs = validateQcDivisionEntry(entry, vals, tier, {
        finalMixDetailsValues: options?.mixingFinalMixDetailsValues ?? vals,
        viscosityValues: vals,
      });
    } else {
      errs = validateQcDivisionEntry(entry, vals, tier);
    }

    if (Object.keys(errs).length > 0) {
      errorsByEntryId[entry.entryId] = errs;
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
