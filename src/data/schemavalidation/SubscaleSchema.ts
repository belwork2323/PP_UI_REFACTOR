import { SchemaDocumentV2 } from "@/schema-engine";
import { z } from "zod";
import { SchemaSectionSubmission } from "../models/user/CastingCuringFormModel";

// Reusable regex validators for security and input control
const CODE_REGEX = /^[a-zA-Z0-9\s\-_./#]+$/;
const TEXT_AREA_REGEX = /^[a-zA-Z0-9\s\-_.,/#()'"\n\r]*$/;
const NUMERIC_REGEX = /^[0-9]+(\.[0-9]+)?$/;

const requiredString = z
  .string()
  .min(1, "Required")
  .max(100, "Must be at most 100 characters")
  .regex(CODE_REGEX, "Only alphanumeric characters and standard symbols (- _ . / #) are allowed");

const optionalString = z.string().optional().or(z.literal(""));

const numericString = z
  .string()
  .min(1, "Required")
  .max(20, "Value is too large")
  .regex(NUMERIC_REGEX, "Must be a valid numeric value");

const optionalNumericString = z
  .string()
  .max(20, "Value is too large")
  .regex(NUMERIC_REGEX, "Must be a valid numeric value")
  .optional()
  .or(z.literal(""));

const observationsString = z
  .string()
  .max(500, "Must be at most 500 characters")
  .regex(TEXT_AREA_REGEX, "Contains unsupported or restricted special characters")
  .optional()
  .or(z.literal(""));

const fileSchema = z
  .object({
    name: z.string().max(255, "File name is too long").optional(),
    url: z.string().url("Must be a valid URL").optional(),
  })
  .passthrough();

// 1. Hardware Preparation Section Schema
const hardwarePreparationSchema = z.object({
  NO_OF_40KG_BEMS: numericString,
  NO_OF_10KG_BEMS: numericString,
  NO_OF_2KG_BEMS: numericString,
  NO_OF_WHEEL_PEEL: numericString,
  NO_OF_SBS_TBS: numericString,
  NO_OF_CARTOONS: numericString,
  LINER_TYPE: requiredString,
  LINER_BATCH_NO: requiredString,
  LINER_BATCH_DATE: requiredString,
});

// Row Schemas
const articleTypeRowSchema = z.object({
  SR_NO: z.union([z.string(), z.number()]),
  ARTICLE_TYPE: requiredString,
  RUBBER_MATERIAL: requiredString,
  SLEEVE_NO: requiredString,
  MOULD_NO: requiredString,
  SIZE_MM: optionalString,
  THICKNESS_MM: optionalString,
  LINER_APPLIED: optionalString,
  OBSERVATIONS: optionalString,
});

const castingRowSchema = z.object({
  SR_NO: z.union([z.string(), z.number()]),
  ARTICLE_TYPE: requiredString,
  BEM_MOULD_NO: requiredString,
  CASTING_PIT_NO: optionalString,
  CASTING_START_TIME: optionalString,
  CASTING_END_TIME: optionalString,
  VACUUM_LEVEL: numericString,
  REMARKS: observationsString,
});

const curingRowSchema = z.object({
  SR_NO: z.union([z.string(), z.number()]),
  ARTICLE_TYPE: requiredString,
  BEM_MOULD_NO: requiredString,
  CURING_START_DATE: optionalString,
  CURING_END_DATE: optionalString,
  OVEN_NO: optionalString,
  TEMPERATURE: optionalNumericString,
  HARDNESS: optionalNumericString,
  DECORING_DATE: optionalString,
  DECORING_LOAD: optionalNumericString,
  GRAIN_SURFACE_OBSERVATIONS: observationsString,
});

const ndtRowSchema = z.object({
  SR_NO: z.union([z.string(), z.number()]),
  ARTICLE_TYPE: requiredString,
  BEM_NO: requiredString,
  DATE_OF_NDT: requiredString,
  OBSERVATIONS: observationsString,
});

const trimmingRowSchema = z.object({
  SR_NO: z.union([z.string(), z.number()]),
  ARTICLE_TYPE: requiredString,
  BEM_NO: requiredString,
  HE_OD: optionalNumericString,
  HE_PORT_INNER: optionalNumericString,
  HE_PORT_OUTER: optionalNumericString,
  HE_BEFORE_INHIBITION_INNER: optionalNumericString,
  HE_BEFORE_INHIBITION_OUTER: optionalNumericString,
  NE_OD: optionalNumericString,
  NE_PORT_INNER: optionalNumericString,
  NE_PORT_OUTER: optionalNumericString,
  NE_WEB_INNER: optionalNumericString,
  NE_WEB_OUTER: optionalNumericString,
  LENGTH_BEFORE_INHIBITION: optionalNumericString,
});

const inhibitionRowSchema = z.object({
  SR_NO: z.union([z.string(), z.number()]),
  ARTICLE_TYPE: requiredString,
  BEM_NO: requiredString,
  LINER_COATED_SLEEVE_WEIGHT: optionalNumericString,
  WEIGHT_BEFORE_INHIBITION: optionalNumericString,
  WEIGHT_AFTER_INHIBITION: optionalNumericString,
  IR_APPLIED_WEIGHT: optionalNumericString,
  PROPELLANT_WEIGHT: optionalNumericString,
  DATE_OF_APPLICATION: optionalString,
  REMARKS: observationsString,
});

const staticTestingRowSchema = z.object({
  SR_NO: z.union([z.string(), z.number()]),
  ARTICLE_TYPE: requiredString,
  BEM_NO: requiredString,
  PROPELLANT_MASS: optionalNumericString,
  DT: optionalNumericString,
  WEB_THICKNESS: optionalNumericString,
  N_VALUE: optionalNumericString,
  PRESSURE_AVG: optionalNumericString,
  THRUST_AVG: optionalNumericString,
  BURN_RATE: optionalNumericString,
  // Accept either a file metadata object, a File instance, or null/undefined.
  GRAPH_UPLOAD: z.any().optional().nullable(),
});

const mechanicalPropertiesRowSchema = z.object({
  SR_NO: z.union([z.string(), z.number()]),
  ARTICLE_TYPE: requiredString,
  BEM_NO: requiredString,
  TS: optionalNumericString,
  ELONGATION: optionalNumericString,
  MODULUS: optionalNumericString,
  SBS: optionalNumericString,
  TBS: optionalNumericString,
  PEEL_STRENGTH: optionalNumericString,
  DENSITY: optionalNumericString,
  ACTOR: optionalNumericString,
});

// Process Particular Row Schema for Mixing Cycles
const processParticularRowSchema = z.object({
  operationId: z.union([z.string(), z.number()]).optional(),
  operation: z.string().optional(),
  // These particulars are optional by default; requiredness is enforced
  // conditionally in the superRefine block for specific batch types.
  rpm: optionalNumericString,
  time: optionalNumericString,
  temp: optionalNumericString,
  vacuum: optionalNumericString,
});

const subscaleMixingCycleSchema = z.object({
  _key: z.string().optional(),
  stage: requiredString,
  mixingCycleCode: requiredString,
  mixingCycleName: optionalString,
  mixingCycleId: z.union([z.string(), z.number()]).nullable().optional(),
  premixParticulars: z.array(processParticularRowSchema).default([]),
  finalMixParticulars: z.array(processParticularRowSchema).default([]),
});

// Comprehensive Subscale & Main Hardware Form Schema with conditional checks
export const subscaleHardwareSchema = hardwarePreparationSchema
  .extend({
    // Metadata / Batch Context
    BATCH_TYPE: z.string().optional(),
    SUB_BATCH_TYPE: z.string().optional(),
    IS_PROCESS_FORM_LOADED: z.boolean().optional(),

    // General Batch Info (Conditional for Subscale)
    BATCH_SIZE: optionalString,
    mixerType: optionalString,
    MIXER_BLDG_NO: optionalString,
    PREMIX_DATE: optionalString,
    FINAL_MIX_DATE: optionalString,

    // Mixing Cycles (Conditional for Subscale)
    SUBSCALE_MIXING_CYCLES: z.array(subscaleMixingCycleSchema).default([]),

    // Process / Hardware Fields
    DATE_OF_CASTING: optionalString,
    IR_BATCH_NO: optionalString,
    DATE_OF_MFG: optionalString,

    // Tables
    ARTICLE_TYPE_TABLE: z.array(articleTypeRowSchema).default([]),
    CASTING_TABLE: z.array(castingRowSchema).default([]),
    CURING_TABLE: z.array(curingRowSchema).default([]),
    NDT_TABLE: z.array(ndtRowSchema).default([]),
    TRIMMING_TABLE: z.array(trimmingRowSchema).default([]),
    INHIBITION_TABLE: z.array(inhibitionRowSchema).default([]),

    // Omitted or optional for Main batches
    STATIC_TESTING_TABLE: z.array(staticTestingRowSchema).default([]),
    MECHANICAL_PROPERTIES_TABLE: z.array(mechanicalPropertiesRowSchema).default([]),
  })
  .superRefine((data, ctx) => {
    const isMain = String(data.BATCH_TYPE ?? "")
      .toUpperCase()
      .includes("MAIN");
    const subType = String(data.SUB_BATCH_TYPE ?? "").toUpperCase();
    const isExperimental = subType === "EXPERIMENTAL";

    if (!isMain) {
      // Subscale validations
      if (!data.PREMIX_DATE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required for subscale batches",
          path: ["PREMIX_DATE"],
        });
      }
      if (!data.FINAL_MIX_DATE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required for subscale batches",
          path: ["FINAL_MIX_DATE"],
        });
      }

      if (isExperimental) {
        // Experimental requires stage and mixing cycle selection per cycle entry
        data.SUBSCALE_MIXING_CYCLES.forEach((cycle, index) => {
          if (!cycle.stage) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Motor stage is required",
              path: ["SUBSCALE_MIXING_CYCLES", index, "stage"],
            });
          }
          if (!cycle.mixingCycleCode) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Mixing cycle is required",
              path: ["SUBSCALE_MIXING_CYCLES", index, "mixingCycleCode"],
            });
          }
        });
      }

      // For subscale batches, require mixing cycle particulars (rpm/time/temp/vacuum)
      data.SUBSCALE_MIXING_CYCLES.forEach((cycle, cIndex) => {
        (cycle.premixParticulars || []).forEach((row, rIndex) => {
          if (!row) return;
          ["rpm", "time", "temp", "vacuum"].forEach((fld) => {
            if (!String((row as any)[fld] ?? "").trim()) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Required",
                path: ["SUBSCALE_MIXING_CYCLES", cIndex, "premixParticulars", rIndex, fld],
              });
            }
          });
        });
        (cycle.finalMixParticulars || []).forEach((row, rIndex) => {
          if (!row) return;
          ["rpm", "time", "temp", "vacuum"].forEach((fld) => {
            if (!String((row as any)[fld] ?? "").trim()) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Required",
                path: ["SUBSCALE_MIXING_CYCLES", cIndex, "finalMixParticulars", rIndex, fld],
              });
            }
          });
        });
      });

      // When the process form is loaded, require key process fields to be present.
      if (data.IS_PROCESS_FORM_LOADED) {
        if (!data.DATE_OF_CASTING) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Required",
            path: ["DATE_OF_CASTING"],
          });
        }
        if (!data.IR_BATCH_NO) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["IR_BATCH_NO"] });
        }
        if (!data.DATE_OF_MFG) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["DATE_OF_MFG"] });
        }
      }
    }
  });

export const rootSubscaleFormSchema = z.object({
  schemaFormLoaded: z.boolean(),
  subscaleSchema: z.any().nullable(),
  schemaFormValues: subscaleHardwareSchema, // <--- Nest it here!
  savedSections: z.any().optional(),
});

export type SubscaleHardwareFormInput = z.infer<typeof rootSubscaleFormSchema>;
export type SubscaleHardwareFormValues = SubscaleHardwareFormInput;
