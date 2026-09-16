import { flattenValidationErrorTree } from "@/utils/flattenValidationErrorTree";

type RemapRule = {
  pattern: RegExp;
  to: string | ((match: RegExpMatchArray) => string);
};

const applyRules = (path: string, rules: RemapRule[]): string | null => {
  for (const rule of rules) {
    const match = path.match(rule.pattern);
    if (!match) continue;
    return typeof rule.to === "function" ? rule.to(match) : path.replace(rule.pattern, rule.to);
  }
  return null;
};

const LOOSE_FLAP_RULES: RemapRule[] = [
  {
    pattern: /^looseFlapFillingDetails\.bellowRemovalDetails\.(\d+)\.(.+)$/,
    to: "bellowRemovalDetails.bellowRemovalTable.$1.$2",
  },
  {
    pattern: /^looseFlapFillingDetails\.epoxyPreparationIngredients\.batchNo$/,
    to: "looseFlapEpoxyPreparation.epoxyBatchNo",
  },
  {
    pattern: /^looseFlapFillingDetails\.epoxyPreparationIngredients\.preparationDate$/,
    to: "looseFlapEpoxyPreparation.epoxyPreparationDate",
  },
  {
    pattern: /^looseFlapFillingDetails\.epoxyPreparationIngredients\.parameters\.(\d+)\.quantityTaken$/,
    to: "looseFlapEpoxyPreparation.preparationDetails.$1.quantity",
  },
  {
    pattern: /^looseFlapFillingDetails\.epoxyPreparationIngredients\.parameters\.(\d+)\.(.+)$/,
    to: "looseFlapEpoxyPreparation.preparationDetails.$1.$2",
  },
  {
    pattern: /^looseFlapFillingDetails\.qualificationDetails\.batchNo$/,
    to: "qualificationDetails.qualificationBatchNo",
  },
  {
    pattern: /^looseFlapFillingDetails\.qualificationDetails\.preparationDate$/,
    to: "qualificationDetails.qualificationPreparationDate",
  },
  {
    pattern: /^looseFlapFillingDetails\.qualificationDetails\.qcReport$/,
    to: "qualificationDetails.qualificationQcReport",
  },
  {
    pattern: /^looseFlapFillingDetails\.qualificationDetails\.parameters\.(\d+)\.(.+)$/,
    to: "qualificationDetails.qualificationTable.$1.$2",
  },
  {
    pattern: /^looseFlapFillingDetails\.fillingDetails\.(\d+)\.quantityFilled$/,
    to: "lfEpoxyFillingDetails.lfFillingTable.$1.qtyFilled",
  },
  {
    pattern: /^looseFlapFillingDetails\.fillingDetails\.(\d+)\.(.+)$/,
    to: "lfEpoxyFillingDetails.lfFillingTable.$1.$2",
  },
  {
    pattern: /^looseFlapFillingDetails$/,
    to: "looseFlapFillingDetails",
  },
];

const inhibitionRulesForType = (inhibitorType?: string): RemapRule[] => {
  const isHemcoat = String(inhibitorType ?? "")
    .trim()
    .toUpperCase()
    .includes("HEMCOAT");

  const premixPrefix = isHemcoat ? "hemcoat3kPreparation" : "ir1Premix";
  const premixBatch = isHemcoat ? "hemcoatPremixBatchNo" : "ir1PremixBatchNo";
  const premixDate = isHemcoat ? "hemcoatPremixDate" : "ir1PremixDate";
  const premixTable = isHemcoat ? "premixPreparationTable" : "ir1PremixTable";

  const finalPrefix = isHemcoat ? "hemcoat3kFinalMix" : "ir1FinalMix";
  const finalBatch = isHemcoat ? "hemcoatFinalMixBatchNo" : "ir1FinalMixBatchNo";
  const finalDate = isHemcoat ? "hemcoatFinalMixDate" : "ir1FinalMixDate";
  const finalTable = isHemcoat ? "finalMixTable" : "ir1FinalMixTable";

  const qualPrefix = isHemcoat ? "hemcoat3kQualification" : "ir1Qualification";

  return [
    {
      pattern: /^inhibitionDetails\.premixDetails\.batchNo$/,
      to: `${premixPrefix}.${premixBatch}`,
    },
    {
      pattern: /^inhibitionDetails\.premixDetails\.preparationDate$/,
      to: `${premixPrefix}.${premixDate}`,
    },
    {
      pattern: /^inhibitionDetails\.premixDetails\.ingredients\.(\d+)\.quantityTaken$/,
      to: `${premixPrefix}.${premixTable}.$1.qtyTaken`,
    },
    {
      pattern: /^inhibitionDetails\.premixDetails\.ingredients\.(\d+)\.(.+)$/,
      to: `${premixPrefix}.${premixTable}.$1.$2`,
    },
    {
      pattern: /^inhibitionDetails\.finalMixDetails\.batchNo$/,
      to: `${finalPrefix}.${finalBatch}`,
    },
    {
      pattern: /^inhibitionDetails\.finalMixDetails\.preparationDate$/,
      to: `${finalPrefix}.${finalDate}`,
    },
    {
      pattern: /^inhibitionDetails\.finalMixDetails\.ingredients\.(\d+)\.quantityTaken$/,
      to: `${finalPrefix}.${finalTable}.$1.qtyTaken`,
    },
    {
      pattern: /^inhibitionDetails\.finalMixDetails\.ingredients\.(\d+)\.(.+)$/,
      to: `${finalPrefix}.${finalTable}.$1.$2`,
    },
    {
      pattern: /^inhibitionDetails\.qualificationDetails\.batchNo$/,
      to: `${qualPrefix}.qualificationBatchNo`,
    },
    {
      pattern: /^inhibitionDetails\.qualificationDetails\.preparationDate$/,
      to: `${qualPrefix}.qualificationPreparationDate`,
    },
    {
      pattern: /^inhibitionDetails\.qualificationDetails\.qcReport$/,
      to: `${qualPrefix}.qualificationQcReport`,
    },
    {
      pattern: /^inhibitionDetails\.qualificationDetails\.parameters\.(\d+)\.(.+)$/,
      to: `${qualPrefix}.qualificationTable.$1.$2`,
    },
    {
      pattern: /^inhibitionDetails\.inhibitorBatchDetails\.batchNo$/,
      to: "inhibitionBatchDetails.inhibitorBatchNo",
    },
    {
      pattern: /^inhibitionDetails\.inhibitorBatchDetails\.batchSize$/,
      to: "inhibitionBatchDetails.inhibitorBatchSize",
    },
    {
      pattern: /^inhibitionDetails\.applicationDetails\.(\d+)\.quantityApplied$/,
      to: "inhibitionApplicationDetails.inhibitionApplicationTable.$1.qtyApplied",
    },
    {
      pattern: /^inhibitionDetails\.applicationDetails\.(\d+)\.(.+)$/,
      to: "inhibitionApplicationDetails.inhibitionApplicationTable.$1.$2",
    },
    {
      pattern: /^inhibitionDetails\.dispatchDetails\.dispatchDate$/,
      to: "dispatchDetails.dispatchDate",
    },
    {
      pattern: /^inhibitionDetails\.dispatchDetails\.dispatchStation$/,
      to: "dispatchDetails.dispatchStation",
    },
    {
      pattern: /^inhibitionDetails\.notApplicableRemarks$/,
      to: "inhibitionNotApplicable.remarks",
    },
    {
      pattern: /^inhibitionDetails$/,
      to: "inhibitionDetails",
    },
    {
      pattern: /^inhibitorType$/,
      to: "inhibitorType",
    },
  ];
};

const remapMotorRelativePath = (apiPath: string, inhibitorType?: string): string => {
  const loose = applyRules(apiPath, LOOSE_FLAP_RULES);
  if (loose) return loose;
  const inhibition = applyRules(apiPath, inhibitionRulesForType(inhibitorType));
  if (inhibition) return inhibition;
  return apiPath;
};

export type MapPostCureApiErrorsOptions = {
  /** Index under `motors[]` in the failed request (usually 0 for single-motor save). */
  motorIndex?: number;
  inhibitorType?: string | null;
};

/**
 * Maps Post Cure API `errorDetails` onto UI `validationErrors` keys used by PostCureMotorPanel.
 */
export function mapPostCureApiErrorsToUi(
  errorDetails: unknown,
  options: MapPostCureApiErrorsOptions = {},
): Record<string, string> {
  if (!errorDetails) return {};

  const flat = flattenValidationErrorTree(errorDetails);
  const motorIndex = options.motorIndex ?? 0;
  const motorPrefix = `motors.${motorIndex}.`;
  const result: Record<string, string> = {};

  for (const [apiPath, message] of Object.entries(flat)) {
    let relative = apiPath;
    if (apiPath.startsWith("motors.")) {
      if (!apiPath.startsWith(motorPrefix)) continue;
      relative = apiPath.slice(motorPrefix.length);
    }
    if (!relative) continue;
    const uiPath = remapMotorRelativePath(relative, options.inhibitorType ?? undefined);
    result[uiPath] = message;
  }

  return result;
}

/** Prefer structured `errorDetails`, then fall back to mapped AppError details. */
export function extractApiErrorDetails(response: {
  errorDetails?: unknown;
  error?: unknown;
  details?: unknown;
} | null | undefined): unknown {
  if (!response) return null;
  return response.errorDetails ?? response.error ?? response.details ?? null;
}
