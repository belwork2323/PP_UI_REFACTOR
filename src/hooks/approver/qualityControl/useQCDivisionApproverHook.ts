import { useCallback, useEffect, useMemo, useState } from "react";

import { useAlertStore } from "../../../app/store/alertStore";
import { useAuthStore } from "../../../app/store/authStore";
import { STRINGS } from "../../../app/config/strings";
import { normalizeApproverBatchStatus } from "../../../data/models/approver/ApproverBatchListModel";
import qcDivisionController from "../../../controllers/user/quality_control/qcDivisionController";
import qcDivisionApproverController from "../../../controllers/approver/qcDivisionApproverController";
import type { QcDivisionApproverChangeStatusPayload } from "../../../data/api/approver/qcDivisionApproverApi";
import type { QCDivisionDetailView } from "../../../data/models/user/QualityControlFormModel";
import type { QualityControlFormState } from "../../../data/models/user/QualityControlFormModel";
import { createDefaultQualityControlFormState } from "../../../data/models/user/QualityControlFormModel";
import { QCDivisionDetailsModel } from "../../../data/models/user/QCDivisionApiModel";
import { ApiResponseModel } from "../../../data/models/common/ApiResponseModel";
import useApproverFormAction from "../useApproverFormAction";
import { loadQcDivisionDetailsViewState } from "../../user/qualityControl/qcDivisionDetailsHydration";
import { buildDivisionNavGroups, resolveFormNavForPartialItem } from "../../user/qualityControl/qcDivisionNav";
import {
  scopeFormStateToPartialItem,
  type QcPartialItemStatus,
  type QcPartialNavItem,
} from "../../user/qualityControl/qcDivisionApprovalUnits";
import {
  isRawMaterialProcessingType,
  isRawMaterialRevalidationType,
} from "../../user/qualityControl/qcProcessingConfig";
import {
  mapQcDivisionsFromApi,
  resolveQcDivisionIdFromApiDivision,
  type QcDivisionCatalogNavTab,
} from "../../user/qualityControl/qcFlowConfig";
import { resolveQcApiDivisionForTabKey } from "../../user/qualityControl/qcDivisionRegistry";
import type { QcDivisionEntry } from "../../user/qualityControl/qcDivisionEntryTypes";
import {
  buildQcApproverDivisionRows,
  buildQcApproverFinalGroups,
  buildQcApproverFinalRows,
  buildQcApproverPartialState,
  isQcPartialItemApproverActionable,
  resolveInitialApproverPartialNavIndex,
} from "./qcDivisionApproverGuards";

const DEPARTMENT = "qualityControl" as const;
const SUB_DEPARTMENT = "qc-division";
const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

const toApproverFlowKey = (tabKey: string): string => {
  const key = String(tabKey ?? "").trim().toUpperCase();
  if (key === "RAW_MATERIAL_PROCESSING" || key === "RAW_MATERIAL_REVALIDATION") {
    return "RAW_MATERIAL";
  }
  if (key === "POST_CURE_OPERATION") return "POST_CURE";
  if (key === "PROPELLANT_PROPERTIES") return "QC";
  return key;
};

const entryMatchesApproverDivisionTab = (
  entry: QcDivisionEntry,
  tab: QcDivisionCatalogNavTab,
): boolean => {
  if (entry.flowKey !== tab.flowKey) return false;
  if (!tab.rawMaterialType) return true;
  if (isRawMaterialRevalidationType(tab.rawMaterialType)) {
    return entry.kind === "REVALIDATION";
  }
  if (isRawMaterialProcessingType(tab.rawMaterialType)) {
    return (
      entry.kind === "PROCESSING_MATERIAL" ||
      entry.kind === "SOLID_PREMIX" ||
      entry.kind === "LIQUID_PREMIX" ||
      entry.kind === "BOTH_PREMIX"
    );
  }
  return true;
};

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
  subIndex = 0,
): string => {
  const groups = buildDivisionNavGroups(formData.divisionEntries ?? []);
  const safeGroupIndex = Math.min(Math.max(groupIndex, 0), Math.max(0, groups.length - 1));
  const group = groups[safeGroupIndex];
  if (!group) return "";

  if (group.kind === "entries") {
    const entry = group.entries[Math.min(Math.max(subIndex, 0), Math.max(0, group.entries.length - 1))];
    return String(entry?.apiDivision ?? group.flowKey ?? "").trim();
  }

  if (group.kind === "mixing") {
    const tab = group.tabs[Math.min(Math.max(subIndex, 0), Math.max(0, group.tabs.length - 1))];
    if (tab && tab.kind === "entry") {
      return String(tab.entry.apiDivision ?? group.flowKey ?? "").trim();
    }
    const firstEntry = group.tabs.find((item) => item.kind === "entry");
    if (firstEntry && firstEntry.kind === "entry") {
      return String(firstEntry.entry.apiDivision ?? group.flowKey ?? "").trim();
    }
    return String(group.flowKey ?? "").trim();
  }

  const motorTab =
    group.motorTabs[Math.min(Math.max(subIndex, 0), Math.max(0, group.motorTabs.length - 1))];
  const entry = motorTab?.entries?.[0];
  return String(entry?.apiDivision ?? group.flowKey ?? "").trim();
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
  const [activeDivisionTabKey, setActiveDivisionTabKey] = useState("");
  const [partialNavByDivision, setPartialNavByDivision] = useState<
    Record<string, QcPartialNavItem[]>
  >({});
  const [divisionStatusByFlowKey, setDivisionStatusByFlowKey] = useState<
    Record<string, QcPartialItemStatus>
  >({});
  const [formSubmissionType, setFormSubmissionType] = useState<string>("");
  const [resolvedSubDepartmentId, setResolvedSubDepartmentId] = useState<number | null>(null);

  const subDepartmentId = useMemo(() => resolveSubDepartmentId(user), [user]);

  const fetchDivisionCatalog = useCallback(async () => {
    const response = await qcDivisionController.fetchDivisions();
    if (!response?.success) {
      return { catalog: [] as ReturnType<typeof mapQcDivisionsFromApi>, error: response };
    }
    return { catalog: mapQcDivisionsFromApi(response.data), error: null };
  }, []);

  const activeDivisionKey = useMemo(
    () => resolveActiveDivisionKey(formData, activeDivisionGroupIndex, activeDivisionSubIndex),
    [activeDivisionGroupIndex, activeDivisionSubIndex, formData],
  );

  const effectiveDivisionKey = useMemo(() => {
    if (activeDivisionTabKey && (partialNavByDivision[activeDivisionTabKey] || divisionStatusByFlowKey[activeDivisionTabKey])) {
      return activeDivisionTabKey;
    }
    if (partialNavByDivision[activeDivisionKey]?.length) return activeDivisionKey;
    const waitingKey = Object.keys(partialNavByDivision).find((key) =>
      (partialNavByDivision[key] ?? []).some((item) => item.status === "WAITING_FOR_APPROVAL"),
    );
    if (waitingKey) return waitingKey;
    return Object.keys(partialNavByDivision)[0] ?? activeDivisionKey;
  }, [
    activeDivisionKey,
    activeDivisionTabKey,
    divisionStatusByFlowKey,
    partialNavByDivision,
  ]);

  const partialNavItems = useMemo(
    () => partialNavByDivision[effectiveDivisionKey] ?? [],
    [effectiveDivisionKey, partialNavByDivision],
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
        preferredDivision &&
        (state.partialNavByDivision[preferredDivision] ||
          state.divisionStatusByFlowKey[preferredDivision])
          ? preferredDivision
          : Object.keys(state.divisionStatusByFlowKey)[0] ||
            Object.keys(state.partialNavByDivision)[0] ||
            "";
      setActiveDivisionTabKey(divisionKey);
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
      const tabKey = String(payload.tabKey ?? payload.division ?? "").trim();
      const division = resolveQcApiDivisionForTabKey(tabKey) || tabKey;

      const { catalog, error } = await fetchDivisionCatalog();
      if (error) return error;
      const divisionId =
        resolveQcDivisionIdFromApiDivision(catalog, division) ??
        resolveQcDivisionIdFromApiDivision(catalog, tabKey) ??
        0;

      if (!(divisionId > 0) || !division) {
        return new ApiResponseModel({
          success: false,
          message: S.DIVISION_ID_MISSING,
          statusCode: 400,
        });
      }

      const base: QcDivisionApproverChangeStatusPayload = {
        formId: String(payload.formId ?? ""),
        subDepartmentId: Number(payload.subDepartmentId ?? 0),
        divisionId,
        division,
        actionType: payload.actionType as ApproverChangeStatusPayload["actionType"],
        remarks: (payload.remarks as string | null | undefined) ?? null,
        rejectionReason: (payload.rejectionReason as string | null | undefined) ?? null,
      };

      if (kind === "MOTOR") {
        return qcDivisionApproverController.submitUnitStatusChange({
          ...base,
          motorId: String(payload.motorId ?? "").trim(),
        });
      }

      if (kind === "DIVISION") {
        const tab = String(payload.tabKey ?? payload.division ?? "").trim().toUpperCase();
        if (tab !== "RAW_MATERIAL_REVALIDATION") {
          return new ApiResponseModel({
            success: false,
            message: S.DIVISION_ID_MISSING,
            statusCode: 400,
          });
        }
        return qcDivisionApproverController.submitUnitStatusChange(base);
      }

      if (kind === "PREMIX" || kind === "FINAL_MIX") {
        return qcDivisionApproverController.submitUnitStatusChange({
          ...base,
          premixNo: Number(payload.premixNo ?? 0),
          stageType: kind === "FINAL_MIX" ? "FINAL_MIX" : "PREMIX",
        });
      }

      // Division-level (Revalidation, etc.): omit premixNo / motorId / stageType
      return qcDivisionApproverController.submitUnitStatusChange(base);
    },
    [fetchDivisionCatalog],
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
    buildChangeStatusPayload: () => {
      const tabKey = effectiveDivisionKey || activeDivisionKey || "";
      return {
        unitKind: activePartialItem?.kind,
        motorId: activePartialItem?.motorId,
        premixNo: activePartialItem?.finalMixNo ?? activePartialItem?.premixNo,
        tabKey,
        division: resolveQcApiDivisionForTabKey(tabKey) || tabKey || undefined,
      };
    },
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
    setActiveDivisionTabKey("");
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
    setActiveDivisionTabKey("");
    setPartialNavByDivision({});
    setDivisionStatusByFlowKey({});
    setFormSubmissionType("");
    setResolvedSubDepartmentId(null);
  };

  const handleActiveDivisionGroupIndexChange = useCallback(
    (index: number) => {
      setActiveDivisionGroupIndex(index);
      setActiveDivisionSubIndex(0);
      const nextDivision = resolveActiveDivisionKey(formData, index, 0);
      const normalized = String(nextDivision ?? "").trim().toUpperCase();
      const tabKey =
        (normalized &&
          (partialNavByDivision[normalized] || divisionStatusByFlowKey[normalized]) &&
          normalized) ||
        (normalized === "RAW_MATERIAL"
          ? Object.keys(partialNavByDivision).find((key) => key.startsWith("RAW_MATERIAL_"))
          : null) ||
        normalized;
      if (tabKey) setActiveDivisionTabKey(tabKey);
      const itemsForDivision =
        partialNavByDivision[tabKey] ??
        partialNavByDivision[normalized] ??
        [];
      setActivePartialNavIndex(resolveInitialApproverPartialNavIndex(itemsForDivision));
    },
    [divisionStatusByFlowKey, formData, partialNavByDivision],
  );

  const handleDivisionNavTabChange = useCallback(
    (tabKey: string) => {
      const key = String(tabKey ?? "").trim();
      if (!key) return;
      setActiveDivisionTabKey(key);
      // Scoped form data rebuilds groups per tab — always start at the first group.
      setActiveDivisionGroupIndex(0);
      setActiveDivisionSubIndex(0);
      const itemsForDivision = partialNavByDivision[key] ?? [];
      setActivePartialNavIndex(resolveInitialApproverPartialNavIndex(itemsForDivision));
    },
    [partialNavByDivision],
  );

  const handleActivePartialNavIndexChange = useCallback(
    (index: number) => {
      setActivePartialNavIndex(index);
      const tabKey = effectiveDivisionKey || activeDivisionTabKey;
      const items = partialNavByDivision[tabKey] ?? [];
      const item = items[index];
      if (item) {
        const { groupIndex, subIndex } = resolveFormNavForPartialItem(
          formData.divisionEntries,
          item,
          { flowKey: toApproverFlowKey(tabKey) },
        );
        setActiveDivisionGroupIndex(groupIndex);
        setActiveDivisionSubIndex(subIndex);
        return;
      }
      setActiveDivisionGroupIndex(0);
      setActiveDivisionSubIndex(0);
    },
    [
      activeDivisionTabKey,
      effectiveDivisionKey,
      formData.divisionEntries,
      partialNavByDivision,
    ],
  );

  useEffect(() => {
    if (!activePartialItem) return;
    const tabKey = effectiveDivisionKey || activeDivisionTabKey;
    const { groupIndex, subIndex } = resolveFormNavForPartialItem(
      formData.divisionEntries,
      activePartialItem,
      { flowKey: toApproverFlowKey(tabKey) },
    );
    setActiveDivisionGroupIndex(groupIndex);
    setActiveDivisionSubIndex(subIndex);
  }, [
    activeDivisionTabKey,
    activePartialItem,
    effectiveDivisionKey,
    formData.divisionEntries,
  ]);

  const requestUnitApprove = useCallback(
    async (item: ApproverListRow) => {
      if (!activePartialItem || !isQcPartialItemApproverActionable(activePartialItem.status)) {
        showAlert(S.UNIT_APPROVER_LOCKED, "warning", { autoCloseMs: 3000 });
        return;
      }
      requestUnitApproveAction(item);
    },
    [activePartialItem, requestUnitApproveAction, showAlert],
  );

  const requestUnitReject = useCallback(
    async (item: ApproverListRow) => {
      if (!activePartialItem || !isQcPartialItemApproverActionable(activePartialItem.status)) {
        showAlert(S.UNIT_APPROVER_LOCKED, "warning", { autoCloseMs: 3000 });
        return;
      }
      requestUnitRejectAction(item);
    },
    [activePartialItem, requestUnitRejectAction, showAlert],
  );

  const divisionApprovalRows = useMemo(
    () => buildQcApproverDivisionRows(partialNavItems, activeDivisionKey || "—"),
    [activeDivisionKey, partialNavItems],
  );

  const finalApprovalGroups = useMemo(
    () => buildQcApproverFinalGroups(partialNavByDivision, divisionStatusByFlowKey),
    [divisionStatusByFlowKey, partialNavByDivision],
  );

  const divisionNavTabs = useMemo<QcDivisionCatalogNavTab[]>(
    () =>
      finalApprovalGroups.map((group) => {
        const tabKey = String(group.divisionKey ?? "").trim();
        const flowKey = toApproverFlowKey(tabKey);
        return {
          tabKey,
          flowKey,
          rawMaterialType: flowKey === "RAW_MATERIAL" ? tabKey : "",
          label: group.divisionLabel,
          divisionId: 0,
        };
      }),
    [finalApprovalGroups],
  );

  const scopedFormData = useMemo(() => {
    const tab = divisionNavTabs.find((entry) => entry.tabKey === effectiveDivisionKey);
    const unitScoped =
      activePartialItem &&
      (activePartialItem.kind === "PREMIX" ||
        activePartialItem.kind === "FINAL_MIX" ||
        activePartialItem.kind === "MOTOR")
        ? scopeFormStateToPartialItem(formData, activePartialItem, {
            flowKey: toApproverFlowKey(effectiveDivisionKey),
          })
        : formData;

    if (!tab) return unitScoped;

    const entries = (unitScoped.divisionEntries ?? []).filter((entry) =>
      entryMatchesApproverDivisionTab(entry, tab),
    );
    if (entries.length === (unitScoped.divisionEntries ?? []).length) return unitScoped;
    return { ...unitScoped, divisionEntries: entries };
  }, [activePartialItem, divisionNavTabs, effectiveDivisionKey, formData]);

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
    formData: scopedFormData,
    activeDivisionGroupIndex,
    activeDivisionSubIndex,
    setActiveDivisionSubIndex,
    setActiveDivisionGroupIndex: handleActiveDivisionGroupIndexChange,
    activeDivisionTabKey: effectiveDivisionKey,
    divisionNavTabs,
    setActiveDivisionTabKey: handleDivisionNavTabChange,
    activePartialNavIndex,
    setActivePartialNavIndex: handleActivePartialNavIndexChange,
    partialNavItems,
    activePartialItem,
    divisionStatusByFlowKey,
    divisionApprovalRows,
    finalApprovalGroups,
    finalApprovalRows,
    canApproveActiveUnit,
    subDepartmentId: resolvedSubDepartmentId ?? subDepartmentId,
    dialogProps: unitDialogProps,
    actionLoading: unitDialogBaseProps.submitting,
    requestApprove: requestUnitApprove,
    requestReject: requestUnitReject,
    handleViewDetails,
    handleCloseDetail,
  };
};

export default useQCDivisionApproverHook;
