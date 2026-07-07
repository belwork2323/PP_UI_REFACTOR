import { USER_RAW_MATERIAL_PREPARATION_ENDPOINTS } from "../../data/api/endPoints";
import type { MaterialsListGrade, MaterialsListItem } from "../../data/models/user/MaterialsListModel";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../state/formState";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../types";

export const RMP_SCHEMA_FUNCTIONALITY = "CREATE_RAW_MATERIAL_PREPARATION_FORM";
export const RMP_SCHEMA_TYPE = "RAW_MATERIALS";
export const RMP_SCHEMA_VERSION = "1.0";

/** Approved procurement lots for Feed Material Details lot dropdowns */
export const RAW_MATERIAL_PROCUREMENT_LOT_DATASOURCE = {
  type: "api" as const,
  api: {
    endpoint: "raw-material-procurement-lot-list",
    method: "POST" as const,
    requestBody: {
      limit: 500,
      page: 1,
      status: ["APPROVED"],
      subDepartmentId: 1,
      materialCode: ["{{materialCode}}"],
    },
    responsePath: "data.lots",
    displayKey: "lotId",
    valueKey: "lotId",
  },
};

export const rawMaterialPrepSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_RAW_MATERIAL_PREPARATION_ENDPOINTS.SCHEMA_RAW_MATERIAL,
};

export type RawMaterialSchemaRequestParams = {
  subDepartmentId: number;
  material: MaterialsListItem;
  grade?: MaterialsListGrade | null;
};

export const buildRawMaterialSchemaRequestFromCodes = (params: {
  subDepartmentId: number;
  materialId: number;
  materialCode: string;
  gradeId?: number | null;
  gradeCode?: string | null;
}) => ({
  schemaVersion: RMP_SCHEMA_VERSION,
  schemaType: RMP_SCHEMA_TYPE,
  layout: { type: "flat" },
  materialId: params.materialId,
  materialCode: params.materialCode,
  gradeId: params.gradeId ?? null,
  gradeCode: params.gradeCode ?? null,
  subdepartmentId: params.subDepartmentId,
  functionality: RMP_SCHEMA_FUNCTIONALITY,
});

export const buildRawMaterialSchemaRequest = ({
  subDepartmentId,
  material,
  grade,
}: RawMaterialSchemaRequestParams) =>
  buildRawMaterialSchemaRequestFromCodes({
    subDepartmentId,
    materialId: material.materialId,
    materialCode: material.materialCode,
    gradeId: grade?.gradeId ?? null,
    gradeCode: grade?.gradeCode ?? null,
  });

export type SchemaProcessSubmission = {
  materialId: number;
  materialCode: string;
  materialName: string;
  gradeId: number | null;
  gradeCode: string | null;
  schemaVersion: string;
  schemaType: string;
  sections: SchemaSectionSubmission[];
};

export const buildProcessSubmission = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
  material: MaterialsListItem,
  grade?: MaterialsListGrade | null,
): SchemaProcessSubmission => ({
  materialId: material.materialId,
  materialCode: material.materialCode,
  materialName: material.materialName,
  gradeId: grade?.gradeId ?? null,
  gradeCode: grade?.gradeCode ?? null,
  schemaVersion: schema.schemaVersion || RMP_SCHEMA_VERSION,
  schemaType: schema.schemaType || RMP_SCHEMA_TYPE,
  sections: toSectionSubmissions(schema, values),
});

export const hydrateValuesFromProcess = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections);

export const createInitialValues = (schema: SchemaDocumentV2) => buildInitialFormValues(schema);

export const findMaterialInList = (
  materials: MaterialsListItem[],
  materialCode: string,
): MaterialsListItem | undefined =>
  materials.find((m) => m.materialCode.toUpperCase() === String(materialCode ?? "").toUpperCase());

export const findGradeInMaterial = (
  material: MaterialsListItem | undefined,
  gradeCode: string,
): MaterialsListGrade | undefined => material?.grades?.find((g) => g.gradeCode === gradeCode);

export type PreparationProcessEntry = SchemaProcessSubmission;

export type PreparationPremixEntry = {
  premixNo: number;
  materialType: "SOLID" | "LIQUID" | "BOTH";
  solidProcess: PreparationProcessEntry[];
  liquidProcess: PreparationProcessEntry[];
};

export const derivePremixMaterialType = (premix: {
  selectedProcesses: { solid: boolean; liquid: boolean };
}): "SOLID" | "LIQUID" | "BOTH" => {
  const { solid, liquid } = premix.selectedProcesses;
  if (solid && liquid) return "BOTH";
  if (solid) return "SOLID";
  return "LIQUID";
};
