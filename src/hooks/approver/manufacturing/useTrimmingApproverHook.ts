import { useCallback, useMemo, useState } from "react";

import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { normalizeApproverBatchStatus } from "../../../data/models/approver/ApproverBatchListModel";
import trimmingApproverController from "../../../controllers/approver/trimmingApproverController";
import trimmingController from "../../../controllers/user/manufacturing/trimmingController";
import type { ApproverChangeStatusPayload } from "../../../data/api/approver/approverApi";
import type { TrimmingApproverMotorChangeStatusPayload } from "../../../data/api/approver/trimmingApproverApi";
import {
  canApproverActionEntireTrimmingForm,
  getTrimmingBatchStatusLabel,
  isTrimmingMotorApproverTabDisabled,
  mapTrimmingDetailsForDisplay,
  type TrimmingDetailView,
} from "../../../data/models/user/TrimmingFormModel";
import useApproverFormAction from "../useApproverFormAction";

const DEPARTMENT = "manufacturing" as const;
const SUB_DEPARTMENT = "trimming";
const S = STRINGS.MANUFACTURING.TRIMMING;

type ApproverListRow = Record<string, unknown> & {
  id?: number | string;
  formId?: string | null;
  batchId?: string | null;
  status?: string | null;
  trStatus?: string | null;
  detailView?: TrimmingDetailView | null;
};

const resolveInitialApproverMotorId = (
  motors: TrimmingDetailView["motors"],
): string | null => {
  const waitingMotor = motors.find(
    (motor) => motor.motorSubmissionStatus === "WAITING_FOR_APPROVAL",
  );
  if (waitingMotor) return waitingMotor.motorId;

  const viewableMotor = motors.find(
    (motor) => !isTrimmingMotorApproverTabDisabled(motor.motorSubmissionStatus),
  );
  return viewableMotor?.motorId ?? null;
};

export const useTrimmingApproverHook = () => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<ApproverListRow[]>([]);
  const [selected, setSelected] = useState<ApproverListRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeMotorId, setActiveMotorId] = useState<string | null>(null);

  const subDepartmentId = useMemo(() => {
    const match =
      user?.allSubDepartments?.find(
        (item) => item.slugs?.dept === "manufacturing" && item.slugs?.subDept === SUB_DEPARTMENT,
      ) ??
      user?.allSubDepartments?.find((item) => item.slugs?.subDept === SUB_DEPARTMENT);
    return match?.subDepartmentId ?? null;
  }, [user]);

  const refreshSelectedDetails = useCallback(async (formId: string) => {
    const response = await trimmingController.fetchFormDetails({ formId });
    if (!response?.success || !response?.data) return null;
    return mapTrimmingDetailsForDisplay(response.data as unknown as Record<string, unknown>);
  }, []);

  const submitMotorChangeStatus = useCallback(
    async (payload: Record<string, unknown>) =>
      trimmingApproverController.submitMotorStatusChange({
        formId: String(payload.formId ?? ""),
        motorId: String(payload.motorId ?? ""),
        subDepartmentId: Number(payload.subDepartmentId ?? 0),
        actionType: payload.actionType as TrimmingApproverMotorChangeStatusPayload["actionType"],
        remarks: (payload.remarks as string | null | undefined) ?? null,
        rejectionReason: (payload.rejectionReason as string | null | undefined) ?? null,
      }),
    [],
  );

  const submitFormChangeStatus = useCallback(
    async (payload: Record<string, unknown>) =>
      trimmingApproverController.submitFormStatusChange({
        formId: String(payload.formId ?? ""),
        subDepartmentId: Number(payload.subDepartmentId ?? 0),
        actionType: payload.actionType as ApproverChangeStatusPayload["actionType"],
        remarks: (payload.remarks as string | null | undefined) ?? null,
        rejectionReason: (payload.rejectionReason as string | null | undefined) ?? null,
      }),
    [],
  );

  const {
    dialogProps: motorDialogBaseProps,
    requestApprove: requestMotorApproveAction,
    requestReject: requestMotorRejectAction,
  } = useApproverFormAction({
    department: DEPARTMENT,
    setItems,
    setSelected,
    subDepartment: SUB_DEPARTMENT,
    statusField: "trStatus",
    submitChangeStatus: submitMotorChangeStatus,
    buildChangeStatusPayload: () => ({
      motorId: activeMotorId ?? undefined,
    }),
    onStatusChangeSuccess: async (item, response) => {
      const formId = String(item.formId ?? "").trim();
      if (!formId) return;

      const refreshed = await refreshSelectedDetails(formId);
      if (!refreshed) return;

      const nextMotorId = resolveInitialApproverMotorId(refreshed.motors);
      setActiveMotorId(nextMotorId);

      const batchStatus = normalizeApproverBatchStatus(
        (response.data as { batchStatus?: string })?.batchStatus ||
          (response.data as { status?: string })?.status ||
          refreshed.status ||
          "",
      );

      setSelected((current) =>
        current
          ? {
              ...current,
              status: batchStatus || current.status,
              trStatus: batchStatus || current.trStatus,
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
    statusField: "trStatus",
    submitChangeStatus: submitFormChangeStatus,
    onStatusChangeSuccess: async (item, response) => {
      const formId = String(item.formId ?? "").trim();
      if (!formId) return;

      const refreshed = await refreshSelectedDetails(formId);
      const batchStatus = normalizeApproverBatchStatus(
        (response.data as { batchStatus?: string })?.batchStatus ||
          (response.data as { status?: string })?.status ||
          refreshed?.status ||
          "",
      );

      setSelected((current) =>
        current
          ? {
              ...current,
              status: batchStatus || current.status,
              trStatus: batchStatus || current.trStatus,
              detailView: refreshed ?? current.detailView,
            }
          : current,
      );
    },
    closeSelectedOnSuccess: true,
  });

  const motorDialogProps = useMemo(
    () => ({
      ...motorDialogBaseProps,
      batchId:
        activeMotorId && motorDialogBaseProps.batchId
          ? `${motorDialogBaseProps.batchId} · ${activeMotorId}`
          : motorDialogBaseProps.batchId,
    }),
    [activeMotorId, motorDialogBaseProps],
  );

  const handleViewDetails = async (row: ApproverListRow) => {
    setSelected({ ...row });
    setDetailsLoading(true);
    setActiveMotorId(null);

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

    const response = await trimmingController.fetchFormDetails({ formId });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      const fallback =
        response?.statusCode === 404 ? S.DETAILS_NOT_FOUND : S.DETAILS_FETCH_ERROR;
      showAlert(response?.message || fallback, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    const detailView = mapTrimmingDetailsForDisplay(
      response.data as unknown as Record<string, unknown>,
    );

    setActiveMotorId(resolveInitialApproverMotorId(detailView?.motors ?? []));

    const nextStatus =
      detailView?.status ||
      getTrimmingBatchStatusLabel((response.data as { status?: unknown })?.status) ||
      getTrimmingBatchStatusLabel((response.data as { trStatus?: unknown })?.trStatus) ||
      row.trStatus ||
      row.status ||
      "";

    const isWaitingForComplete = (() => {
      const upper = String(nextStatus).trim().toUpperCase().replace(/\s+/g, "_");
      return upper === "WAITING_FOR_COMPLETE_APPROVAL";
    })();

    const enrichedDetailView = detailView
      ? {
          ...detailView,
          status: detailView.status || String(nextStatus),
          formSubmissionType:
            detailView.formSubmissionType ||
            (isWaitingForComplete ? "SUBMIT" : detailView.formSubmissionType),
        }
      : null;

    setSelected({
      ...row,
      formId: enrichedDetailView?.formId || formId,
      batchId: enrichedDetailView?.batchId || row.batchId,
      status: nextStatus,
      trStatus: nextStatus,
      detailView: enrichedDetailView,
    });
  };

  const handleCloseDetail = () => {
    if (detailsLoading) return;
    setSelected(null);
    setActiveMotorId(null);
  };

  const handleActiveMotorChange = useCallback((motorId: string) => {
    setActiveMotorId(motorId);
  }, []);

  const requestMotorApprove = useCallback(
    (item: ApproverListRow) => {
      if (!activeMotorId) {
        showAlert(S.MOTOR_LOCKED_WAITING, "warning", { autoCloseMs: 3000 });
        return;
      }

      const activeMotor = item.detailView?.motors.find(
        (motor) => motor.motorId === activeMotorId,
      );
      if (!activeMotor || activeMotor.motorSubmissionStatus !== "WAITING_FOR_APPROVAL") {
        showAlert(S.MOTOR_LOCKED_WAITING, "warning", { autoCloseMs: 3000 });
        return;
      }
      requestMotorApproveAction(item);
    },
    [activeMotorId, requestMotorApproveAction, showAlert],
  );

  const requestMotorReject = useCallback(
    (item: ApproverListRow) => {
      if (!activeMotorId) {
        showAlert(S.MOTOR_LOCKED_WAITING, "warning", { autoCloseMs: 3000 });
        return;
      }

      const activeMotor = item.detailView?.motors.find(
        (motor) => motor.motorId === activeMotorId,
      );
      if (!activeMotor || activeMotor.motorSubmissionStatus !== "WAITING_FOR_APPROVAL") {
        showAlert(S.MOTOR_LOCKED_WAITING, "warning", { autoCloseMs: 3000 });
        return;
      }
      requestMotorRejectAction(item);
    },
    [activeMotorId, requestMotorRejectAction, showAlert],
  );

  const requestFormApprove = useCallback(
    (item: ApproverListRow) => {
      if (
        !canApproverActionEntireTrimmingForm({
          formSubmissionType: item.detailView?.formSubmissionType,
          status: item.detailView?.status ?? item.trStatus ?? item.status,
          motors: item.detailView?.motors,
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
        !canApproverActionEntireTrimmingForm({
          formSubmissionType: item.detailView?.formSubmissionType,
          status: item.detailView?.status ?? item.trStatus ?? item.status,
          motors: item.detailView?.motors,
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
    activeMotorId,
    dialogProps: motorDialogProps,
    formDialogProps,
    actionLoading: motorDialogBaseProps.submitting || formDialogProps.submitting,
    requestApprove: requestMotorApprove,
    requestReject: requestMotorReject,
    requestFormApprove,
    requestFormReject,
    handleViewDetails,
    handleCloseDetail,
    handleActiveMotorChange,
  };
};

export default useTrimmingApproverHook;
