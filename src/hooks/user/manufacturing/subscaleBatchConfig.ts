import type { SchemaFormValues } from "../../../schema-engine";
import {
  ARTICLE_TYPE_TABLE_ID,
  createDefaultHardwareValues,
  HARDWARE_COUNT_FIELDS,
  LINER_TYPE_FIELD,
  mergeHardwareFormValues,
} from "./subscaleHardwareConfig";

export const SUBSCALE_BATCH_SETUP_SECTION_ID = "SUBSCALE_BATCH_SETUP";

export const SUBSCALE_BATCH_FIELDS = {
  BATCH_SIZE: "BATCH_SIZE",
  MIXER_BLDG_NO: "MIXER_BLDG_NO",
  PREMIX_DATE: "PREMIX_DATE",
  FINAL_MIX_DATE: "FINAL_MIX_DATE",
  MIXING_CYCLES: "SUBSCALE_MIXING_CYCLES",
} as const;

export const SUBSCALE_MIXER_BLDG_OPTIONS = [
  "MY60-14C",
  "MY120-14A",
  "MY120-14B",
  "14FMY300",
] as const;

export type ProcessParticularRow = {
  operationId: number;
  operation: string;
  rpm: string;
  time: string;
  temp: string;
  vacuum: string;
};

// Backward-compatible alias
export type SubscaleProcessParticularRow = ProcessParticularRow;

export type SubscaleMixingCycleEntry = {
  _key: string;
  stage: string;
  mixingCycleCode: string;
  mixingCycleName: string;
  mixingCycleId?: number | null;
  processParticulars?: ProcessParticularRow[]; // Fallback field
  premixParticulars: ProcessParticularRow[];
  finalMixParticulars: ProcessParticularRow[];
};

export const createSubscaleMixingCycleEntry = (index: number): SubscaleMixingCycleEntry => ({
  _key: `mixing-cycle-${index}`,
  stage: "",
  mixingCycleCode: "",
  mixingCycleName: "",
  mixingCycleId: null,
  premixParticulars: [],
  finalMixParticulars: [],
});

/**
 * Extracts operations from API payload containing nested `cycles` structure.
 */
export const resolveMixingCycleOperations = (data: any) => {
  const cycles = data?.cycles || data;
  return {
    premixOperations: (cycles?.premixOperations || []) as Array<{
      operationId: number;
      operationName: string;
      sequenceNo?: number;
    }>,
    finalMixOperations: (cycles?.finalMixOperations || []) as Array<{
      operationId: number;
      operationName: string;
      sequenceNo?: number;
    }>,
  };
};

/**
 * Merges newly fetched operation names with existing row values (rpm, time, temp, vacuum)
 */
export const mergeProcessParticularsWithOperations = (
  operations: Array<{ operationId: number; operationName?: string; sequenceNo?: number }>,
  existingRows: ProcessParticularRow[] = [],
): ProcessParticularRow[] => {
  if (!operations.length) {
    return existingRows;
  }

  return operations.map((op) => {
    const existing = existingRows.find((r) => r.operationId === op.operationId);
    return {
      operationId: op.operationId,
      operation: op.operationName || existing?.operation || "",
      rpm: existing?.rpm || "",
      time: existing?.time || "",
      temp: existing?.temp || "",
      vacuum: existing?.vacuum || "",
    };
  });
};

/**
 * Normalizes input structure to guarantee `premixParticulars` and `finalMixParticulars` arrays exist.
 */
export const normalizeSubscaleMixingCycles = (cycles: unknown): SubscaleMixingCycleEntry[] => {
  if (!Array.isArray(cycles) || cycles.length === 0) {
    return [createSubscaleMixingCycleEntry(1)];
  }

  // API allows only one mixing cycle per subscale form.
  const entry = (cycles[0] ?? {}) as Partial<SubscaleMixingCycleEntry> & Record<string, unknown>;
  const stage = String(entry.stage ?? "");
  const mixingCycleCode = String(entry.mixingCycleCode ?? entry.cycleCode ?? "").trim();
  const mixingCycleName = String(entry.mixingCycleName ?? entry.cycleName ?? "").trim();
  const mixingCycleIdRaw = entry.mixingCycleId ?? entry.cycleId;
  const mixingCycleId =
    mixingCycleIdRaw === null || mixingCycleIdRaw === undefined || mixingCycleIdRaw === ""
      ? null
      : Number(mixingCycleIdRaw);

  const premix = Array.isArray(entry.premixParticulars)
    ? entry.premixParticulars
    : Array.isArray(entry.processParticulars)
      ? entry.processParticulars
      : [];

  const finalMix = Array.isArray(entry.finalMixParticulars) ? entry.finalMixParticulars : [];

  return [
    {
      _key: String(entry._key ?? "mixing-cycle-1"),
      stage,
      mixingCycleCode,
      mixingCycleName,
      mixingCycleId: Number.isFinite(mixingCycleId as number) ? (mixingCycleId as number) : null,
      premixParticulars: premix,
      finalMixParticulars: finalMix,
      processParticulars: premix,
    },
  ];
};

export const createDefaultSubscaleBatchValues = (): SchemaFormValues => ({
  [SUBSCALE_BATCH_FIELDS.BATCH_SIZE]: "",
  [SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO]: "",
  [SUBSCALE_BATCH_FIELDS.PREMIX_DATE]: "",
  [SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE]: "",
  [SUBSCALE_BATCH_FIELDS.MIXING_CYCLES]: [createSubscaleMixingCycleEntry(1)],
  ...createDefaultHardwareValues(),
});

export const mergeSubscaleBatchFormValues = (values: SchemaFormValues): SchemaFormValues => {
  if (values.IS_PROCESS_FORM_LOADED) {
    return values;
  }

  return mergeHardwareFormValues({
    ...createDefaultSubscaleBatchValues(),
    ...values,
    [SUBSCALE_BATCH_FIELDS.MIXING_CYCLES]: normalizeSubscaleMixingCycles(
      values[SUBSCALE_BATCH_FIELDS.MIXING_CYCLES],
    ),
  });
};

export const isSubscaleBatchFieldFilled = (fieldId: string, value: unknown) => {
  if (
    fieldId === SUBSCALE_BATCH_FIELDS.BATCH_SIZE ||
    fieldId === SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO ||
    fieldId === SUBSCALE_BATCH_FIELDS.PREMIX_DATE ||
    fieldId === SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE
  ) {
    return String(value ?? "").trim().length > 0;
  }
  return false;
};

export const isSubscaleGeneralBatchComplete = (values: SchemaFormValues) =>
  isSubscaleBatchFieldFilled(
    SUBSCALE_BATCH_FIELDS.BATCH_SIZE,
    values[SUBSCALE_BATCH_FIELDS.BATCH_SIZE],
  ) &&
  isSubscaleBatchFieldFilled(
    SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO,
    values[SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO],
  ) &&
  isSubscaleBatchFieldFilled(
    SUBSCALE_BATCH_FIELDS.PREMIX_DATE,
    values[SUBSCALE_BATCH_FIELDS.PREMIX_DATE],
  ) &&
  isSubscaleBatchFieldFilled(
    SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE,
    values[SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE],
  ) &&
  normalizeSubscaleMixingCycles(values[SUBSCALE_BATCH_FIELDS.MIXING_CYCLES]).every(
    (cycle) =>
      String(cycle.stage ?? "").trim().length > 0 &&
      (String(cycle.mixingCycleCode ?? "").trim().length > 0 ||
        cycle.premixParticulars.length > 0 ||
        cycle.finalMixParticulars.length > 0),
  );
