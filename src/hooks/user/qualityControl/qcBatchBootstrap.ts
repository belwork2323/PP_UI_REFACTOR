import { batchManagementController } from "../../../controllers/admin/BatchManagement/batchManagementController";
import { qcDivisionController } from "../../../controllers/user/quality_control/qcDivisionController";
import { resolveQcBatchContext, type QcBatchContext } from "./qcBatchContext";
import type { QcDivisionCatalogItem } from "./qcFlowConfig";

export const fetchFreshBatchDetails = async (batchId: string) => {
  const id = String(batchId ?? "").trim();
  if (!id) return null;
  return batchManagementController.getBatchById(id);
};

export const fetchFreshQcFormDetails = async (params: {
  formId: string;
  subDepartmentId: number;
}) => {
  const formId = String(params.formId ?? "").trim();
  if (!formId || !params.subDepartmentId) return null;

  const response = await qcDivisionController.fetchFormDetails({
    formId,
    subDepartmentId: params.subDepartmentId,
  });
  if (!response?.success || !response.data) return null;
  return response.data as Record<string, unknown>;
};

export type QcBatchBootstrapResult = {
  batchDetails: unknown;
  qcFormDetails: Record<string, unknown> | null;
  context: QcBatchContext;
};

/** Always fetch fresh — never cache batch or QC form details. */
export const bootstrapQcBatchContext = async (params: {
  batchId: string;
  listRow?: Record<string, unknown> | null;
  catalog?: QcDivisionCatalogItem[];
  formId?: string | null;
  subDepartmentId?: number | null;
}): Promise<QcBatchBootstrapResult | null> => {
  const batchDetails = await fetchFreshBatchDetails(params.batchId);
  if (!batchDetails) return null;

  const formId = String(params.formId ?? "").trim();
  let qcFormDetails: Record<string, unknown> | null = null;

  if (formId && params.subDepartmentId) {
    qcFormDetails = await fetchFreshQcFormDetails({
      formId,
      subDepartmentId: params.subDepartmentId,
    });
  }

  const context = resolveQcBatchContext({
    listRow: params.listRow,
    batchDetails,
    catalog: params.catalog,
    formId,
    qcFormDetails,
  });

  return { batchDetails, qcFormDetails, context };
};
