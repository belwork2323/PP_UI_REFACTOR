import { USER_QC_DIVISION_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import schemaEngineController from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../state/formState";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../types";

export const QC_SCHEMA_FUNCTIONALITY = "CREATE_QC_FORM";
export const QC_SCHEMA_TYPE = "QC";
export const QC_SCHEMA_VERSION = "1.0";

export const MIXING_SCHEMA_FUNCTIONALITY = "CREATE_MIXING_FORM";
export const HARDWARE_SCHEMA_FUNCTIONALITY = "CREATE_HARDWARE_FORM";
export const CASTING_SCHEMA_FUNCTIONALITY = "CREATE_CASTING_FORM";
export const CURING_SCHEMA_FUNCTIONALITY = "CREATE_CURING_FORM";
export const DE_CORING_SCHEMA_FUNCTIONALITY = "CREATE_DE_CORING_FORM";
export const TRIMMING_SCHEMA_FUNCTIONALITY = "CREATE_TRIMMING_FORM";
export const POST_CURE_SCHEMA_FUNCTIONALITY = "CREATE_POST_CURE_FORM";
export const NDT_SCHEMA_FUNCTIONALITY = "CREATE_NDT_FORM";
export const PROPELLANT_SCHEMA_FUNCTIONALITY = "CREATE_QC_PROPELLANT_FORM";
export const WEIGHTMENT_SCHEMA_FUNCTIONALITY = "CREATE_WEIGHTMENT_FORM";

export type QcInhibitorType = "IR1" | "HEMCOAT-3K" | "NOT_APPLICABLE";

export type QcApiDivision =
  | "RAW_MATERIAL_REVALIDATION"
  | "RAW_MATERIAL_PROCESSING"
  | "MIXING"
  | "HARDWARE"
  | "CASTING"
  | "CURING"
  | "DE_CORING"
  | "TRIMMING"
  | "POST_CURE"
  | "NDT"
  | "PROPELLANT_PROPERTIES"
  | "WEIGHTMENT"
  | "QC"
  | "STATIC_TEST_FACILITY";

export type QcApiSubType =
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

export type QcSchemaRequest = {
  schemaVersion: string;
  schemaType: string;
  layout: { type: "flat" };
  division: QcApiDivision;
  subType: QcApiSubType;
  subDepartmentId: number;
  functionality: string;
  inhibitorType?: QcInhibitorType | null;
};

export const qcSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_QC_DIVISION_ENDPOINTS.SCHEMA,
};

export const resolveQcSchemaMeta = (
  division: QcApiDivision,
): { schemaType: string; functionality: string } => {
  if (division === "MIXING") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: MIXING_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "HARDWARE") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: HARDWARE_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "CASTING") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: CASTING_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "CURING") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: CURING_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "DE_CORING") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: DE_CORING_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "TRIMMING") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: TRIMMING_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "POST_CURE") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: POST_CURE_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "NDT") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: NDT_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "PROPELLANT_PROPERTIES") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: PROPELLANT_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "WEIGHTMENT") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: WEIGHTMENT_SCHEMA_FUNCTIONALITY,
    };
  }

  return {
    schemaType: QC_SCHEMA_TYPE,
    functionality: QC_SCHEMA_FUNCTIONALITY,
  };
};

export const buildQcSchemaRequest = (params: {
  subDepartmentId: number;
  division: QcApiDivision;
  subType?: QcApiSubType;
  inhibitorType?: QcInhibitorType | null;
}): QcSchemaRequest => {
  const { schemaType, functionality } = resolveQcSchemaMeta(params.division);

  const request: QcSchemaRequest = {
    schemaVersion: QC_SCHEMA_VERSION,
    schemaType,
    layout: { type: "flat" },
    division: params.division,
    subType: params.subType ?? null,
    subDepartmentId: params.subDepartmentId,
    functionality,
  };

  if (
    params.division === "POST_CURE" &&
    params.subType === "INHIBITION" &&
    params.inhibitorType
  ) {
    request.inhibitorType = params.inhibitorType;
  }

  return request;
};

export const getQcSchemaTypeForDivision = (division: QcApiDivision) =>
  resolveQcSchemaMeta(division).schemaType;

export const createQcInitialValues = (schema: SchemaDocumentV2) =>
  buildInitialFormValues(schema);

export const hydrateQcValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections);

export const buildQcSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] => toSectionSubmissions(schema, values);

export const fetchQcSchema = async (params: {
  subDepartmentId: number;
  division: QcApiDivision;
  subType?: QcApiSubType;
  inhibitorType?: QcInhibitorType | null;
}) => {
  const request = buildQcSchemaRequest(params);
  return schemaEngineController.fetchSchema(qcSchemaFetchConfig, request);
};
