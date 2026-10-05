
import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import type { FieldRuleConfig, SubDeptValidationConfig } from "../runValidation";
import type { ValidationErrors, ValidationTier } from "../submissionIntent";
import { str } from "../fieldValidators";
import { VALIDATIONSTRING } from "./validationString";
import {
  QC_MIXING_FINAL_MIX_DETAILS_FORM_KEY,
  QC_MIXING_PREMIX_FORM_KEY,
  QC_MIXING_VISCOSITY_FORM_KEY,
  getMixingDetailsRows,
  getViscosityRows,
  parseMixingSpecificationBounds,
} from "@/hooks/user/qualityControl/qcMixingTables";

const S = VALIDATIONSTRING;
const M = VALIDATIONSTRING;

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

const unwrapTableRows = (raw: unknown): Record<string, unknown>[] => {
  if (Array.isArray(raw) && raw.length) {
    return raw.map((r) => asRecord(r) ?? {}).filter((r) => Object.keys(r).length > 0);
  }
  const nested = asRecord(raw);
  if (nested && Array.isArray(nested.rows) && nested.rows.length) {
    return nested.rows.map((r) => asRecord(r) ?? {}).filter((r) => Object.keys(r).length > 0);
  }
  return [];
};

/**
 * Prefer composite form keys used by setMixingDetailsRows
 * (`PREMIX_DETAILS::PREMIX_DETAILS`), then getMixingDetailsRows.
 */
const extractDetailsRows = (
  values: Record<string, unknown>,
  variant: "premix" | "finalMix",
): Record<string, unknown>[] => {
  const formKey =
    variant === "premix" ? QC_MIXING_PREMIX_FORM_KEY : QC_MIXING_FINAL_MIX_DETAILS_FORM_KEY;
  const fromKey = unwrapTableRows(values[formKey]);
  if (fromKey.length) return fromKey;

  for (const key of [
    "premixDetails",
    "finalMixDetails",
    "PREMIX_DETAILS",
    "FINAL_MIX_DETAILS",
    "rows",
    "detailsRows",
  ]) {
    const rows = unwrapTableRows(values[key]);
    if (rows.length && (rows[0].PARAMETER != null || rows[0].BOWL_NO != null)) {
      return rows;
    }
  }

  // Same source of truth as QCMixingDetailsTable display.
  try {
    const fromHelper = getMixingDetailsRows(values as SchemaFormValues, variant);
    if (fromHelper.length) {
      return fromHelper.map((row) => ({ ...(row as Record<string, unknown>) }));
    }
  } catch {
    // ignore
  }

  for (const v of Object.values(values)) {
    const rows = unwrapTableRows(v);
    if (rows.length && (rows[0].PARAMETER != null || rows[0].BOWL_NO != null)) {
      return rows;
    }
  }
  return [];
};

const extractViscosityRows = (values: Record<string, unknown>): Record<string, unknown>[] => {
  const fromKey = unwrapTableRows(values[QC_MIXING_VISCOSITY_FORM_KEY]);
  if (fromKey.length) return fromKey;

  for (const key of ["viscosityRows", "VISCOSITY_ROWS", "rows"]) {
    const rows = unwrapTableRows(values[key]);
    if (rows.length && (rows[0].TIME != null || rows[0].VISCOSITY_VALUE != null)) {
      return rows;
    }
  }

  try {
    const fromHelper = getViscosityRows(values as SchemaFormValues);
    if (fromHelper.length) {
      return fromHelper.map((row) => ({ ...(row as Record<string, unknown>) }));
    }
  } catch {
    // ignore
  }

  for (const v of Object.values(values)) {
    const rows = unwrapTableRows(v);
    if (rows.length && rows[0].VISCOSITY_VALUE != null) return rows;
  }
  return [];
};

const valueFieldKeys = (row: Record<string, unknown>): string[] => {
  const sampleCount = Number(row.SAMPLE_COUNT ?? row.sampleCount ?? row.noOfSamples);
  if (Number.isFinite(sampleCount) && sampleCount > 0) {
    return Array.from({ length: Math.floor(sampleCount) }, (_, i) => `VALUE_${i + 1}`);
  }
  const ordered: string[] = [];
  for (let i = 1; i <= 20; i += 1) {
    const key = `VALUE_${i}`;
    if (key in row) ordered.push(key);
  }
  if (ordered.length) return ordered;
  if ("VALUE" in row) return ["VALUE"];
  return Object.keys(row).filter(
    (k) =>
      ![
        "SR_NO",
        "PARAMETER",
        "PARAMETER_ID",
        "SPECIFICATION",
        "SPEC_MIN",
        "SPEC_MAX",
        "REMARKS",
        "BOWL_NO",
        "DATE_OF_PREMIX",
        "DATE_OF_FINAL_MIX",
        "MIXER_BLDG_NO",
        "PREMIX_QTY",
        "SAMPLE_COUNT",
        "_rowId",
        "readonly",
      ].includes(k) && typeof row[k] !== "object",
  );
};

/** Manufacturing Mixing parity — VALUE samples must fall within specification bounds. */
const applyMixingValueRangeRules = (
  target: QcMixingValidationTarget,
  tier: ValidationTier,
  errors: ValidationErrors,
) => {
  if (target.variant === "viscosity") return;
  const isSubmit = tier === "SUBMIT";
  const values = asRecord(target.values) ?? {};
  const rows = extractDetailsRows(values, target.variant);
  rows.forEach((row, i) => {
    const boundsFromFields = {
      min:
        row.SPEC_MIN != null && row.SPEC_MIN !== ""
          ? Number(row.SPEC_MIN)
          : undefined,
      max:
        row.SPEC_MAX != null && row.SPEC_MAX !== ""
          ? Number(row.SPEC_MAX)
          : undefined,
    };
    const parsed = parseMixingSpecificationBounds(row.SPECIFICATION);
    const min =
      boundsFromFields.min != null && Number.isFinite(boundsFromFields.min)
        ? boundsFromFields.min
        : parsed.min;
    const max =
      boundsFromFields.max != null && Number.isFinite(boundsFromFields.max)
        ? boundsFromFields.max
        : parsed.max;

    valueFieldKeys(row).forEach((vf) => {
      const path = `details.${i}.${vf}`;
      // Don't overwrite required/format errors already set by field rules.
      if (errors[path]) return;
      const raw = row[vf];
      if (raw === undefined || raw === null || String(raw).trim() === "") {
        return;
      }
      const num = Number(raw);
      if (Number.isNaN(num)) {
        errors[path] = S.INVALID;
        return;
      }
      if (!isSubmit && (min == null && max == null)) return;
      if (min != null && max != null) {
        if (num < min || num > max) {
          errors[path] = M.OBSERVED_VALUE_RANGE.replace("{min}", String(min)).replace(
            "{max}",
            String(max),
          );
        }
      } else if (min != null && num < min) {
        errors[path] = M.OBSERVED_VALUE_MIN.replace("{min}", String(min));
      } else if (max != null && num > max) {
        errors[path] = M.OBSERVED_VALUE_MAX.replace("{max}", String(max));
      }
    });
  });
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
        fields.push({
          path: "viscosityRows.0.VISCOSITY_VALUE",
          value: "",
          ruleKey: "viscosityValue",
        });
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

    const rows = extractDetailsRows(values, target.variant);
    if (!rows.length) {
      fields.push({ path: "details.0.BOWL_NO", value: "", ruleKey: "bowlNo" });
      fields.push({ path: "details.0.MIXER_BLDG_NO", value: "", ruleKey: "mixerBldgNo" });
      fields.push({ path: "details.0.PREMIX_QTY", value: "", ruleKey: "batchSize" });
      if (target.variant === "premix") {
        fields.push({ path: "details.0.DATE_OF_PREMIX", value: "", ruleKey: "dateOfPremix" });
      } else {
        fields.push({
          path: "details.0.DATE_OF_FINAL_MIX",
          value: "",
          ruleKey: "dateOfFinalMix",
        });
      }
      fields.push({ path: "details.0.SPECIFICATION", value: "", ruleKey: "specification" });
      fields.push({ path: "details.0.VALUE_1", value: "", ruleKey: "value" });
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
      const specRaw = str(row.SPECIFICATION);
      const hasMasterParam = Boolean(str(row.PARAMETER) || str(row.PARAMETER_ID));
      fields.push({
        path: `details.${i}.SPECIFICATION`,
        value: specRaw || (hasMasterParam ? "NA" : ""),
        ruleKey: "specification",
      });

      const valueKeys = valueFieldKeys(row);
      if (valueKeys.length) {
        valueKeys.forEach((vf) => {
          fields.push({
            path: `details.${i}.${vf}`,
            value: row[vf],
            ruleKey: "value",
          });
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
  customRules: [applyMixingValueRangeRules],
  isUnitComplete: (target) => {
    const values = asRecord(target.values) ?? {};
    if (target.variant === "viscosity") {
      const rows = extractViscosityRows(values);
      return rows.some((r) => Boolean(str(r.TIME) || str(r.VISCOSITY_VALUE)));
    }
    const rows = extractDetailsRows(values, target.variant);
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
