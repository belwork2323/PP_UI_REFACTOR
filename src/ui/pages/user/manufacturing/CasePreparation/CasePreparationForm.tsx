import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { CASE_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/casePreparation_theme";
import {
  isMainMotorBatch,
  isSubscaleBatch,
  resolveCasePrepBatchMotorCount,
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
  createCasePrepInitialValues,
  hydrateCasePrepValuesFromSections,
  type SchemaDocumentV2,
  type SchemaFormValues,
} from "../../../../../schema-engine";
import PremixStatusChip from "../RawMaterial/components/PremixStatusChip";
import CasePrepDateField from "./CasePrepDateField";
import CasePrepMotorSchemaPanel from "./CasePrepMotorSchemaPanel";
import CasePrepSubscaleSchemaPanel from "./CasePrepSubscaleSchemaPanel";
import FinalApprovalMotorDialog, {
  areAllMotorsApproved,
  buildFinalApprovalMotorRows,
} from "./components/FinalApprovalMotorDialog";
import {
  UserWorkflowNavPanel,
  UserWorkflowTabNav,
  type UserWorkflowNavTab,
} from "../../../../components/custom/UserWorkflowStepPager";

const S = STRINGS.MANUFACTURING.CASE_PREP;
const { cleaningServices: CleaningServicesRoundedIcon } = icons.user.manufacturing.casePreparation.form;

type CasePreparationFormProps = {
  batch?: {
    batchId?: string;
    batchType?: string;
    motorId?: string;
    motorIds?: Array<string | number>;
    numberOfMotors?: number | string;
    formId?: string | null;
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
  onMotorSessionChange: (
    motorId: string,
    next: CasePrepMotorSession,
    meta?: { hydrate?: boolean },
  ) => void;
  onSubscaleValuesChange: (values: SchemaFormValues) => void;
  onSaveMotorDraft?: (motorId: string) => void;
  onSubmitMotor?: (motorId: string) => void;
  onSubmitForFinalApproval?: () => void;
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
  schemaLoading = false,
  schemaError = null,
  subDepartmentId,
  actionLoading = false,
  onMotorSessionChange,
  onSubscaleValuesChange,
  onSaveMotorDraft,
  onSubmitMotor,
  onSubmitForFinalApproval,
  theme,
}: CasePreparationFormProps) => {
  const BRAND = CASE_PREP_BRAND;
  const schema = formData.schema;
  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];
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

  const setupContext = useMemo(
    () => ({
      numberOfMotors: resolveCasePrepBatchMotorCount(batch, batchMotorCount),
    }),
    [batch, batchMotorCount],
  );

  const statusConfig = theme?.manufacturing?.casePreparation?.details?.bannerStatusConfig ?? {};
  const activeMotorId = activeMotorEntry?.motorId ?? "";
  const activeMotorStatus =
    (getMotorStatus?.(activeMotorId) ??
      motorStatusById[activeMotorId]?.motorSubmissionStatus ??
      "TO_BE_INITIATED") as MotorSubmissionStatus;
  const activeMotorLocked = activeMotorId ? !(isMotorEditable?.(activeMotorId) ?? true) : false;

  const finalApprovalRows = useMemo(
    () => buildFinalApprovalMotorRows(motorStatusById, motorCards.map((m) => m.motorId)),
    [motorCards, motorStatusById],
  );
  const allMotorsApproved = areAllMotorsApproved(finalApprovalRows);
  const canOpenFinalApproval = Boolean(batch?.formId);

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

  useEffect(() => {
    if (!schema || !isMainMotorBatch(batch?.batchType)) return;
    if (!activeMotorSession || Object.keys(activeMotorSession.formValues ?? {}).length === 0) return;

    const prefetchIndexes = [activeMotorIndex + 1, activeMotorIndex - 1].filter(
      (idx) => idx >= 0 && idx < motorCards.length,
    );
    if (!prefetchIndexes.length) return;

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      prefetchIndexes.forEach((idx) => {
        const entry = motorCards[idx];
        const session = (formData.motors ?? []).find((m) => m.motorId === entry.motorId);
        if (!session || Object.keys(session.formValues ?? {}).length > 0) return;
        const nextValues = session.savedSections?.length
          ? hydrateCasePrepValuesFromSections(schema, session.savedSections, setupContext)
          : createCasePrepInitialValues(schema, setupContext);
        onMotorSessionChange(
          entry.motorId,
          { ...session, formValues: nextValues, savedSections: undefined },
          { hydrate: true },
        );
      });
    };

    const idleId =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? window.requestIdleCallback(run, { timeout: 1200 })
        : window.setTimeout(run, 0);

    return () => {
      cancelled = true;
      if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId as number);
      } else {
        window.clearTimeout(idleId as number);
      }
    };
  }, [
    activeMotorIndex,
    activeMotorSession,
    batch?.batchType,
    formData.motors,
    motorCards,
    onMotorSessionChange,
    schema,
    setupContext,
  ]);

  if (!supportsCasePrepSchemaFlow(batch?.batchType)) {
    return (
      <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${BRAND.border}`, background: BRAND.surface }}>
        <Typography sx={{ fontSize: "0.85rem", color: BRAND.textSub }}>{S.NON_MAIN_BATCH_MESSAGE}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} mb={2.5} flexWrap="wrap">
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
            <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: BRAND.text }}>{S.FORM_TITLE}</Typography>
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.15 }}>{S.FORM_SUBTITLE}</Typography>
          </Box>
        </Stack>

        {isMainMotorBatch(batch?.batchType) && motorCards.length > 0 ? (
          <Button
            variant="contained"
            size="small"
            disabled={actionLoading || !canOpenFinalApproval}
            onClick={() => setFinalApprovalOpen(true)}
          >
            {S.SUBMIT_FOR_FINAL_APPROVAL}
          </Button>
        ) : null}
      </Stack>

      {schemaLoading && !schema ? (
        <Stack direction="row" alignItems="center" gap={1.25} sx={{ py: 3, justifyContent: "center" }}>
          <CircularProgress size={22} />
          <Typography sx={{ fontSize: "0.82rem", color: BRAND.textSub }}>{S.BATCH_DETAILS_LOADING}</Typography>
        </Stack>
      ) : null}

      {schemaError ? (
        <Typography sx={{ fontSize: "0.82rem", color: BRAND.danger, mb: 2 }}>{schemaError}</Typography>
      ) : null}

      {isSubscaleBatch(batch?.batchType) && schema && (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.border}`,
            background: theme.palette.surface,
            px: 1.5,
            py: 1.25,
          }}
        >
          <CasePrepSubscaleSchemaPanel
            schema={schema}
            formValues={formData.subscaleFormValues ?? {}}
            savedSections={formData.subscaleSavedSections}
            subDepartmentId={subDepartmentId}
            batchId={batch?.batchId}
            onChange={onSubscaleValuesChange}
            loading={schemaLoading}
            error={schemaError}
          />
        </Box>
      )}

      {isMainMotorBatch(batch?.batchType) &&
        motorCards.length > 0 &&
        activeMotorEntry &&
        activeMotorSession &&
        schema && (
          <Stack spacing={1.25}>
            <UserWorkflowNavPanel palette={navPalette}>
              <UserWorkflowTabNav
                title={S.MOTOR_NAV_TITLE}
                hint={S.MOTOR_NAV_HINT}
                tabs={motorTabs}
                activeIndex={activeMotorIndex}
                onActiveIndexChange={setActiveMotorIndex}
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
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: theme.palette.primary }}>
                    {S.MOTOR_CARD_TITLE} — {activeMotorEntry.motorId}
                  </Typography>
                  <PremixStatusChip
                    status={activeMotorStatus}
                    statusConfig={statusConfig}
                    variant="embedded"
                  />
                </Stack>

                <Stack direction="row" gap={1} flexShrink={0}>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={actionLoading || activeMotorLocked}
                    onClick={() => onSaveMotorDraft?.(activeMotorEntry.motorId)}
                  >
                    {S.SAVE_MOTOR_DRAFT}
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={actionLoading || activeMotorLocked}
                    onClick={() => onSubmitMotor?.(activeMotorEntry.motorId)}
                  >
                    {S.SUBMIT_MOTOR}
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
                    border: `1px solid ${theme.palette.border}`,
                    bgcolor: theme.palette.background ?? BRAND.surface,
                  }}
                >
                  <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, fontWeight: 600 }}>
                    {activeMotorStatus === "APPROVED" ? S.MOTOR_LOCKED_APPROVED : S.MOTOR_LOCKED_WAITING}
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

              <CasePrepMotorSchemaPanel
                schema={schema as SchemaDocumentV2}
                motor={activeMotorSession}
                motorIndex={activeMotorIndex}
                setupContext={setupContext}
                subDepartmentId={subDepartmentId}
                batchId={batch?.batchId}
                readOnly={activeMotorLocked}
                onMotorChange={(next, meta) => onMotorSessionChange(activeMotorEntry.motorId, next, meta)}
                loading={schemaLoading}
                error={schemaError}
              />
            </Box>
          </Stack>
        )}

      <FinalApprovalMotorDialog
        open={finalApprovalOpen}
        rows={finalApprovalRows}
        statusConfig={statusConfig}
        allMotorsApproved={allMotorsApproved}
        confirmDisabled={actionLoading}
        onClose={() => setFinalApprovalOpen(false)}
        onProceed={async () => {
          setFinalApprovalOpen(false);
          await onSubmitForFinalApproval?.();
        }}
      />
    </Box>
  );
};

export default CasePreparationForm;
