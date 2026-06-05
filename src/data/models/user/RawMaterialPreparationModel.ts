import type { MaterialsListItem } from "./MaterialsListModel";
import type {
  PreparationPremixEntry,
  PreparationProcessEntry,
} from "../../../schemaManagement/adapters/rawMaterialPreparation.adapter";
import {
  buildProcessSubmission,
  derivePremixMaterialType,
  findGradeInMaterial,
  findMaterialInList,
} from "../../../schemaManagement/adapters/rawMaterialPreparation.adapter";
import type {
  SchemaDocument,
  SchemaFormValues,
  SchemaSectionSubmission,
} from "../../../schemaManagement/models/schema.types";
import { schemaValuesHaveUserData } from "../../../schemaManagement/models/schemaFormState";

export type RawMaterialPreparationSubmitResponse = {
  formId: string;
  batchId: string;
  status: string;
};

export type RawMaterialPrepPremixSelection = {
  premix: number;
  selectedProcesses: { solid: boolean; liquid: boolean };
  solidMaterialCode: string;
  solidGradeCode: string;
  solidMaterialId?: number;
  solidGradeId?: number;
  liquidMaterialCode: string;
  liquidMaterialId?: number;
};

export type RawMaterialPrepMaterialSchemaSlot = {
  schema: SchemaDocument | null;
  schemaLoading: boolean;
  schemaError: string | null;
  formValues: SchemaFormValues;
};

export type RawMaterialPrepPremixSession = {
  selectedProcesses: { solid: boolean; liquid: boolean };
  solidMaterialCode: string;
  solidGradeCode: string;
  liquidMaterialCode: string;
  solid: RawMaterialPrepMaterialSchemaSlot;
  liquid: RawMaterialPrepMaterialSchemaSlot;
  pendingSolidSections?: SchemaSectionSubmission[];
  pendingLiquidSections?: SchemaSectionSubmission[];
};

export type RawMaterialPreparationDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  preparationDetails?: {
    premixes?: Array<{
      premixNo: number;
      materialType: string;
      solidProcess?: PreparationProcessEntry[];
      liquidProcess?: PreparationProcessEntry[];
    }>;
    weightmentSheet?: unknown;
  };
};

const emptySlot = (): RawMaterialPrepMaterialSchemaSlot => ({
  schema: null,
  schemaLoading: false,
  schemaError: null,
  formValues: {},
});

export const createEmptyPremixSchemaSession = (): RawMaterialPrepPremixSession => ({
  selectedProcesses: { solid: false, liquid: false },
  solidMaterialCode: "",
  solidGradeCode: "",
  liquidMaterialCode: "",
  solid: emptySlot(),
  liquid: emptySlot(),
});

const buildProcessForSlot = (
  schema: SchemaDocument | null,
  values: SchemaFormValues,
  material: MaterialsListItem | undefined,
  gradeCode: string,
  fallback?: { materialId?: number; materialCode?: string; materialName?: string; gradeId?: number }
): PreparationProcessEntry | null => {
  if (!schema || !schemaValuesHaveUserData(values)) return null;

  const resolvedMaterial: MaterialsListItem | undefined =
    material ??
    (fallback?.materialId && fallback.materialCode
      ? {
          materialId: fallback.materialId,
          materialCode: fallback.materialCode,
          materialName: fallback.materialName ?? fallback.materialCode,
          specCount: 0,
          grades: [],
        }
      : undefined);

  if (!resolvedMaterial) return null;

  const grade =
    findGradeInMaterial(resolvedMaterial, gradeCode) ??
    (fallback?.gradeId
      ? {
          gradeId: fallback.gradeId,
          gradeCode,
          gradeName: gradeCode,
        }
      : undefined);

  return buildProcessSubmission(schema, values, resolvedMaterial, grade ?? null);
};

export const mapPreparationDetailsPayload = (params: {
  addedPremixSelections: RawMaterialPrepPremixSelection[];
  premixSessions: Record<number, RawMaterialPrepPremixSession>;
  solidMaterials: MaterialsListItem[];
  liquidMaterials: MaterialsListItem[];
}) => {
  const premixes: PreparationPremixEntry[] = [];

  params.addedPremixSelections.forEach((entry) => {
    const session = params.premixSessions[entry.premix] ?? createEmptyPremixSchemaSession();
    const solidMaterial = findMaterialInList(params.solidMaterials, entry.solidMaterialCode);
    const liquidMaterial = findMaterialInList(params.liquidMaterials, entry.liquidMaterialCode);

    const solidProcess: PreparationProcessEntry[] = [];
    const liquidProcess: PreparationProcessEntry[] = [];

    if (entry.selectedProcesses.solid) {
      const process = buildProcessForSlot(
        session.solid.schema,
        session.solid.formValues,
        solidMaterial,
        entry.solidGradeCode,
        {
          materialId: entry.solidMaterialId,
          materialCode: entry.solidMaterialCode,
          materialName: session.solid.schema?.rawMaterialDetails.materialName,
          gradeId: entry.solidGradeId,
        }
      );
      if (process) solidProcess.push(process);
    }

    if (entry.selectedProcesses.liquid) {
      const process = buildProcessForSlot(
        session.liquid.schema,
        session.liquid.formValues,
        liquidMaterial,
        "",
        {
          materialId: entry.liquidMaterialId,
          materialCode: entry.liquidMaterialCode,
          materialName: session.liquid.schema?.rawMaterialDetails.materialName,
        }
      );
      if (process) liquidProcess.push(process);
    }

    if (solidProcess.length === 0 && liquidProcess.length === 0) return;

    premixes.push({
      premixNo: entry.premix,
      materialType: derivePremixMaterialType(entry),
      solidProcess,
      liquidProcess,
    });
  });

  return {
    preparationDetails: {
      premixes,
    },
  };
};

export const mapPreparationDetailsFromApi = (
  details: RawMaterialPreparationDetails
): {
  addedPremixSelections: RawMaterialPrepPremixSelection[];
  premixSessions: Record<number, RawMaterialPrepPremixSession>;
} => {
  const premixes = details.preparationDetails?.premixes ?? [];
  const addedPremixSelections: RawMaterialPrepPremixSelection[] = [];
  const premixSessions: Record<number, RawMaterialPrepPremixSession> = {};

  premixes.forEach((premix) => {
    const premixNo = Number(premix.premixNo ?? 0);
    if (!premixNo) return;

    const solidEntry = premix.solidProcess?.[0];
    const liquidEntry = premix.liquidProcess?.[0];
    const hasSolid = (premix.solidProcess?.length ?? 0) > 0;
    const hasLiquid = (premix.liquidProcess?.length ?? 0) > 0;

    addedPremixSelections.push({
      premix: premixNo,
      selectedProcesses: { solid: hasSolid, liquid: hasLiquid },
      solidMaterialCode: solidEntry?.materialCode ?? "",
      solidGradeCode: solidEntry?.gradeCode ?? "",
      solidMaterialId: solidEntry?.materialId,
      solidGradeId: solidEntry?.gradeId ?? undefined,
      liquidMaterialCode: liquidEntry?.materialCode ?? "",
      liquidMaterialId: liquidEntry?.materialId,
    });

    premixSessions[premixNo] = {
      ...createEmptyPremixSchemaSession(),
      selectedProcesses: { solid: hasSolid, liquid: hasLiquid },
      solidMaterialCode: solidEntry?.materialCode ?? "",
      solidGradeCode: solidEntry?.gradeCode ?? "",
      liquidMaterialCode: liquidEntry?.materialCode ?? "",
      pendingSolidSections: solidEntry?.sections,
      pendingLiquidSections: liquidEntry?.sections,
    };
  });

  return { addedPremixSelections, premixSessions };
};

export const premixSessionHasData = (session: RawMaterialPrepPremixSession) => {
  const solidFilled =
    session.selectedProcesses.solid && schemaValuesHaveUserData(session.solid.formValues);
  const liquidFilled =
    session.selectedProcesses.liquid && schemaValuesHaveUserData(session.liquid.formValues);
  return solidFilled || liquidFilled;
};

export class RawMaterialPreparationSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(data: Partial<RawMaterialPreparationSubmitResponse> = {}) {
    this.formId = data.formId ?? "";
    this.batchId = data.batchId ?? "";
    this.status = data.status ?? "";
  }

  static fromApi(data: any) {
    return new RawMaterialPreparationSubmitResponseModel({
      formId: data?.formId,
      batchId: data?.batchId,
      status: data?.status,
    });
  }
}

export class RawMaterialPreparationDetailsModel {
  static fromApi(data: any): RawMaterialPreparationDetails {
    return {
      formId: String(data?.formId ?? ""),
      batchId: String(data?.batchId ?? ""),
      subDepartmentId: Number(data?.subDepartmentId ?? 0),
      formSubmissionType: String(data?.formSubmissionType ?? ""),
      preparationDetails: data?.preparationDetails ?? { premixes: [] },
    };
  }
}
