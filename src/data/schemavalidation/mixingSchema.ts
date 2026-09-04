import { z } from "zod";

const requiredString = (message: string) => z.string({ message }).trim().min(1, message);

const requiredNumericField = (message: string) =>
  z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number({ message }),
  );

// Flexible Specification Schema supporting object shapes, stringified descriptions, and empty objects
export const specificationSchema = z.preprocess(
  (val) => {
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (typeof parsed === "object" && parsed !== null) return parsed;
      } catch {
        return { unit: val };
      }
    }
    return val;
  },
  z
    .union([
      z.object({
        minValue: z.union([z.number(), z.string()]).optional().nullable(),
        maxValue: z.union([z.number(), z.string()]).optional().nullable(),
        unit: z.string().optional().nullable(),
      }),
      z.string(),
      z.object({}),
    ])
    .optional()
    .nullable(),
);

// Shared Process Particulars Schema
export const processParticularSchema = z.object({
  operation: requiredString("Operation is required"),
  operationId: z.union([z.string(), z.number()]).optional(),
  rpm: requiredNumericField("RPM is required and must be a number"),
  time: requiredNumericField("Time is required and must be a number"),
  temp: requiredNumericField("Temperature is required and must be a number"),
  vacuum: requiredNumericField("Vacuum is required and must be a number"),
});

// Quality Check Row Schema with Robust Min/Max Checks
export const qualityCheckRowSchema = z
  .object({
    parameterId: z.union([z.string(), z.number()]).optional(),
    parameter: z.string().optional(),
    parameterName: z.string().optional(),
    specification: specificationSchema,
    noOfSamples: z.union([z.number(), z.string()]).optional(),
    observedValues: z.array(z.string().optional()).default([]),
  })
  .superRefine((row, ctx) => {
    const rawSampleCount = Number(row.noOfSamples);
    const sampleCount =
      Number.isFinite(rawSampleCount) && rawSampleCount >= 1
        ? Math.floor(rawSampleCount)
        : Math.max(1, row.observedValues?.length || 1);

    const values = row.observedValues ?? [];

    // Parse Spec Min / Max Values Safely
    let min: number | undefined;
    let max: number | undefined;

    if (row.specification && typeof row.specification === "object") {
      const specObj = row.specification as { minValue?: unknown; maxValue?: unknown };
      const minVal = Number(specObj.minValue);
      const maxVal = Number(specObj.maxValue);

      if (!Number.isNaN(minVal) && specObj.minValue !== null && specObj.minValue !== undefined) {
        min = minVal;
      }
      if (!Number.isNaN(maxVal) && specObj.maxValue !== null && specObj.maxValue !== undefined) {
        max = maxVal;
      }
    }

    // Validate active slots
    for (let index = 0; index < sampleCount; index += 1) {
      const raw = values[index];
      const isEmpty = raw === undefined || raw === null || String(raw).trim() === "";

      if (isEmpty) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Observed value is required",
          path: ["observedValues", index],
        });
        continue;
      }

      const num = Number(raw);

      if (Number.isNaN(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Must be a valid number",
          path: ["observedValues", index],
        });
        continue;
      }

      if (min !== undefined && num < min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Value must be ≥ ${min}`,
          path: ["observedValues", index],
        });
      }

      if (max !== undefined && num > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Value must be ≤ ${max}`,
          path: ["observedValues", index],
        });
      }
    }
  });

// Premix Form Schema
export const premixFormSchema = z.object({
  premixNo: z.union([z.string(), z.number()]).optional(),
  bowlId: requiredString("Please select a Bowl"),
  bowlTrialDate: requiredString("Please select a Trial Date"),
  bowlTrialObservations: requiredString("Trial observations are required"),
  processParticulars: z.array(processParticularSchema),
  qualityChecks: z.array(qualityCheckRowSchema).min(1, "At least one quality check is required"),
});

// Final Mix Form Schema
export const finalMixFormSchema = z.object({
  mixNo: z.union([z.string(), z.number()]).optional(),
  finalMixNo: z.string().optional(),
  mixerType: z.string().optional(),
  bldgNo: z.string().optional(),
  mixingCycle: z.union([z.string(), z.number()]).optional(),
  bowlId: requiredString("Please select a Bowl"),
  processParticulars: z.array(processParticularSchema),
  qualityChecks: z.array(qualityCheckRowSchema).min(1, "At least one quality check is required"),
});

export const rootFormSchema = z.object({
  premixes: z.array(premixFormSchema),
  finalMixes: z.array(finalMixFormSchema),
});

export type RootFormInput = z.infer<typeof rootFormSchema>;
export type RootPremixFormInput = z.infer<typeof rootFormSchema>;
export type PremixFormInput = z.input<typeof premixFormSchema>;
export type FinalMixFormInput = z.input<typeof finalMixFormSchema>;
