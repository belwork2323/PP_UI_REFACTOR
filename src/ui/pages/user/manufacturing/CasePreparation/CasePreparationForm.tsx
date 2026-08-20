import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { CASE_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/casePreparation_theme";
import {
  isMainMotorBatch,
  isSubscaleBatch,
  supportsCasePrepSchemaFlow,
  type CasePrepAddedMotor,
} from "../../../../../hooks/user/manufacturing/casePreparationFlowConfig";
import type {
  CasePrepMotorSession,
  CasePreparationFormState,
  MotorStatusMeta,
  MotorSubmissionStatus,
} from "../../../../../data/models/user/CasePreparationFormModel";
import {
  getRocketMotorCasingMotorsFromSheet,
  type IdentificationSheet,
} from "../../../../../data/models/admin/BatchManagement/BatchManagementModel";
import {
  createEmptyCasePrepMotorData,
  type CasePrepMotorData,
} from "../../../../../data/models/user/CasePrepMotorDataModel";
import PremixStatusChip from "../RawMaterial/components/PremixStatusChip";
import ViewStatusButton from "../../../../components/common/ViewStatusButton";
import CasePrepDateField from "./CasePrepDateField";
import CasePrepMotorPanel from "./CasePrepMotorPanel";
import FinalApprovalMotorDialog, {
  areAllMotorsApproved,
  buildFinalApprovalMotorRows,
} from "./components/FinalApprovalMotorDialog";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";
import { buildMotorNavGateHelpers } from "../../../../../hooks/user/previousStageApproval";

const S = STRINGS.MANUFACTURING.CASE_PREP;
const { cleaningServices: CleaningServicesRoundedIcon } =
  icons.user.manufacturing.casePreparation.form;

type CasePreparationFormProps = {
  batch?: {
    batchId?: string;
    batchType?: string;
    motorId?: string;
    motorIds?: Array<string | number>;
    numberOfMotors?: number | string;
    formId?: string | null;
    identificationSheet?: IdentificationSheet | Record<string, unknown> | null;
  } | null;
  formData: CasePreparationFormState;
  addedMotors: CasePrepAddedMotor[];
  batchMotorCount?: number;
  motorStatusById?: Record<string, MotorStatusMeta>;
  getMotorStatus?: (motorId: string) => MotorSubmissionStatus;
  isMotorEditable?: (motorId: string) => boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  subDepartmentId?: number;
  actionLoading?: boolean;
  onMotorSessionChange: (motorId: string, next: CasePrepMotorSession) => void;
  onSubscaleValuesChange: (values: CasePrepMotorData) => void;
  onSaveMotorDraft?: (motorId: string) => void;
  onSubmitMotor?: (motorId: string) => void;
  theme: any;
};

const CasePreparationForm = ({
  batch,
  formData,
  addedMotors,
  batchMotorCount = 1,
  motorStatusById = {},
  getMotorStatus,
  isMotorEditable,
  schemaError = null,
  actionLoading = false,
  onMotorSessionChange,
  onSubscaleValuesChange,
  onSaveMotorDraft,
  onSubmitMotor,
  theme,
}: CasePreparationFormProps) => {
  const BRAND = CASE_PREP_BRAND;
  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];
  const motorNavGate = useMemo(() => {
    const resolveMotorStatus = (motorId: string) =>
      getMotorStatus?.(motorId) ??
      motorStatusById[motorId]?.motorSubmissionStatus ??
      "TO_BE_INITIATED";
    return buildMotorNavGateHelpers(
      motorCards,
      {
        enableAll: true,
        kind: "motor",
        previousSubDepartmentId: null,
        previousSubDepartmentName: null,
        approvedPremixNos: new Set(),
        approvedMotorIds: new Set(),
      },
      resolveMotorStatus,
    );
  }, [motorCards, getMotorStatus, motorStatusById]);
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const [finalApprovalOpen, setFinalApprovalOpen] = useState(false);

  useEffect(() => {
    if (motorCards.length === 0) {
      setActiveMotorIndex(0);
      return;
    }
    setActiveMotorIndex((prev) => Math.min(prev, motorCards.length - 1));
  }, [motorCards.length]);

  const activeMotorEntry = useMemo(
    () => (motorCards.length > 0 ? motorCards[activeMotorIndex] : null),
    [motorCards, activeMotorIndex],
  );

  const activeMotorSession = useMemo(() => {
    if (!activeMotorEntry) return null;
    return (formData.motors ?? []).find((m) => m.motorId === activeMotorEntry.motorId) ?? null;
  }, [activeMotorEntry, formData.motors]);

  const statusConfig = theme?.manufacturing?.casePreparation?.details?.bannerStatusConfig ?? {};
  const activeMotorId = activeMotorEntry?.motorId ?? "";
  const activeMotorStatus = (getMotorStatus?.(activeMotorId) ??
    motorStatusById[activeMotorId]?.motorSubmissionStatus ??
    "TO_BE_INITIATED") as MotorSubmissionStatus;
  const activeMotorLocked = activeMotorId
    ? !motorNavGate.isMotorWorkflowEnabled(activeMotorId) ||
      !(isMotorEditable?.(activeMotorId) ?? true)
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

  const navPalette = useMemo(
    () => ({
      primary: theme.palette.primary,
      primaryLight: theme.palette.primaryLight,
      border: theme.palette.border,
      surface: theme.palette.surface,
      textSub: theme.palette.textSub,
      text: theme.palette.text,
    }),
    [theme.palette],
  );

  const sheet = (batch?.identificationSheet ?? null) as IdentificationSheet | null;
  const sheetMaterials = Array.isArray(sheet?.materials) ? sheet.materials : [];

  const activeMotorMeta = useMemo(() => {
    const motorId = activeMotorEntry?.motorId ?? "";
    if (!motorId || !sheet) return { casingType: "", insulationType: "" };
    const motors = getRocketMotorCasingMotorsFromSheet(sheet);
    const match = motors.find((m) => String(m.motorId ?? "").trim() === motorId);
    return {
      casingType: String(match?.castingType ?? "").trim(),
      insulationType: String(match?.insulationType ?? "").trim(),
    };
  }, [activeMotorEntry?.motorId, sheet]);

  const motorTabs = useMemo<UserWorkflowNavTab[]>(
    () =>
      motorCards.map((entry, index) => {
        const status =
          getMotorStatus?.(entry.motorId) ??
          motorStatusById[entry.motorId]?.motorSubmissionStatus ??
          "TO_BE_INITIATED";
        return {
          id: entry.motorId,
          label: entry.motorId,
          endAdornment: (
            <PremixStatusChip
              status={status as any}
              statusConfig={statusConfig}
              variant="embedded"
              onAccent={index === activeMotorIndex}
            />
          ),
        };
      }),
    [activeMotorIndex, getMotorStatus, motorCards, motorStatusById, statusConfig],
  );

  const subscaleData = formData.subscaleData ?? createEmptyCasePrepMotorData();

  if (!supportsCasePrepSchemaFlow(batch?.batchType)) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px solid ${BRAND.border}`,
          background: BRAND.surface,
        }}
      >
        <Typography sx={{ fontSize: "0.85rem", color: BRAND.textSub }}>
          {S.NON_MAIN_BATCH_MESSAGE}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1.5}
        mb={2.5}
        flexWrap="wrap"
      >
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "11px",
              background: "linear-gradient(135deg,#1565C0,#1976D2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(21,101,192,0.3)",
            }}
          >
            <CleaningServicesRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: BRAND.text }}>
              {S.FORM_TITLE}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.15 }}>
              {S.FORM_SUBTITLE}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {schemaError ? (
        <Typography sx={{ fontSize: "0.82rem", color: BRAND.danger, mb: 2 }}>
          {schemaError}
        </Typography>
      ) : null}

      {isSubscaleBatch(batch?.batchType) && (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.border}`,
            background: theme.palette.surface,
            px: 1.5,
            py: 1.25,
          }}
        >
          <CasePrepMotorPanel
            value={subscaleData}
            onChange={onSubscaleValuesChange}
            motorId="SUBSCALE"
            batchId={batch?.batchId}
            theme={theme}
          />
        </Box>
      )}

      {isMainMotorBatch(batch?.batchType) &&
        motorCards.length > 0 &&
        activeMotorEntry &&
        activeMotorSession && (
          <Stack spacing={1.25}>
            <UserWorkflowNavPanel palette={navPalette}>
              <UserWorkflowTabNav
                title={S.MOTOR_NAV_TITLE}
                hint={S.MOTOR_NAV_HINT}
                tabs={motorTabs}
                activeIndex={activeMotorIndex}
                onActiveIndexChange={setActiveMotorIndex}
                isTabDisabled={(_, index) => !motorNavGate.isMotorTabEnabled(index)}
                tabTooltip={(_, index) => motorNavGate.getMotorTabTooltip(index)}
                palette={navPalette}
                showStepArrows
                titleEndAdornment={
                  <Chip
                    label={`${S.BATCH_MOTOR_COUNT_LABEL}: ${batchMotorCount}`}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.72rem",
                      height: 24,
                      background: BRAND.cp ?? "#1565C0",
                      color: "#fff",
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                }
              />
            </UserWorkflowNavPanel>

            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                disabled={actionLoading || activeMotorLocked}
                onClick={() => onSaveMotorDraft?.(activeMotorEntry.motorId)}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                {S.SAVE_MOTOR_DRAFT(activeMotorEntry.motorId)}
              </Button>
              <Button
                variant="contained"
                size="small"
                disabled={actionLoading || activeMotorLocked}
                onClick={() => onSubmitMotor?.(activeMotorEntry.motorId)}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                {S.SUBMIT_MOTOR(activeMotorEntry.motorId)}
              </Button>
              <ViewStatusButton
                disabled={actionLoading}
                onClick={() => setFinalApprovalOpen(true)}
                label={S.VIEW_STATUS}
              />
            </Stack>

            <Box
              sx={{
                borderRadius: 2.5,
                border: `1px solid ${theme.palette.border}`,
                background: theme.palette.surface,
                px: 1.5,
                py: 1.25,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ sm: "center" }}
                justifyContent="space-between"
                gap={1}
                mb={1}
              >
                <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography
                    sx={{ fontSize: "0.8rem", fontWeight: 700, color: theme.palette.primary }}
                  >
                    {S.MOTOR_CARD_TITLE} — {activeMotorEntry.motorId}
                  </Typography>
                  <PremixStatusChip
                    status={activeMotorStatus}
                    statusConfig={statusConfig}
                    variant="embedded"
                  />
                </Stack>
              </Stack>

              {activeMotorLocked ? (
                <Box
                  sx={{
                    mb: 1.25,
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 1.5,
                    border: `1px solid ${theme.palette.border}`,
                    bgcolor: theme.palette.background ?? BRAND.surface,
                  }}
                >
                  <Typography
                    sx={{ fontSize: "0.72rem", color: theme.palette.textSub, fontWeight: 600 }}
                  >
                    {activeMotorStatus === "APPROVED"
                      ? S.MOTOR_LOCKED_APPROVED
                      : S.MOTOR_LOCKED_WAITING}
                  </Typography>
                </Box>
              ) : null}

              <Box sx={{ mb: 1.5 }}>
                <CasePrepDateField
                  label={`${S.PRRC_CLEARANCE_DATE_LABEL}:`}
                  value={activeMotorSession.prrcClearanceDate || ""}
                  onChange={(value) =>
                    onMotorSessionChange(activeMotorEntry.motorId, {
                      ...activeMotorSession,
                      prrcClearanceDate: value,
                    })
                  }
                  disabled={activeMotorLocked}
                  placeholder={S.PRRC_CLEARANCE_DATE_PLACEHOLDER}
                  theme={theme}
                />
              </Box>

              <CasePrepMotorPanel
                value={activeMotorSession.data ?? createEmptyCasePrepMotorData()}
                onChange={(next) =>
                  onMotorSessionChange(activeMotorEntry.motorId, {
                    ...activeMotorSession,
                    data: next,
                  })
                }
                motorId={activeMotorEntry.motorId}
                batchId={batch?.batchId}
                casingType={activeMotorMeta.casingType}
                insulationType={activeMotorMeta.insulationType}
                materials={sheetMaterials}
                disabled={activeMotorLocked}
                theme={theme}
              />
            </Box>
          </Stack>
        )}

      <FinalApprovalMotorDialog
        open={finalApprovalOpen}
        rows={finalApprovalRows}
        statusConfig={statusConfig}
        allMotorsApproved={allMotorsApproved}
        hideConfirm
        onClose={() => setFinalApprovalOpen(false)}
      />
    </Box>
  );
};

export default CasePreparationForm;
