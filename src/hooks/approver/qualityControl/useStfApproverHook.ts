import { useCallback, useMemo, useState } from "react";

import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { STRINGS } from "../../../app/config/strings";
import { normalizeApproverBatchStatus } from "../../../data/models/approver/ApproverBatchListModel";
import stfController from "../../../controllers/user/quality_control/stfController";
import stfApproverController from "../../../controllers/approver/stfApproverController";
import type { ApproverChangeStatusPayload } from "../../../data/api/approver/approverApi";
import type { STFApproverMotorChangeStatusPayload } from "../../../data/api/approver/stfApproverApi";
import {
  canApproverActionEntireStfForm,
  isStfMotorApproverTabDisabled,
  mapStfDetailsForDisplay,
  STFDetailsModel,
  type StfDetailView,
} from "../../../data/models/user/StaticTestFacilityApiModel";
import {
  fetchStfSchema,
  mapStfSubType,
  type SchemaDocumentV2,
  type StfSubType,
} from "../../../schema-engine";
import useApproverFormAction from "../useApproverFormAction";

const DEPARTMENT = "qualityControl" as const;
const SUB_DEPARTMENT = "static-test-facility";
const S = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;

type ApproverListRow = Record<string, unknown> & {
  id?: number | string;
  formId?: string | null;
  batchId?: string | null;
  batchType?: string | null;
  status?: string | null;
  stfStatus?: string | null;
  detailView?: StfDetailView | null;
};

type StfSchemasBySubType = Partial<Record<StfSubType, SchemaDocumentV2 | null>>;

const collectMotorSubTypes = (details: Record<string, unknown> | null | undefined): StfSubType[] => {
  const root = details ?? {};
  const motors = Array.isArray(root.motors) ? root.motors : [];
  const types = new Set<StfSubType>();
  motors.forEach((motor) => {
    const entry = motor as { subType?: string };
    types.add(mapStfSubType(entry?.subType));
  });
  if (types.size === 0) types.add("MAIN_MOTOR");
  return Array.from(types);
};

const resolveInitialApproverMotorId = (motors: StfDetailView["motors"]): string | null => {
  const waitingMotor = motors.find(
    (motor) => motor.motorSubmissionStatus === "WAITING_FOR_APPROVAL",
  );
  if (waitingMotor) return waitingMotor.motorId;

  const viewableMotor = motors.find(
    (motor) => !isStfMotorApproverTabDisabled(motor.motorSubmissionStatus),
  );
  return viewableMotor?.motorId ?? null;
};

export const useStfApproverHook = () => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<ApproverListRow[]>([]);
  const [selected, setSelected] = useState<ApproverListRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeMotorId, setActiveMotorId] = useState<string | null>(null);

  const subDepartmentId = useMemo(() => {
    const match =
      user?.allSubDepartments?.find(
        (item) => item.slugs?.dept === "quality" && item.slugs?.subDept === SUB_DEPARTMENT,
      ) ?? user?.allSubDepartments?.find((item) => item.slugs?.subDept === SUB_DEPARTMENT);
    return match?.subDepartmentId ?? null;
  }, [user]);

  const loadSchemasForDetails = useCallback(
    async (details: Record<string, unknown>): Promise<StfSchemasBySubType> => {
      if (!subDepartmentId) return {};

      const subTypes = collectMotorSubTypes(details);
      const entries = await Promise.all(
        subTypes.map(async (subType) => {
          try {
            const response = await fetchStfSchema({ subDepartmentId, subType });
            const schema =
              response?.success && response.data
                ? (response.data as SchemaDocumentV2)
                : null;
            return [subType, schema] as const;
          } catch {
            return [subType, null] as const;
          }
        }),
      );

      return Object.fromEntries(entries) as StfSchemasBySubType;
    },
    [subDepartmentId],
  );

  const mapDetailsWithSchema = useCallback(
    async (detailsPayload: unknown) => {
      const detailsModel =
        detailsPayload instanceof STFDetailsModel
          ? detailsPayload
          : STFDetailsModel.fromApi({ data: detailsPayload });
      const plain = STFDetailsModel.toPlainRecord(detailsModel);
      if (!plain) return null;

      const schemasBySubType = await loadSchemasForDetails(plain);
      return mapStfDetailsForDisplay(plain, schemasBySubType);
    },
    [loadSchemasForDetails],
  );

  const refreshSelectedDetails = useCallback(
    async (formId: string) => {
      if (!subDepartmentId) return null;
      const response = await stfController.fetchFormDetails({ formId, subDepartmentId });
      if (!response?.success || !response?.data) return null;
      return mapDetailsWithSchema(response.data);
    },
    [mapDetailsWithSchema, subDepartmentId],
  );

  const submitMotorChangeStatus = useCallback(
    async (payload: Record<string, unknown>) =>
      stfApproverController.submitMotorStatusChange({
        formId: String(payload.formId ?? ""),
        motorId: String(payload.motorId ?? ""),
        subDepartmentId: Number(payload.subDepartmentId ?? 0),
        actionType: payload.actionType as STFApproverMotorChangeStatusPayload["actionType"],
        remarks: (payload.remarks as string | null | undefined) ?? null,
        rejectionReason: (payload.rejectionReason as string | null | undefined) ?? null,
      }),
    [],
  );

  const submitFormChangeStatus = useCallback(
    async (payload: Record<string, unknown>) =>
      stfApproverController.submitFormStatusChange({
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
    statusField: "stfStatus",
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
              stfStatus: batchStatus || current.stfStatus,
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
    statusField: "stfStatus",
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
              stfStatus: batchStatus || current.stfStatus,
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

    const response = await stfController.fetchFormDetails({ formId, subDepartmentId });

    setDetailsLoading(false);

    if (!response?.success || !response?.data) {
      const fallback =
        response?.statusCode === 404 ? S.DETAILS_NOT_FOUND : S.DETAILS_FETCH_ERROR;
      showAlert(response?.message || fallback, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    const detailView = await mapDetailsWithSchema(response.data);
    if (!detailView) {
      showAlert(S.DETAILS_FETCH_ERROR, "error", { autoCloseMs: 3500 });
      setSelected(null);
      return;
    }

    setActiveMotorId(resolveInitialApproverMotorId(detailView.motors));

    const nextStatus =
      detailView.status ||
      String((response.data as { formStatus?: unknown })?.formStatus ?? "") ||
      String(row.stfStatus ?? row.status ?? "");

    const isWaitingForComplete = (() => {
      const upper = String(nextStatus).trim().toUpperCase().replace(/\s+/g, "_");
      return upper === "WAITING_FOR_COMPLETE_APPROVAL";
    })();

    const enrichedDetailView = {
      ...detailView,
      status: detailView.status || String(nextStatus),
      formSubmissionType:
        detailView.formSubmissionType ||
        (isWaitingForComplete ? "SUBMIT" : detailView.formSubmissionType),
    };

    setSelected({
      ...row,
      formId: enrichedDetailView.formId || formId,
      batchId: enrichedDetailView.batchId || row.batchId,
      batchType: enrichedDetailView.batchType || row.batchType,
      status: nextStatus,
      stfStatus: nextStatus,
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
        !canApproverActionEntireStfForm({
          formSubmissionType: item.detailView?.formSubmissionType,
          status: item.detailView?.status ?? item.stfStatus ?? item.status,
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
        !canApproverActionEntireStfForm({
          formSubmissionType: item.detailView?.formSubmissionType,
          status: item.detailView?.status ?? item.stfStatus ?? item.status,
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

export default useStfApproverHook;
