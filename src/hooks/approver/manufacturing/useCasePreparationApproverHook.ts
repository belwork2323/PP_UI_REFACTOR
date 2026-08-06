import { useCallback, useMemo, useState } from "react";

import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { normalizeApproverBatchStatus } from "../../../data/models/approver/ApproverBatchListModel";
import casePreparationApproverController from "../../../controllers/approver/casePreparationApproverController";
import casePreparationController from "../../../controllers/user/manufacturing/casePreparationController";
import type { ApproverChangeStatusPayload } from "../../../data/api/approver/approverApi";
import type { CasePrepApproverMotorChangeStatusPayload } from "../../../data/api/approver/casePreparationApproverApi";
import {
  canApproverActionEntireCasePrepForm,
  getCasePrepBatchStatusLabel,
  isMotorApproverTabDisabled,
  mapCasePreparationDetailsForDisplay,
  type CasePreparationDetailView,
} from "../../../data/models/user/CasePreparationFormModel";
import useApproverFormAction from "../useApproverFormAction";

const DEPARTMENT = "manufacturing" as const;
const SUB_DEPARTMENT = "case-preparation";
const S = STRINGS.MANUFACTURING.CASE_PREP;

type ApproverListRow = Record<string, unknown> & {
  id?: number | string;
  formId?: string | null;
  batchId?: string | null;
  status?: string | null;
  detailView?: CasePreparationDetailView | null;
};

const resolveInitialApproverMotorId = (
  motors: CasePreparationDetailView["motors"],
): string | null => {
  const waitingMotor = motors.find(
    (motor) => motor.motorSubmissionStatus === "WAITING_FOR_APPROVAL",
  );
  if (waitingMotor) return waitingMotor.motorId;

  const viewableMotor = motors.find(
    (motor) => !isMotorApproverTabDisabled(motor.motorSubmissionStatus),
  );
  return viewableMotor?.motorId ?? null;
};

export const useCasePreparationApproverHook = () => {
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

  const refreshSelectedDetails = useCallback(
    async (formId: string, preferredMotorIds?: Array<string | number> | null) => {
      if (!subDepartmentId) return null;
      const response = await casePreparationController.fetchFormDetails({
        formId,
        subDepartmentId,
      });
      if (!response?.success || !response?.data) return null;
      return mapCasePreparationDetailsForDisplay(
        response.data as unknown as Record<string, unknown>,
        undefined,
        { preferredMotorIds },
      );
    },
    [subDepartmentId],
  );

  const submitMotorChangeStatus = useCallback(
    async (payload: Record<string, unknown>) =>
      casePreparationApproverController.submitMotorStatusChange({
        formId: String(payload.formId ?? ""),
        motorId: String(payload.motorId ?? ""),
        subDepartmentId: Number(payload.subDepartmentId ?? 0),
        actionType: payload.actionType as CasePrepApproverMotorChangeStatusPayload["actionType"],
        remarks: (payload.remarks as string | null | undefined) ?? null,
        rejectionReason: (payload.rejectionReason as string | null | undefined) ?? null,
      }),
    [],
  );

  const submitFormChangeStatus = useCallback(
    async (payload: Record<string, unknown>) =>
      casePreparationApproverController.submitFormStatusChange({
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
    submitChangeStatus: submitMotorChangeStatus,
    buildChangeStatusPayload: () => ({
      motorId: activeMotorId ?? undefined,
    }),
    onStatusChangeSuccess: async (item, response) => {
      const formId = String(item.formId ?? "").trim();
      if (!formId) return;

      const refreshed = await refreshSelectedDetails(
        formId,
        Array.isArray(item.motorIds) ? item.motorIds : null,
      );
      if (!refreshed) return;

      const nextMotorId = resolveInitialApproverMotorId(refreshed.motors);
      setActiveMotorId(nextMotorId);

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

      const refreshed = await refreshSelectedDetails(
        formId,
        Array.isArray(item.motorIds) ? item.motorIds : null,
      );
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

    const response = await casePreparationController.fetchFormDetails({
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

    const detailView = mapCasePreparationDetailsForDisplay(
      response.data as unknown as Record<string, unknown>,
      undefined,
      {
        preferredMotorIds: Array.isArray(row.motorIds) ? row.motorIds : null,
      },
    );

    setActiveMotorId(resolveInitialApproverMotorId(detailView?.motors ?? []));

    setSelected({
      ...row,
      formId: detailView?.formId || formId,
      batchId: detailView?.batchId || row.batchId,
      status:
        detailView?.status ??
        getCasePrepBatchStatusLabel((response.data as { status?: unknown })?.status) ??
        row.status,
      detailView,
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
        !canApproverActionEntireCasePrepForm({
          formSubmissionType: item.detailView?.formSubmissionType,
          status: item.detailView?.status ?? item.status,
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
        !canApproverActionEntireCasePrepForm({
          formSubmissionType: item.detailView?.formSubmissionType,
          status: item.detailView?.status ?? item.status,
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

export default useCasePreparationApproverHook;
