import { z } from "zod";
import { PostCureMotorData } from "../models/user/PostCureMotorDataModel";

// Reusable regex validators for security and input control
const CODE_REGEX = /^[a-zA-Z0-9\s\-_./#]+$/; // Standard for batch numbers, names, codes, locations
const TEXT_AREA_REGEX = /^[a-zA-Z0-9\s\-_.,/#()'"\n\r]*$/; // Allows punctuation & line breaks for remarks/observations
const NUMERIC_REGEX = /^[0-9]+(\.[0-9]+)?$/; // Ensures valid positive numbers/decimals for quantities and sizes
const optionalString = z.string().optional().or(z.literal(""));
const fileSchema = z
  .object({
    name: z.string().max(255, "File name is too long").optional(),
    url: z.string().url("Must be a valid URL").optional(),
  })
  .passthrough();

const requiredString = z
  .string()
  .min(1, "Required")
  .max(100, "Must be at most 100 characters")
  .regex(CODE_REGEX, "Only alphanumeric characters and standard symbols (- _ . / #) are allowed");

const codeString = requiredString;

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

const locationDateRowSchema = z.object({
  location: codeString,
  fromDate: requiredString,
  toDate: requiredString,
  observations: observationsString,
});

const locationQtyRowSchema = z.object({
  location: codeString,
  fromDate: requiredString,
  toDate: requiredString,
  qtyFilled: numericString,
  observations: observationsString,
});

const locationAppliedRowSchema = z.object({
  location: codeString,
  fromDate: requiredString,
  toDate: requiredString,
  qtyApplied: numericString,
  observations: observationsString,
});

// Strict ingredient row schema with conditional check to handle optional/computed TOTAL rows safely
const strictIngredientRowSchema = z
  .object({
    srNo: z.union([z.string(), z.number()]),
    ingredient: codeString,
    mfgLot: z.string().optional().or(z.literal("")),
    partsByWeight: optionalString, // <-- FIXED HERE (no more .min(1))
    quantity: z.string().optional().or(z.literal("")),
    qtyTaken: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const isTotal = String(data.srNo ?? "").toUpperCase() === "TOTAL";

    // If it's the TOTAL row, skip all required checks completely!
    if (isTotal) {
      return;
    }

    // Otherwise, validate regular ingredient rows:
    if (!data.mfgLot || data.mfgLot.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mfg Lot is required",
        path: ["mfgLot"],
      });
    }

    const targetQty = data.quantity ?? data.qtyTaken;
    const targetFieldKey = data.quantity !== undefined ? "quantity" : "qtyTaken";

    if (!targetQty || targetQty.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quantity is required",
        path: [targetFieldKey],
      });
    }
  });

const qualificationRowSchema = z.object({
  parameter: z.string(),
  specification: z.string().min(1, "Required").max(255, "Must be at most 255 characters"), // Flexible string instead of strict codeString
  result: codeString,
});

const qualificationSectionSchema = z.object({
  qualificationBatchNo: codeString,
  qualificationPreparationDate: requiredString,
  qualificationTable: z.array(qualificationRowSchema).min(1, "At least one parameter is required"),
  qualificationQcReport: z.array(fileSchema).min(1, "QC Report is required"),
});

const inhibitionSharedSchema = {
  inhibitionBatchDetails: z.object({
    inhibitorBatchNo: codeString,
    inhibitorBatchSize: numericString,
  }),
  inhibitionApplicationDetails: z.object({
    inhibitionApplicationTable: z
      .array(locationAppliedRowSchema)
      .min(1, "At least one application record is required"),
  }),
  dispatchDetails: z.object({
    dispatchDate: requiredString,
    dispatchStation: codeString,
  }),
};

const looseFlapVariantSchema = z.object({
  variant: z.literal("loose-flap-filling"),
  bellowRemovalDetails: z.object({
    bellowRemovalTable: z
      .array(locationDateRowSchema)
      .min(1, "At least one bellow removal entry is required"),
  }),
  looseFlapEpoxyPreparation: z.object({
    epoxyBatchNo: codeString,
    epoxyPreparationDate: requiredString,
    preparationDetails: z
      .array(strictIngredientRowSchema)
      .min(1, "At least one ingredient row is required"),
  }),
  qualificationDetails: qualificationSectionSchema,
  lfEpoxyFillingDetails: z.object({
    lfFillingTable: z
      .array(locationQtyRowSchema)
      .min(1, "At least one LF filling entry is required"),
  }),
});

const ir1VariantSchema = z.object({
  variant: z.literal("inhibition-ir1"),
  ir1Premix: z.object({
    ir1PremixBatchNo: codeString,
    ir1PremixDate: requiredString,
    ir1PremixTable: z
      .array(strictIngredientRowSchema)
      .min(1, "At least one premix ingredient is required"),
  }),
  ir1FinalMix: z.object({
    ir1FinalMixBatchNo: codeString,
    ir1FinalMixDate: requiredString,
    ir1FinalMixTable: z
      .array(strictIngredientRowSchema)
      .min(1, "At least one final mix ingredient is required"),
  }),
  ir1Qualification: qualificationSectionSchema,
  ...inhibitionSharedSchema,
});

const hemcoatVariantSchema = z.object({
  variant: z.literal("inhibition-hemcoat-3k"),
  hemcoat3kPreparation: z.object({
    hemcoatPremixBatchNo: codeString,
    hemcoatPremixDate: requiredString,
    premixPreparationTable: z
      .array(strictIngredientRowSchema)
      .min(1, "At least one premix ingredient is required"),
  }),
  hemcoat3kFinalMix: z.object({
    hemcoatFinalMixBatchNo: codeString,
    hemcoatFinalMixDate: requiredString,
    finalMixTable: z
      .array(strictIngredientRowSchema)
      .min(1, "At least one final mix ingredient is required"),
  }),
  hemcoat3kQualification: qualificationSectionSchema,
  ...inhibitionSharedSchema,
});

const inhibitionNotApplicableVariantSchema = z.object({
  variant: z.literal("inhibition-not-applicable"),
  inhibitionNotApplicable: z.object({
    remarks: z
      .string()
      .min(1, "Remarks are required")
      .max(500, "Remarks cannot exceed 500 characters")
      .regex(TEXT_AREA_REGEX, "Contains restricted special characters"),
  }),
});

export const postCureSchema = z.discriminatedUnion("variant", [
  looseFlapVariantSchema,
  ir1VariantSchema,
  hemcoatVariantSchema,
  inhibitionNotApplicableVariantSchema,
]);

export type PostCureFormInput = PostCureMotorData;
export type PostCureFormValues = PostCureMotorData;
