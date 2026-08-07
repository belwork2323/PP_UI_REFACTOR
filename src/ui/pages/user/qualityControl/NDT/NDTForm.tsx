import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Chip, Stack, Typography, alpha } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import {
  canLoadNDTForm,
  NDT_BEAM_ENERGY_OPTIONS,
  NDT_EQUIPMENT_OPTIONS,
  NDT_FLOW_LABELS,
  type NDTAddedMotor,
  type NDTMotorOption,
} from "../../../../../hooks/user/qualityControl/ndtFlowConfig";
import {
  isNDTMotorSetupReady,
  normalizeNDTMotorSession,
  type NDTFormState,
  type NDTMotorSession,
  type NDTMotorStatusMeta,
  type NDTMotorSubmissionStatus,
} from "../../../../../data/models/user/NDTFormModel";
import type { NDTBatch } from "../../../../../hooks/user/qualityControl/useNDTHook";
import {
  buildMotorNavGateHelpers,
  type PreviousStageApprovedUnits,
} from "../../../../../hooks/user/previousStageApproval";
import { generalController } from "../../../../../controllers/admin/common/generalController";
import PremixStatusChip from "../../manufacturing/RawMaterial/components/PremixStatusChip";
import FinalApprovalMotorDialog, {
  areAllMotorsApproved,
  buildFinalApprovalMotorRows,
} from "../../manufacturing/CasePreparation/components/FinalApprovalMotorDialog";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";
import NDTFlowBar, { type NDTBeamEnergyOption, type NDTEquipmentOption } from "./NDTFlowBar";
import NDTMotorTables from "./NDTMotorTables";

const strings = STRINGS.QUALITY_CONTROL.NDT;
const { warning: WarningAmberRoundedIcon, biotech: BiotechRoundedIcon } =
  icons.user.qualityControl.ndt.form;

type Props = {
  activeBatch?: NDTBatch | null;
  formData: NDTFormState;
  addedMotors: NDTAddedMotor[];
  autoMotorEntries?: NDTAddedMotor[];
  availableMotorOptions?: NDTMotorOption[];
  motorStatusById?: Record<string, NDTMotorStatusMeta>;
  getMotorStatus?: (motorId: string) => NDTMotorSubmissionStatus;
  isMotorEditable?: (motorId: string) => boolean;
  previousStageGate?: PreviousStageApprovedUnits | null;
  actionLoading?: boolean;
  isEditMode?: boolean;
  theme: ReturnType<typeof getQualityControlTheme>;
  onSetupChange: (patch: Partial<NDTFormState>) => void;
  onMotorSessionChange: (motorId: string, patch: Partial<NDTMotorSession>) => void;
  onLoadNDTForm: (motorId?: string) => void;
  onSaveMotorDraft?: (motorId: string) => void;
  onSubmitMotor?: (motorId: string) => void;
  onSubmitForFinalApproval?: () => void;
};

const NDTForm = ({
  activeBatch = null,
  formData,
  addedMotors,
  autoMotorEntries,
  availableMotorOptions = [],
  motorStatusById = {},
  getMotorStatus,
  isMotorEditable,
  previousStageGate = null,
  actionLoading = false,
  isEditMode = false,
  theme,
  onSetupChange,
  onMotorSessionChange,
  onLoadNDTForm,
  onSaveMotorDraft,
  onSubmitMotor,
  onSubmitForFinalApproval,
}: Props) => {
  const ndtTheme = theme.qualityControl.ndt;
  const brand = ndtTheme.brand;
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const [finalApprovalOpen, setFinalApprovalOpen] = useState(false);
  const [equipmentOptions, setEquipmentOptions] = useState<NDTEquipmentOption[]>([
    ...NDT_EQUIPMENT_OPTIONS,
  ]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [beamEnergyOptions, setBeamEnergyOptions] = useState<NDTBeamEnergyOption[]>(
    NDT_BEAM_ENERGY_OPTIONS.map((option) => ({ value: option, label: option })),
  );
  const [beamEnergyLoading, setBeamEnergyLoading] = useState(false);
  const prevMotorCountRef = useRef(0);
  const formSessionKey = `${activeBatch?.batchId ?? ""}:${activeBatch?.formId ?? "new"}`;

  const motorCards = useMemo(() => {
    const autoCards = Array.isArray(autoMotorEntries)
      ? autoMotorEntries.filter((entry) => Boolean(entry?.motorId))
      : [];
    return autoCards.length > 0 ? autoCards : Array.isArray(addedMotors) ? addedMotors : [];
  }, [addedMotors, autoMotorEntries]);

  const motorNavGate = useMemo(() => {
    const resolveMotorStatus = (motorId: string) =>
      getMotorStatus?.(motorId) ??
      motorStatusById[motorId]?.motorSubmissionStatus ??
      "TO_BE_INITIATED";
    return buildMotorNavGateHelpers(motorCards, previousStageGate, resolveMotorStatus, {
      previousStage: STRINGS.MANUFACTURING.PREVIOUS_STAGE_MOTOR_TAB_DISABLED,
      sequential: STRINGS.MANUFACTURING.SEQUENTIAL_UNIT_TAB_DISABLED,
    });
  }, [motorCards, previousStageGate, getMotorStatus, motorStatusById]);

  const safeBeamEnergies = Array.isArray(formData.beamEnergies) ? formData.beamEnergies : [];
  const safeEquipment = useMemo(() => {
    return Array.isArray(formData.equipment) ? formData.equipment : [];
  }, [formData.equipment]);

  useEffect(() => {
    let cancelled = false;

    const loadEquipment = async () => {
      setEquipmentLoading(true);
      try {
        const response = await generalController.getEquipmentList();
        if (cancelled) return;
        if (!response?.success || !Array.isArray(response.data) || response.data.length === 0) {
          setEquipmentOptions([...NDT_EQUIPMENT_OPTIONS]);
          return;
        }
        setEquipmentOptions(
          response.data
            .map(
              (item: {
                equipmentCode?: string;
                equipmentName?: string;
                code?: string;
                name?: string;
              }) => {
                const name = String(item.equipmentName ?? item.name ?? "").trim();
                const code = String(item.equipmentCode ?? item.code ?? "").trim();
                const label = name || code;
                // Keep display name as value so existing NDT equipment API mappers continue to work.
                return label ? { value: label, label } : null;
              },
            )
            .filter(Boolean) as NDTEquipmentOption[],
        );
      } catch {
        if (!cancelled) setEquipmentOptions([...NDT_EQUIPMENT_OPTIONS]);
      } finally {
        if (!cancelled) setEquipmentLoading(false);
      }
    };

    const loadBeamEnergies = async () => {
      setBeamEnergyLoading(true);
      try {
        const response = await generalController.getBeamEnergyList();
        if (cancelled) return;
        if (!response?.success || !Array.isArray(response.data) || response.data.length === 0) {
          setBeamEnergyOptions(
            NDT_BEAM_ENERGY_OPTIONS.map((option) => ({ value: option, label: option })),
          );
          return;
        }
        setBeamEnergyOptions(
          response.data
            .map(
              (item: {
                beamEnergyCode?: string;
                beamEnergyName?: string;
                code?: string;
                name?: string;
              }) => {
                const name = String(item.beamEnergyName ?? item.name ?? "").trim();
                const code = String(item.beamEnergyCode ?? item.code ?? "").trim();
                const label = name || code;
                // Keep display name as value so existing NDT beam energy API mappers continue to work.
                return label ? { value: label, label } : null;
              },
            )
            .filter(Boolean) as NDTBeamEnergyOption[],
        );
      } catch {
        if (!cancelled) {
          setBeamEnergyOptions(
            NDT_BEAM_ENERGY_OPTIONS.map((option) => ({ value: option, label: option })),
          );
        }
      } finally {
        if (!cancelled) setBeamEnergyLoading(false);
      }
    };

    void loadEquipment();
    void loadBeamEnergies();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setActiveMotorIndex(0);
    prevMotorCountRef.current = 0;
  }, [formSessionKey]);

  useEffect(() => {
    if (motorCards.length === 0) {
      setActiveMotorIndex(0);
      prevMotorCountRef.current = 0;
      return;
    }

    const prevCount = prevMotorCountRef.current;
    const firstEnabled = motorCards.findIndex((_, index) => motorNavGate.isMotorTabEnabled(index));

    if (prevCount === 0) {
      setActiveMotorIndex(firstEnabled >= 0 ? firstEnabled : 0);
    } else if (motorCards.length > prevCount) {
      setActiveMotorIndex(motorCards.length - 1);
    } else {
      setActiveMotorIndex((prev) => {
        const current = motorCards[prev];
        if (current && motorNavGate.isMotorWorkflowEnabled(current.motorId)) {
          return Math.min(prev, motorCards.length - 1);
        }
        return firstEnabled >= 0
          ? firstEnabled
          : Math.min(prev, motorCards.length - 1);
      });
    }

    prevMotorCountRef.current = motorCards.length;
  }, [motorCards, motorNavGate]);

  const activeMotorEntry = useMemo(
    () => (motorCards.length > 0 ? motorCards[activeMotorIndex] : null),
    [motorCards, activeMotorIndex],
  );

  const activeMotorSession = useMemo(() => {
    if (!activeMotorEntry) return null;
    const found = (formData.motors ?? []).find(
      (motor) => motor.motorId === activeMotorEntry.motorId,
    );
    return found ? normalizeNDTMotorSession(found) : null;
  }, [activeMotorEntry, formData.motors]);

  const isCurrentMotorSetupReady = isNDTMotorSetupReady(activeMotorSession);

  const canLoad = canLoadNDTForm({
    equipment: safeEquipment,
    beamEnergies: safeBeamEnergies,
    ndtFormLoaded: isCurrentMotorSetupReady,
    availableMotorOptions,
  });

  const statusConfig = ndtTheme.details?.bannerStatusConfig ?? {};
  const activeMotorId = activeMotorEntry?.motorId ?? "";
  const activeMotorStatus = (getMotorStatus?.(activeMotorId) ??
    motorStatusById[activeMotorId]?.motorSubmissionStatus ??
    "TO_BE_INITIATED") as NDTMotorSubmissionStatus;
  const activeMotorPriorEnabled = motorNavGate.isMotorWorkflowEnabled(activeMotorId);
  const activeMotorLocked = activeMotorId
    ? !activeMotorPriorEnabled || !(isMotorEditable?.(activeMotorId) ?? true)
    : false;

  const finalApprovalRows = useMemo(
    () =>
      buildFinalApprovalMotorRows(
        motorStatusById,
        motorCards.map((m) => m.motorId),
      ),
    [motorCards, motorStatusById],
  );
  const allMotorsApproved = areAllMotorsApproved(finalApprovalRows);
  const canOpenFinalApproval = Boolean(activeBatch?.formId);

  const navPalette = {
    primary: brand.primary,
    primaryLight: brand.primaryLight,
    border: brand.border,
    surface: brand.surface,
    textSub: brand.textSub,
    text: brand.text,
  };

  const motorTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      motorCards.map((entry) => {
        const status = (getMotorStatus?.(entry.motorId) ??
          motorStatusById[entry.motorId]?.motorSubmissionStatus ??
          "TO_BE_INITIATED") as NDTMotorSubmissionStatus;
        return {
          id: entry.motorId,
          label: entry.motorId,
          endAdornment: (
            <PremixStatusChip
              status={status as any}
              statusConfig={statusConfig}
              showIcon={false}
              variant="embedded"
              onAccent={entry.motorId === activeMotorId}
            />
          ),
        };
      }),
    [activeMotorId, getMotorStatus, motorCards, motorStatusById, statusConfig],
  );

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      {isEditMode ? (
        <Box
          sx={{
            mb: 2,
            px: 1.75,
            py: 1.1,
            borderRadius: 2,
            background: alpha(brand.danger, 0.05),
            border: `1.5px solid ${alpha(brand.danger, 0.2)}`,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <WarningAmberRoundedIcon sx={{ fontSize: 18, color: brand.danger }} />
          <Typography sx={{ fontSize: "0.8rem", color: brand.danger, fontWeight: 600 }}>
            {strings.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      ) : null}

      <Box sx={ndtTheme.panel.header}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          gap={1.5}
        >
          <Stack direction="row" alignItems="center" gap={1.5} flex={1}>
            <Box sx={ndtTheme.panel.headerIcon}>
              <BiotechRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={ndtTheme.panel.headerTitle}>{strings.TITLE}</Typography>
              <Typography sx={ndtTheme.panel.headerSubtitle}>{strings.SUBTITLE}</Typography>
            </Box>
          </Stack>

          {motorCards.length > 0 ? (
            <Button
              variant="contained"
              size="small"
              disabled={actionLoading || !canOpenFinalApproval}
              onClick={() => setFinalApprovalOpen(true)}
            >
              {strings.SUBMIT_FOR_FINAL_APPROVAL}
            </Button>
          ) : null}
        </Stack>
      </Box>

      {motorCards.length > 0 && activeMotorEntry ? (
        <Stack spacing={1.25}>
          <UserWorkflowNavPanel palette={navPalette}>
            <UserWorkflowTabNav
              title={strings.MOTOR_NAV_TITLE}
              hint={strings.MOTOR_NAV_HINT}
              tabs={motorTabs}
              activeIndex={activeMotorIndex}
              onActiveIndexChange={setActiveMotorIndex}
              isTabDisabled={(_, index) => !motorNavGate.isMotorTabEnabled(index)}
              tabTooltip={(_, index) => motorNavGate.getMotorTabTooltip(index)}
              palette={navPalette}
              showStepArrows
              titleEndAdornment={
                <Chip
                  label={`${strings.BATCH_MOTOR_COUNT_LABEL}: ${motorCards.length}`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    height: 24,
                    background: brand.primary,
                    color: "#fff",
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              }
            />
          </UserWorkflowNavPanel>

          <Box sx={ndtTheme.panel.motorCard}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ sm: "center" }}
              justifyContent="space-between"
              gap={1}
              mb={1.25}
            >
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: brand.primary }}>
                  {NDT_FLOW_LABELS.motorCardTitle} — {activeMotorEntry.motorId}
                </Typography>
                <PremixStatusChip
                  status={activeMotorStatus as any}
                  statusConfig={statusConfig}
                  variant="embedded"
                />
              </Stack>

              <Stack direction="row" gap={1} flexShrink={0} alignItems="center">
                <Button
                  variant="outlined"
                  size="small"
                  disabled={actionLoading || activeMotorLocked || !isCurrentMotorSetupReady}
                  onClick={() => onSaveMotorDraft?.(activeMotorEntry.motorId)}
                >
                  {strings.SAVE_MOTOR_DRAFT}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  disabled={actionLoading || activeMotorLocked || !isCurrentMotorSetupReady}
                  onClick={() => onSubmitMotor?.(activeMotorEntry.motorId)}
                >
                  {strings.SUBMIT_MOTOR}
                </Button>
              </Stack>
            </Stack>

            {activeMotorLocked ? (
              <Box
                sx={{
                  mb: 1.25,
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1.5,
                  border: `1px solid ${brand.border}`,
                  bgcolor: brand.surface,
                }}
              >
                <Typography sx={{ fontSize: "0.72rem", color: brand.textSub, fontWeight: 600 }}>
                  {!activeMotorPriorEnabled
                    ? STRINGS.MANUFACTURING.PREVIOUS_STAGE_MOTOR_TAB_DISABLED
                    : activeMotorStatus === "APPROVED"
                      ? strings.MOTOR_LOCKED_APPROVED
                      : strings.MOTOR_LOCKED_WAITING}
                </Typography>
              </Box>
            ) : null}

            {activeMotorStatus === "REJECTED" && motorStatusById[activeMotorId]?.rejectionReason ? (
              <Alert severity="error" sx={{ fontSize: "0.78rem", mb: 1.25 }}>
                {motorStatusById[activeMotorId]?.rejectionReason}
              </Alert>
            ) : null}

            {!isCurrentMotorSetupReady ? (
              <NDTFlowBar
                equipment={safeEquipment}
                beamEnergies={safeBeamEnergies}
                radiographyPlan={formData.radiographyPlan ?? ""}
                ndtFormLoaded={isCurrentMotorSetupReady}
                equipmentOptions={equipmentOptions}
                equipmentLoading={equipmentLoading}
                beamEnergyOptions={beamEnergyOptions}
                beamEnergyLoading={beamEnergyLoading}
                onEquipmentChange={(equipment: string[]) => onSetupChange({ equipment })}
                onBeamEnergiesChange={(beamEnergies: string[]) => onSetupChange({ beamEnergies })}
                onRadiographyPlanChange={(radiographyPlan: string) =>
                  onSetupChange({ radiographyPlan })
                }
                onLoadNDTForm={() => onLoadNDTForm(activeMotorEntry.motorId)}
                canLoad={canLoad && !activeMotorLocked}
                theme={theme}
              />
            ) : (
              activeMotorSession && (
                <Box sx={activeMotorLocked ? { pointerEvents: "none", opacity: 0.72 } : undefined}>
                  <NDTMotorTables
                    motor={activeMotorSession}
                    theme={theme}
                    onChange={(patch) => onMotorSessionChange(activeMotorEntry.motorId, patch)}
                  />
                </Box>
              )
            )}
          </Box>
        </Stack>
      ) : null}

      <FinalApprovalMotorDialog
        open={finalApprovalOpen}
        rows={finalApprovalRows}
        statusConfig={statusConfig}
        allMotorsApproved={allMotorsApproved}
        confirmDisabled={actionLoading}
        copy={{
          title: strings.FINAL_APPROVAL_DIALOG_TITLE,
          info: strings.FINAL_APPROVAL_DIALOG_INFO,
          proceed: strings.FINAL_APPROVAL_PROCEED,
          close: strings.FINAL_APPROVAL_CLOSE,
          notReady: strings.FINAL_APPROVAL_NOT_READY,
          colMotor: strings.FINAL_APPROVAL_COL_MOTOR,
          colType: strings.FINAL_APPROVAL_COL_TYPE,
          colStatus: strings.FINAL_APPROVAL_COL_STATUS,
        }}
        onClose={() => setFinalApprovalOpen(false)}
        onProceed={async () => {
          setFinalApprovalOpen(false);
          await onSubmitForFinalApproval?.();
        }}
      />
    </Box>
  );
};

export default NDTForm;
