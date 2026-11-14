import { STRINGS } from "@app/config/strings";
import {
  normalizeRawMaterialLotListStatus,
  type RawMaterialLotDetailsContext,
  type RawMaterialLotListRow,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";

type LotDetailsModel = {
  lotId?: string;
  materialCode?: string;
  grade?: string | null;
  supplyOrderNo?: string;
  receiptDate?: string;
  manufacturerName?: string;
  workflowInsights?: {
    currentStatus?: string;
    rejectionReason?: string | null;
  } | null;
};

/** Seed details context from a list row (pre-fetch). */
export const buildDetailsRowFromListRow = (
  row: RawMaterialLotListRow,
  lotId: string,
): RawMaterialLotDetailsContext => ({
  lotId,
  sourcingId: row.sourcingId,
  materialCode: row.materialCode,
  materialName: row.materialName,
  grade: row.grade ?? null,
  supplyOrderNo: row.supplyOrderNo,
  receiptDate: row.receiptDate,
  manufacturerName: row.manufacturerName,
  rmStatus: row.rmStatus,
  createdBy: row.createdBy,
  createdOn: row.createdOn,
  rejectionReason: row?.rejectionReason,
});

/** Refresh details context after a successful lot-details fetch. */
export const buildDetailsRowFromLotModel = (
  model: LotDetailsModel,
  row: RawMaterialLotListRow,
  lotId: string,
): RawMaterialLotDetailsContext => {
  const wf = model.workflowInsights;
  return {
    lotId: model.lotId || lotId,
    sourcingId: row.sourcingId,
    materialCode: model.materialCode || row.materialCode,
    materialName: row.materialName,
    grade:
      row.grade ??
      (model.grade ? { gradeId: 0, gradeCode: model.grade, gradeName: model.grade } : null),
    supplyOrderNo: model.supplyOrderNo || row.supplyOrderNo,
    receiptDate: model.receiptDate || row.receiptDate,
    manufacturerName: model.manufacturerName || row.manufacturerName,
    rmStatus: normalizeRawMaterialLotListStatus(wf?.currentStatus || row.rmStatus),
    createdBy: row.createdBy,
    createdOn: row.createdOn,
    rejectionReason: wf?.rejectionReason ?? null,
  };
};

/** 404 → DETAILS_NOT_FOUND; otherwise DETAILS_FETCH_ERROR. */
export const resolveLotDetailsFetchErrorFallback = (statusCode?: number) =>
  statusCode === 404
    ? STRINGS.SOURCING.SPECIFICATION_FORM.DETAILS_NOT_FOUND
    : STRINGS.SOURCING.SPECIFICATION_FORM.DETAILS_FETCH_ERROR;
