import { useCallback, useMemo, useState } from "react";

import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { normalizeApproverBatchStatus } from "../../../data/models/approver/ApproverBatchListModel";
import rawMaterialPreparationApproverController from "../../../controllers/approver/rawMaterialPreparationApproverController";
import rawMaterialPreparationController from "../../../controllers/user/manufacturing/rawMaterialPreparationController";
import type { ApproverChangeStatusPayload } from "../../../data/api/approver/approverApi";
import type { RmpApproverPremixChangeStatusPayload } from "../../../data/api/approver/rawMaterialPreparationApproverApi";
import {
  canApproverActionEntireRawMaterialPrepForm,
  isPremixApproverTabDisabled,
  mapRawMaterialPreparationDetailsForDisplay,
  getRawMaterialPrepBatchStatusLabel,
  type RawMaterialPreparationDetails,
  type RawMaterialPrepApproverDetailView,
} from "../../../data/models/user/RawMaterialPreparationModel";
import useApproverFormAction from "../useApproverFormAction";
import { applyApproverSubdepartmentBatchListClientFilters } from "../useApproverSubdepartmentBatchListFilters";

const DEPARTMENT = "manufacturing" as const;
const SUB_DEPARTMENT = "raw-material-prep";
const S = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;

export type RawMaterialPrepApproverAppliedFilters =
  import("../useApproverSubdepartmentBatchListFilters").ApproverSubdepartmentBatchListAppliedFilters;

type ApproverListRow = Record<string, unknown> & {
  id?: number | string;
  formId?: string | null;
  batchId?: string | null;
  status?: string | null;
  detailView?: RawMaterialPrepApproverDetailView | null;
  weightmentSheet?: unknown;
};

export const applyRawMaterialPrepApproverClientFilters = applyApproverSubdepartmentBatchListClientFilters;

const resolveInitialApproverPremixNo = (
  premixes: RawMaterialPrepApproverDetailView["premixes"],
) => {
  const waitingPremix = premixes.find(
    (premix) => premix.premixSubmissionStatus === "WAITING_FOR_APPROVAL",
  );
  if (waitingPremix) return waitingPremix.premixNo;

  const viewablePremix = premixes.find(
    (premix) => !isPremixApproverTabDisabled(premix.premixSubmissionStatus),
  );
  return viewablePremix?.premixNo ?? null;
};

export const useRawMaterialPreparationApproverHook = () => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const [items, setItems] = useState<ApproverListRow[]>([]);
  const [selected, setSelected] = useState<ApproverListRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activePremixNo, setActivePremixNo] = useState<number | null>(null);

  const refreshSelectedDetails = useCallback(async (formId: string) => {
    const response = await rawMaterialPreparationController.fetchFormDetails({ formId });
    if (!response?.success || !response?.data) return null;

    return mapRawMaterialPreparationDetailsForDisplay(
      response.data as RawMaterialPreparationDetails,
    );
  }, []);

  const submitPremixChangeStatus = useCallback(
    async (payload: Record<string, unknown>) =>
      rawMaterialPreparationApproverController.submitPremixStatusChange({
        formId: String(payload.formId ?? ""),
        premixNo: Number(payload.premixNo ?? 0),
        subDepartmentId: Number(payload.subDepartmentId ?? 0),
        actionType: payload.actionType as RmpApproverPremixChangeStatusPayload["actionType"],
        remarks: (payload.remarks as string | null | undefined) ?? null,
        rejectionReason: (payload.rejectionReason as string | null | undefined) ?? null,
      }),
    [],
  );

  const submitFormChangeStatus = useCallback(
    async (payload: Record<string, unknown>) =>
      rawMaterialPreparationApproverController.submitFormStatusChange({
        formId: String(payload.formId ?? ""),
        subDepartmentId: Number(payload.subDepartmentId ?? 0),
        actionType: payload.actionType as ApproverChangeStatusPayload["actionType"],
        remarks: (payload.remarks as string | null | undefined) ?? null,
        rejectionReason: (payload.rejectionReason as string | null | undefined) ?? null,
      }),
    [],
  );

  const {
    dialogProps: premixDialogBaseProps,
    requestApprove: requestPremixApproveAction,
    requestReject: requestPremixRejectAction,
  } = useApproverFormAction({
    department: DEPARTMENT,
    setItems,
    setSelected,
    subDepartment: SUB_DEPARTMENT,
    submitChangeStatus: submitPremixChangeStatus,
    buildChangeStatusPayload: () => ({
      premixNo: activePremixNo ?? undefined,
    }),
    onStatusChangeSuccess: async (item, response) => {
      const formId = String(item.formId ?? "").trim();
      if (!formId) return;

      const refreshed = await refreshSelectedDetails(formId);
      if (!refreshed?.detailView) return;

      const nextPremixNo = resolveInitialApproverPremixNo(refreshed.detailView.premixes);
      setActivePremixNo(nextPremixNo);

      const batchStatus = normalizeApproverBatchStatus(
        (response.data as { batchStatus?: string })?.batchStatus ??
          (response.data as { status?: string })?.status,
      );

      setSelected((current) =>
        current
          ? {
              ...current,
              status: batchStatus || current.status,
              detailView: refreshed.detailView,
              weightmentSheet: refreshed.weightmentSheet,
            }
          : current,
      );
    },
    closeSelectedOnSuccess: false,
  });

  const {
    dialogProps: formDialogProps,
    requestApprove: requestFormApproveAction,
    requestReject: requestFormRejectAction,
  } = useApproverFormAction({
    department: DEPARTMENT,
    setItems,
    setSelected,
    subDepartment: SUB_DEPARTMENT,
    submitChangeStatus: submitFormChangeStatus,
    onStatusChangeSuccess: async (item, response) => {
      const formId = String(item.formId ?? "").trim();
      if (!formId) return;

      const refreshed = await refreshSelectedDetails(formId);
      const batchStatus = normalizeApproverBatchStatus(
        (response.data as { batchStatus?: string })?.batchStatus ??
          (response.data as { status?: string })?.status,
      );

      setSelected((current) =>
        current
          ? {
              ...current,
              status: batchStatus || current.status,
              detailView: refreshed?.detailView ?? current.detailView,
              weightmentSheet: refreshed?.weightmentSheet ?? current.weightmentSheet,
            }
          : current,
      );
    },
    closeSelectedOnSuccess: true,
  });

  const premixDialogProps = useMemo(
    () => ({
      ...premixDialogBaseProps,
      batchId:
        activePremixNo && premixDialogBaseProps.batchId
          ? `${premixDialogBaseProps.batchId} · Premix ${activePremixNo}`
          : premixDialogBaseProps.batchId,
    }),
    [activePremixNo, premixDialogBaseProps],
  );

  const handleViewDetails = async (row: ApproverListRow) => {
    setSelected({ ...row });
    setDetailsLoading(true);
    setActivePremixNo(null);

    const formId = String(row?.formId ?? "").trim();

    if (!formId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    const response = await rawMaterialPreparationController.fetchFormDetails({ formId });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      const fallback =
        response?.statusCode === 404 ? S.DETAILS_NOT_FOUND : S.DETAILS_FETCH_ERROR;
      showAlert(response?.message || fallback, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    const { detailView, weightmentSheet } = mapRawMaterialPreparationDetailsForDisplay(
      response.data as RawMaterialPreparationDetails,
    );

    setActivePremixNo(resolveInitialApproverPremixNo(detailView?.premixes ?? []));

    setSelected({
      ...row,
      formId: detailView?.formId || formId,
      batchId: detailView?.batchId || row.batchId,
      status: detailView?.status ?? getRawMaterialPrepBatchStatusLabel(response.data.status) ?? row.status,
      detailView,
      weightmentSheet,
    });
  };

  const handleCloseDetail = () => {
    if (detailsLoading) return;
    setSelected(null);
    setActivePremixNo(null);
  };

  const handleActivePremixChange = useCallback((premixNo: number) => {
    setActivePremixNo(premixNo);
  }, []);

  const requestPremixApprove = useCallback(
    (item: ApproverListRow) => {
      if (!activePremixNo) {
        showAlert(S.PREMIX_LOCKED_WAITING, "warning", { autoCloseMs: 3000 });
        return;
      }

      const activePremix = item.detailView?.premixes.find(
        (premix) => premix.premixNo === activePremixNo,
      );
      if (!activePremix || activePremix.premixSubmissionStatus !== "WAITING_FOR_APPROVAL") {
        showAlert(S.PREMIX_LOCKED_WAITING, "warning", { autoCloseMs: 3000 });
        return;
      }
      requestPremixApproveAction(item);
    },
    [activePremixNo, requestPremixApproveAction, showAlert],
  );

  const requestPremixReject = useCallback(
    (item: ApproverListRow) => {
      if (!activePremixNo) {
        showAlert(S.PREMIX_LOCKED_WAITING, "warning", { autoCloseMs: 3000 });
        return;
      }

      const activePremix = item.detailView?.premixes.find(
        (premix) => premix.premixNo === activePremixNo,
      );
      if (!activePremix || activePremix.premixSubmissionStatus !== "WAITING_FOR_APPROVAL") {
        showAlert(S.PREMIX_LOCKED_WAITING, "warning", { autoCloseMs: 3000 });
        return;
      }
      requestPremixRejectAction(item);
    },
    [activePremixNo, requestPremixRejectAction, showAlert],
  );

  const requestFormApprove = useCallback(
    (item: ApproverListRow) => {
      if (
        !canApproverActionEntireRawMaterialPrepForm({
          formSubmissionType: item.detailView?.formSubmissionType,
          status: item.detailView?.status ?? item.status,
          premixes: item.detailView?.premixes,
        })
      ) {
        showAlert(S.FINAL_APPROVAL_NOT_READY, "warning", { autoCloseMs: 3000 });
        return;
      }
      requestFormApproveAction(item);
    },
    [requestFormApproveAction, showAlert],
  );

  const requestFormReject = useCallback(
    (item: ApproverListRow) => {
      if (
        !canApproverActionEntireRawMaterialPrepForm({
          formSubmissionType: item.detailView?.formSubmissionType,
          status: item.detailView?.status ?? item.status,
          premixes: item.detailView?.premixes,
        })
      ) {
        showAlert(S.FINAL_APPROVAL_NOT_READY, "warning", { autoCloseMs: 3000 });
        return;
      }
      requestFormRejectAction(item);
    },
    [requestFormRejectAction, showAlert],
  );

  return {
    items,
    selected,
    detailsLoading,
    activePremixNo,
    dialogProps: premixDialogProps,
    formDialogProps,
    actionLoading: premixDialogBaseProps.submitting || formDialogProps.submitting,
    requestApprove: requestPremixApprove,
    requestReject: requestPremixReject,
    requestFormApprove,
    requestFormReject,
    handleViewDetails,
    handleCloseDetail,
    handleActivePremixChange,
  };
};

export default useRawMaterialPreparationApproverHook;
