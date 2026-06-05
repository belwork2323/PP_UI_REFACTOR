import { INGREDIENT_SPECS, type RawMaterialRevalidationBlock } from "./QCRawMaterialRevalidationModel";

export type RawMaterialRevalidationSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

export type RawMaterialRevalidationRowPayload = {
  specificationCode: string;
  result: string;
  validity: string;
};

export type RawMaterialRevalidationBlockPayload = {
  ingredientCode: string;
  lotNo: string;
  rows: RawMaterialRevalidationRowPayload[];
};

export class RawMaterialRevalidationSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): RawMaterialRevalidationSubmitResponseModel {
    return new RawMaterialRevalidationSubmitResponseModel(apiResponse?.data ?? {});
  }
}

type RawMaterialRevalidationDetailsRow = {
  specificationCode: string;
  specificationName: string;
  result: string;
  validity: string;
};

type RawMaterialRevalidationDetailsBlock = {
  ingredientCode: string;
  lotNo: string;
  rows: RawMaterialRevalidationDetailsRow[];
};

export class RawMaterialRevalidationDetailsModel {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  blocks: RawMaterialRevalidationDetailsBlock[];
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? "";
    this.blocks = Array.isArray(payload?.blocks) ? payload.blocks : [];
    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? "",
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): RawMaterialRevalidationDetailsModel {
    return new RawMaterialRevalidationDetailsModel(apiResponse?.data ?? {});
  }

  static toBlocks(model: RawMaterialRevalidationDetailsModel): RawMaterialRevalidationBlock[] {
    return (model.blocks ?? []).map((block) => {
      const fallbackSpecs = INGREDIENT_SPECS[block.ingredientCode] ?? [];

      return {
        ingredient: block.ingredientCode,
        lotNo: block.lotNo ?? "",
        rows: (block.rows ?? []).length > 0
          ? block.rows.map((row, index) => ({
              specificationCode: row.specificationCode ?? fallbackSpecs[index]?.specificationCode ?? "",
              parameter: row.specificationName ?? fallbackSpecs[index]?.parameter ?? row.specificationCode ?? "",
              result: row.result ?? "",
              validity: row.validity ?? "",
            }))
          : fallbackSpecs.map((spec) => ({
              specificationCode: spec.specificationCode,
              parameter: spec.parameter,
              result: "",
              validity: "",
            })),
      };
    });
  }
}

export const mapBlocksToRawMaterialRevalidationPayload = (
  blocks: RawMaterialRevalidationBlock[],
): RawMaterialRevalidationBlockPayload[] => {
  return (blocks ?? []).map((block) => ({
    ingredientCode: block.ingredient,
    lotNo: block.lotNo ?? "",
    rows: (block.rows ?? []).map((row) => ({
      specificationCode: row.specificationCode ?? "",
      result: row.result ?? "",
      validity: row.validity ?? "",
    })),
  }));
};