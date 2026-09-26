import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
  type SchemaDocumentV2,
  type SchemaFormValues,
  type SchemaSectionSubmission,
} from "../../shared/sectionFormTypes";

export const QC_SCHEMA_TYPE = "QC";

export type QcInhibitorType = "IR1" | "HEMCOAT-3K" | "NOT_APPLICABLE";

export type QcApiDivision =
  | "RAW_MATERIAL"
  | "RAW_MATERIAL_REVALIDATION"
  | "RAW_MATERIAL_PROCESSING"
  | "MIXING"
  | "HARDWARE"
  | "CASTING"
  | "CURING"
  | "DE_CORING"
  | "TRIMMING"
  | "POST_CURE"
  | "POST_CURE_OPERATION"
  | "NDT"
  | "PROPELLANT_PROPERTIES"
  | "WEIGHTMENT"
  | "QC"
  | "STATIC_TEST_FACILITY";

export type QcApiSubType =
  | "RAW_MATERIAL_REVALIDATION"
  | "RAW_MATERIAL_PROCESSING"
  | "SOLID_PROCESSING"
  | "LIQUID_PROCESSING"
  | "BEM"
  | "MAIN_MOTOR"
  | "PREMIX"
  | "FINAL_MIX"
  | "ABRADING"
  | "PREHEATING"
  | "LINEAR_COATING"
  | "DISPATCH"
  | "NORMAL"
  | "CONFINED"
  | "N2_PRESSURE"
  | "MAIN_BATCH"
  | "SUBSCALE"
  | "LOOSE_FLAP_FILLING"
  | "INHIBITION"
  | "MECHANICAL_PROPERTIES"
  | "INTERFACE_PROPERTIES"
  | "SSBR_UBR_BURN_RATE"
  | "BALLISTIC_EVALUATION"
  | null;

export const getQcSchemaTypeForDivision = (_division: QcApiDivision) => QC_SCHEMA_TYPE;

/** @deprecated Schema engine removed. */
export const createQcInitialValues = (schema: SchemaDocumentV2) =>
  buildInitialFormValues(schema);

/** @deprecated Schema engine removed. */
export const hydrateQcValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections);

/** @deprecated Schema engine removed. */
export const buildQcSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] => toSectionSubmissions(schema, values);

/** @deprecated Schema engine removed — always fails closed. */
export const fetchQcSchema = async (_params: {
  subDepartmentId: number;
  division: QcApiDivision;
  subType?: QcApiSubType;
  inhibitorType?: QcInhibitorType | null;
  entry?: unknown;
}): Promise<{ success: false; data: null; message: string }> => ({
  success: false,
  data: null,
  message: "Schema engine removed",
});
