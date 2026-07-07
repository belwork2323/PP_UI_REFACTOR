import { useEffect, useMemo, useState } from "react";

import { STRINGS } from "../../../app/config/strings";
import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { useApproverListRefreshStore } from "../../../app/store/approverListRefreshStore";
import {
  APPROVER_STATUS_META,
  isApproverActionableStatus,
} from "../../../app/theme/approver";
import { operationsController } from "../../../controllers/user/operationsController";
import rocketMotorCasingController from "../../../controllers/user/sourcing/rocketMotorCasingController";
import type { ApproverFormActionType } from "../../../data/api/approver/approverApi";
import { ROCKET_MOTOR_CASING_APPROVER_STATUS_TABS } from "../../../data/models/approver/RocketMotorCasingApproverModel";
import { RocketMotorCasingDetailsModel } from "../../../data/models/user/RocketMotorCasingProcurementModel";
import { submitApproverFormStatusChange } from "../../../controllers/approver/approverController";
import type { MotorStageOption } from "../../user/sourcing/useRocketMotorCasingList";
import { OPERATION_STATUS } from "../../operationStatus";
import { alpha } from "@mui/material";

const DEPARTMENT_SLUG = "sourcing";
const SUB_DEPARTMENT_SLUG = "rocket-motor";
const FILTER_ALL = STRINGS.APPROVER.COMMON.STATUS_ALL;

export type RocketMotorCasingApproverAppliedFilters = {
  motorStage: string;
  casingType: string;
  insulationType: string;
  fromDate: string;
  toDate: string;
};

const emptyAppliedFilters: RocketMotorCasingApproverAppliedFilters = {
  motorStage: "",
  casingType: "",
  insulationType: "",
  fromDate: "",
  toDate: "",
};

const S = STRINGS.SOURCING.CASING_FORM;
const A = STRINGS.APPROVER.ACTION;

const getResponseMessage = (response: { message?: string; errorCode?: string | null }) =>
  response.message || response.errorCode || A.FAILED;

const ROCKET_MOTOR_CASING_APPROVER_STATUS_META = {
  ...APPROVER_STATUS_META,
  [OPERATION_STATUS.INITIATED]: {
    bg: alpha("#5D6D7E", 0.08),
    color: "#2E4053",
    border: alpha("#5D6D7E", 0.2),
  },
  [OPERATION_STATUS.IN_PROGRESS]: {
    bg: alpha("#2E86C1", 0.1),
    color: "#1A5276",
    border: alpha("#2E86C1", 0.3),
  },
};

export const useRocketMotorCasingApproverHook = () => {
  const user = useAuthStore((state) => state.user);
  const showAlert = useAlertStore((state) => state.showAlert);
  const bumpListVersion = useApproverListRefreshStore((state) => state.bumpVersion);
  const [selected, setSelected] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [actionType, setActionType] = useState<ApproverFormActionType | null>(null);
  const [dialogItem, setDialogItem] = useState<any | null>(null);
  const [dialogValue, setDialogValue] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [appliedFilters, setAppliedFilters] =
    useState<RocketMotorCasingApproverAppliedFilters>(emptyAppliedFilters);
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);
  const [motorStageOptions, setMotorStageOptions] = useState<MotorStageOption[]>([]);
  const [motorStagesLoading, setMotorStagesLoading] = useState(false);

  const subDepartmentId = useMemo(
    () =>
      user?.allSubDepartments.find(
        (sd) => sd.slugs?.dept === DEPARTMENT_SLUG && sd.slugs?.subDept === SUB_DEPARTMENT_SLUG,
      )?.subDepartmentId ?? null,
    [user],
  );

  useEffect(() => {
    let active = true;

    const loadStages = async () => {
      if (!subDepartmentId) {
        setMotorStageOptions([]);
        return;
      }

      setMotorStagesLoading(true);
      try {
        const response = await operationsController.fetchMotorsStageList();
        if (!active) return;
        if (response?.success && response.data) {
          const stages = response.data.stages ?? [];
          setMotorStageOptions(
            stages.map((stage) => ({
              motorStage: String(stage.motorStage ?? "").trim(),
              noOfmotors: Number(stage.noOfmotors ?? 0),
            })),
          );
        } else {
          setMotorStageOptions([]);
        }
      } catch {
        if (active) setMotorStageOptions([]);
      } finally {
        if (active) setMotorStagesLoading(false);
      }
    };

    void loadStages();

    return () => {
      active = false;
    };
  }, [subDepartmentId]);

  const listFiltersRecord = useMemo(
    () => ({
      motorStage: appliedFilters.motorStage || FILTER_ALL,
      casingType: appliedFilters.casingType || FILTER_ALL,
      insulationType: appliedFilters.insulationType || FILTER_ALL,
      fromDate: appliedFilters.fromDate,
      toDate: appliedFilters.toDate,
    }),
    [appliedFilters],
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.motorStage) count += 1;
    if (appliedFilters.casingType) count += 1;
    if (appliedFilters.insulationType) count += 1;
    if (appliedFilters.fromDate) count += 1;
    if (appliedFilters.toDate) count += 1;
    if (statusFilter !== FILTER_ALL) count += 1;
    return count;
  }, [appliedFilters, statusFilter]);

  const applyPanelFilters = (
    next: RocketMotorCasingApproverAppliedFilters & { status: string },
  ) => {
    setAppliedFilters({
      motorStage: next.motorStage,
      casingType: next.casingType,
      insulationType: next.insulationType,
      fromDate: next.fromDate,
      toDate: next.toDate,
    });
    setStatusFilter(next.status || FILTER_ALL);
  };

  const clearListFilters = () => {
    setAppliedFilters(emptyAppliedFilters);
    setStatusFilter(FILTER_ALL);
  };

  const statusTabs = useMemo(() => [FILTER_ALL, ...ROCKET_MOTOR_CASING_APPROVER_STATUS_TABS], []);

  const statusDropdownValues = useMemo(
    () => [FILTER_ALL, ...ROCKET_MOTOR_CASING_APPROVER_STATUS_TABS],
    [],
  );

  const closeDialog = () => {
    if (submitting) return;
    setActionType(null);
    setDialogItem(null);
    setDialogValue("");
    setDialogError("");
  };

  const requestAction = (item: any, nextActionType: ApproverFormActionType) => {
    if (!subDepartmentId) {
      showAlert(A.SUBDEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    const motorCasingId = String(item?.motorCasingId ?? item?.batchId ?? "").trim();

    if (!motorCasingId) {
      showAlert(A.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    if (!isApproverActionableStatus(item.status)) {
      showAlert(A.INVALID_STATUS, "warning", { autoCloseMs: 3000 });
      return;
    }

    setActionType(nextActionType);
    setDialogItem(item);
    setDialogValue(
      nextActionType === "REJECTED" ? String(item.rejectionReason ?? "") : String(item.remarks ?? ""),
    );
    setDialogError("");
  };

  const handleConfirm = async () => {
    if (!dialogItem || !actionType || !subDepartmentId) return;

    const trimmedValue = dialogValue.trim();
    const motorCasingId = String(dialogItem?.motorCasingId ?? dialogItem?.batchId ?? "").trim();

    if (actionType === "REJECTED" && !trimmedValue) {
      setDialogError(A.REJECTION_REASON_REQUIRED);
      return;
    }

    if (!motorCasingId) {
      showAlert(A.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    setSubmitting(true);
    showAlert(actionType === "APPROVED" ? A.APPROVING : A.REJECTING, "info", { loading: true });

    const response = await submitApproverFormStatusChange({
      formId: motorCasingId,
      subDepartmentId,
      actionType,
      remarks: actionType === "APPROVED" ? trimmedValue || null : null,
      rejectionReason: actionType === "REJECTED" ? trimmedValue : null,
    });

    setSubmitting(false);

    if (response.success) {
      setSelected(null);
      closeDialog();
      bumpListVersion();
      showAlert(getResponseMessage(response), "success", { autoCloseMs: 2000 });
      return;
    }

    showAlert(getResponseMessage(response), "error", { autoCloseMs: 3500 });
  };

  const handleViewDetails = async (row: any) => {
    setSelected({ ...row, casingBlocks: [] });
    setDetailsLoading(true);

    const motorCasingId = String(row?.motorCasingId ?? row?.batchId ?? "").trim();
    if (!motorCasingId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    const response = await rocketMotorCasingController.fetchFormDetails({
      motorCasingId,
    });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      const err = response?.error as { details?: string } | undefined;
      showAlert(err?.details || response?.message || S.DETAILS_FETCH_ERROR, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    const model = response.data as RocketMotorCasingDetailsModel;

    setSelected({
      ...row,
      motorCasingId,
      batchId: motorCasingId,
      formId: motorCasingId,
      casingBlocks: RocketMotorCasingDetailsModel.toDetailBlocks(model),
    });
  };

  const handleCloseDetail = () => {
    if (detailsLoading) return;
    setSelected(null);
  };

  return {
    selected,
    detailsLoading,
    dialogProps: {
      actionType,
      batchId: dialogItem?.motorCasingId ?? dialogItem?.batchId ?? null,
      idLabel: STRINGS.APPROVER.ACTION.MOTOR_CASING_ID_LABEL,
      confirmDisabled: actionType === "REJECTED" ? dialogValue.trim().length === 0 : false,
      helperText: dialogError,
      onCancel: closeDialog,
      onConfirm: handleConfirm,
      onValueChange: (value: string) => {
        setDialogValue(value);
        if (dialogError) setDialogError("");
      },
      open: Boolean(actionType && dialogItem),
      submitting,
      value: dialogValue,
    },
    requestApprove: (item: any) => requestAction(item, "APPROVED"),
    requestReject: (item: any) => requestAction(item, "REJECTED"),
    handleViewDetails,
    handleCloseDetail,
    statusMeta: ROCKET_MOTOR_CASING_APPROVER_STATUS_META,
    appliedFilters,
    applyPanelFilters,
    clearListFilters,
    activeFilterCount,
    listFiltersRecord,
    motorStageOptions,
    motorStagesLoading,
    statusFilter,
    setStatusFilter,
    statusTabs,
    statusDropdownValues,
    filterAllLabel: FILTER_ALL,
  };
};

export default useRocketMotorCasingApproverHook;
