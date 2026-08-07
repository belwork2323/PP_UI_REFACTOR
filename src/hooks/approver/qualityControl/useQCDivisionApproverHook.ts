import { useCallback, useMemo, useState } from "react";

import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { STRINGS } from "../../../app/config/strings";
import { normalizeApproverBatchStatus } from "../../../data/models/approver/ApproverBatchListModel";
import qcDivisionController from "../../../controllers/user/quality_control/qcDivisionController";
import qcDivisionApproverController from "../../../controllers/approver/qcDivisionApproverController";
import type { ApproverChangeStatusPayload } from "../../../data/api/approver/approverApi";
import type {
  QcDivisionApproverDivisionChangeStatusPayload,
  QcDivisionApproverMotorChangeStatusPayload,
  QcDivisionApproverPremixChangeStatusPayload,
} from "../../../data/api/approver/qcDivisionApproverApi";
import type { QCDivisionDetailView } from "../../../data/models/user/QualityControlFormModel";
import type { QualityControlFormState } from "../../../data/models/user/QualityControlFormModel";
import { createDefaultQualityControlFormState } from "../../../data/models/user/QualityControlFormModel";
import { QCDivisionDetailsModel } from "../../../data/models/user/QCDivisionApiModel";
import useApproverFormAction from "../useApproverFormAction";
import { loadQcDivisionDetailsViewState } from "../../user/qualityControl/qcDivisionDetailsHydration";
import { buildDivisionNavGroups } from "../../user/qualityControl/qcDivisionNav";
import type { QcPartialItemStatus, QcPartialNavItem } from "../../user/qualityControl/qcDivisionApprovalUnits";
import {
  buildQcApproverDivisionRows,
  buildQcApproverFinalRows,
  buildQcApproverPartialState,
  canApproverActionEntireQcDivisionForm,
  isQcPartialItemApproverActionable,
  resolveInitialApproverPartialNavIndex,
} from "./qcDivisionApproverGuards";

const DEPARTMENT = "qualityControl" as const;
const SUB_DEPARTMENT = "qc-division";
const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

type ApproverListRow = Record<string, unknown> & {
  id?: number | string;
  formId?: string | null;
  batchId?: string | null;
  status?: string | null;
  qcDivStatus?: string | null;
  subDepartmentId?: number | null;
};

const resolveSubDepartmentId = (
  user: ReturnType<typeof useAuthStore.getState>["user"],
  row?: ApproverListRow | null,
) => {
  const fromRow = Number(row?.subDepartmentId ?? 0);
  if (fromRow > 0) return fromRow;

  const match =
    user?.allSubDepartments?.find(
      (item) => item.slugs?.dept === "quality" && item.slugs?.subDept === SUB_DEPARTMENT,
    ) ?? user?.allSubDepartments?.find((item) => item.slugs?.subDept === SUB_DEPARTMENT);

  return match?.subDepartmentId ?? null;
};

const resolveActiveDivisionKey = (
  formData: QualityControlFormState,
  groupIndex: number,
): string => {
  const groups = buildDivisionNavGroups(formData.divisionEntries ?? []);
  const safeIndex = Math.min(Math.max(groupIndex, 0), Math.max(0, groups.length - 1));
  const group = groups[safeIndex];
  if (!group) return "";
  const entries = formData.divisionEntries ?? [];
  const matching = entries.find((entry) => entry.flowKey === group.flowKey);
  return String(matching?.apiDivision ?? group.flowKey ?? "").trim();
};

export const useQCDivisionApproverHook = () => {
  const showAlert = useAlertStore((state) => state.showAlert);
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<ApproverListRow[]>([]);
  const [selected, setSelected] = useState<ApproverListRow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [detailView, setDetailView] = useState<QCDivisionDetailView | null>(null);
  const [formData, setFormData] = useState<QualityControlFormState>(
    createDefaultQualityControlFormState(),
  );
  const [activeDivisionGroupIndex, setActiveDivisionGroupIndex] = useState(0);
  const [activeDivisionSubIndex, setActiveDivisionSubIndex] = useState(0);
  const [activePartialNavIndex, setActivePartialNavIndex] = useState(0);
  const [partialNavByDivision, setPartialNavByDivision] = useState<
    Record<string, QcPartialNavItem[]>
  >({});
  const [divisionStatusByFlowKey, setDivisionStatusByFlowKey] = useState<
    Record<string, QcPartialItemStatus>
  >({});
  const [formSubmissionType, setFormSubmissionType] = useState<string>("");
  const [resolvedSubDepartmentId, setResolvedSubDepartmentId] = useState<number | null>(null);

  const subDepartmentId = useMemo(() => resolveSubDepartmentId(user), [user]);

  const activeDivisionKey = useMemo(
    () => resolveActiveDivisionKey(formData, activeDivisionGroupIndex),
    [activeDivisionGroupIndex, formData],
  );

  const partialNavItems = useMemo(
    () => partialNavByDivision[activeDivisionKey] ?? [],
    [activeDivisionKey, partialNavByDivision],
  );

  const activePartialItem = useMemo(() => {
    if (!partialNavItems.length) return null;
    const safeIndex = Math.min(
      Math.max(activePartialNavIndex, 0),
      Math.max(0, partialNavItems.length - 1),
    );
    return partialNavItems[safeIndex] ?? null;
  }, [activePartialNavIndex, partialNavItems]);

  const applyPartialState = useCallback(
    (detailsPayload: Record<string, unknown>, preferredDivision?: string) => {
      const state = buildQcApproverPartialState(detailsPayload);
      setPartialNavByDivision(state.partialNavByDivision);
      setDivisionStatusByFlowKey(state.divisionStatusByFlowKey);
      setFormSubmissionType(state.formSubmissionType);

      const divisionKey =
        preferredDivision && state.partialNavByDivision[preferredDivision]
          ? preferredDivision
          : Object.keys(state.partialNavByDivision)[0] ?? "";
      const itemsForDivision = state.partialNavByDivision[divisionKey] ?? [];
      setActivePartialNavIndex(resolveInitialApproverPartialNavIndex(itemsForDivision));
      return state;
    },
    [],
  );

  const refreshSelectedDetails = useCallback(
    async (formId: string, row?: ApproverListRow | null) => {
      const rowSubDepartmentId = resolveSubDepartmentId(user, row);
      if (!rowSubDepartmentId) return null;

      const response = await qcDivisionController.fetchFormDetails({
        formId,
        subDepartmentId: rowSubDepartmentId,
      });
      if (!response?.success || !response?.data) return null;

      const detailsModel = response.data;
      const effectiveSubDepartmentId = Number(detailsModel.subDepartmentId || rowSubDepartmentId);
      const detailsRecord =
        (QCDivisionDetailsModel.toPlainRecord(detailsModel) as Record<string, unknown> | null) ??
        {};

      const hydrated = await loadQcDivisionDetailsViewState(
        detailsModel,
        effectiveSubDepartmentId,
      );

      return {
        ...hydrated,
        effectiveSubDepartmentId,
        detailsRecord,
        status: normalizeApproverBatchStatus(
          (detailsRecord as { batchStatus?: string })?.batchStatus ??
            (detailsRecord as { status?: string })?.status ??
            (detailsRecord as { formStatus?: string })?.formStatus,
        ),
      };
    },
    [user],
  );

  const submitUnitChangeStatus = useCallback(
    async (payload: Record<string, unknown>) => {
      const kind = String(payload.unitKind ?? "").trim().toUpperCase();
      const base = {
        formId: String(payload.formId ?? ""),
        division: String(payload.division ?? ""),
        subDepartmentId: Number(payload.subDepartmentId ?? 0),
        actionType: payload.actionType as ApproverChangeStatusPayload["actionType"],
        remarks: (payload.remarks as string | null | undefined) ?? null,
        rejectionReason: (payload.rejectionReason as string | null | undefined) ?? null,
      };

      if (kind === "MOTOR") {
        return qcDivisionApproverController.submitMotorStatusChange({
          ...base,
          motorId: String(payload.motorId ?? ""),
        } as QcDivisionApproverMotorChangeStatusPayload);
      }

      if (kind === "PREMIX" || kind === "FINAL_MIX") {
        return qcDivisionApproverController.submitPremixStatusChange({
          ...base,
          premixNo: Number(payload.premixNo ?? 0),
          stageType: (kind === "FINAL_MIX" ? "FINAL_MIX" : "PREMIX") as "PREMIX" | "FINAL_MIX",
        } as QcDivisionApproverPremixChangeStatusPayload);
      }

      return qcDivisionApproverController.submitDivisionStatusChange({
        ...base,
      } as QcDivisionApproverDivisionChangeStatusPayload);
    },
    [],
  );

  const submitFormChangeStatus = useCallback(
    async (payload: Record<string, unknown>) =>
      qcDivisionApproverController.submitFormStatusChange({
        formId: String(payload.formId ?? ""),
        subDepartmentId: Number(payload.subDepartmentId ?? 0),
        actionType: payload.actionType as ApproverChangeStatusPayload["actionType"],
        remarks: (payload.remarks as string | null | undefined) ?? null,
        rejectionReason: (payload.rejectionReason as string | null | undefined) ?? null,
      }),
    [],
  );

  const syncListStatus = useCallback(
    (item: ApproverListRow, batchStatus: string) => {
      setSelected((current) =>
        current
          ? {
              ...current,
              status: batchStatus || current.status,
              qcDivStatus: batchStatus || current.qcDivStatus,
            }
          : current,
      );
      setItems((current) =>
        current.map((row) => {
          const isMatch =
            row.id === item.id ||
            (row.formId && item.formId && row.formId === item.formId) ||
            (row.batchId && item.batchId && row.batchId === item.batchId);
          if (!isMatch) return row;
          return {
            ...row,
            status: batchStatus || row.status,
            qcDivStatus: batchStatus || row.qcDivStatus,
          };
        }),
      );
    },
    [],
  );

  const {
    dialogProps: unitDialogBaseProps,
    requestApprove: requestUnitApproveAction,
    requestReject: requestUnitRejectAction,
  } = useApproverFormAction({
    department: DEPARTMENT,
    setItems,
    setSelected,
    subDepartment: SUB_DEPARTMENT,
    statusField: "qcDivStatus",
    submitChangeStatus: submitUnitChangeStatus,
    buildChangeStatusPayload: () => ({
      unitKind: activePartialItem?.kind,
      motorId: activePartialItem?.motorId,
      premixNo: activePartialItem?.finalMixNo ?? activePartialItem?.premixNo,
      division: activeDivisionKey || undefined,
    }),
    onStatusChangeSuccess: async (item, response) => {
      const formId = String(item.formId ?? "").trim();
      if (!formId) return;

      setDetailsLoading(true);
      setSchemaLoading(true);
      try {
        const refreshed = await refreshSelectedDetails(formId, item);
        if (!refreshed) return;

        const batchStatus = normalizeApproverBatchStatus(
          (response.data as { batchStatus?: string })?.batchStatus ??
            (response.data as { status?: string })?.status ??
            refreshed.status,
        );

        setResolvedSubDepartmentId(refreshed.effectiveSubDepartmentId);
        setFormData(refreshed.formData);
        setDetailView(refreshed.detailView);
        applyPartialState(refreshed.detailsRecord ?? {}, activeDivisionKey);
        syncListStatus(item, batchStatus || "");
      } finally {
        setSchemaLoading(false);
        setDetailsLoading(false);
      }
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
    statusField: "qcDivStatus",
    submitChangeStatus: submitFormChangeStatus,
    onStatusChangeSuccess: async (item, response) => {
      const formId = String(item.formId ?? "").trim();
      if (!formId) return;

      setDetailsLoading(true);
      setSchemaLoading(true);
      try {
        const refreshed = await refreshSelectedDetails(formId, item);
        const batchStatus = normalizeApproverBatchStatus(
          (response.data as { batchStatus?: string })?.batchStatus ??
            (response.data as { status?: string })?.status ??
            refreshed?.status,
        );

        if (refreshed) {
          setResolvedSubDepartmentId(refreshed.effectiveSubDepartmentId);
          setFormData(refreshed.formData);
          setDetailView(refreshed.detailView);
          applyPartialState(refreshed.detailsRecord ?? {}, activeDivisionKey);
        }
        syncListStatus(item, batchStatus || "");
      } finally {
        setSchemaLoading(false);
        setDetailsLoading(false);
      }
    },
    closeSelectedOnSuccess: true,
  });

  const unitDialogProps = useMemo(() => {
    const unitLabel = activePartialItem?.label;
    return {
      ...unitDialogBaseProps,
      batchId:
        unitLabel && unitDialogBaseProps.batchId
          ? `${unitDialogBaseProps.batchId} · ${unitLabel}`
          : unitDialogBaseProps.batchId,
    };
  }, [activePartialItem?.label, unitDialogBaseProps]);

  const handleViewDetails = async (row: ApproverListRow) => {
    setSelected({ ...row });
    setDetailView(null);
    setFormData(createDefaultQualityControlFormState());
    setActiveDivisionGroupIndex(0);
    setActiveDivisionSubIndex(0);
    setActivePartialNavIndex(0);
    setPartialNavByDivision({});
    setDivisionStatusByFlowKey({});
    setFormSubmissionType("");
    setDetailsLoading(true);
    setSchemaLoading(false);

    const formId = String(row?.formId ?? "").trim();
    const rowSubDepartmentId = resolveSubDepartmentId(user, row);

    if (!formId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.FORM_ID_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    if (!rowSubDepartmentId) {
      setDetailsLoading(false);
      setSelected(null);
      showAlert(S.SUB_DEPARTMENT_MISSING, "error", { autoCloseMs: 3000 });
      return;
    }

    try {
      const response = await qcDivisionController.fetchFormDetails({
        formId,
        subDepartmentId: rowSubDepartmentId,
      });

      if (!response?.success || !response?.data) {
        const fallback = response?.statusCode === 404 ? S.DETAILS_NOT_FOUND : S.DETAILS_FETCH_ERROR;
        showAlert(response?.message || fallback, "error", { autoCloseMs: 3500 });
        setSelected(null);
        return;
      }

      const effectiveSubDepartmentId = Number(response.data.subDepartmentId || rowSubDepartmentId);
      setResolvedSubDepartmentId(effectiveSubDepartmentId);
      setSchemaLoading(true);

      const detailsModel = response.data;
      const { formData: hydratedFormData, detailView: hydratedDetailView } =
        await loadQcDivisionDetailsViewState(detailsModel, effectiveSubDepartmentId);

      const detailsRecord =
        (QCDivisionDetailsModel.toPlainRecord(detailsModel) as Record<string, unknown> | null) ??
        {};
      const partialState = applyPartialState(detailsRecord);

      const nextStatus =
        hydratedDetailView?.status ||
        partialState.status ||
        String(row.qcDivStatus ?? row.status ?? "");

      setFormData(hydratedFormData);
      setDetailView(
        hydratedDetailView
          ? {
              ...hydratedDetailView,
              status: hydratedDetailView.status || nextStatus,
              formSubmissionType:
                hydratedDetailView.formSubmissionType ||
                partialState.formSubmissionType ||
                hydratedDetailView.formSubmissionType,
            }
          : hydratedDetailView,
      );
      setSelected({
        ...row,
        formId: hydratedDetailView?.formId || formId,
        batchId: hydratedDetailView?.batchId || row.batchId,
        status: nextStatus,
        qcDivStatus: nextStatus,
      });
    } catch {
      showAlert(S.DETAILS_FETCH_ERROR, "error", { autoCloseMs: 3500 });
      setSelected(null);
      setDetailView(null);
      setFormData(createDefaultQualityControlFormState());
    } finally {
      setSchemaLoading(false);
      setDetailsLoading(false);
    }
  };

  const handleCloseDetail = () => {
    if (detailsLoading || schemaLoading) return;
    setSelected(null);
    setDetailView(null);
    setFormData(createDefaultQualityControlFormState());
    setActiveDivisionGroupIndex(0);
    setActiveDivisionSubIndex(0);
    setActivePartialNavIndex(0);
    setPartialNavByDivision({});
    setDivisionStatusByFlowKey({});
    setFormSubmissionType("");
    setResolvedSubDepartmentId(null);
  };

  const handleActiveDivisionGroupIndexChange = useCallback(
    (index: number) => {
      setActiveDivisionGroupIndex(index);
      setActiveDivisionSubIndex(0);
      const nextDivision = resolveActiveDivisionKey(formData, index);
      const itemsForDivision = partialNavByDivision[nextDivision] ?? [];
      setActivePartialNavIndex(resolveInitialApproverPartialNavIndex(itemsForDivision));
    },
    [formData, partialNavByDivision],
  );

  const handleActivePartialNavIndexChange = useCallback((index: number) => {
    setActivePartialNavIndex(index);
  }, []);

  const requestUnitApprove = useCallback(
    (item: ApproverListRow) => {
      if (!activePartialItem || !isQcPartialItemApproverActionable(activePartialItem.status)) {
        showAlert(S.UNIT_APPROVER_LOCKED, "warning", { autoCloseMs: 3000 });
        return;
      }
      requestUnitApproveAction(item);
    },
    [activePartialItem, requestUnitApproveAction, showAlert],
  );

  const requestUnitReject = useCallback(
    (item: ApproverListRow) => {
      if (!activePartialItem || !isQcPartialItemApproverActionable(activePartialItem.status)) {
        showAlert(S.UNIT_APPROVER_LOCKED, "warning", { autoCloseMs: 3000 });
        return;
      }
      requestUnitRejectAction(item);
    },
    [activePartialItem, requestUnitRejectAction, showAlert],
  );

  const canApproveForm = useMemo(
    () =>
      canApproverActionEntireQcDivisionForm({
        formSubmissionType: formSubmissionType || detailView?.formSubmissionType,
        status: detailView?.status ?? selected?.qcDivStatus ?? selected?.status,
        divisionStatusByFlowKey,
      }),
    [
      detailView?.formSubmissionType,
      detailView?.status,
      divisionStatusByFlowKey,
      formSubmissionType,
      selected?.qcDivStatus,
      selected?.status,
    ],
  );

  const requestFormApprove = useCallback(
    (item: ApproverListRow) => {
      if (
        !canApproverActionEntireQcDivisionForm({
          formSubmissionType: formSubmissionType || detailView?.formSubmissionType,
          status: detailView?.status ?? item.qcDivStatus ?? item.status,
          divisionStatusByFlowKey,
        })
      ) {
        showAlert(S.FORM_APPROVER_NOT_READY, "warning", { autoCloseMs: 3000 });
        return;
      }
      requestFormApproveAction(item);
    },
    [
      detailView?.formSubmissionType,
      detailView?.status,
      divisionStatusByFlowKey,
      formSubmissionType,
      requestFormApproveAction,
      showAlert,
    ],
  );

  const requestFormReject = useCallback(
    (item: ApproverListRow) => {
      if (
        !canApproverActionEntireQcDivisionForm({
          formSubmissionType: formSubmissionType || detailView?.formSubmissionType,
          status: detailView?.status ?? item.qcDivStatus ?? item.status,
          divisionStatusByFlowKey,
        })
      ) {
        showAlert(S.FORM_APPROVER_NOT_READY, "warning", { autoCloseMs: 3000 });
        return;
      }
      requestFormRejectAction(item);
    },
    [
      detailView?.formSubmissionType,
      detailView?.status,
      divisionStatusByFlowKey,
      formSubmissionType,
      requestFormRejectAction,
      showAlert,
    ],
  );

  const divisionApprovalRows = useMemo(
    () => buildQcApproverDivisionRows(partialNavItems, activeDivisionKey || "—"),
    [activeDivisionKey, partialNavItems],
  );

  const finalApprovalRows = useMemo(
    () => buildQcApproverFinalRows(partialNavByDivision, divisionStatusByFlowKey),
    [divisionStatusByFlowKey, partialNavByDivision],
  );

  const canApproveActiveUnit = isQcPartialItemApproverActionable(activePartialItem?.status);

  return {
    items,
    selected,
    detailsLoading,
    schemaLoading,
    detailView,
    formData,
    activeDivisionGroupIndex,
    activeDivisionSubIndex,
    setActiveDivisionSubIndex,
    setActiveDivisionGroupIndex: handleActiveDivisionGroupIndexChange,
    activePartialNavIndex,
    setActivePartialNavIndex: handleActivePartialNavIndexChange,
    partialNavItems,
    activePartialItem,
    divisionStatusByFlowKey,
    divisionApprovalRows,
    finalApprovalRows,
    canApproveActiveUnit,
    canApproveForm,
    subDepartmentId: resolvedSubDepartmentId ?? subDepartmentId,
    dialogProps: unitDialogProps,
    formDialogProps,
    actionLoading: unitDialogBaseProps.submitting || formDialogProps.submitting,
    requestApprove: requestUnitApprove,
    requestReject: requestUnitReject,
    requestFormApprove,
    requestFormReject,
    handleViewDetails,
    handleCloseDetail,
  };
};

export default useQCDivisionApproverHook;
