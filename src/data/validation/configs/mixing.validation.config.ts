import { STRINGS } from "@/app/config/strings";
import type { FinalMixEntry, PremixEntry } from "@/data/models/user/MixingFormModel";
import { validateFieldState } from "../fieldValidators";
import type { SubDeptValidationConfig } from "../runValidation";
import type { ValidationTier } from "../submissionIntent";

const M = STRINGS.MANUFACTURING.MIXING.VALIDATION;

export const mixingFieldRules = {
  bowlId: {
    valueType: "text" as const,
    pattern: undefined,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: M.BOWL_ID_REQUIRED, invalid: M.BOWL_ID_INVALID },
  },
  bowlTrialDate: {
    valueType: "date" as const,
    pattern: undefined,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: M.BOWL_TRIAL_DATE_REQUIRED, invalid: M.BOWL_TRIAL_DATE_INVALID },
  },
  bowlTrialObservations: {
    valueType: "text" as const,
    pattern: undefined,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: M.BOWL_TRIAL_OBS_REQUIRED, invalid: M.BOWL_TRIAL_OBS_INVALID },
  },
  // process particulars
  operation: {
    valueType: "text" as const,
    pattern: undefined,
    requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
    messages: { required: M.OPERATION_REQUIRED, invalid: M.OPERATION_INVALID },
  },
  rpm: {
    valueType: "number" as const,
    pattern: undefined,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.RPM_REQUIRED, invalid: M.RPM_INVALID },
  },
  time: {
    valueType: "number" as const,
    pattern: undefined,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.TIME_REQUIRED, invalid: M.TIME_INVALID },
  },
  temp: {
    valueType: "number" as const,
    pattern: undefined,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.TEMP_REQUIRED, invalid: M.TEMP_INVALID },
  },
  vacuum: {
    valueType: "number" as const,
    pattern: undefined,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.VACUUM_REQUIRED, invalid: M.VACUUM_INVALID },
  },
  qualityChecks: {
    valueType: "file" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.QUALITY_CHECKS_REQUIRED, invalid: M.QUALITY_CHECKS_INVALID },
  },
  observedValue: {
    valueType: "number" as const,
    requiredIn: ["SUBMIT"] as ValidationTier[],
    messages: { required: M.OBSERVED_VALUE_REQUIRED, invalid: M.OBSERVED_VALUE_INVALID },
  },
};

type MixingData = {
  premixes?: PremixEntry[];
  finalMixes?: FinalMixEntry[];
};

function resolveFieldPaths(data: MixingData) {
  const paths: Array<{ path: string; value: unknown; ruleKey: string }> = [];

  (data.premixes ?? []).forEach((p, i) => {
    paths.push({ path: `premixes.${i}.bowlId`, value: p.bowlId, ruleKey: "bowlId" });
    paths.push({
      path: `premixes.${i}.bowlTrialDate`,
      value: p.bowlTrialDate,
      ruleKey: "bowlTrialDate",
    });
    paths.push({
      path: `premixes.${i}.bowlTrialObservations`,
      value: p.bowlTrialObservations,
      ruleKey: "bowlTrialObservations",
    });

    (p.processParticulars ?? []).forEach((row, r) => {
      paths.push({
        path: `premixes.${i}.processParticulars.${r}.operation`,
        value: row.operation,
        ruleKey: "operation",
      });
      paths.push({
        path: `premixes.${i}.processParticulars.${r}.rpm`,
        value: row.rpm,
        ruleKey: "rpm",
      });
      paths.push({
        path: `premixes.${i}.processParticulars.${r}.time`,
        value: row.time,
        ruleKey: "time",
      });
      paths.push({
        path: `premixes.${i}.processParticulars.${r}.temp`,
        value: row.temp,
        ruleKey: "temp",
      });
      paths.push({
        path: `premixes.${i}.processParticulars.${r}.vacuum`,
        value: row.vacuum,
        ruleKey: "vacuum",
      });
    });

    (p.qualityChecks ?? []).forEach((qc, q) => {
      (qc.observedValues ?? []).forEach((ov, o) => {
        paths.push({
          path: `premixes.${i}.qualityChecks.${q}.observedValues.${o}`,
          value: ov,
          ruleKey: "observedValue",
        });
      });
    });
  });

  (data.finalMixes ?? []).forEach((p, i) => {
    paths.push({ path: `finalMixes.${i}.bowlId`, value: p.bowlId, ruleKey: "bowlId" });
    (p.processParticulars ?? []).forEach((row, r) => {
      paths.push({
        path: `finalMixes.${i}.processParticulars.${r}.operation`,
        value: row.operation,
        ruleKey: "operation",
      });
      paths.push({
        path: `finalMixes.${i}.processParticulars.${r}.rpm`,
        value: row.rpm,
        ruleKey: "rpm",
      });
      paths.push({
        path: `finalMixes.${i}.processParticulars.${r}.time`,
        value: row.time,
        ruleKey: "time",
      });
      paths.push({
        path: `finalMixes.${i}.processParticulars.${r}.temp`,
        value: row.temp,
        ruleKey: "temp",
      });
      paths.push({
        path: `finalMixes.${i}.processParticulars.${r}.vacuum`,
        value: row.vacuum,
        ruleKey: "vacuum",
      });
    });

    (p.qualityChecks ?? []).forEach((qc, q) => {
      (qc.observedValues ?? []).forEach((ov, o) => {
        paths.push({
          path: `finalMixes.${i}.qualityChecks.${q}.observedValues.${o}`,
          value: ov,
          ruleKey: "observedValue",
        });
      });
    });
  });

  return paths;
}

export const mixingValidationConfig: SubDeptValidationConfig<MixingData> = {
  id: "mixing",
  fields: mixingFieldRules as any,
  resolveFieldPaths,
  customRules: [
    (data: MixingData, tier: string, errors: Record<string, string>) => {
      const isSubmit = tier === "SUBMIT";

      const checkQualityRows = (prefix: string, qRows: any[] | undefined) => {
        if (!qRows || !qRows.length) {
          if (isSubmit) errors[`${prefix}`] = mixingFieldRules.qualityChecks.messages.required;
          return;
        }

        qRows.forEach((row, qIdx) => {
          const spec = row.specification;
          let min: number | undefined;
          let max: number | undefined;
          if (spec && typeof spec === "object") {
            const minVal = Number((spec as any).minValue);
            const maxVal = Number((spec as any).maxValue);
            if (
              !Number.isNaN(minVal) &&
              (spec as any).minValue !== null &&
              (spec as any).minValue !== undefined
            ) {
              min = minVal;
            }
            if (
              !Number.isNaN(maxVal) &&
              (spec as any).maxValue !== null &&
              (spec as any).maxValue !== undefined
            ) {
              max = maxVal;
            }
          }

          const values = row.observedValues ?? [];
          const sampleCount = Math.max(1, Number(row.noOfSamples) || values.length || 1);

          for (let o = 0; o < sampleCount; o++) {
            const val = values[o];
            const path = `${prefix}.qualityChecks.${qIdx}.observedValues.${o}`;
            if (isSubmit) {
              if (val === undefined || val === null || String(val).trim() === "") {
                errors[path] = mixingFieldRules.observedValue.messages.required;
                continue;
              }
            } else {
              // FORMAT/UNIT: skip empty
              if (val === undefined || val === null || String(val).trim() === "") continue;
            }

            const num = Number(val);
            if (Number.isNaN(num)) {
              errors[path] = mixingFieldRules.observedValue.messages.invalid;
              continue;
            }
            if (min !== undefined && max !== undefined) {
              if (num < min || num > max) {
                errors[path] = M.OBSERVED_VALUE_RANGE.replace("{min}", String(min)).replace(
                  "{max}",
                  String(max),
                );
              }
            } else if (min !== undefined && num < min) {
              errors[path] = M.OBSERVED_VALUE_MIN.replace("{min}", String(min));
            } else if (max !== undefined && num > max) {
              errors[path] = M.OBSERVED_VALUE_MAX.replace("{max}", String(max));
            }
          }
        });
      };

      // premixes
      (data.premixes ?? []).forEach((p, i) => {
        checkQualityRows(`premixes.${i}`, p.qualityChecks);
      });

      // final mixes
      (data.finalMixes ?? []).forEach((p, i) => {
        checkQualityRows(`finalMixes.${i}`, p.qualityChecks);
      });
    },
  ],
};

export default mixingValidationConfig;
