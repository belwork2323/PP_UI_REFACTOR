
import type { SchemaFormValues } from "@/schema-engine";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";
import { str } from "../fieldValidators";
import { VALIDATIONSTRING } from "./validationString";

const S = VALIDATIONSTRING;

const text = (
  requiredIn: ValidationTier[],
  pattern?: RegExp,
): FieldRuleConfig => ({
  valueType: "text",
  requiredIn,
  pattern,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

const number = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "number",
  requiredIn,
  pattern: S.PATTERNS.FLOAT,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

const date = (requiredIn: ValidationTier[]): FieldRuleConfig => ({
  valueType: "date",
  requiredIn,
  messages: { required: S.FIELD_REQUIRED, invalid: S.INVALID },
});

export type QcMixingValidationTarget = {
  entryId?: string;
  variant: "premix" | "finalMix" | "viscosity";
  values: SchemaFormValues | Record<string, unknown>;
};

export const qcMixingValidationFields: Record<string, FieldRuleConfig> = {
  // Shared header (Premix / Final Mix details)
  // Bowl may be "Bowl No.2", numeric id, or master code from mixer config
  // Mandatory on SUBMIT only — draft/save uses FORMAT (no required checks)
  bowlNo: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  dateOfPremix: date(["SUBMIT"]),
  dateOfFinalMix: date(["SUBMIT"]),
  // Auto-seeded as "MX-1 & BLD-1" (mixer + building), not a bare building code
  mixerBldgNo: text(["SUBMIT"], S.PATTERNS.ALPHABET_WITH_SPECIAL),
  batchSize: number(["SUBMIT"]),

  // Specs from quality-check master (e.g. "NA", "0 - 0.08 %") — not numeric
  specification: text(["SUBMIT"], S.PATTERNS.SPECIFICATION_WITH_TOLERANCE),
  value: number(["SUBMIT"]),
  remarks: text([], S.PATTERNS.ALPHABET_WITH_SPECIAL),

  // Viscosity build-up
  viscosityTime: number(["SUBMIT"]),
  viscosityValue: number(["SUBMIT"]),
};

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Prefer known keys used by getMixingDetailsRows / setMixingDetailsRows. */
const extractDetailsRows = (values: Record<string, unknown>): Record<string, unknown>[] => {
  for (const key of [
    "premixDetails",
    "finalMixDetails",
    "PREMIX_DETAILS",
    "FINAL_MIX_DETAILS",
    "rows",
    "detailsRows",
  ]) {
    const arr = asArray(values[key]);
    if (arr.length && asRecord(arr[0])?.PARAMETER != null) {
      return arr.map((r) => asRecord(r) ?? {});
    }
  }
  // Nested under section-style keys
  for (const v of Object.values(values)) {
    const arr = asArray(v);
    if (
      arr.length &&
      (asRecord(arr[0])?.PARAMETER != null || asRecord(arr[0])?.BOWL_NO != null)
    ) {
      return arr.map((r) => asRecord(r) ?? {});
    }
  }
  return [];
};

const extractViscosityRows = (values: Record<string, unknown>): Record<string, unknown>[] => {
  for (const key of ["viscosityRows", "VISCOSITY_ROWS", "rows"]) {
    const arr = asArray(values[key]);
    if (arr.length && (asRecord(arr[0])?.TIME != null || asRecord(arr[0])?.VISCOSITY_VALUE != null)) {
      return arr.map((r) => asRecord(r) ?? {});
    }
  }
  for (const v of Object.values(values)) {
    const arr = asArray(v);
    if (arr.length && asRecord(arr[0])?.VISCOSITY_VALUE != null) {
      return arr.map((r) => asRecord(r) ?? {});
    }
  }
  return [];
};

const valueFieldKeys = (row: Record<string, unknown>): string[] => {
  // Premix uses VALUE_1..VALUE_5; final mix uses VALUE_1. Prefer ordered VALUE_* keys.
  const ordered = ["VALUE_1", "VALUE_2", "VALUE_3", "VALUE_4", "VALUE_5", "VALUE"];
  const found = ordered.filter((k) => k in row);
  if (found.length) return found;
  return Object.keys(row).filter(
    (k) =>
      !["SR_NO", "PARAMETER", "PARAMETER_ID", "SPECIFICATION", "REMARKS", "BOWL_NO", "DATE_OF_PREMIX", "DATE_OF_FINAL_MIX", "MIXER_BLDG_NO", "PREMIX_QTY", "_rowId"].includes(
        k,
      ) && typeof row[k] !== "object",
  );
};

export const qcMixingValidationConfig: SubDeptValidationConfig<QcMixingValidationTarget> = {
  id: "qc-mixing",
  fields: qcMixingValidationFields,
  resolveFieldPaths: (target) => {
    const values = asRecord(target.values) ?? {};
    const fields: Array<{ path: string; value: unknown; ruleKey: string }> = [];

    if (target.variant === "viscosity") {
      const rows = extractViscosityRows(values);
      if (!rows.length) {
        fields.push({ path: "viscosityRows.0.TIME", value: "", ruleKey: "viscosityTime" });
        return fields;
      }
      rows.forEach((row, i) => {
        fields.push({
          path: `viscosityRows.${i}.TIME`,
          value: row.TIME,
          ruleKey: "viscosityTime",
        });
        fields.push({
          path: `viscosityRows.${i}.VISCOSITY_VALUE`,
          value: row.VISCOSITY_VALUE,
          ruleKey: "viscosityValue",
        });
      });
      return fields;
    }

    const rows = extractDetailsRows(values);
    if (!rows.length) {
      fields.push({ path: "details.0.BOWL_NO", value: "", ruleKey: "bowlNo" });
      return fields;
    }

    const first = rows[0] ?? {};
    fields.push({ path: "details.0.BOWL_NO", value: first.BOWL_NO, ruleKey: "bowlNo" });
    fields.push({
      path: "details.0.MIXER_BLDG_NO",
      value: first.MIXER_BLDG_NO,
      ruleKey: "mixerBldgNo",
    });
    fields.push({
      path: "details.0.PREMIX_QTY",
      value: first.PREMIX_QTY,
      ruleKey: "batchSize",
    });

    if (target.variant === "premix") {
      fields.push({
        path: "details.0.DATE_OF_PREMIX",
        value: first.DATE_OF_PREMIX,
        ruleKey: "dateOfPremix",
      });
    } else {
      fields.push({
        path: "details.0.DATE_OF_FINAL_MIX",
        value: first.DATE_OF_FINAL_MIX,
        ruleKey: "dateOfFinalMix",
      });
    }

    rows.forEach((row, i) => {
      fields.push({
        path: `details.${i}.SPECIFICATION`,
        value: row.SPECIFICATION,
        ruleKey: "specification",
      });

      // Premix rows always carry VALUE_1..VALUE_5 keys (often empty). Match API payload:
      // trailing empty samples are allowed; only filled samples are format-checked.
      // On SUBMIT, require at least one sample value (VALUE_1 if none filled).
      const valueKeys = valueFieldKeys(row);
      const filledValueKeys = valueKeys.filter((vf) => Boolean(str(row[vf])));
      if (filledValueKeys.length) {
        filledValueKeys.forEach((vf) => {
          fields.push({
            path: `details.${i}.${vf}`,
            value: row[vf],
            ruleKey: "value",
          });
        });
      } else if (valueKeys.length) {
        fields.push({
          path: `details.${i}.${valueKeys[0]}`,
          value: "",
          ruleKey: "value",
        });
      }

      fields.push({
        path: `details.${i}.REMARKS`,
        value: row.REMARKS,
        ruleKey: "remarks",
      });
    });

    return fields;
  },
  isUnitComplete: (target) => {
    const values = asRecord(target.values) ?? {};
    if (target.variant === "viscosity") {
      const rows = extractViscosityRows(values);
      return rows.some((r) => Boolean(str(r.TIME) || str(r.VISCOSITY_VALUE)));
    }
    const rows = extractDetailsRows(values);
    if (!rows.length) return false;
    const first = rows[0];
    return Boolean(
      str(first.BOWL_NO) ||
        str(first.DATE_OF_PREMIX) ||
        str(first.DATE_OF_FINAL_MIX) ||
        str(first.MIXER_BLDG_NO),
    );
  },
};

export function toQcMixingValidationTarget(
  values: SchemaFormValues | Record<string, unknown> | null | undefined,
  variant: QcMixingValidationTarget["variant"],
  entryId?: string,
): QcMixingValidationTarget {
  return {
    entryId,
    variant,
    values: (values as SchemaFormValues) ?? {},
  };
}
