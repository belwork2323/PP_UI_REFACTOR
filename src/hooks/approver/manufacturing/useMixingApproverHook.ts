import { useCallback, useMemo, useState } from "react";

import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { normalizeApproverBatchStatus } from "../../../data/models/approver/ApproverBatchListModel";
import mixingApproverController from "../../../controllers/approver/mixingApproverController";
import mixingController from "../../../controllers/user/manufacturing/mixingController";
import type { ApproverChangeStatusPayload } from "../../../data/api/approver/approverApi";
import type { MixingApproverMixCardChangeStatusPayload } from "../../../data/api/approver/mixingApproverApi";
import {
  buildMixingApproverCards,
  canApproverActionEntireMixingForm,
  getMixingBatchStatusLabel,
  isMixCardApproverTabDisabled,
  mapMixingDetailsForDisplay,
  type MixingDetailView,
} from "../../../data/models/user/MixingFormModel";
import useApproverFormAction from "../useApproverFormAction";

const DEPARTMENT = "manufacturing" as const;
const SUB_DEPARTMENT = "mixing";
const S = STRINGS.MANUFACTURING.MIXING;

type ApproverListRow = Record<string, unknown> & {
  id?: number | string;
  formId?: string | null;
  batchId?: string | null;
  status?: string | null;
  mxStatus?: string | null;
  detailView?: MixingDetailView | null;
};

const resolveInitialApproverMixCardId = (
  detailView: MixingDetailView | null | undefined,
): string | null => {
  const mixCards = buildMixingApproverCards(detailView);
  const waitingCard = mixCards.find(
    (card) => card.mixCardSubmissionStatus === "WAITING_FOR_APPROVAL",
  );
  if (waitingCard) return waitingCard.mixCardId;

  const viewableCard = mixCards.find(
    (card) => !isMixCardApproverTabDisabled(card.mixCardSubmissionStatus),
  );
  return viewableCard?.mixCardId ?? null;
};

export const useMixingApproverHook = () => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<ApproverListRow[]>([]);
  const [selected, setSelected] = useState<ApproverListRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeMixCardId, setActiveMixCardId] = useState<string | null>(null);

  const subDepartmentId = useMemo(() => {
    const match =
      user?.allSubDepartments?.find(
        (item) => item.slugs?.dept === "manufacturing" && item.slugs?.subDept === SUB_DEPARTMENT,
      ) ??
      user?.allSubDepartments?.find((item) => item.slugs?.subDept === SUB_DEPARTMENT);
    return match?.subDepartmentId ?? null;
  }, [user]);

  const activeMixCard = useMemo(() => {
    const mixCards = buildMixingApproverCards(selected?.detailView);
    return mixCards.find((card) => card.mixCardId === activeMixCardId) ?? null;
  }, [selected?.detailView, activeMixCardId]);

  const refreshSelectedDetails = useCallback(
    async (formId: string) => {
      if (!subDepartmentId) return null;
      const response = await mixingController.fetchFormDetails({
        formId,
        subDepartmentId,
      });
      if (!response?.success || !response?.data) return null;
      return mapMixingDetailsForDisplay(response.data as unknown as Record<string, unknown>);
    },
    [subDepartmentId],
  );

  const submitMixCardChangeStatus = useCallback(
    async (payload: Record<string, unknown>) =>
      mixingApproverController.submitMixCardStatusChange({
        formId: String(payload.formId ?? ""),
        stageType: String(payload.stageType ?? "PREMIX") as "PREMIX" | "FINAL_MIX",
        premixNo: Number(payload.premixNo ?? 0),
        subDepartmentId: Number(payload.subDepartmentId ?? 0),
        actionType: payload.actionType as MixingApproverMixCardChangeStatusPayload["actionType"],
        remarks: (payload.remarks as string | null | undefined) ?? null,
        rejectionReason: (payload.rejectionReason as string | null | undefined) ?? null,
      }),
    [],
  );

  const submitFormChangeStatus = useCallback(
    async (payload: Record<string, unknown>) =>
      mixingApproverController.submitFormStatusChange({
        formId: String(payload.formId ?? ""),
        subDepartmentId: Number(payload.subDepartmentId ?? 0),
        actionType: payload.actionType as ApproverChangeStatusPayload["actionType"],
        remarks: (payload.remarks as string | null | undefined) ?? null,
        rejectionReason: (payload.rejectionReason as string | null | undefined) ?? null,
      }),
    [],
  );

  const {
    dialogProps: mixCardDialogBaseProps,
    requestApprove: requestMixCardApproveAction,
    requestReject: requestMixCardRejectAction,
  } = useApproverFormAction({
    department: DEPARTMENT,
    setItems,
    setSelected,
    subDepartment: SUB_DEPARTMENT,
    submitChangeStatus: submitMixCardChangeStatus,
    buildChangeStatusPayload: () => ({
      stageType: activeMixCard?.stageType,
      premixNo: Number(activeMixCard?.cardNo ?? 0) || undefined,
    }),
    onStatusChangeSuccess: async (item, response) => {
      const formId = String(item.formId ?? "").trim();
      if (!formId) return;

      const refreshed = await refreshSelectedDetails(formId);
      if (!refreshed) return;

      const nextMixCardId = resolveInitialApproverMixCardId(refreshed);
      setActiveMixCardId(nextMixCardId);

      const batchStatus = normalizeApproverBatchStatus(
        (response.data as { batchStatus?: string })?.batchStatus ??
          (response.data as { status?: string })?.status ??
          refreshed.status,
      );

      setSelected((current) =>
        current
          ? {
              ...current,
              status: batchStatus || current.status,
              detailView: refreshed,
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
          (response.data as { status?: string })?.status ??
          refreshed?.status,
      );

      setSelected((current) =>
        current
          ? {
              ...current,
              status: batchStatus || current.status,
              detailView: refreshed ?? current.detailView,
            }
          : current,
      );
    },
    closeSelectedOnSuccess: true,
  });

  const mixCardDialogProps = useMemo(
    () => ({
      ...mixCardDialogBaseProps,
      batchId:
        activeMixCard?.label && mixCardDialogBaseProps.batchId
          ? `${mixCardDialogBaseProps.batchId} · ${activeMixCard.label}`
          : mixCardDialogBaseProps.batchId,
    }),
    [activeMixCard?.label, mixCardDialogBaseProps],
  );

  const handleViewDetails = async (row: ApproverListRow) => {
    setSelected({ ...row });
    setDetailsLoading(true);
    setActiveMixCardId(null);

    const formId = String(row?.formId ?? "").trim();

    if (!formId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    if (!subDepartmentId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.SUB_DEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    const response = await mixingController.fetchFormDetails({
      formId,
      subDepartmentId,
    });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      const fallback =
        response?.statusCode === 404 ? S.DETAILS_NOT_FOUND : S.DETAILS_FETCH_ERROR;
      showAlert(response?.message || fallback, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    const detailView = mapMixingDetailsForDisplay(
      response.data as unknown as Record<string, unknown>,
    );

    setActiveMixCardId(resolveInitialApproverMixCardId(detailView));

    setSelected({
      ...row,
      formId: detailView?.formId || formId,
      batchId: detailView?.batchId || row.batchId,
      status:
        detailView?.status ??
        getMixingBatchStatusLabel((response.data as { status?: unknown })?.status) ??
        row.status ??
        row.mxStatus,
      detailView,
    });
  };

  const handleCloseDetail = () => {
    if (detailsLoading) return;
    setSelected(null);
    setActiveMixCardId(null);
  };

  const handleActiveMixCardChange = useCallback((mixCardId: string) => {
    setActiveMixCardId(mixCardId);
  }, []);

  const requestApprove = useCallback(
    (item: ApproverListRow) => {
      if (!activeMixCard || activeMixCard.mixCardSubmissionStatus !== "WAITING_FOR_APPROVAL") {
        showAlert(S.MIX_CARD_APPROVER_SELECT_WAITING, "warning", { autoCloseMs: 3000 });
        return;
      }
      requestMixCardApproveAction(item);
    },
    [activeMixCard, requestMixCardApproveAction, showAlert],
  );

  const requestReject = useCallback(
    (item: ApproverListRow) => {
      if (!activeMixCard || activeMixCard.mixCardSubmissionStatus !== "WAITING_FOR_APPROVAL") {
        showAlert(S.MIX_CARD_APPROVER_SELECT_WAITING, "warning", { autoCloseMs: 3000 });
        return;
      }
      requestMixCardRejectAction(item);
    },
    [activeMixCard, requestMixCardRejectAction, showAlert],
  );

  const requestFormApprove = useCallback(
    (item: ApproverListRow) => {
      if (
        !canApproverActionEntireMixingForm({
          formSubmissionType: item.detailView?.formSubmissionType,
          status: item.detailView?.status ?? item.status,
          mixCards: buildMixingApproverCards(item.detailView),
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
        !canApproverActionEntireMixingForm({
          formSubmissionType: item.detailView?.formSubmissionType,
          status: item.detailView?.status ?? item.status,
          mixCards: buildMixingApproverCards(item.detailView),
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
    activeMixCardId,
    dialogProps: mixCardDialogProps,
    formDialogProps,
    actionLoading: mixCardDialogBaseProps.submitting || formDialogProps.submitting,
    requestApprove,
    requestReject,
    requestFormApprove,
    requestFormReject,
    handleViewDetails,
    handleCloseDetail,
    handleActiveMixCardChange,
  };
};

export default useMixingApproverHook;
