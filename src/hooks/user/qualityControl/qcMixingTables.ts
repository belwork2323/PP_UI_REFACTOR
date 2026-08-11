import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import {
  QC_MIXING_FINAL_MIX_DETAILS_SECTION_ID,
  QC_MIXING_PREMIX_SECTION_ID,
  QC_MIXING_VISCOSITY_SECTION_ID,
} from "./qcMixingConfig";

export const QC_MIXING_PREMIX_TABLE_ID = "PREMIX_DETAILS";
export const QC_MIXING_FINAL_MIX_DETAILS_TABLE_ID = "FINAL_MIX_DETAILS";
export const QC_MIXING_VISCOSITY_TABLE_ID = "VISCOSITY_BUILD_UP";

export const QC_MIXING_PREMIX_FORM_KEY = `${QC_MIXING_PREMIX_SECTION_ID}::${QC_MIXING_PREMIX_TABLE_ID}`;
export const QC_MIXING_FINAL_MIX_DETAILS_FORM_KEY = `${QC_MIXING_FINAL_MIX_DETAILS_SECTION_ID}::${QC_MIXING_FINAL_MIX_DETAILS_TABLE_ID}`;
export const QC_MIXING_VISCOSITY_FORM_KEY = `${QC_MIXING_VISCOSITY_SECTION_ID}::${QC_MIXING_VISCOSITY_TABLE_ID}`;

export const QC_MIXING_PREMIX_PARAMETERS = ["Homogeneity", "Moisture"] as const;
export const QC_MIXING_FINAL_MIX_DETAIL_PARAMETERS = [
  "End of mix Viscosity (Poise)",
  "End of Mix Temp (°C)",
] as const;

export const QC_MIXING_PREMIX_MERGE_COLUMNS = [
  "BOWL_NO",
  "DATE_OF_PREMIX",
  "MIXER_BLDG_NO",
  "PREMIX_QTY",
] as const;

export const QC_MIXING_FINAL_MIX_MERGE_COLUMNS = [
  "BOWL_NO",
  "DATE_OF_FINAL_MIX",
  "MIXER_BLDG_NO",
  "PREMIX_QTY",
] as const;

export type QcMixingDetailsVariant = "premix" | "finalMix";

export type QcMixingDetailsSeed = {
  BOWL_NO?: string;
  DATE_OF_PREMIX?: string;
  DATE_OF_FINAL_MIX?: string;
  MIXER_BLDG_NO?: string;
  PREMIX_QTY?: string;
};

export const QC_MIXING_PREMIX_VALUE_FIELDS = [
  "VALUE_1",
  "VALUE_2",
  "VALUE_3",
  "VALUE_4",
  "VALUE_5",
] as const;

export const QC_MIXING_FINAL_MIX_VALUE_FIELDS = ["VALUE_1"] as const;

export type QcMixingDetailsRow = {
  BOWL_NO?: string;
  DATE_OF_PREMIX?: string;
  DATE_OF_FINAL_MIX?: string;
  MIXER_BLDG_NO?: string;
  PREMIX_QTY?: string;
  PARAMETER?: string;
  PARAMETER_ID?: string;
  SPECIFICATION?: string;
  VALUE_1?: string;
  VALUE_2?: string;
  VALUE_3?: string;
  VALUE_4?: string;
  VALUE_5?: string;
  REMARKS?: string;
  readonly?: boolean;
};

/** Spec list row from Mixing division-details / QC details qualityChecks. */
export type QcMixingQualityCheckDefinition = {
  parameterId: string;
  parameter: string;
  specification: string;
  sampleCount?: number;
};

export type QcMixingViscosityRow = {
  SR_NO?: number | string;
  TIME?: string;
  VISCOSITY_VALUE?: string;
};

const DETAILS_PARAMETERS: Record<QcMixingDetailsVariant, readonly string[]> = {
  premix: QC_MIXING_PREMIX_PARAMETERS,
  finalMix: QC_MIXING_FINAL_MIX_DETAIL_PARAMETERS,
};

const DETAILS_DATE_KEY: Record<QcMixingDetailsVariant, "DATE_OF_PREMIX" | "DATE_OF_FINAL_MIX"> = {
  premix: "DATE_OF_PREMIX",
  finalMix: "DATE_OF_FINAL_MIX",
};

const DETAILS_FORM_KEY: Record<QcMixingDetailsVariant, string> = {
  premix: QC_MIXING_PREMIX_FORM_KEY,
  finalMix: QC_MIXING_FINAL_MIX_DETAILS_FORM_KEY,
};

const DETAILS_SECTION_ID: Record<QcMixingDetailsVariant, string> = {
  premix: QC_MIXING_PREMIX_SECTION_ID,
  finalMix: QC_MIXING_FINAL_MIX_DETAILS_SECTION_ID,
};

const DETAILS_TABLE_ID: Record<QcMixingDetailsVariant, string> = {
  premix: QC_MIXING_PREMIX_TABLE_ID,
  finalMix: QC_MIXING_FINAL_MIX_DETAILS_TABLE_ID,
};

const hasValue = (value: unknown) => Boolean(String(value ?? "").trim());

const rowHasUserData = (row: QcMixingDetailsRow) =>
  hasValue(row.BOWL_NO) ||
  hasValue(row.DATE_OF_PREMIX) ||
  hasValue(row.DATE_OF_FINAL_MIX) ||
  hasValue(row.MIXER_BLDG_NO) ||
  hasValue(row.PREMIX_QTY) ||
  hasValue(row.SPECIFICATION) ||
  hasValue(row.VALUE_1) ||
  hasValue(row.VALUE_2) ||
  hasValue(row.VALUE_3) ||
  hasValue(row.VALUE_4) ||
  hasValue(row.VALUE_5) ||
  hasValue(row.REMARKS);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
};

/** Unwrap `{ source, parsedValue }` bounds from division-details / QC details specs. */
const resolveSpecBound = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "object" && !Array.isArray(value)) {
    const rec = value as Record<string, unknown>;
    return pickString(rec.parsedValue, rec.source, rec.value);
  }
  return pickString(value);
};

/** Format API specification; empty `{}` / missing bounds → `"NA"`. */
const formatSpecificationLabel = (specification: unknown): string => {
  if (specification == null) return "NA";
  if (typeof specification !== "object" || Array.isArray(specification)) {
    return pickString(specification) || "NA";
  }
  const rec = specification as Record<string, unknown>;
  const minValue = resolveSpecBound(rec.minValue ?? rec.min);
  const maxValue = resolveSpecBound(rec.maxValue ?? rec.max);
  const unit = pickString(rec.unit);
  if (!minValue && !maxValue && !unit) return "NA";
  if (minValue && maxValue) return `${minValue} - ${maxValue}${unit ? ` ${unit}` : ""}`.trim();
  if (minValue || maxValue) return `${minValue || maxValue}${unit ? ` ${unit}` : ""}`.trim();
  return unit || "NA";
};

/** Parse qualityChecks arrays from division-details / QC details (or legacy quality-checks API). */
export const parseMixingQualityCheckDefinitions = (
  response: unknown,
): QcMixingQualityCheckDefinition[] => {
  const root = asRecord(response);
  const data = asRecord(root?.data) ?? root;
  const nestedData = asRecord(data?.data);
  const definitions = asArray(
    nestedData?.qualityChecks ??
      data?.qualityChecks ??
      root?.qualityChecks ??
      data?.parameters ??
      root?.parameters ??
      data?.specificationList ??
      data?.specifications ??
      root?.specificationList,
  );

  return definitions
    .map((item): QcMixingQualityCheckDefinition | null => {
      const rec = asRecord(item);
      if (!rec) return null;
      const parameterId = pickString(
        rec.parameterId,
        rec.specificationCode,
        rec.specCode,
        rec.code,
      );
      const parameter = pickString(
        rec.parameterName,
        rec.parameter,
        rec.specificationName,
        rec.name,
        parameterId,
      );
      const specification = formatSpecificationLabel(
        rec.specification ?? rec.referenceRange ?? rec.specs,
      );
      if (!parameterId && !parameter) return null;
      const sampleCount = pickNumber(rec.noOfSamples, rec.sampleCount);
      return {
        parameterId: parameterId || parameter,
        parameter,
        specification,
        ...(sampleCount != null ? { sampleCount } : {}),
      };
    })
    .filter((row): row is QcMixingQualityCheckDefinition => row != null);
};

const pickNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const formatMixerBldgNo = (mixer?: unknown, bldg?: unknown): string => {
  const mixerText = String(mixer ?? "").trim();
  const bldgText = String(bldg ?? "").trim();
  if (mixerText && bldgText) return `${mixerText} & ${bldgText}`;
  return mixerText || bldgText;
};

const resolveIdentificationSheet = (
  autoPopulatePayload?: unknown,
  batchPayload?: unknown,
): Record<string, unknown> | null => {
  const sources = [
    autoPopulatePayload,
    asRecord(autoPopulatePayload)?.data,
    asRecord(autoPopulatePayload)?.__manufacturingDivisionData,
    batchPayload,
    asRecord(batchPayload)?.identificationSheet,
  ];
  for (const source of sources) {
    const rec = asRecord(source);
    if (!rec) continue;
    const sheet = asRecord(rec.identificationSheet);
    if (sheet) return sheet;
    if (
      rec.batchSize != null ||
      rec.mixerType != null ||
      rec.bldgNo != null ||
      rec.date != null
    ) {
      return rec;
    }
  }
  return null;
};

const resolveMixingStages = (autoPopulatePayload?: unknown): unknown[] => {
  const roots = [
    autoPopulatePayload,
    asRecord(autoPopulatePayload)?.data,
    asRecord(autoPopulatePayload)?.__manufacturingDivisionData,
    asRecord(autoPopulatePayload)?.__qcFormDivisionData,
  ];
  for (const root of roots) {
    const rec = asRecord(root);
    if (!rec) continue;
    const mixingDetails = asRecord(rec.mixingDetails);
    const fromDetails = asArray(mixingDetails?.stages);
    if (fromDetails.length) return fromDetails;
    const fromRoot = asArray(rec.stages);
    if (fromRoot.length) return fromRoot;
  }
  return [];
};

const findStagePremixEntry = (
  stages: unknown[],
  stageType: "PREMIX" | "FINAL_MIX",
  premixNo: number,
): Record<string, unknown> | null => {
  const stage = stages.find(
    (row) =>
      String(asRecord(row)?.stageType ?? "")
        .trim()
        .toUpperCase() === stageType,
  );
  const entries = asArray(asRecord(stage)?.premixes);
  const match = entries.find((entry) => {
    const rec = asRecord(entry);
    if (!rec) return false;
    const no = pickNumber(rec.premixNo, rec.finalMixNo, rec.mixNo, rec.no);
    return no === premixNo;
  });
  return asRecord(match);
};

/** QC division-details nests premix payload under `details`; manufacturing may use a flat shape. */
const unwrapStagePremixEntry = (
  entry: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null => {
  if (!entry) return null;
  const nested = asRecord(entry.details);
  if (
    nested &&
    (nested.mixerConfiguration != null ||
      nested.mixDetails != null ||
      nested.qualityChecks != null ||
      nested.trialDetails != null)
  ) {
    return {
      ...nested,
      premixNo: pickNumber(entry.premixNo, nested.premixNo, entry.finalMixNo, nested.finalMixNo),
    };
  }
  return entry;
};

export const resolveMixingDivisionEntry = (params: {
  variant: QcMixingDetailsVariant;
  premixNo?: number | null;
  autoPopulatePayload?: unknown;
}): Record<string, unknown> | null => {
  const premixNo = Number(params.premixNo);
  if (!Number.isFinite(premixNo) || premixNo <= 0) return null;
  const stages = resolveMixingStages(params.autoPopulatePayload);
  const stageType = params.variant === "premix" ? "PREMIX" : "FINAL_MIX";
  return unwrapStagePremixEntry(findStagePremixEntry(stages, stageType, premixNo));
};

/**
 * Build parameter/spec rows from division-details or QC form details payloads.
 * Quality-checks live under stages[].premixes[].details.qualityChecks (or domain parameters).
 */
export const extractMixingQualityCheckDefinitionsFromPayload = (
  payload: unknown,
  stageType: "PREMIX" | "FINAL_MIX",
): QcMixingQualityCheckDefinition[] => {
  const stages = resolveMixingStages(payload);
  if (stages.length) {
    const stage = stages.find(
      (row) =>
        String(asRecord(row)?.stageType ?? "")
          .trim()
          .toUpperCase() === stageType,
    );
    for (const entry of asArray(asRecord(stage)?.premixes)) {
      const unwrapped = unwrapStagePremixEntry(asRecord(entry));
      const checks = asArray(unwrapped?.qualityChecks);
      if (checks.length) {
        return parseMixingQualityCheckDefinitions({ qualityChecks: checks });
      }
    }
  }

  const roots = [
    payload,
    asRecord(payload)?.data,
    asRecord(payload)?.__manufacturingDivisionData,
    asRecord(payload)?.__qcFormDivisionData,
  ];
  for (const root of roots) {
    const premixes = asArray(asRecord(root)?.premixes);
    for (const item of premixes) {
      const rec = asRecord(item);
      if (!rec) continue;
      const details =
        stageType === "PREMIX"
          ? asRecord(rec.premixDetails) ?? asRecord(rec.details)
          : asRecord(rec.finalMixDetails) ?? asRecord(rec.details);
      const checks = asArray(details?.qualityChecks ?? details?.parameters);
      if (checks.length) {
        return parseMixingQualityCheckDefinitions({ qualityChecks: checks });
      }
    }
  }

  return [];
};

const buildMixingDetailsSeedFromEntry = (
  entry: Record<string, unknown> | null | undefined,
  variant: QcMixingDetailsVariant,
  sheet: Record<string, unknown> | null,
  premixFallback?: Record<string, unknown> | null,
): QcMixingDetailsSeed | null => {
  if (!entry && !premixFallback) return null;

  const mixerConfig = asRecord(entry?.mixerConfiguration) ?? asRecord(premixFallback?.mixerConfiguration);
  const mixDetails = asRecord(entry?.mixDetails);
  const premixMixDetails = asRecord(premixFallback?.mixDetails);

  const bowlNo = pickString(
    mixerConfig?.bowlId,
    entry?.bowlId,
    entry?.bowlNo,
    premixFallback?.bowlId,
    premixFallback?.bowlNo,
  );
  const mixerBldg = formatMixerBldgNo(
    mixerConfig?.mixerId ??
      mixerConfig?.mixerType ??
      entry?.mixerType ??
      premixFallback?.mixerType ??
      sheet?.mixerType,
    mixerConfig?.bldgNo ?? entry?.bldgNo ?? premixFallback?.bldgNo ?? sheet?.bldgNo,
  );

  // Final Mix API often has null mixDetails — reuse Premix date + batch size.
  const batchSize = pickString(
    mixDetails?.mixQuantity,
    entry?.premixQuantity,
    entry?.batchSize,
    premixMixDetails?.mixQuantity,
    premixFallback?.premixQuantity,
    premixFallback?.batchSize,
    sheet?.batchSize,
  );

  const dateKey = variant === "premix" ? "DATE_OF_PREMIX" : "DATE_OF_FINAL_MIX";
  const mixDate = pickString(
    mixDetails?.mixDate,
    entry?.premixDate,
    entry?.finalMixDate,
    entry?.mixDate,
    premixMixDetails?.mixDate,
    premixFallback?.premixDate,
    premixFallback?.mixDate,
    sheet?.date,
  );

  const seed: QcMixingDetailsSeed = {
    BOWL_NO: bowlNo,
    MIXER_BLDG_NO: mixerBldg,
    PREMIX_QTY: batchSize,
    [dateKey]: mixDate,
  };

  if (
    !seed.BOWL_NO &&
    !seed.MIXER_BLDG_NO &&
    !seed.PREMIX_QTY &&
    !seed.DATE_OF_PREMIX &&
    !seed.DATE_OF_FINAL_MIX
  ) {
    return null;
  }

  return seed;
};

const applyMixingQualityChecksToValues = (
  values: SchemaFormValues | null | undefined,
  qualityChecks: unknown,
  variant: QcMixingDetailsVariant,
  options?: {
    onlyIfEmpty?: boolean;
    qualityCheckDefinitions?: QcMixingQualityCheckDefinition[] | null;
  },
): SchemaFormValues => {
  const checks = asArray(qualityChecks);
  const definitions = options?.qualityCheckDefinitions ?? [];
  const definitionById = new Map(
    definitions.map((def) => [String(def.parameterId).trim().toUpperCase(), def]),
  );

  // Prefer specification-list order when available; otherwise keep existing / fallback rows.
  let rows =
    definitions.length > 0
      ? createInitialMixingDetailsRows(variant, definitions)
      : getMixingDetailsRows(values, variant);

  // Preserve shared fields + any already-entered values from current form state.
  const existingRows = getMixingDetailsRows(values, variant);
  if (existingRows.length) {
    const shared = {
      BOWL_NO: existingRows[0].BOWL_NO ?? "",
      DATE_OF_PREMIX: existingRows[0].DATE_OF_PREMIX ?? "",
      DATE_OF_FINAL_MIX: existingRows[0].DATE_OF_FINAL_MIX ?? "",
      MIXER_BLDG_NO: existingRows[0].MIXER_BLDG_NO ?? "",
      PREMIX_QTY: existingRows[0].PREMIX_QTY ?? "",
    };
    const existingById = new Map(
      existingRows
        .filter((row) => String(row.PARAMETER_ID ?? "").trim())
        .map((row) => [String(row.PARAMETER_ID).trim().toUpperCase(), row]),
    );
    const existingByName = new Map(
      existingRows
        .filter((row) => String(row.PARAMETER ?? "").trim())
        .map((row) => [String(row.PARAMETER).trim().toUpperCase(), row]),
    );

    rows = rows.map((row, index) => {
      const byId = existingById.get(String(row.PARAMETER_ID ?? "").trim().toUpperCase());
      const byName = existingByName.get(String(row.PARAMETER ?? "").trim().toUpperCase());
      const prior = byId ?? byName ?? existingRows[index];
      return {
        ...row,
        ...shared,
        VALUE_1: prior?.VALUE_1 ?? row.VALUE_1,
        VALUE_2: prior?.VALUE_2 ?? row.VALUE_2,
        VALUE_3: prior?.VALUE_3 ?? row.VALUE_3,
        VALUE_4: prior?.VALUE_4 ?? row.VALUE_4,
        VALUE_5: prior?.VALUE_5 ?? row.VALUE_5,
        REMARKS: prior?.REMARKS ?? row.REMARKS,
        SPECIFICATION:
          pickString(row.SPECIFICATION) || pickString(prior?.SPECIFICATION) || "",
        PARAMETER: pickString(row.PARAMETER) || pickString(prior?.PARAMETER) || "",
        PARAMETER_ID: pickString(row.PARAMETER_ID) || pickString(prior?.PARAMETER_ID) || "",
      };
    });
  }

  if (!checks.length && !definitions.length) {
    return setMixingDetailsRows(values, variant, rows);
  }

  const valueFields = getMixingValueFields(variant);
  const nextRows = rows.map((row, rowIndex) => {
    const rowParameterId = String(row.PARAMETER_ID ?? "").trim().toUpperCase();
    const check =
      asRecord(
        checks.find((item) => {
          const rec = asRecord(item);
          if (!rec) return false;
          const checkId = pickString(
            rec.parameterId,
            rec.specificationCode,
            rec.specCode,
          ).toUpperCase();
          return Boolean(rowParameterId && checkId && checkId === rowParameterId);
        }),
      ) ??
      // Index fallback only when rows have no parameterId yet (pre-spec-list seed).
      (rowParameterId ? null : asRecord(checks[rowIndex]));

    const definition =
      definitionById.get(rowParameterId) ??
      (check
        ? definitionById.get(
            pickString(check.parameterId, check.specificationCode, check.specCode).toUpperCase(),
          )
        : undefined);

    const next = { ...row };
    // Prefer embedded qualityChecks from division-details / QC details (name + specification + observations).
    if (definition) {
      next.PARAMETER = definition.parameter || next.PARAMETER;
      next.SPECIFICATION = definition.specification || "NA";
      next.PARAMETER_ID = definition.parameterId || next.PARAMETER_ID;
    } else if (check) {
      const parameterName = pickString(
        check.parameterName,
        check.parameter,
        check.specificationName,
      );
      const specification = formatSpecificationLabel(
        check.specification ?? check.referenceRange ?? check.specs,
      );
      if (parameterName) next.PARAMETER = parameterName;
      next.SPECIFICATION = specification || "NA";
      const checkId = pickString(check.parameterId, check.specificationCode, check.specCode);
      if (checkId) next.PARAMETER_ID = checkId;
    }

    if (!check) return next;

    const observations = asArray(check.observations)
      .map((item, index) => {
        if (item == null) return null;
        if (typeof item === "string" || typeof item === "number") {
          return { index, value: String(item) };
        }
        const rec = asRecord(item);
        if (!rec) return null;
        const sampleNo = pickNumber(rec.sampleNo);
        return {
          index: sampleNo != null && sampleNo > 0 ? sampleNo - 1 : index,
          value: String(rec.value ?? "").trim(),
        };
      })
      .filter((item): item is { index: number; value: string } => Boolean(item));

    valueFields.forEach((field, index) => {
      const observation = observations.find((item) => item.index === index);
      const observationValue = String(observation?.value ?? "").trim();
      if (!observationValue) return;
      const current = String(next[field] ?? "").trim();
      if (options?.onlyIfEmpty !== false && current) return;
      next[field] = observationValue;
    });
    return next;
  });

  return setMixingDetailsRows(values, variant, nextRows);
};

const resolvePremixFallbackForFinalMix = (params: {
  premixNo?: number | null;
  autoPopulatePayload?: unknown;
}): Record<string, unknown> | null =>
  resolveMixingDivisionEntry({
    variant: "premix",
    premixNo: params.premixNo,
    autoPopulatePayload: params.autoPopulatePayload,
  });

export const applyMixingDivisionEntryToValues = (
  values: SchemaFormValues | null | undefined,
  params: {
    variant: QcMixingDetailsVariant;
    premixNo?: number | null;
    autoPopulatePayload?: unknown;
    batchPayload?: unknown;
    qualityCheckDefinitions?: QcMixingQualityCheckDefinition[] | null;
  },
  options?: { onlyIfEmpty?: boolean },
): SchemaFormValues => {
  const entry = resolveMixingDivisionEntry(params);
  const premixFallback =
    params.variant === "finalMix"
      ? resolvePremixFallbackForFinalMix(params)
      : null;
  if (!entry && !premixFallback && !(params.qualityCheckDefinitions?.length)) {
    return values ?? {};
  }

  const sheet = resolveIdentificationSheet(params.autoPopulatePayload, params.batchPayload);
  const seed = buildMixingDetailsSeedFromEntry(entry, params.variant, sheet, premixFallback);
  let next = values ?? {};
  if (params.qualityCheckDefinitions?.length || entry?.qualityChecks) {
    next = applyMixingQualityChecksToValues(next, entry?.qualityChecks, params.variant, {
      onlyIfEmpty: options?.onlyIfEmpty,
      qualityCheckDefinitions: params.qualityCheckDefinitions,
    });
  }
  next = applyMixingDetailsSeedToValues(next, seed, params.variant, options);
  return next;
};

export const resolveMixingDetailsSeed = (params: {
  variant: QcMixingDetailsVariant;
  premixNo?: number | null;
  autoPopulatePayload?: unknown;
  batchPayload?: unknown;
}): QcMixingDetailsSeed | null => {
  const entry = resolveMixingDivisionEntry(params);
  const premixFallback =
    params.variant === "finalMix"
      ? resolvePremixFallbackForFinalMix(params)
      : null;
  const sheet = resolveIdentificationSheet(params.autoPopulatePayload, params.batchPayload);
  return buildMixingDetailsSeedFromEntry(entry, params.variant, sheet, premixFallback);
};

export const applyMixingDetailsSeedToValues = (
  values: SchemaFormValues | null | undefined,
  seed: QcMixingDetailsSeed | null | undefined,
  variant: QcMixingDetailsVariant,
  options?: { onlyIfEmpty?: boolean },
): SchemaFormValues => {
  if (!seed) return values ?? {};
  const dateKey = DETAILS_DATE_KEY[variant];
  const rows = getMixingDetailsRows(values, variant).map((row) => {
    const next = { ...row };
    const assign = (field: keyof QcMixingDetailsSeed, seedValue?: string) => {
      const incoming = String(seedValue ?? "").trim();
      if (!incoming) return;
      const current = String(next[field] ?? "").trim();
      if (options?.onlyIfEmpty !== false && current) return;
      next[field] = incoming;
    };
    assign("BOWL_NO", seed.BOWL_NO);
    assign("MIXER_BLDG_NO", seed.MIXER_BLDG_NO);
    assign("PREMIX_QTY", seed.PREMIX_QTY);
    assign(dateKey, seed[dateKey]);
    return next;
  });
  return setMixingDetailsRows(values, variant, rows);
};

export const createSeededMixingDetailsValues = (
  variant: QcMixingDetailsVariant,
  params: {
    premixNo?: number | null;
    autoPopulatePayload?: unknown;
    batchPayload?: unknown;
    qualityCheckDefinitions?: QcMixingQualityCheckDefinition[] | null;
  },
): SchemaFormValues => {
  const base =
    variant === "premix"
      ? createInitialPremixDetailsValues(params.qualityCheckDefinitions)
      : createInitialFinalMixDetailsValues(params.qualityCheckDefinitions);
  return applyMixingDivisionEntryToValues(base, { variant, ...params }, { onlyIfEmpty: false });
};

const extractTableRows = <T extends Record<string, unknown>>(
  sectionData: unknown,
  tableId: string,
): T[] => {
  if (!Array.isArray(sectionData)) return [];
  for (const item of sectionData) {
    if (!item || typeof item !== "object") continue;
    const tableValue = (item as Record<string, unknown>)[tableId];
    if (Array.isArray(tableValue)) {
      return tableValue.filter((row) => row && typeof row === "object") as T[];
    }
    if (tableValue && typeof tableValue === "object") {
      const nestedRows = (tableValue as Record<string, unknown>).rows;
      if (Array.isArray(nestedRows)) {
        return nestedRows.filter((row) => row && typeof row === "object") as T[];
      }
    }
  }
  return [];
};

export const createInitialMixingDetailsRows = (
  variant: QcMixingDetailsVariant,
  qualityCheckDefinitions?: QcMixingQualityCheckDefinition[] | null,
): QcMixingDetailsRow[] => {
  if (qualityCheckDefinitions?.length) {
    return qualityCheckDefinitions.map((definition) => ({
      PARAMETER: definition.parameter,
      PARAMETER_ID: definition.parameterId,
      readonly: true,
      BOWL_NO: "",
      [DETAILS_DATE_KEY[variant]]: "",
      MIXER_BLDG_NO: "",
      PREMIX_QTY: "",
      SPECIFICATION: definition.specification || "NA",
      VALUE_1: "",
      VALUE_2: "",
      VALUE_3: "",
      VALUE_4: "",
      VALUE_5: variant === "premix" ? "" : undefined,
      REMARKS: "",
    }));
  }

  return DETAILS_PARAMETERS[variant].map((parameter) => ({
    PARAMETER: parameter,
    readonly: true,
    BOWL_NO: "",
    [DETAILS_DATE_KEY[variant]]: "",
    MIXER_BLDG_NO: "",
    PREMIX_QTY: "",
    SPECIFICATION: "",
    VALUE_1: "",
    VALUE_2: "",
    VALUE_3: "",
    VALUE_4: "",
    VALUE_5: variant === "premix" ? "" : undefined,
    REMARKS: "",
  }));
};

export const getMixingValueFields = (variant: QcMixingDetailsVariant) =>
  variant === "premix" ? QC_MIXING_PREMIX_VALUE_FIELDS : QC_MIXING_FINAL_MIX_VALUE_FIELDS;

export const createInitialPremixDetailsValues = (
  qualityCheckDefinitions?: QcMixingQualityCheckDefinition[] | null,
): SchemaFormValues => ({
  [QC_MIXING_PREMIX_FORM_KEY]: createInitialMixingDetailsRows("premix", qualityCheckDefinitions),
});

export const createInitialFinalMixDetailsValues = (
  qualityCheckDefinitions?: QcMixingQualityCheckDefinition[] | null,
): SchemaFormValues => ({
  [QC_MIXING_FINAL_MIX_DETAILS_FORM_KEY]: createInitialMixingDetailsRows(
    "finalMix",
    qualityCheckDefinitions,
  ),
});

export const createInitialViscosityValues = (): SchemaFormValues => ({
  [QC_MIXING_VISCOSITY_FORM_KEY]: [{ SR_NO: 1, TIME: "", VISCOSITY_VALUE: "" }],
});

export const getMixingDetailsRows = (
  values: SchemaFormValues | null | undefined,
  variant: QcMixingDetailsVariant,
  qualityCheckDefinitions?: QcMixingQualityCheckDefinition[] | null,
): QcMixingDetailsRow[] => {
  const raw = values?.[DETAILS_FORM_KEY[variant]];
  if (!Array.isArray(raw) || !raw.length) {
    return createInitialMixingDetailsRows(variant, qualityCheckDefinitions);
  }
  const rows = raw.filter((row) => row && typeof row === "object") as QcMixingDetailsRow[];
  if (qualityCheckDefinitions?.length) {
    const byId = new Map(
      rows
        .filter((row) => String(row.PARAMETER_ID ?? "").trim())
        .map((row) => [String(row.PARAMETER_ID).trim().toUpperCase(), row]),
    );
    const byName = new Map(
      rows
        .filter((row) => String(row.PARAMETER ?? "").trim())
        .map((row) => [String(row.PARAMETER).trim().toUpperCase(), row]),
    );
    return qualityCheckDefinitions.map((definition, index) => {
      const match =
        byId.get(definition.parameterId.trim().toUpperCase()) ??
        byName.get(definition.parameter.trim().toUpperCase()) ??
        rows[index];
      return {
        ...(match ?? {}),
        PARAMETER: definition.parameter || match?.PARAMETER || "",
        PARAMETER_ID: definition.parameterId || match?.PARAMETER_ID || "",
        SPECIFICATION: definition.specification || match?.SPECIFICATION || "NA",
        REMARKS: match?.REMARKS ?? "",
        VALUE_1: match?.VALUE_1 ?? "",
        VALUE_2: match?.VALUE_2 ?? "",
        VALUE_3: match?.VALUE_3 ?? "",
        VALUE_4: match?.VALUE_4 ?? "",
        VALUE_5: match?.VALUE_5 ?? "",
        readonly: true,
      };
    });
  }
  if (rows.length >= DETAILS_PARAMETERS[variant].length) return rows;
  const byParameter = new Map(rows.map((row) => [String(row.PARAMETER ?? ""), row]));
  return DETAILS_PARAMETERS[variant].map(
    (parameter) =>
      byParameter.get(parameter) ?? {
        PARAMETER: parameter,
        readonly: true,
      },
  );
};

export const setMixingDetailsRows = (
  values: SchemaFormValues | null | undefined,
  variant: QcMixingDetailsVariant,
  rows: QcMixingDetailsRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [DETAILS_FORM_KEY[variant]]: rows,
});

export const getViscosityRows = (
  values: SchemaFormValues | null | undefined,
): QcMixingViscosityRow[] => {
  const raw = values?.[QC_MIXING_VISCOSITY_FORM_KEY];
  if (!Array.isArray(raw) || !raw.length) {
    return [{ SR_NO: 1, TIME: "", VISCOSITY_VALUE: "" }];
  }
  return raw
    .filter((row) => row && typeof row === "object")
    .map((row, index) => ({
      ...(row as QcMixingViscosityRow),
      SR_NO: (row as QcMixingViscosityRow).SR_NO ?? index + 1,
    }));
};

export const setViscosityRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcMixingViscosityRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [QC_MIXING_VISCOSITY_FORM_KEY]: rows.map((row, index) => ({
    ...row,
    SR_NO: row.SR_NO ?? index + 1,
  })),
});

/** Merge Final Mix Details + Viscosity into one entry schemaValues blob. */
export const mergeFinalMixEntrySchemaValues = (
  detailsValues?: SchemaFormValues | null,
  viscosityValues?: SchemaFormValues | null,
): SchemaFormValues => ({
  ...(detailsValues ?? {}),
  ...(viscosityValues ?? {}),
});

/** Read Final Mix Details from a Final Mix entry (falls back to shared form values). */
export const pickFinalMixDetailsSchemaValues = (
  entrySchemaValues?: SchemaFormValues | null,
  sharedFallback?: SchemaFormValues | null,
): SchemaFormValues => {
  if (entrySchemaValues?.[QC_MIXING_FINAL_MIX_DETAILS_FORM_KEY] != null) {
    return {
      [QC_MIXING_FINAL_MIX_DETAILS_FORM_KEY]:
        entrySchemaValues[QC_MIXING_FINAL_MIX_DETAILS_FORM_KEY],
    };
  }
  return sharedFallback ?? {};
};

/** Read only Viscosity rows from a Final Mix entry schemaValues blob. */
export const pickViscositySchemaValues = (
  entrySchemaValues?: SchemaFormValues | null,
): SchemaFormValues => {
  if (entrySchemaValues?.[QC_MIXING_VISCOSITY_FORM_KEY] != null) {
    return {
      [QC_MIXING_VISCOSITY_FORM_KEY]: entrySchemaValues[QC_MIXING_VISCOSITY_FORM_KEY],
    };
  }
  return {};
};

const syncSharedDetailsFields = (
  rows: QcMixingDetailsRow[],
  variant: QcMixingDetailsVariant,
): QcMixingDetailsRow[] => {
  if (!rows.length) return rows;
  const dateKey = DETAILS_DATE_KEY[variant];
  const shared = {
    BOWL_NO: rows[0].BOWL_NO ?? "",
    [dateKey]: (rows[0] as Record<string, unknown>)[dateKey] ?? "",
    MIXER_BLDG_NO: rows[0].MIXER_BLDG_NO ?? "",
    PREMIX_QTY: rows[0].PREMIX_QTY ?? "",
  };
  return rows.map((row) => ({
    ...row,
    ...shared,
    PARAMETER: row.PARAMETER,
    readonly: row.readonly ?? true,
  }));
};

const sanitizeDetailsRowsForVariant = (
  rows: QcMixingDetailsRow[],
  variant: QcMixingDetailsVariant,
) => {
  if (!rows.some(rowHasUserData)) return [];
  return syncSharedDetailsFields(rows, variant).map(({ readonly: _readonly, ...row }) => row);
};

const sanitizeViscosityRows = (rows: QcMixingViscosityRow[]) =>
  rows
    .filter((row) => hasValue(row.TIME) || hasValue(row.VISCOSITY_VALUE))
    .map((row, index) => ({
      TIME: String(row.TIME ?? "").trim(),
      VISCOSITY_VALUE: String(row.VISCOSITY_VALUE ?? "").trim(),
      SR_NO: row.SR_NO ?? index + 1,
    }));

export const buildMixingDetailsSectionPayload = (
  values: SchemaFormValues | null | undefined,
  variant: QcMixingDetailsVariant,
): SchemaSectionSubmission[] => {
  const rows = sanitizeDetailsRowsForVariant(
    getMixingDetailsRows(values, variant),
    variant,
  );
  if (!rows.length) return [];
  return [
    {
      sectionId: DETAILS_SECTION_ID[variant],
      sectionData: [
        {
          [DETAILS_TABLE_ID[variant]]: { rows },
        },
      ],
    },
  ];
};

export const buildViscositySectionPayload = (
  values: SchemaFormValues | null | undefined,
): SchemaSectionSubmission[] => {
  const rows = sanitizeViscosityRows(getViscosityRows(values));
  if (!rows.length) return [];
  return [
    {
      sectionId: QC_MIXING_VISCOSITY_SECTION_ID,
      sectionData: [
        {
          [QC_MIXING_VISCOSITY_TABLE_ID]: { rows },
        },
      ],
    },
  ];
};

export const hydrateMixingDetailsValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
  variant: QcMixingDetailsVariant,
): SchemaFormValues => {
  const section = (sections ?? []).find(
    (entry) => String(entry.sectionId ?? "").trim() === DETAILS_SECTION_ID[variant],
  );
  const rows = extractTableRows<QcMixingDetailsRow>(section?.sectionData, DETAILS_TABLE_ID[variant]);
  if (!rows.length) {
    return variant === "premix"
      ? createInitialPremixDetailsValues()
      : createInitialFinalMixDetailsValues();
  }
  return setMixingDetailsRows({}, variant, syncSharedDetailsFields(rows, variant));
};

export const hydrateViscosityValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
): SchemaFormValues => {
  const section = (sections ?? []).find(
    (entry) => String(entry.sectionId ?? "").trim() === QC_MIXING_VISCOSITY_SECTION_ID,
  );
  const rows = extractTableRows<QcMixingViscosityRow>(
    section?.sectionData,
    QC_MIXING_VISCOSITY_TABLE_ID,
  );
  if (!rows.length) return createInitialViscosityValues();
  return setViscosityRows({}, rows);
};

/** Domain API parameter row under premixDetails / finalMixDetails. */
export type QcMixingDomainParameter = {
  parameterId?: string;
  parameter: string;
  specification: string;
  value?: string;
  values?: string[];
  remarks?: string;
};

export type QcMixingDomainDetails = {
  premixSubmissionType?: "DRAFT" | "SUBMIT";
  bowlNo?: string;
  dateOfPremix?: string;
  dateOfFinalMix?: string;
  mixerBuildingNo?: string;
  premixQty?: string | number;
  parameters?: QcMixingDomainParameter[];
  viscosityBuildUp?: Array<Record<string, unknown>>;
};

const buildDomainParametersFromRows = (
  rows: QcMixingDetailsRow[],
  variant: QcMixingDetailsVariant,
): QcMixingDomainParameter[] => {
  const valueFields = getMixingValueFields(variant);
  return rows.map((row) => {
    const compactValues = valueFields.map((field) => String(row[field] ?? "").trim());
    while (compactValues.length && !compactValues[compactValues.length - 1]) {
      compactValues.pop();
    }
    const firstValue = compactValues.find((value) => value) ?? "";
    return {
      ...(pickString(row.PARAMETER_ID) ? { parameterId: pickString(row.PARAMETER_ID) } : {}),
      parameter: pickString(row.PARAMETER),
      specification: pickString(row.SPECIFICATION),
      value: firstValue,
      values: compactValues,
      remarks: pickString(row.REMARKS),
    };
  });
};

export const buildMixingDetailsDomainPayload = (
  values: SchemaFormValues | null | undefined,
  variant: QcMixingDetailsVariant,
): QcMixingDomainDetails | null => {
  const rows = sanitizeDetailsRowsForVariant(getMixingDetailsRows(values, variant), variant);
  if (!rows.length) return null;
  const first = rows[0];
  return {
    bowlNo: pickString(first.BOWL_NO),
    ...(variant === "premix"
      ? { dateOfPremix: pickString(first.DATE_OF_PREMIX) }
      : { dateOfFinalMix: pickString(first.DATE_OF_FINAL_MIX) }),
    mixerBuildingNo: pickString(first.MIXER_BLDG_NO),
    premixQty: pickString(first.PREMIX_QTY),
    parameters: buildDomainParametersFromRows(rows, variant),
  };
};

/** Build Mixing details object with submission type first (backend contract). */
const buildMixingDetailsWithSubmissionType = (
  details: QcMixingDomainDetails,
  submissionType?: "DRAFT" | "SUBMIT" | null,
): QcMixingDomainDetails => {
  const {
    premixSubmissionType: _ignored,
    bowlNo,
    dateOfPremix,
    dateOfFinalMix,
    mixerBuildingNo,
    premixQty,
    parameters,
    viscosityBuildUp,
  } = details;
  return {
    ...(submissionType ? { premixSubmissionType: submissionType } : {}),
    ...(bowlNo != null ? { bowlNo } : {}),
    ...(dateOfPremix != null ? { dateOfPremix } : {}),
    ...(dateOfFinalMix != null ? { dateOfFinalMix } : {}),
    ...(mixerBuildingNo != null ? { mixerBuildingNo } : {}),
    ...(premixQty != null ? { premixQty } : {}),
    parameters: parameters ?? [],
    ...(viscosityBuildUp != null ? { viscosityBuildUp } : {}),
  };
};

export const buildViscosityDomainPayload = (
  values: SchemaFormValues | null | undefined,
): Array<{ srNo: number; time: string; finalMix1: string }> =>
  sanitizeViscosityRows(getViscosityRows(values)).map((row, index) => ({
    srNo: Number(row.SR_NO) || index + 1,
    time: pickString(row.TIME),
    finalMix1: pickString(row.VISCOSITY_VALUE),
  }));

export const buildMixingPremixesPayload = (
  form: {
    divisionEntryValues?: Record<string, { schemaValues?: SchemaFormValues }>;
    mixingFinalMixDetailsValues?: SchemaFormValues;
  },
  entries: Array<{
    entryId: string;
    kind: string;
    premixNo?: number | null;
  }>,
  options?: { unitSubmissionType?: "DRAFT" | "SUBMIT" | null },
): Array<Record<string, unknown>> => {
  const byPremix = new Map<
    number,
    { premixEntryId?: string; finalMixEntryId?: string }
  >();

  entries.forEach((entry) => {
    const premixNo = Number(entry.premixNo);
    if (!Number.isFinite(premixNo) || premixNo <= 0) return;
    const bucket = byPremix.get(premixNo) ?? {};
    if (entry.kind === "MIXING_PREMIX") bucket.premixEntryId = entry.entryId;
    if (entry.kind === "MIXING_FINAL_MIX") bucket.finalMixEntryId = entry.entryId;
    byPremix.set(premixNo, bucket);
  });

  // Shared Final Mix details can exist without a viscosity entry yet.
  if (!byPremix.size && form.mixingFinalMixDetailsValues) {
    byPremix.set(1, {});
  }

  return Array.from(byPremix.entries())
    .sort(([a], [b]) => a - b)
    .map(([premixNo, bucket]) => {
      // RMP-style premix root: premixNo first; Mixing details live under premixDetails/finalMixDetails.
      const payload: Record<string, unknown> = { premixNo };
      const submissionType = options?.unitSubmissionType ?? null;

      if (bucket.premixEntryId) {
        const baseDetails =
          buildMixingDetailsDomainPayload(
            form.divisionEntryValues?.[bucket.premixEntryId]?.schemaValues,
            "premix",
          ) ?? {
            bowlNo: "",
            dateOfPremix: "",
            mixerBuildingNo: "",
            premixQty: "",
            parameters: [],
          };
        // Backend reads premixSubmissionType from inside premixDetails (not the premix root).
        payload.premixDetails = buildMixingDetailsWithSubmissionType(baseDetails, submissionType);
      }

      const entrySchemaValues = bucket.finalMixEntryId
        ? form.divisionEntryValues?.[bucket.finalMixEntryId]?.schemaValues
        : undefined;
      // Prefer per-unit Final Mix Details on the entry; shared form values are legacy fallback.
      const finalMixDetailsSource = pickFinalMixDetailsSchemaValues(
        entrySchemaValues,
        form.mixingFinalMixDetailsValues,
      );
      const perUnitFinalMixDetails = buildMixingDetailsDomainPayload(
        finalMixDetailsSource,
        "finalMix",
      );
      const viscosityBuildUp = entrySchemaValues
        ? buildViscosityDomainPayload(entrySchemaValues)
        : [];

      if (perUnitFinalMixDetails || viscosityBuildUp.length || bucket.finalMixEntryId) {
        const baseFinalMixDetails: QcMixingDomainDetails = {
          ...(perUnitFinalMixDetails ?? {
            bowlNo: "",
            dateOfFinalMix: "",
            mixerBuildingNo: "",
            premixQty: "",
            parameters: [],
          }),
          viscosityBuildUp,
        };
        // Final-mix unit saves also expect submission type nested under finalMixDetails.
        payload.finalMixDetails = buildMixingDetailsWithSubmissionType(
          baseFinalMixDetails,
          submissionType && bucket.finalMixEntryId && !bucket.premixEntryId
            ? submissionType
            : null,
        );
      }

      return payload;
    })
    .filter(
      (row) =>
        row.premixDetails != null ||
        row.finalMixDetails != null,
    );
};

const mapDomainParametersToRows = (
  parameters: unknown,
  variant: QcMixingDetailsVariant,
  shared: QcMixingDetailsSeed,
): QcMixingDetailsRow[] => {
  const list = asArray(parameters);
  const valueFields = getMixingValueFields(variant);
  if (!list.length) {
    return createInitialMixingDetailsRows(variant).map((row) => ({
      ...row,
      ...shared,
    }));
  }

  return list.map((item) => {
    const rec = asRecord(item) ?? {};
    const valuesFromArray = asArray(rec.values).map((value) => String(value ?? "").trim());
    const observations = asArray(rec.observations);
    const valuesFromObservations = observations.map((obs) => {
      if (typeof obs === "string" || typeof obs === "number") return String(obs);
      return pickString(asRecord(obs)?.value);
    });
    const singleValue = pickString(rec.value, rec.result);
    const resolvedValues =
      valuesFromArray.length > 0
        ? valuesFromArray
        : valuesFromObservations.length > 0
          ? valuesFromObservations
          : singleValue
            ? [singleValue]
            : [];

    const row: QcMixingDetailsRow = {
      ...shared,
      PARAMETER_ID: pickString(rec.parameterId, rec.specificationCode, rec.specCode),
      PARAMETER: pickString(rec.parameterName, rec.parameter, rec.specificationName),
      SPECIFICATION: formatSpecificationLabel(
        rec.specification ?? rec.referenceRange ?? rec.specs,
      ) || "NA",
      REMARKS: pickString(rec.remarks, rec.remark, rec.REMARKS),
      readonly: true,
    };
    valueFields.forEach((field, index) => {
      row[field] = resolvedValues[index] ?? "";
    });
    return row;
  });
};

export const hydrateMixingDetailsValuesFromDomain = (
  details: unknown,
  variant: QcMixingDetailsVariant,
): SchemaFormValues => {
  const rec = asRecord(details);
  if (!rec) {
    return variant === "premix"
      ? createInitialPremixDetailsValues()
      : createInitialFinalMixDetailsValues();
  }

  const shared: QcMixingDetailsSeed = {
    BOWL_NO: pickString(rec.bowlNo, rec.BOWL_NO),
    MIXER_BLDG_NO: pickString(rec.mixerBuildingNo, rec.MIXER_BLDG_NO),
    PREMIX_QTY: pickString(rec.premixQty, rec.PREMIX_QTY),
  };
  if (variant === "premix") {
    shared.DATE_OF_PREMIX = pickString(rec.dateOfPremix, rec.DATE_OF_PREMIX);
  } else {
    shared.DATE_OF_FINAL_MIX = pickString(rec.dateOfFinalMix, rec.DATE_OF_FINAL_MIX);
  }

  const rows = mapDomainParametersToRows(rec.parameters, variant, shared);
  return setMixingDetailsRows({}, variant, syncSharedDetailsFields(rows, variant));
};

export const hydrateViscosityValuesFromDomain = (
  viscosityBuildUp: unknown,
): SchemaFormValues => {
  const rows = asArray(viscosityBuildUp).map((item, index) => {
    const rec = asRecord(item) ?? {};
    return {
      SR_NO: pickNumber(rec.srNo, rec.SR_NO) ?? index + 1,
      TIME: pickString(rec.time, rec.TIME),
      VISCOSITY_VALUE: pickString(
        rec.finalMix1,
        rec.viscosityValue,
        rec.VISCOSITY_VALUE,
        rec.value,
      ),
    } satisfies QcMixingViscosityRow;
  });
  if (!rows.length) return createInitialViscosityValues();
  return setViscosityRows({}, rows);
};

export type HydratedMixingDivisionData = {
  premixEntries: Array<{ premixNo: number; values: SchemaFormValues }>;
  finalMixEntries: Array<{ premixNo: number; values: SchemaFormValues }>;
  finalMixDetailsValues?: SchemaFormValues;
};

/** Hydrate Mixing UI state from QC form `data.premixes[]` domain shape (or legacy sections). */
export const hydrateMixingDivisionFromFormData = (
  data: unknown,
): HydratedMixingDivisionData | null => {
  const root = asRecord(data);
  if (!root) return null;

  const premixes = asArray(root.premixes);
  if (premixes.length) {
    const premixEntries: HydratedMixingDivisionData["premixEntries"] = [];
    const finalMixEntries: HydratedMixingDivisionData["finalMixEntries"] = [];
    let finalMixDetailsValues: SchemaFormValues | undefined;

    premixes.forEach((item) => {
      const rec = asRecord(item);
      if (!rec) return;
      const premixNo = pickNumber(rec.premixNo, rec.finalMixNo, rec.mixNo);
      if (premixNo == null) return;

      const premixDetails = asRecord(rec.premixDetails);
      if (premixDetails) {
        premixEntries.push({
          premixNo,
          values: hydrateMixingDetailsValuesFromDomain(premixDetails, "premix"),
        });
      }

      const finalMixDetails = asRecord(rec.finalMixDetails);
      if (finalMixDetails) {
        const detailsValues = hydrateMixingDetailsValuesFromDomain(
          finalMixDetails,
          "finalMix",
        );
        if (!finalMixDetailsValues) {
          finalMixDetailsValues = detailsValues;
        }
        finalMixEntries.push({
          premixNo,
          values: mergeFinalMixEntrySchemaValues(
            detailsValues,
            hydrateViscosityValuesFromDomain(finalMixDetails.viscosityBuildUp),
          ),
        });
      }
    });

    if (premixEntries.length || finalMixEntries.length || finalMixDetailsValues) {
      return { premixEntries, finalMixEntries, finalMixDetailsValues };
    }
  }

  // Legacy schema-section shape fallback.
  const sections = asArray(root.sections) as SchemaSectionSubmission[];
  if (!sections.length) return null;

  const premixEntries: HydratedMixingDivisionData["premixEntries"] = [];
  const finalMixEntries: HydratedMixingDivisionData["finalMixEntries"] = [];
  const detailSections = sections.filter(
    (section) => String(section.sectionId ?? "") === DETAILS_SECTION_ID.finalMix,
  );
  const premixByNo = new Map<number, SchemaSectionSubmission[]>();
  const viscosityByNo = new Map<number, SchemaSectionSubmission[]>();

  sections.forEach((section) => {
    const premixNo = pickNumber((section as { premixNo?: number }).premixNo);
    if (premixNo == null) return;
    if (String(section.sectionId ?? "") === DETAILS_SECTION_ID.premix) {
      const list = premixByNo.get(premixNo) ?? [];
      list.push(section);
      premixByNo.set(premixNo, list);
    }
    if (String(section.sectionId ?? "") === QC_MIXING_VISCOSITY_SECTION_ID) {
      const list = viscosityByNo.get(premixNo) ?? [];
      list.push(section);
      viscosityByNo.set(premixNo, list);
    }
  });

  premixByNo.forEach((sectionList, premixNo) => {
    premixEntries.push({
      premixNo,
      values: hydrateMixingDetailsValuesFromSections(sectionList, "premix"),
    });
  });
  viscosityByNo.forEach((sectionList, premixNo) => {
    finalMixEntries.push({
      premixNo,
      values: hydrateViscosityValuesFromSections(sectionList),
    });
  });

  return {
    premixEntries,
    finalMixEntries,
    finalMixDetailsValues: detailSections.length
      ? hydrateMixingDetailsValuesFromSections(detailSections, "finalMix")
      : undefined,
  };
};

export const findMixingPremixDomainEntry = (
  data: unknown,
  premixNo: number,
): Record<string, unknown> | null => {
  const root = asRecord(data);
  const match = asArray(root?.premixes).find((item) => {
    const rec = asRecord(item);
    return pickNumber(rec?.premixNo, rec?.finalMixNo, rec?.mixNo) === premixNo;
  });
  return asRecord(match);
};

/**
 * QC /qc-division/details may split Mixing into separate PREMIX + FINAL_MIX divisionDetails.
 * Merge all Mixing premixes by premixNo so premixDetails + finalMixDetails are available together.
 */
export const resolveMixingQcFormData = (formDetails: unknown): Record<string, unknown> | null => {
  const root = asRecord(formDetails);
  if (!root) return null;

  if (asArray(root.premixes).length) return root;
  const nested = asRecord(root.data);
  if (nested && asArray(nested.premixes).length) return nested;

  const byPremix = new Map<number, Record<string, unknown>>();
  for (const detail of asArray(root.divisionDetails)) {
    const rec = asRecord(detail);
    if (!rec) continue;
    const division = String(rec.division ?? "")
      .trim()
      .toUpperCase();
    if (division !== "MIXING") continue;
    const data = asRecord(rec.data) ?? rec;
    for (const item of asArray(data.premixes)) {
      const premix = asRecord(item);
      if (!premix) continue;
      const premixNo = pickNumber(premix.premixNo, premix.finalMixNo, premix.mixNo);
      if (premixNo == null) continue;
      const existing = byPremix.get(premixNo) ?? { premixNo };
      if (premix.premixDetails != null) existing.premixDetails = premix.premixDetails;
      if (premix.finalMixDetails != null) existing.finalMixDetails = premix.finalMixDetails;
      byPremix.set(premixNo, existing);
    }
  }

  if (!byPremix.size) return null;
  return {
    premixes: Array.from(byPremix.values()).sort(
      (a, b) => Number(a.premixNo) - Number(b.premixNo),
    ),
  };
};

/** @deprecated Schema no longer required — use createInitialPremixDetailsValues */
export const createMixingFinalMixViscosityValues = () => createInitialViscosityValues();

/** @deprecated Schema no longer required — use createInitialFinalMixDetailsValues */
export const createMixingFinalMixDetailsValues = () => createInitialFinalMixDetailsValues();
