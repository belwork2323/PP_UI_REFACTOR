import type { SchemaFormValues } from "../../../schema-engine";
import { createProcessParticularRows } from "./mixingConfig";
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

export const SUBSCALE_MIXER_BLDG_OPTIONS = ["MY60-14C", "MY120-14A", "MY120-14B", "14FMY300"] as const;

export type SubscaleProcessParticularRow = {
  id: number;
  operation: string;
  rpm: string;
  time: string;
  temp: string;
  vacuum: string;
};

export type SubscaleMixingCycleEntry = {
  _key: string;
  stage: string;
  processParticulars: SubscaleProcessParticularRow[];
};

export const SUBSCALE_MOTOR_STAGE_OPTIONS = [
  { value: "A", label: "Stage A", operations: ["Charging", "Premixing", "Mixing", "Sampling"] },
  { value: "B", label: "Stage B", operations: ["Charging", "Mixing", "Sampling"] },
  { value: "C", label: "Stage C", operations: ["Charging", "Mixing"] },
  { value: "D", label: "Stage D", operations: ["Charging", "Final Mixing", "Sampling"] },
] as const;

export const getSubscaleMixingStage = (value: string) =>
  SUBSCALE_MOTOR_STAGE_OPTIONS.find((option) => option.value === value) ?? null;

export const createSubscaleMixingCycleEntry = (index: number): SubscaleMixingCycleEntry => ({
  _key: `mixing-cycle-${index}`,
  stage: "",
  processParticulars: [],
});

export const buildSubscaleProcessParticulars = (stage: string): SubscaleProcessParticularRow[] => {
  const config = getSubscaleMixingStage(stage);
  if (!config) return [];
  return createProcessParticularRows([...config.operations]);
};

export const normalizeSubscaleMixingCycles = (
  cycles: unknown,
): SubscaleMixingCycleEntry[] => {
  if (!Array.isArray(cycles)) return [createSubscaleMixingCycleEntry(1)];

  return cycles.map((entry, index) => {
    const row = (entry ?? {}) as Partial<SubscaleMixingCycleEntry>;
    const stage = String(row.stage ?? "");
    const particulars = Array.isArray(row.processParticulars)
      ? (row.processParticulars as SubscaleProcessParticularRow[])
      : buildSubscaleProcessParticulars(stage);

    return {
      _key: String(row._key ?? `mixing-cycle-${index + 1}`),
      stage,
      processParticulars: particulars,
    };
  });
};

export const createDefaultSubscaleBatchValues = (): SchemaFormValues => ({
  [SUBSCALE_BATCH_FIELDS.BATCH_SIZE]: "",
  [SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO]: "",
  [SUBSCALE_BATCH_FIELDS.PREMIX_DATE]: "",
  [SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE]: "",
  [SUBSCALE_BATCH_FIELDS.MIXING_CYCLES]: [createSubscaleMixingCycleEntry(1)],
  ...createDefaultHardwareValues(),
});

export const mergeSubscaleBatchFormValues = (values: SchemaFormValues): SchemaFormValues =>
  mergeHardwareFormValues({
    ...createDefaultSubscaleBatchValues(),
    ...values,
    [SUBSCALE_BATCH_FIELDS.MIXING_CYCLES]: normalizeSubscaleMixingCycles(
      values[SUBSCALE_BATCH_FIELDS.MIXING_CYCLES],
    ),
  });

export const isSubscaleBatchFieldFilled = (fieldId: string, value: unknown) => {
  if (fieldId === SUBSCALE_BATCH_FIELDS.BATCH_SIZE) {
    return String(value ?? "").trim().length > 0;
  }
  if (fieldId === SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO) {
    return String(value ?? "").trim().length > 0;
  }
  if (fieldId === SUBSCALE_BATCH_FIELDS.PREMIX_DATE || fieldId === SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE) {
    return String(value ?? "").trim().length > 0;
  }
  return false;
};

export const isSubscaleGeneralBatchComplete = (values: SchemaFormValues) =>
  isSubscaleBatchFieldFilled(SUBSCALE_BATCH_FIELDS.BATCH_SIZE, values[SUBSCALE_BATCH_FIELDS.BATCH_SIZE]) &&
  isSubscaleBatchFieldFilled(SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO, values[SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO]) &&
  isSubscaleBatchFieldFilled(SUBSCALE_BATCH_FIELDS.PREMIX_DATE, values[SUBSCALE_BATCH_FIELDS.PREMIX_DATE]) &&
  isSubscaleBatchFieldFilled(SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE, values[SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE]) &&
  normalizeSubscaleMixingCycles(values[SUBSCALE_BATCH_FIELDS.MIXING_CYCLES]).every(
    (cycle) => cycle.stage && cycle.processParticulars.length > 0,
  );
