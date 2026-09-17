import { runValidation } from "../runValidation";
import type { ValidationTier, ValidationErrors } from "../submissionIntent";
import subscaleHardwareValidationConfig from "../configs/subscale.validation.config";
import { firstValidationErrorWithPath } from "../validationErrors";

const SUBSCALE_FIELD_LABELS: Record<string, string> = {
  NO_OF_40KG_BEMS: "No. of 40kg BEMs",
  NO_OF_10KG_BEMS: "No. of 10kg BEMs",
  NO_OF_2KG_BEMS: "No. of 2kg BEMs",
  NO_OF_WHEEL_PEEL: "No. of Wheel Peel",
  NO_OF_SBS_TBS: "No. of SBS/TBS",
  NO_OF_CARTOONS: "No. of Cartoons",
  LINER_TYPE: "Liner Type",
  LINER_BATCH_NO: "Liner Batch No.",
  LINER_BATCH_DATE: "Liner Batch Date",
  PREMIX_DATE: "Premix Date",
  FINAL_MIX_DATE: "Final Mix Date",
  DATE_OF_CASTING: "Date of Casting",
  IR_BATCH_NO: "IR Batch No.",
  DATE_OF_MFG: "Date of Mfg",
  ARTICLE_TYPE: "Article Type",
  RUBBER_MATERIAL: "Rubber Material",
  SLEEVE_NO: "Sleeve No.",
  MOULD_NO: "Mould No.",
  BEM_MOULD_NO: "BEM Mould No.",
  BEM_NO: "BEM No.",
  DATE_OF_NDT: "Date of NDT",
  VACUUM_LEVEL: "Vacuum Level",
  rpm: "RPM",
  time: "Time",
  temp: "Temperature",
  vacuum: "Vacuum",
  stage: "Motor Stage",
  mixingCycleCode: "Mixing Cycle",
};

const TABLE_SECTION_LABELS: Record<string, string> = {
  ARTICLE_TYPE_TABLE: "Article Type",
  CASTING_TABLE: "Casting",
  CURING_TABLE: "Curing",
  NDT_TABLE: "NDT",
  TRIMMING_TABLE: "Trimming",
  INHIBITION_TABLE: "Inhibition",
  STATIC_TESTING_TABLE: "Static Testing",
  MECHANICAL_PROPERTIES_TABLE: "Mechanical Properties",
};

export function formatSubscaleValidationPath(path: string): string {
  const trimmed = String(path ?? "").trim();
  if (!trimmed) return "";
  if (SUBSCALE_FIELD_LABELS[trimmed]) return SUBSCALE_FIELD_LABELS[trimmed];

  const mixingMatch = trimmed.match(
    /^SUBSCALE_MIXING_CYCLES\.(\d+)\.(premixParticulars|finalMixParticulars)\.(\d+)\.(\w+)$/,
  );
  if (mixingMatch) {
    const cycle = Number(mixingMatch[1]) + 1;
    const section = mixingMatch[2] === "premixParticulars" ? "Premix" : "Final mix";
    const row = Number(mixingMatch[3]) + 1;
    const leaf = SUBSCALE_FIELD_LABELS[mixingMatch[4]] ?? mixingMatch[4];
    return `Mixing cycle ${cycle} · ${section} row ${row} · ${leaf}`;
  }

  const cycleFieldMatch = trimmed.match(/^SUBSCALE_MIXING_CYCLES\.(\d+)\.(\w+)$/);
  if (cycleFieldMatch) {
    const cycle = Number(cycleFieldMatch[1]) + 1;
    const leaf = SUBSCALE_FIELD_LABELS[cycleFieldMatch[2]] ?? cycleFieldMatch[2];
    return `Mixing cycle ${cycle} · ${leaf}`;
  }

  const tableMatch = trimmed.match(/^([A-Z_]+_TABLE)\.(\d+)\.(\w+)$/);
  if (tableMatch) {
    const section = TABLE_SECTION_LABELS[tableMatch[1]] ?? tableMatch[1];
    const row = Number(tableMatch[2]) + 1;
    const leaf = SUBSCALE_FIELD_LABELS[tableMatch[3]] ?? tableMatch[3];
    return `${section} row ${row} · ${leaf}`;
  }

  const parts = trimmed.split(".");
  const leaf = parts[parts.length - 1] ?? trimmed;
  return SUBSCALE_FIELD_LABELS[leaf] ?? leaf;
}

export function firstSubscaleValidationError(errors: ValidationErrors): string | undefined {
  return firstValidationErrorWithPath(errors, formatSubscaleValidationPath);
}

export function validateSubscale(data: unknown, tier: ValidationTier): ValidationErrors {
  return runValidation(data as any, tier, subscaleHardwareValidationConfig);
}

export default validateSubscale;
