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
          case 11:
          default:
            next = { kind: "unsupported" };
            break;
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

  return createPortal(
    <ThemeProvider theme={elevatedTheme}>{dialog}</ThemeProvider>,
    document.body,
  );
}
