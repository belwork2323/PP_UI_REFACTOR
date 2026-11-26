import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";

import { STRINGS } from "../../../../app/config/strings";
import { useAlertStore } from "../../../../app/store/alertStore";
import { useThemeStore } from "../../../../app/store/themeStore";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";

/** Above System Manager / Admin batch Modal (theme popup zIndex 1400). */
const FORM_PREVIEW_Z_INDEX = 1600;
import casePreparationController from "../../../../controllers/user/manufacturing/casePreparationController";
import castingCuringController from "../../../../controllers/user/manufacturing/castingCuringController";
import mixingController from "../../../../controllers/user/manufacturing/mixingController";
import postCureController from "../../../../controllers/user/manufacturing/postCureController";
import rawMaterialPreparationController from "../../../../controllers/user/manufacturing/rawMaterialPreparationController";
import { subscaleController } from "../../../../controllers/user/manufacturing/subscaleController";
import trimmingController from "../../../../controllers/user/manufacturing/trimmingController";
import dispatchController from "../../../../controllers/user/dispatch/dispatchController";
import ndtController from "../../../../controllers/user/quality_control/ndtController";
import stfController from "../../../../controllers/user/quality_control/stfController";
import { fetchSMBatchSubDeptDetails } from "../../../../data/api/system_manager/systemManagerAPI";
import { mapCasePreparationDetailsForDisplay } from "../../../../data/models/user/CasePreparationFormModel";
import { mapCastingCuringDetailsForDisplay } from "../../../../data/models/user/CastingCuringFormModel";
import {
  buildMixingApproverCards,
  isMixCardApproverTabDisabled,
  mapMixingDetailsForDisplay,
} from "../../../../data/models/user/MixingFormModel";
import { mapPostCureDetailsForDisplay } from "../../../../data/models/user/PostCureFormModel";
import {
  isPremixApproverTabDisabled,
  mapRawMaterialPreparationDetailsForDisplay,
} from "../../../../data/models/user/RawMaterialPreparationModel";
import { mapSubscaleDetailsForDisplay } from "../../../../data/models/user/SubscaleFormModel";
import { mapTrimmingDetailsForDisplay } from "../../../../data/models/user/TrimmingFormModel";
import { mapDispatchDetailsForDisplay } from "../../../../data/models/user/DispatchApiModel";
import { mapNDTDetailsForDisplay } from "../../../../data/models/user/NDTFormModel";
import { mapStfDetailsForDisplay } from "../../../../data/models/user/StaticTestFacilityApiModel";
import CasePreparationApproverDetailDialog from "../../approver/manufacturing/CasePreparationApproverDetailDialog";
import CastingAndCuringApproverDetailDialog from "../../approver/manufacturing/CastingAndCuringApproverDetailDialog";
import MixingApproverDetailDialog from "../../approver/manufacturing/MixingApproverDetailDialog";
import PostCureApproverDetailDialog from "../../approver/manufacturing/PostCureApproverDetailDialog";
import RawMaterialPreparationApproverDetailDialog from "../../approver/manufacturing/RawMaterialPreparationApproverDetailDialog";
import SubscaleApproverDetailDialog from "../../approver/manufacturing/SubscaleApproverDetailDialog";
import TrimmingApproverDetailDialog from "../../approver/manufacturing/TrimmingApproverDetailDialog";
import DispatchApproverDetailDialog from "../../approver/dispatch/DispatchApproverDetailDialog";
import NDTApproverDetailDialog from "../../approver/qualityControl/NDTApproverDetailDialog";
import STFApproverDetailDialog from "../../approver/qualityControl/STFApproverDetailDialog";
import { qcController } from "@/controllers/user/quality_control/qualityControlController";
import qcDivisionController from "@/controllers/user/quality_control/qcDivisionController";
import {
  createDefaultQualityControlFormState,
  mapQualityControlDetailsToFormState,
  QcDivisionEntry,
} from "@/data/models/user/QualityControlFormModel";
import QCDivisionApproverPage from "../../approver/qualityControl/QCDivisionApproverPage";
import QCDivisionDetailsContent from "../../user/qualityControl/QCDivision/components/QCDivisionDetailsContent";
import QCDivisionApproverDetailDialog from "../../approver/qualityControl/QCDivisionApproverDetailDialog";
import useQCDivisionApproverHook from "@/hooks/approver/qualityControl/useQCDivisionApproverHook";
import { QcDivisionCatalogNavTab } from "@/hooks/user/qualityControl/qcFlowConfig";
import {
  buildQcApproverDivisionRows,
  buildQcApproverFinalGroups,
  buildQcApproverFinalRows,
  buildQcApproverPartialState,
  resolveInitialApproverPartialNavIndex,
} from "@/hooks/approver/qualityControl/qcDivisionApproverGuards";
import {
  QcPartialItemStatus,
  QcPartialNavItem,
  scopeFormStateToPartialItem,
} from "@/hooks/user/qualityControl/qcDivisionApprovalUnits";
import { resolveFormNavForPartialItem } from "@/hooks/user/qualityControl/qcDivisionNav";
import {
  isRawMaterialProcessingType,
  isRawMaterialRevalidationType,
} from "@/hooks/user/qualityControl/qcProcessingConfig";
import { loadQcDivisionDetailsViewState } from "@/hooks/user/qualityControl/qcDivisionDetailsHydration";
import { QCDivisionDetailsModel } from "@/data/models/user/QCDivisionApiModel";

const S = STRINGS.SYSTEM_MANAGER.BATCH_DETAILS;

export type BatchSubDeptFormPreviewTarget = {
  batchId: string;
  formId: string;
  subDepartmentId: number;
  subDepartmentName?: string;
  status?: string | null;
} | null;

type Props = {
  open: boolean;
  target: BatchSubDeptFormPreviewTarget;
  onClose: () => void;
};

const resolveInitialMixCardId = (detailView: any): string | null => {
  const mixCards = buildMixingApproverCards(detailView);
  const waiting = mixCards.find((c) => c.mixCardSubmissionStatus === "WAITING_FOR_APPROVAL");
  if (waiting) return waiting.mixCardId;
  const viewable = mixCards.find((c) => !isMixCardApproverTabDisabled(c.mixCardSubmissionStatus));
  return viewable?.mixCardId ?? null;
};

const resolveInitialMotorId = (detailView: any): string | null => {
  const motors = detailView?.motors ?? detailView?.motorDetails ?? [];
  if (!Array.isArray(motors) || motors.length === 0) return null;
  const first = motors[0];
  return String(first?.motorId ?? first?.id ?? "") || null;
};

const resolveInitialPremixNo = (detailView: any): number | null => {
  const premixes = detailView?.premixes;
  if (!Array.isArray(premixes) || premixes.length === 0) return null;
  const waiting = premixes.find((p: any) => p.premixSubmissionStatus === "WAITING_FOR_APPROVAL");
  if (waiting?.premixNo != null) return Number(waiting.premixNo);
  const viewable = premixes.find(
    (p: any) => !isPremixApproverTabDisabled(p.premixSubmissionStatus),
  );
  return viewable?.premixNo != null ? Number(viewable.premixNo) : null;
};
const normalizeStatusToken = (status: unknown): string =>
  String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const resolveInitialDivision = (detailView: any): string | number | null => {
  // Adjust candidate keys to match your detailView shape (e.g. divisions / divisionDetails / subDepartments)
  const divisions =
    detailView?.divisions ?? detailView?.divisionDetails ?? detailView?.subDepartments ?? [];

  if (!Array.isArray(divisions) || divisions.length === 0) return null;

  const getDivisionKey = (d: any) =>
    d?.divisionId ?? d?.divisionCode ?? d?.code ?? d?.id ?? d?.name ?? null;

  const getDivisionStatus = (d: any) =>
    normalizeStatusToken(d?.divisionSubmissionStatus ?? d?.submissionStatus ?? d?.status);

  const waiting = divisions.find((d: any) => getDivisionStatus(d) === "WAITING_FOR_APPROVAL");
  if (waiting) {
    const key = getDivisionKey(waiting);
    if (key != null && String(key).trim() !== "") return key;
  }

  // If you have a disabled/viewable helper for divisions, use it here; otherwise pick first viewable/present item
  const firstKey = getDivisionKey(divisions[0]);
  return firstKey != null && String(firstKey).trim() !== "" ? firstKey : null;
};
const PROCESS_DATA_KEYS = [
  "rawMaterialProcessingData",
  "casePreparationProcessingData",
  "mixingProcessingData",
  "castingCuringProcessingData",
  "postCureProcessingData",
  "subscaleProcessingData",
  "trimmingProcessingData",
  "ndtProcessingData",
  "dispatchProcessingData",
  "staticTestingProcessingData",
] as const;

/** Resolve formId when stage timeline payload omitted it (legacy / missing map). */
async function resolveFormIdFromBatchDetails(
  batchId: string,
  subDepartmentId: number,
): Promise<string | null> {
  try {
    const resp = await fetchSMBatchSubDeptDetails({ batchId, subDepartmentId });
    const data = (resp as any)?.data;
    if (!data || typeof data !== "object") return null;
    for (const key of PROCESS_DATA_KEYS) {
      const formId = (data as any)?.[key]?.formId;
      if (formId) return String(formId);
    }
    if ((data as any)?.formId) return String((data as any).formId);
  } catch {
    /* fall through */
  }
  return null;
}

/**
 * Opens the matching Approver detail dialog (actions omitted) for an approved
 * sub-department stage from the Admin / Centre Head / System Manager batch popup.
 */

export default function BatchSubDeptFormPreview({ open, target, onClose }: Props) {
  const {
    detailView: qcDetailView,
    formData: qcFormData,
    partialNavItems,
    divisionNavTabs,
    divisionApprovalRows,
    finalApprovalGroups,
    finalApprovalRows,
  } = useQCDivisionApproverHook();

  const mode = useThemeStore((s) => s.mode);
  const theme = useMemo(() => getRawMaterialPreparationApproverTheme(mode), [mode]);
  const muiTheme = useTheme();
  const elevatedTheme = useMemo(
    () =>
      createTheme(muiTheme, {
        zIndex: {
          ...muiTheme.zIndex,
          modal: FORM_PREVIEW_Z_INDEX,
        },
      }),
    [muiTheme],
  );
  const showAlert = useAlertStore((s) => s.showAlert);

  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<any>(null);
  const [activeMotorId, setActiveMotorId] = useState<string | null>(null);
  const [activeMixCardId, setActiveMixCardId] = useState<string | null>(null);
  const [activePremixNo, setActivePremixNo] = useState<number | null>(null);

  const targetFormId = target?.formId ?? "";
  const subDepartmentId = target?.subDepartmentId ?? 0;
  const batchId = target?.batchId ?? "";
  const status = target?.status ?? null;

  const toApproverFlowKey = (tabKey: string): string => {
    const key = String(tabKey ?? "")
      .trim()
      .toUpperCase();
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

  const effectiveDivisionKey = useMemo(() => {
    if (
      activeDivisionTabKey &&
      (partialNavByDivision[activeDivisionTabKey] || divisionStatusByFlowKey[activeDivisionTabKey])
    ) {
      return activeDivisionTabKey;
    }
    const waitingKey = Object.keys(partialNavByDivision).find((key) =>
      (partialNavByDivision[key] ?? []).some((item) => item.status === "WAITING_FOR_APPROVAL"),
    );
    if (waitingKey) return waitingKey;
    return Object.keys(partialNavByDivision)[0] ?? activeDivisionTabKey;
  }, [activeDivisionTabKey, divisionStatusByFlowKey, partialNavByDivision]);

  const qcPartialNavItems = useMemo(
    () => partialNavByDivision[effectiveDivisionKey] ?? [],
    [effectiveDivisionKey, partialNavByDivision],
  );

  const activePartialItem = useMemo(() => {
    if (!qcPartialNavItems.length) return null;
    const safeIndex = Math.min(
      Math.max(activePartialNavIndex, 0),
      Math.max(0, qcPartialNavItems.length - 1),
    );
    return qcPartialNavItems[safeIndex] ?? null;
  }, [activePartialNavIndex, qcPartialNavItems]);

  const qcFinalApprovalGroups = useMemo(
    () => buildQcApproverFinalGroups(partialNavByDivision, divisionStatusByFlowKey),
    [divisionStatusByFlowKey, partialNavByDivision],
  );

  const qcDivisionNavTabs = useMemo<QcDivisionCatalogNavTab[]>(
    () =>
      qcFinalApprovalGroups.map((group) => {
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
    [qcFinalApprovalGroups],
  );

  const qcDivisionApprovalRows = useMemo(
    () => buildQcApproverDivisionRows(qcPartialNavItems, effectiveDivisionKey || "—"),
    [effectiveDivisionKey, qcPartialNavItems],
  );

  const qcFinalApprovalRows = useMemo(
    () => buildQcApproverFinalRows(partialNavByDivision, divisionStatusByFlowKey),
    [divisionStatusByFlowKey, partialNavByDivision],
  );

  const scopedQcFormData = useMemo(() => {
    const baseFormData =
      payload?.kind === "qc" ? payload.formData : createDefaultQualityControlFormState();
    const tab = qcDivisionNavTabs.find((entry) => entry.tabKey === effectiveDivisionKey);
    const unitScoped =
      activePartialItem &&
      (activePartialItem.kind === "PREMIX" ||
        activePartialItem.kind === "FINAL_MIX" ||
        activePartialItem.kind === "MOTOR")
        ? scopeFormStateToPartialItem(baseFormData, activePartialItem, {
            flowKey: toApproverFlowKey(effectiveDivisionKey),
          })
        : baseFormData;

    if (!tab) return unitScoped;

    const entries = (unitScoped.divisionEntries ?? []).filter((entry) =>
      entryMatchesApproverDivisionTab(entry, tab),
    );
    if (entries.length === (unitScoped.divisionEntries ?? []).length) return unitScoped;
    return { ...unitScoped, divisionEntries: entries };
  }, [activePartialItem, effectiveDivisionKey, payload, qcDivisionNavTabs]);

  useEffect(() => {
    if (payload?.kind !== "qc" || !activePartialItem) return;
    const { groupIndex, subIndex } = resolveFormNavForPartialItem(
      payload.formData?.divisionEntries ?? [],
      activePartialItem,
      { flowKey: toApproverFlowKey(effectiveDivisionKey) },
    );
    setActiveDivisionGroupIndex(groupIndex);
    setActiveDivisionSubIndex(subIndex);
  }, [activePartialItem, effectiveDivisionKey, payload]);
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!open || !subDepartmentId || !batchId) {
        setPayload(null);
        return;
      }

      setLoading(true);
      setPayload(null);
      setActiveMotorId(null);
      setActiveMixCardId(null);
      setActivePremixNo(null);

      try {
        let formId = String(targetFormId ?? "").trim();
        if (!formId) {
          formId = (await resolveFormIdFromBatchDetails(batchId, subDepartmentId)) ?? "";
        }
        if (!formId) {
          throw new Error(S.FORM_DETAILS_FETCH_ERROR);
        }

        const baseItem = {
          formId,
          batchId,
          subDepartmentId,
          status: status ?? "COMPLETELY_APPROVED",
          ssStatus: status ?? "COMPLETELY_APPROVED",
          mxStatus: status ?? "COMPLETELY_APPROVED",
        };

        let next: any = null;

        switch (subDepartmentId) {
          case 3: {
            const response = await rawMaterialPreparationController.fetchFormDetails({
              formId,
              subDepartmentId,
            });
            if (!response?.success || !response?.data) throw new Error(response?.message);
            const mapped = mapRawMaterialPreparationDetailsForDisplay(response.data as any);
            next = {
              kind: "rmp",
              item: {
                ...baseItem,
                detailView: mapped.detailView,
                weightmentSheet: mapped.weightmentSheet,
              },
            };
            setActivePremixNo(resolveInitialPremixNo(mapped.detailView));
            break;
          }
          case 4: {
            const response = await casePreparationController.fetchFormDetails({
              formId,
              subDepartmentId,
            });
            if (!response?.success || !response?.data) throw new Error(response?.message);
            const detailView = mapCasePreparationDetailsForDisplay(response.data as any);
            next = { kind: "casePrep", item: { ...baseItem, detailView } };
            setActiveMotorId(resolveInitialMotorId(detailView));
            break;
          }
          case 5: {
            const response = await mixingController.fetchFormDetails({ formId, subDepartmentId });
            if (!response?.success || !response?.data) throw new Error(response?.message);
            const detailView = mapMixingDetailsForDisplay(
              response.data as unknown as Record<string, unknown>,
            );
            next = { kind: "mixing", item: { ...baseItem, detailView } };
            setActiveMixCardId(resolveInitialMixCardId(detailView));
            break;
          }
          case 6: {
            const response = await castingCuringController.fetchFormDetails({
              formId,
              subDepartmentId,
            });
            if (!response?.success || !response?.data) throw new Error(response?.message);
            const detailView = mapCastingCuringDetailsForDisplay(
              response.data as unknown as Record<string, unknown>,
            );
            next = { kind: "casting", item: { ...baseItem, detailView } };
            setActiveMotorId(resolveInitialMotorId(detailView));
            break;
          }
          case 7: {
            const response = await postCureController.fetchFormDetails({
              formId,
              subDepartmentId,
            });
            if (!response?.success || !response?.data) throw new Error(response?.message);
            const detailView = mapPostCureDetailsForDisplay(
              response.data as unknown as Record<string, unknown>,
            );
            next = { kind: "postCure", item: { ...baseItem, detailView } };
            setActiveMotorId(resolveInitialMotorId(detailView));
            break;
          }
          case 8: {
            const response = await subscaleController.fetchFormDetails({
              formId,
              subDepartmentId,
            });
            if (!response?.success || !response?.data) throw new Error(response?.message);
            const detailView = mapSubscaleDetailsForDisplay(response.data);
            next = { kind: "subscale", item: baseItem, detailView };
            break;
          }
          case 9: {
            const response = await trimmingController.fetchFormDetails({
              formId,
              subDepartmentId,
            });
            if (!response?.success || !response?.data) throw new Error(response?.message);
            const detailView = mapTrimmingDetailsForDisplay(
              response.data as unknown as Record<string, unknown>,
            );
            next = { kind: "trimming", item: { ...baseItem, detailView } };
            setActiveMotorId(resolveInitialMotorId(detailView));
            break;
          }
          case 10: {
            const response = await ndtController.fetchFormDetails({ formId, subDepartmentId });
            if (!response?.success || !response?.data) throw new Error(response?.message);
            const detailView = mapNDTDetailsForDisplay(
              response.data as unknown as Record<string, unknown>,
            );
            next = { kind: "ndt", item: { ...baseItem, detailView } };
            setActiveMotorId(resolveInitialMotorId(detailView));
            break;
          }
          case 11: {
            const response = await qcDivisionController.fetchFormDetails({
              formId,
              subDepartmentId,
            });
            if (!response?.success || !response?.data) throw new Error(response?.message);

            const detailsModel = response.data;
            const effectiveSubDepartmentId = Number(
              detailsModel.subDepartmentId || subDepartmentId,
            );

            const { formData: hydratedFormData, detailView: hydratedDetailView } =
              await loadQcDivisionDetailsViewState(detailsModel, effectiveSubDepartmentId);

            const detailsRecord =
              (QCDivisionDetailsModel.toPlainRecord(detailsModel) as Record<
                string,
                unknown
              > | null) ?? {};
            const partialState = buildQcApproverPartialState(detailsRecord);

            const initialDivisionKey =
              Object.keys(partialState.divisionStatusByFlowKey)[0] ||
              Object.keys(partialState.partialNavByDivision)[0] ||
              "";
            const itemsForDivision = partialState.partialNavByDivision[initialDivisionKey] ?? [];

            if (!cancelled) {
              setPartialNavByDivision(partialState.partialNavByDivision);
              setDivisionStatusByFlowKey(partialState.divisionStatusByFlowKey);
              setActiveDivisionTabKey(initialDivisionKey);
              setActiveDivisionGroupIndex(0);
              setActiveDivisionSubIndex(0);
              setActivePartialNavIndex(resolveInitialApproverPartialNavIndex(itemsForDivision));
            }

            const nextStatus =
              hydratedDetailView?.status || partialState.status || status || "COMPLETELY_APPROVED";

            next = {
              kind: "qc",
              item: {
                ...baseItem,
                formId: hydratedDetailView?.formId || formId,
                batchId: hydratedDetailView?.batchId || batchId,
                status: nextStatus,
                qcDivStatus: nextStatus,
                detailView: hydratedDetailView,
              },
              detailView: hydratedDetailView,
              formData: hydratedFormData,
              subDepartmentId: effectiveSubDepartmentId,
            };
            break;
          }
          case 12: {
            const response = await stfController.fetchFormDetails({ formId, subDepartmentId });
            if (!response?.success || !response?.data) throw new Error(response?.message);
            const detailView = mapStfDetailsForDisplay(
              response.data as unknown as Record<string, unknown>,
            );
            next = { kind: "stf", item: { ...baseItem, detailView } };
            setActiveMotorId(resolveInitialMotorId(detailView));
            break;
          }
          case 13: {
            const response = await dispatchController.fetchFormDetails({
              formId,
              subDepartmentId,
            });
            if (!response?.success || !response?.data) throw new Error(response?.message);
            const detailView = mapDispatchDetailsForDisplay(
              response.data as unknown as Record<string, unknown>,
            );
            next = { kind: "dispatch", item: { ...baseItem, detailView } };
            setActiveMotorId(resolveInitialMotorId(detailView));
            break;
          }
          // case 11:
          // default:
          //   next = { kind: "unsupported" };
          //   break;
        }

        if (!cancelled) setPayload(next);
      } catch (err: any) {
        if (!cancelled) {
          setPayload(null);
          showAlert(err?.message || S.FORM_DETAILS_FETCH_ERROR, "error", { autoCloseMs: 3500 });
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, targetFormId, subDepartmentId, batchId, status, showAlert, onClose]);

  useEffect(() => {
    if (!open || payload?.kind !== "unsupported") return;
    showAlert(S.FORM_DETAILS_UNSUPPORTED, "info", { autoCloseMs: 3000 });
    onClose();
  }, [open, payload, showAlert, onClose]);

  if (!open || !target) return null;

  const common = {
    open: true,
    onClose,
    loading: false,
    theme,
  };

  let dialog: React.ReactNode = null;

  if (loading && !payload) {
    dialog = (
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: FORM_PREVIEW_Z_INDEX,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "rgba(0,0,0,0.35)",
        }}
      >
        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: 2,
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <CircularProgress size={28} />
          <Typography variant="body2">{S.FORM_DETAILS_LOADING}</Typography>
        </Box>
      </Box>
    );
  } else if (payload && payload.kind !== "unsupported") {
    switch (payload.kind) {
      case "rmp":
        dialog = (
          <RawMaterialPreparationApproverDetailDialog
            {...common}
            item={payload.item}
            activePremixNo={activePremixNo}
            onActivePremixChange={setActivePremixNo}
          />
        );
        break;
      case "casePrep":
        dialog = (
          <CasePreparationApproverDetailDialog
            {...common}
            item={payload.item}
            activeMotorId={activeMotorId}
            onActiveMotorChange={setActiveMotorId}
          />
        );
        break;
      case "mixing":
        dialog = (
          <MixingApproverDetailDialog
            {...common}
            item={payload.item}
            activeMixCardId={activeMixCardId}
            onActiveMixCardChange={setActiveMixCardId}
          />
        );
        break;
      case "casting":
        dialog = (
          <CastingAndCuringApproverDetailDialog
            {...common}
            item={payload.item}
            activeMotorId={activeMotorId}
            onActiveMotorChange={setActiveMotorId}
          />
        );
        break;
      case "postCure":
        dialog = (
          <PostCureApproverDetailDialog
            {...common}
            item={payload.item}
            activeMotorId={activeMotorId}
            onActiveMotorChange={setActiveMotorId}
          />
        );
        break;
      case "subscale":
        dialog = (
          <SubscaleApproverDetailDialog
            {...common}
            item={payload.item}
            detailView={payload.detailView}
          />
        );
        break;
      case "trimming":
        dialog = (
          <TrimmingApproverDetailDialog
            {...common}
            item={payload.item}
            activeMotorId={activeMotorId}
            onActiveMotorChange={setActiveMotorId}
          />
        );
        break;
      case "ndt":
        dialog = (
          <NDTApproverDetailDialog
            {...common}
            item={payload.item}
            activeMotorId={activeMotorId}
            onActiveMotorChange={setActiveMotorId}
          />
        );
        break;

      case "qc":
        dialog = (
          <QCDivisionApproverDetailDialog
            {...common}
            item={payload.item}
            detailView={payload.detailView}
            formData={scopedQcFormData}
            subDepartmentId={payload.subDepartmentId}
            schemaLoading={false}
            activeDivisionGroupIndex={activeDivisionGroupIndex}
            activeDivisionSubIndex={activeDivisionSubIndex}
            onActiveDivisionGroupIndexChange={(index: number) => {
              setActiveDivisionGroupIndex(index);
              setActiveDivisionSubIndex(0);
            }}
            onActiveDivisionSubIndexChange={setActiveDivisionSubIndex}
            divisionNavTabs={qcDivisionNavTabs}
            activeDivisionTabKey={effectiveDivisionKey}
            onActiveDivisionTabKeyChange={(tabKey: string) => {
              const key = String(tabKey ?? "").trim();
              if (!key) return;
              setActiveDivisionTabKey(key);
              setActiveDivisionGroupIndex(0);
              setActiveDivisionSubIndex(0);
              setActivePartialNavIndex(
                resolveInitialApproverPartialNavIndex(partialNavByDivision[key] ?? []),
              );
            }}
            partialNavItems={qcPartialNavItems}
            activePartialNavIndex={activePartialNavIndex}
            onActivePartialNavIndexChange={(index: number) => {
              setActivePartialNavIndex(index);
              const item = qcPartialNavItems[index];
              if (item) {
                const { groupIndex, subIndex } = resolveFormNavForPartialItem(
                  payload.formData?.divisionEntries ?? [],
                  item,
                  { flowKey: toApproverFlowKey(effectiveDivisionKey) },
                );
                setActiveDivisionGroupIndex(groupIndex);
                setActiveDivisionSubIndex(subIndex);
              } else {
                setActiveDivisionGroupIndex(0);
                setActiveDivisionSubIndex(0);
              }
            }}
            divisionStatusByFlowKey={divisionStatusByFlowKey}
            divisionApprovalRows={qcDivisionApprovalRows}
            finalApprovalGroups={qcFinalApprovalGroups}
            finalApprovalRows={qcFinalApprovalRows}
            actionLoading={false}
          />
        );
        break;
      case "stf":
        dialog = (
          <STFApproverDetailDialog
            {...common}
            item={payload.item}
            activeMotorId={activeMotorId}
            onActiveMotorChange={setActiveMotorId}
            typeOfMotor="acem"
          />
        );
        break;
      case "dispatch":
        dialog = (
          <DispatchApproverDetailDialog
            {...common}
            item={payload.item}
            activeMotorId={activeMotorId}
            onActiveMotorChange={setActiveMotorId}
          />
        );
        break;
      default:
        dialog = null;
    }
  }

  if (!dialog) return null;

  return createPortal(<ThemeProvider theme={elevatedTheme}>{dialog}</ThemeProvider>, document.body);
}
