import { isEmptyManufacturingDivisionDetailsPayload } from "./qcDivisionApprovalUnits";
import { bootstrapQcBatchContext } from "./qcBatchBootstrap";
import {
  canShowQcDivisionUi,
  getQcDivisionBlockedReason,
  type QcBatchContext,
} from "./qcBatchContext";
import type { QcDivisionCatalogItem } from "./qcFlowConfig";

export type QcDivisionUiMode = "BLOCKED" | "SETUP" | "FORM";

export type QcDivisionLoadResult = {
  mode: QcDivisionUiMode;
  blockedReason: string | null;
  batchDetails: unknown;
  qcFormDetails: Record<string, unknown> | null;
  batchContext: QcBatchContext;
  manufacturingSeed: Record<string, unknown> | null;
  hasManufacturingData: boolean;
  hasQcSavedData: boolean;
};

export const resolveQcDivisionUiMode = (params: {
  blocked: boolean;
  hasManufacturingData: boolean;
  hasQcSavedData: boolean;
  hasSetup: boolean;
  setupLoaded: boolean;
}): QcDivisionUiMode => {
  if (params.blocked) return "BLOCKED";
  if (params.hasQcSavedData || params.hasManufacturingData || params.setupLoaded) return "FORM";
  if (params.hasSetup) return "SETUP";
  return "FORM";
};

export const loadQcDivisionContext = async (params: {
  batchId: string;
  listRow?: Record<string, unknown> | null;
  catalog?: QcDivisionCatalogItem[];
  formId?: string | null;
  subDepartmentId?: number | null;
  flowKey: string;
  rawMaterialType?: string | null;
  fetchManufacturingSeed?: () => Promise<Record<string, unknown> | null>;
  hasSetup?: boolean;
  setupLoaded?: boolean;
  hasQcSavedData?: boolean;
}): Promise<QcDivisionLoadResult | null> => {
  const bootstrap = await bootstrapQcBatchContext({
    batchId: params.batchId,
    listRow: params.listRow,
    catalog: params.catalog,
    formId: params.formId,
    subDepartmentId: params.subDepartmentId,
  });
  if (!bootstrap) return null;

  const { batchDetails, qcFormDetails, context } = bootstrap;
  const typeKey = String(params.rawMaterialType ?? "").trim();
  const blocked = !canShowQcDivisionUi(params.flowKey, context.units, typeKey);
  const blockedReason = getQcDivisionBlockedReason(params.flowKey, context.units, typeKey);

  let manufacturingSeed: Record<string, unknown> | null = null;
  if (!blocked && params.fetchManufacturingSeed) {
    manufacturingSeed = await params.fetchManufacturingSeed();
  }

  const hasManufacturingData = Boolean(
    manufacturingSeed && !isEmptyManufacturingDivisionDetailsPayload(manufacturingSeed),
  );
  const hasQcSavedData = Boolean(params.hasQcSavedData);

  const mode = resolveQcDivisionUiMode({
    blocked,
    hasManufacturingData,
    hasQcSavedData,
    hasSetup: Boolean(params.hasSetup),
    setupLoaded: Boolean(params.setupLoaded),
  });

  return {
    mode,
    blockedReason,
    batchDetails,
    qcFormDetails,
    batchContext: context,
    manufacturingSeed,
    hasManufacturingData,
    hasQcSavedData,
  };
};
