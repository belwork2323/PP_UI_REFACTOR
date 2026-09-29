import React, { useEffect, useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  Box,
  Chip,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { icons } from "../../../../../../app/theme/icons";
import VisualInspectionMediaField from "./VisualInspectionMediaField";
import CasingInsulationReportUpload from "./CasingInsulationReportUpload";
import StackRow from "../../../../../components/common/StackRow";
import { STRINGS } from "../../../../../../app/config/strings";
import {
  CASING_DETECTOR_TYPE_OPTIONS,
  DIM_READING_KEYS,
  type RocketMotorCasingFormData,
  CASING_FORM_STEP_COUNT,
  EMPTY_LOOSE_FLAP,
  createEmptyRadiographyPlanRow,
  isLooseFlapDimensionalParam,
  validateCasingFormStep,
  createEmptyMockTrialSlot,
  createInitialThermalProperties,
  createInitialMechanicalProperties,
  isThermalSpecificationCategory,
} from "../../../../../../data/models/user/RocketMotorCasingFormModel";
import {
  computeIsOutOfRange,
  isReferenceRangeNotApplicable,
  sanitizeNumericAnalysedResultInput,
} from "../../../../../../data/models/user/RawMaterialProcurementModel";
import { isCasingIdentificationComplete, isCasingFieldRequired, focusRmcField, type RmcValidationFocusTarget } from "../../../../../../data/validation/adapters/rocketMotorCasing.validation";
import CasingFormStepNav from "./CasingFormStepNav";
import RocketMotorCasingMockTrialPanel from "./RocketMotorCasingMockTrialPanel";
import type { useRocketMotorCasingLookups } from "../../../../../../hooks/user/sourcing/useRocketMotorCasingLookups";
import {
  DateField,
  FieldGrid,
  PropertiesTable,
  ReceiptStatusField,
  SectionCard,
  ProjectSelectField,
  SearchableSelectField,
  SelectField,
  SpecRangeChip,
  SubsectionTitle,
  TextFieldField,
  CasingDeferredInput,
  RequiredMark,
  casingWhiteInputSx,
} from "./CasingFormPrimitives";
import CasingReportUpload from "./CasingReportUpload";
import rocketMotorCasingController from "@/controllers/user/sourcing/rocketMotorCasingController";

const S = STRINGS.SOURCING.CASING_CREATE;
const SF = STRINGS.SOURCING.CASING_FORM;

const DIM_COLUMNS = DIM_READING_KEYS.map((key) => ({
  key,
  label:
    key === "r2tR2b"
      ? S.COL_R2T
      : key === "r1rR1l"
        ? S.COL_R1R
        : key === "tlBr"
          ? S.COL_TL
          : S.COL_TR,
}));

const { rocketLaunch: RocketLaunchRoundedIcon } = icons.user.sourcing.casingDetailsForm;

type Lookups = ReturnType<typeof useRocketMotorCasingLookups>;

type Props = {
  form: RocketMotorCasingFormData;
  setForm: React.Dispatch<React.SetStateAction<RocketMotorCasingFormData>>;
  lookups: Lookups;
  dimensionalParameters: Array<{
    paramId: string;
    paramName: string;
    referenceRange?: { minValue: number | null; maxValue: number | null; unit: string | null };
  }>;
  dimensionalParametersErrorMessage: string;
  motorStage: string;
  subDepartmentId: number;
  loadingDimensionalParams?: boolean;
  lockIdentification?: boolean;
  showDeleteCasing?: boolean;
  onDeleteCasing?: () => void;
  deleteLoading?: boolean;
  validationErrors?: Record<string, string>;
  validationFocusRequest?: {
    id: number;
    target: RmcValidationFocusTarget | null;
  } | null;
  theme: any;
};

const MotorCasingCreateForm = ({
  form,
  setForm,
  lookups,
  dimensionalParameters,
  dimensionalParametersErrorMessage,
  motorStage,
  subDepartmentId: _subDepartmentId,
  loadingDimensionalParams = false,
  lockIdentification = false,
  showDeleteCasing = false,
  onDeleteCasing,
  deleteLoading = false,
  validationErrors = {},
  validationFocusRequest = null,
  theme,
}: Props) => {
  const req = isCasingFieldRequired;
  const casingTheme = theme.sourcing.rocketMotor.casingForm;
  const cf = theme.sourcing.rocketMotor.createForm;
  const sectionColors = casingTheme.sectionColors;
  const patch = (partial: Partial<RocketMotorCasingFormData>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const insulationTypeOptions = useMemo(
    () =>
      lookups.insulationTypes.map((item) => ({
        value: item.insulationType,
        label: item.insulationType,
      })),
    [lookups.insulationTypes],
  );

  const itemsUnitOptions = useMemo(() => {
    const current = form.itemsUnit.trim();
    const base = lookups.unitOptions;
    if (current && !base.some((option) => option.value === current)) {
      return [{ value: current, label: current }, ...base];
    }
    return base;
  }, [lookups.unitOptions, form.itemsUnit]);

  const onInsulationTypeChange = (type: string) => {
    const next = type.trim();
    setForm((prev) => ({
      ...prev,
      insulationType: next,
      insulationSpecifications: null,
      mechanicalProperties: {},
      thermalProperties: {},
    }));
  };
  useEffect(() => {
    const insulationType = form.insulationType;
    if (!insulationType) return;
    if (form.insulationSpecifications?.insulationType === insulationType) return;

    let cancelled = false;

    const loadSpecifications = async () => {
      const response = await rocketMotorCasingController.fetchSpecification(insulationType);
      if (cancelled || !response.success) return;

      setForm((prev) => {
        const spec = response.data;
        const hasMech =
          prev.mechanicalProperties && Object.keys(prev.mechanicalProperties).length > 0;
        const hasThermal =
          prev.thermalProperties && Object.keys(prev.thermalProperties).length > 0;

        return {
          ...prev,
          insulationSpecifications: spec,
          mechanicalProperties: hasMech
            ? prev.mechanicalProperties
            : createInitialMechanicalProperties(spec),
          thermalProperties: hasThermal
            ? prev.thermalProperties
            : createInitialThermalProperties(spec),
        };
      });
    };

    void loadSpecifications();

    return () => {
      cancelled = true;
    };
  }, [form.insulationType, form.insulationSpecifications, setForm]);
  const updateMech = (
    paramKey: string,
    field: "specification" | "reported" | "acemSpec",
    value: string,
    referenceRange?: { minValue: number | null; maxValue: number | null },
  ) => {
    const nextValue =
      (field === "reported" || field === "acemSpec") &&
      !isReferenceRangeNotApplicable(referenceRange)
        ? sanitizeNumericAnalysedResultInput(value)
        : value;
    setForm((prev) => ({
      ...prev,
      mechanicalProperties: {
        ...prev.mechanicalProperties,
        [paramKey]: { ...prev.mechanicalProperties[paramKey], [field]: nextValue },
      },
    }));
  };

  const updateThermal = (
    key: string,
    field: "specification" | "reported" | "acemSpec",
    value: string,
    referenceRange?: { minValue: number | null; maxValue: number | null },
  ) => {
    const nextValue =
      (field === "reported" || field === "acemSpec") &&
      !isReferenceRangeNotApplicable(referenceRange)
        ? sanitizeNumericAnalysedResultInput(value)
        : value;
    setForm((prev) => ({
      ...prev,
      thermalProperties: {
        ...prev.thermalProperties,
        [key]: { ...prev.thermalProperties[key], [field]: nextValue },
      },
    }));
  };

  const receiptLabels = { received: S.RECEIVED, notReceived: S.NOT_RECEIVED };

  const projectSelected = Boolean(String(form.projectId ?? "").trim());

  const stageOptions = lookups.motorStages.map((s) => ({
    value: s.motorStage,
    label: `Stage ${s.motorStage}`,
    meta: s.noOfmotors ? `${s.noOfmotors} motors` : undefined,
  }));
  const identificationProjects = useMemo(() => {
    const list = [...lookups.projects];
    const id = String(form.projectId ?? "").trim();
    if (id && !list.some((p) => p.projectId === id)) {
      list.unshift({
        projectId: id,
        projectName: String(form.projectName ?? "").trim() || id,
      });
    }
    return list;
  }, [lookups.projects, form.projectId, form.projectName]);

  const identificationStageOptions = useMemo(() => {
    const opts = [...stageOptions];
    const stage = String(form.motorStageApi ?? "").trim();
    // Keep current stage visible while locked (edit) even if options briefly empty.
    if (stage && !opts.some((o) => o.value === stage) && lockIdentification) {
      opts.unshift({ value: stage, label: `Stage ${stage}`, meta: undefined });
    }
    return opts;
  }, [stageOptions, form.motorStageApi, lockIdentification]);

  useEffect(() => {
    void lookups.loadMotorStages(String(form.projectId ?? "").trim());
  }, [form.projectId, lookups.loadMotorStages]);

  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);

  const stepLabels = useMemo(
    () => [
      S.STEP_IDENTIFICATION_RECEIPT,
      S.STEP_VISUAL,
      S.STEP_WEIGHMENT,
      S.STEP_DIMENSIONAL,
      S.STEP_MOCK_TRIAL,
      S.STEP_UPLOAD_REPORT,
    ],
    [],
  );

  const isLastStep = step === CASING_FORM_STEP_COUNT - 1;
  const identificationComplete = isCasingIdentificationComplete(form);
  const canAdvanceFromStep = step !== 0 || identificationComplete;
  const specifications = form.insulationSpecifications?.specifications ?? [];

  const specificationCategories = specifications.filter(
    (category) => (category.parameters ?? []).length > 0,
  );
  const handleStepBack = () => {
    setStepError(null);
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepNext = () => {
    const err = validateCasingFormStep(form, step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(CASING_FORM_STEP_COUNT - 1, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const canNavigateToStep = (targetStep: number) => targetStep === 0 || identificationComplete;

  const handleStepClick = (targetStep: number) => {
    if (!canNavigateToStep(targetStep)) return;
    setStepError(null);
    setStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!identificationComplete && step > 0) {
      setStep(0);
      setStepError(null);
    }
  }, [identificationComplete, step]);

  // Switch wizard step then scroll/focus the first validation error field.
  // Depend only on request id — including `step` re-ran this on every Next/Back and pinned the wizard.
  useEffect(() => {
    const target = validationFocusRequest?.target;
    if (!target?.fieldPath) return;
    setStep(target.step);
    setStepError(null);
    const timer = window.setTimeout(() => {
      focusRmcField(target.fieldPath);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [validationFocusRequest?.id]);

  return (
    <Box sx={{ ...casingTheme.root, ...cf.pageRoot }}>
      <Box sx={cf.headerRow}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={casingTheme.headerIconBox}>
            <RocketLaunchRoundedIcon sx={casingTheme.headerLaunchIcon} />
          </Box>
          <Box>
            <Typography sx={casingTheme.headerTitle}>{S.TITLE}</Typography>
            <Typography sx={casingTheme.headerSubtitle}>{S.SUBTITLE}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          {showDeleteCasing && onDeleteCasing ? (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteOutlineRoundedIcon />}
              onClick={onDeleteCasing}
              disabled={deleteLoading}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, flexShrink: 0 }}
            >
              {SF.DELETE_CASING}
            </Button>
          ) : null}
        </Stack>
      </Box>

      <CasingFormStepNav
        currentStep={step}
        totalSteps={CASING_FORM_STEP_COUNT}
        stepLabels={stepLabels}
        canGoBack={step > 0}
        canGoNext={!isLastStep && canAdvanceFromStep}
        isLastStep={isLastStep}
        stepError={stepError}
        nextDisabledHint={!canAdvanceFromStep && !isLastStep ? S.IDENTIFICATION_GATE_HINT : null}
        canNavigateToStep={canNavigateToStep}
        onStepClick={handleStepClick}
        onBack={handleStepBack}
        onNext={handleStepNext}
        theme={theme}
        cf={cf}
      />

      {step === 0 && (
        <>
          <SectionCard
            number="1"
            title={S.SECTION_IDENTIFICATION}
            accentColor={sectionColors.motorId}
            index={0}
            theme={theme}
            cf={cf}
          >
            <FieldGrid theme={theme} cf={cf}>
              <ProjectSelectField
                label={S.PROJECT}
                required={req("projectName")}
                value={form.projectId}
                onChange={(v) => {
                  if (lockIdentification) return;
                  const match = identificationProjects.find((p) => p.projectId === v);
                  const nextProjectId = String(v ?? "").trim();
                  const projectChanged = nextProjectId !== String(form.projectId ?? "").trim();
                  patch({
                    projectId: v,
                    projectName: match?.projectName ?? "",
                    ...(projectChanged
                      ? {
                          motorStageApi: "",
                          mockTrial: createEmptyMockTrialSlot(),
                          dimensionalData: [],
                        }
                      : {}),
                  });
                }}
                projects={identificationProjects}
                loading={lookups.loading && !lockIdentification}
                placeholder={S.SELECT_PROJECT}
                disabled={lockIdentification}
                theme={theme}
                cf={cf}
                error={validationErrors.projectName}
                fieldPath="projectName"
              />
              <SelectField
                label={S.MOTOR_STAGE}
                required={req("motorStageApi")}
                value={form.motorStageApi}
                onChange={(v) => {
                  if (lockIdentification) return;
                  patch({
                    motorStageApi: v,
                    mockTrial: createEmptyMockTrialSlot(),
                    dimensionalData: [],
                  });
                }}
                options={identificationStageOptions}
                placeholder={S.SELECT_STAGE}
                disabled={
                  lockIdentification ||
                  !projectSelected ||
                  lookups.motorStagesLoading ||
                  loadingDimensionalParams
                }
                theme={theme}
                error={validationErrors.motorStageApi}
                fieldPath="motorStageApi"
              />
              <TextFieldField
                label={S.MOTOR_ID}
                required={req("motorId")}
                value={form.motorId}
                onChange={(v) => {
                  if (lockIdentification) return;
                  patch({ motorId: v });
                }}
                placeholder={S.MOTOR_ID_PH}
                disabled={lockIdentification}
                theme={theme}
                error={validationErrors.motorId}
                fieldPath="motorId"
                lightPlaceholder
              />
              {form.motorCasingId || lockIdentification ? (
                <TextFieldField
                  label={S.MOTOR_CASING_ID}
                  value={form.motorCasingId || "—"}
                  onChange={() => undefined}
                  disabled
                  theme={theme}
                />
              ) : null}
            </FieldGrid>
            {loadingDimensionalParams && (
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1.5, py: 0.25 }}>
                <CircularProgress
                  size={22}
                  thickness={5}
                  sx={{ color: theme.palette.primaryLight }}
                />
                <Typography
                  sx={{ fontSize: "0.8rem", color: theme.palette.textSub, fontWeight: 500 }}
                >
                  {SF.LOADING_MOTOR_PARAMS}
                </Typography>
              </Stack>
            )}
          </SectionCard>

          {!identificationComplete ? (
            <Typography sx={cf.identificationGateHint} role="status">
              {S.IDENTIFICATION_GATE_HINT}
            </Typography>
          ) : null}

          {/* 2 — Radiography details (same columns as NDT radiography plan table) */}
          <SectionCard
            number="2"
            title={S.SECTION_RADIOGRAPHY}
            accentColor={sectionColors.motorId}
            index={1}
            disabled={!identificationComplete}
            theme={theme}
            cf={cf}
          >
            <Typography
              sx={{
                fontSize: "0.78rem",
                color: theme.palette.textSub,
                mb: 1.25,
                fontWeight: 500,
              }}
            >
              {S.RADIOGRAPHY_HINT}
            </Typography>
            <FieldGrid theme={theme} cf={cf}>
              <TextFieldField
                label={S.RADIOGRAPHY_PLAN_ID}
                value={form.radiographyPlanId}
                onChange={(v) => patch({ radiographyPlanId: v })}
                placeholder={S.RADIOGRAPHY_PLAN_ID_PH}
                disabled={!identificationComplete}
                theme={theme}
                error={validationErrors.radiographyPlanId}
                fieldPath="radiographyPlanId"
              />
              <TextFieldField
                label={S.RADIOGRAPHY_PLAN_NAME}
                required={req("radiographyPlanName")}
                value={form.radiographyPlanName}
                onChange={(v) => patch({ radiographyPlanName: v })}
                placeholder={S.RADIOGRAPHY_PLAN_NAME_PH}
                disabled={!identificationComplete}
                theme={theme}
                error={validationErrors.radiographyPlanName}
                fieldPath="radiographyPlanName"
              />
            </FieldGrid>
            <TableContainer sx={{ ...casingTheme.tableContainer, mt: 1.5, overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    {[
                      S.COL_RADIOGRAPHY_SR,
                      `${S.COL_RADIOGRAPHY_SECTIONS} *`,
                      `${S.COL_RADIOGRAPHY_ORIENTATIONS} *`,
                      `${S.COL_RADIOGRAPHY_SFD} *`,
                      `${S.COL_RADIOGRAPHY_NORMAL} *`,
                      `${S.COL_RADIOGRAPHY_TANGENTIAL} *`,
                      `${S.COL_RADIOGRAPHY_DETECTOR} *`,
                      "",
                    ].map((label, headerIndex) => (
                      <TableCell
                        key={headerIndex}
                        sx={{
                          ...theme.workflow.formElements.tableHeader,
                          width: headerIndex === 7 ? 44 : undefined,
                        }}
                      >
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(form.radiographyPlanRows ?? []).map((row, index) => (
                    <TableRow
                      key={`radiography-${row.srNo}-${index}`}
                      sx={casingTheme.dataRow(index % 2 === 0)}
                    >
                      <TableCell sx={theme.workflow.formElements.tableCell}>{row.srNo}</TableCell>
                      {(
                        [
                          "sections",
                          "orientations",
                          "sfd",
                          "normalExposures",
                          "tangentialExposures",
                        ] as const
                      ).map((field) => (
                        <TableCell key={field} sx={theme.workflow.formElements.tableCell}>
                          <Box data-rmc-field={`radiographyPlanRows.${index}.${field}`}>
                            <TextField
                              size="small"
                              fullWidth
                              value={row[field]}
                              onChange={(e) => {
                                const next = String(e.target.value).replace(/[^\d.]/g, "");
                                patch({
                                  radiographyPlanRows: form.radiographyPlanRows.map((r, i) =>
                                    i === index ? { ...r, [field]: next } : r,
                                  ),
                                });
                              }}
                              disabled={!identificationComplete}
                              error={Boolean(validationErrors[`radiographyPlanRows.${index}.${field}`])}
                              helperText={validationErrors[`radiographyPlanRows.${index}.${field}`]}
                              inputProps={{ inputMode: "decimal" }}
                              sx={casingWhiteInputSx({
                                ...theme.workflow.formElements.cellField,
                                ...casingTheme.dimInput,
                              })}
                            />
                          </Box>
                        </TableCell>
                      ))}
                      <TableCell sx={theme.workflow.formElements.tableCell}>
                        <Box data-rmc-field={`radiographyPlanRows.${index}.detectorType`}>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={row.detectorType}
                            onChange={(e) =>
                              patch({
                                radiographyPlanRows: form.radiographyPlanRows.map((r, i) =>
                                  i === index ? { ...r, detectorType: e.target.value } : r,
                                ),
                              })
                            }
                            disabled={!identificationComplete}
                            error={Boolean(
                              validationErrors[`radiographyPlanRows.${index}.detectorType`],
                            )}
                            helperText={
                              validationErrors[`radiographyPlanRows.${index}.detectorType`]
                            }
                            SelectProps={{ displayEmpty: true }}
                            sx={casingWhiteInputSx({
                              ...theme.workflow.formElements.cellField,
                              ...casingTheme.dimInput,
                            })}
                          >
                            <MenuItem value="">
                              <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", opacity: 0.45 }}>
                                {S.RADIOGRAPHY_DETECTOR_PH}
                              </Typography>
                            </MenuItem>
                            {CASING_DETECTOR_TYPE_OPTIONS.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Box>
                      </TableCell>
                      <TableCell sx={theme.workflow.formElements.tableCell}>
                        {(form.radiographyPlanRows?.length ?? 0) > 1 ? (
                          <IconButton
                            size="small"
                            disabled={!identificationComplete}
                            onClick={() =>
                              patch({
                                radiographyPlanRows: form.radiographyPlanRows
                                  .filter((_, i) => i !== index)
                                  .map((r, i) => ({ ...r, srNo: i + 1 })),
                              })
                            }
                            sx={{ color: theme.palette.danger, p: 0.5 }}
                          >
                            <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Stack
              direction="row"
              alignItems="center"
              gap={0.5}
              onClick={() => {
                if (!identificationComplete) return;
                const nextSr = (form.radiographyPlanRows?.length ?? 0) + 1;
                patch({
                  radiographyPlanRows: [
                    ...(form.radiographyPlanRows ?? []),
                    createEmptyRadiographyPlanRow(nextSr),
                  ],
                });
              }}
              sx={{
                cursor: identificationComplete ? "pointer" : "not-allowed",
                width: "fit-content",
                mt: 1.25,
                color: theme.palette.primaryLight,
                fontSize: "0.72rem",
                fontWeight: 700,
                opacity: identificationComplete ? 1 : 0.5,
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 15 }} />
              {S.RADIOGRAPHY_ADD_ROW}
            </Stack>
          </SectionCard>

          {/* 3 — Motor receipt */}
          <SectionCard
            number="3"
            title={S.SECTION_MOTOR_RECEIPT}
            accentColor={sectionColors.motorId}
            index={2}
            disabled={!identificationComplete}
            theme={theme}
            cf={cf}
          >
            <FieldGrid theme={theme} cf={cf}>
              <SelectField
                label={S.CASING_TYPE}
                required={req("casingType")}
                value={form.casingType}
                onChange={(v) =>
                  patch({
                    casingType:
                      v === "COMPOSITE" || v === "METALLIC" ? (v as "COMPOSITE" | "METALLIC") : "",
                  })
                }
                options={[
                  { value: "COMPOSITE", label: S.COMPOSITE },
                  { value: "METALLIC", label: S.METALLIC },
                ]}
                placeholder={S.SELECT_CASING_TYPE}
                theme={theme}
                error={validationErrors.casingType}
                fieldPath="casingType"
              />
              <DateField
                label={S.RECEIVING_DATE}
                required={req("receivingDate")}
                value={form.receivingDate}
                onChange={(v) => patch({ receivingDate: v })}
                theme={theme}
                error={validationErrors.receivingDate}
                fieldPath="receivingDate"
              />
            </FieldGrid>

            <Box sx={cf.divider} />
            <SubsectionTitle cf={cf}>
              {S.ITEMS_RECEIVED} — {S.RUBBER_SHEET}
            </SubsectionTitle>
            <FieldGrid theme={theme} cf={cf}>
              <TextFieldField
                label={S.DIMENSION}
                value={form.itemsDimension}
                onChange={(v) => patch({ itemsDimension: v })}
                theme={theme}
                error={validationErrors.itemsDimension}
                fieldPath="itemsDimension"
              />
              <SearchableSelectField
                label={S.UNIT}
                value={form.itemsUnit}
                onChange={(v) => patch({ itemsUnit: v })}
                options={itemsUnitOptions}
                placeholder={S.SELECT_UNIT}
                loading={lookups.loading}
                theme={theme}
                error={validationErrors.itemsUnit}
                fieldPath="itemsUnit"
              />
              <ReceiptStatusField
                label={S.RECEIPT_STATUS}
                value={form.itemsReceiptStatus}
                onChange={(v) => patch({ itemsReceiptStatus: v })}
                theme={theme}
                receivedLabel={receiptLabels.received}
                notReceivedLabel={receiptLabels.notReceived}
                placeholder={S.SELECT_RECEIPT_STATUS}
              />
              <TextFieldField
                label={S.OBSERVATIONS}
                value={form.itemsObservations}
                onChange={(v) => patch({ itemsObservations: v })}
                theme={theme}
                error={validationErrors.itemsObservations}
                fieldPath="itemsObservations"
              />
            </FieldGrid>

            <Box sx={cf.divider} />
            <SubsectionTitle cf={cf}>{S.SECTION_CLEARANCES}</SubsectionTitle>
            <FieldGrid theme={theme} cf={cf}>
              <ReceiptStatusField
                label={S.GREEN_CARD_STATUS}
                value={form.greenCardStatus}
                onChange={(v) => patch({ greenCardStatus: v })}
                theme={theme}
                receivedLabel={receiptLabels.received}
                notReceivedLabel={receiptLabels.notReceived}
                placeholder={S.SELECT_GREEN_CARD}
              />
              <TextFieldField
                label={S.GREEN_CARD_NO}
                value={form.greenCardNo}
                onChange={(v) => patch({ greenCardNo: v })}
                theme={theme}
                error={validationErrors.greenCardNo}
                fieldPath="greenCardNo"
              />
              <DateField
                label={S.CLEARANCE_DATE}
                value={form.clearanceDate}
                onChange={(v) => patch({ clearanceDate: v })}
                theme={theme}
                error={validationErrors.clearanceDate}
                fieldPath="clearanceDate"
              />
              <TextFieldField
                label={S.CLEARANCE_AUTHORITY}
                value={form.clearanceAuthority}
                onChange={(v) => patch({ clearanceAuthority: v })}
                theme={theme}
                error={validationErrors.clearanceAuthority}
                fieldPath="clearanceAuthority"
              />
              <TextFieldField
                label={S.CLEARANCE_DETAILS}
                value={form.clearanceDetails}
                onChange={(v) => patch({ clearanceDetails: v })}
                multiline
                rows={2}
                fullWidth
                theme={theme}
                error={validationErrors.clearanceDetails}
                fieldPath="clearanceDetails"
              />
            </FieldGrid>

            <Box sx={cf.divider} />
            <SubsectionTitle cf={cf}>{S.SECTION_INSULATION}</SubsectionTitle>
            <FieldGrid theme={theme} cf={cf}>
              <DateField
                label={S.CURING_DATE}
                required={req("insulationCuringDate")}
                value={form.insulationCuringDate}
                onChange={(v) => patch({ insulationCuringDate: v })}
                theme={theme}
                error={validationErrors.insulationCuringDate}
                fieldPath="insulationCuringDate"
              />
              <SelectField
                label={S.INSULATION_TYPE}
                required={req("insulationType")}
                value={form.insulationType}
                onChange={onInsulationTypeChange}
                options={insulationTypeOptions}
                placeholder={S.SELECT_INSULATION_TYPE}
                theme={theme}
                error={validationErrors.insulationType}
                fieldPath="insulationType"
              />
              <TextFieldField
                label={S.REPORT_NO}
                required={req("insulationReportNo")}
                value={form.insulationReportNo}
                onChange={(v) => patch({ insulationReportNo: v })}
                theme={theme}
                error={validationErrors.insulationReportNo}
                fieldPath="insulationReportNo"
              />
              <ReceiptStatusField
                label={S.INSULATION_RECEIPT}
                value={form.insulationReceiptStatus}
                onChange={(v) => patch({ insulationReceiptStatus: v })}
                theme={theme}
                receivedLabel={receiptLabels.received}
                notReceivedLabel={receiptLabels.notReceived}
                placeholder={S.SELECT_INSULATION_RECEIPT}
              />
            </FieldGrid>
            <Box sx={{ mt: 1.5, ...cf.compactMediaWrap }}>
              <CasingInsulationReportUpload
                existing={form.insulationReportExisting ?? null}
                onChange={(next) =>
                  patch({
                    insulationReportFile: null,
                    insulationReportExisting: next,
                    insulationReportUrl: next?.fileUrl ?? null,
                  })
                }
              />
            </Box>
            {specificationCategories.map((category) => {
              const thermal = isThermalSpecificationCategory(category.category);
              const propertyPrefix = thermal ? "thermalProperties" : "mechanicalProperties";
              const parameters = category.parameters ?? [];

              return (
                <React.Fragment key={category.category}>
                  <Box sx={cf.divider} />
                  <SubsectionTitle cf={cf}>{category.category}</SubsectionTitle>
                  <PropertiesTable
                    theme={theme}
                    columns={[
                      S.COL_PARAMETER,
                      S.COL_SPECIFICATION,
                      { label: S.REPORTED, required: true },
                      { label: S.TEST_RESULT_ACEM, required: true },
                    ]}
                    rows={parameters.map((item) => {
                      const rangeNotApplicable = isReferenceRangeNotApplicable(item.referenceRange);
                      const inputType = rangeNotApplicable ? "text" : "number";
                      const reportedValue = thermal
                        ? form.thermalProperties[item.specificationCode]?.reported ?? ""
                        : form.mechanicalProperties[item.specificationCode]?.reported ?? "";
                      const acemValue = thermal
                        ? form.thermalProperties[item.specificationCode]?.acemSpec ?? ""
                        : form.mechanicalProperties[item.specificationCode]?.acemSpec ?? "";
                      const reportedOutOfRange = computeIsOutOfRange(
                        reportedValue,
                        item.referenceRange,
                      );
                      const acemOutOfRange = computeIsOutOfRange(acemValue, item.referenceRange);
                      const rowFailed = reportedOutOfRange || acemOutOfRange;
                      const reportedPath = `${propertyPrefix}.${item.specificationCode}.reported`;
                      const acemPath = `${propertyPrefix}.${item.specificationCode}.acemSpec`;
                      const reportedError = Boolean(validationErrors[reportedPath]) || reportedOutOfRange;
                      const acemError = Boolean(validationErrors[acemPath]) || acemOutOfRange;
                      return (
                      <Box
                        component="tr"
                        key={item.specificationCode}
                        sx={cf.propertiesDataRow(rowFailed)}
                      >
                        <td>
                          <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                            <Typography component="span" sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                              {`${item.specificationName ?? item.specificationCode ?? "—"} (${item.referenceRange?.unit ?? "—"})`}
                            </Typography>
                            {rowFailed ? (
                              <Chip
                                label={STRINGS.SOURCING.SPECIFICATION_FORM.SPEC_STATUS_OUT_OF_RANGE}
                                size="small"
                                sx={cf.propertiesFailedChip}
                              />
                            ) : null}
                          </Stack>
                        </td>
                        <td>
                          <Chip
                            size="small"
                            label={
                              rangeNotApplicable
                                ? "N/A"
                                : `${item.referenceRange?.minValue ?? "—"} - ${item.referenceRange?.maxValue ?? "—"}`
                            }
                          />
                        </td>

                        <td>
                          <Box data-rmc-field={reportedPath}>
                            <CasingDeferredInput
                              size="small"
                              fullWidth
                              type={inputType}
                              inputMode={rangeNotApplicable ? "text" : "decimal"}
                              placeholder="Enter value"
                              value={reportedValue}
                              onChange={(value) =>
                                thermal
                                  ? updateThermal(
                                      item.specificationCode,
                                      "reported",
                                      value,
                                      item.referenceRange,
                                    )
                                  : updateMech(
                                      item.specificationCode,
                                      "reported",
                                      value,
                                      item.referenceRange,
                                    )
                              }
                              error={reportedError}
                              sx={[
                                casingWhiteInputSx(theme.workflow.formElements.cellField),
                                ...(reportedError ? [cf.propertiesFailedField] : []),
                              ]}
                            />
                          </Box>
                        </td>

                        <td>
                          <Box data-rmc-field={acemPath}>
                            <CasingDeferredInput
                              size="small"
                              fullWidth
                              type={inputType}
                              inputMode={rangeNotApplicable ? "text" : "decimal"}
                              placeholder="Enter value"
                              value={acemValue}
                              onChange={(value) =>
                                thermal
                                  ? updateThermal(
                                      item.specificationCode,
                                      "acemSpec",
                                      value,
                                      item.referenceRange,
                                    )
                                  : updateMech(
                                      item.specificationCode,
                                      "acemSpec",
                                      value,
                                      item.referenceRange,
                                    )
                              }
                              error={acemError}
                              sx={[
                                casingWhiteInputSx(theme.workflow.formElements.cellField),
                                ...(acemError ? [cf.propertiesFailedField] : []),
                              ]}
                            />
                          </Box>
                        </td>
                      </Box>
                      );
                    })}
                  />
                </React.Fragment>
              );
            })}

            <Box sx={cf.divider} />
            <Box sx={cf.ndtSection}>
              <SubsectionTitle cf={cf}>{S.SECTION_NDT}</SubsectionTitle>
              <Box sx={cf.ndtDatesRow}>
                <DateField
                  label={S.POST_PPT_UT}
                  value={form.postPptUtDate}
                  onChange={(v) => patch({ postPptUtDate: v })}
                  theme={theme}
                  error={validationErrors.postPptUtDate}
                  fieldPath="postPptUtDate"
                />
                <DateField
                  label={S.NDT_DATE}
                  value={form.ndtDate}
                  onChange={(v) => patch({ ndtDate: v })}
                  theme={theme}
                  error={validationErrors.ndtDate}
                  fieldPath="ndtDate"
                />
              </Box>
              <Box sx={cf.ndtObservationsGrid}>
                <TextFieldField
                  label={S.NDT_OBSERVATIONS}
                  value={form.ndtObservations}
                  onChange={(v) => patch({ ndtObservations: v })}
                  multiline
                  rows={3}
                  theme={theme}
                  error={validationErrors.ndtObservations}
                  fieldPath="ndtObservations"
                />
                <TextFieldField
                  label={S.ACEM_NDT}
                  value={form.acemNdtObservations}
                  onChange={(v) => patch({ acemNdtObservations: v })}
                  multiline
                  rows={3}
                  theme={theme}
                  error={validationErrors.acemNdtObservations}
                  fieldPath="acemNdtObservations"
                />
                <TextFieldField
                  label={S.PROJECT_RUBBER}
                  value={form.projectRubberSurfaceObservations}
                  onChange={(v) => patch({ projectRubberSurfaceObservations: v })}
                  multiline
                  rows={3}
                  theme={theme}
                  error={validationErrors.projectRubberSurfaceObservations}
                  fieldPath="projectRubberSurfaceObservations"
                />
                <TextFieldField
                  label={S.OTHER_DETAILS}
                  value={form.otherDetails}
                  onChange={(v) => patch({ otherDetails: v })}
                  multiline
                  rows={3}
                  theme={theme}
                  error={validationErrors.otherDetails}
                  fieldPath="otherDetails"
                />
              </Box>
            </Box>
          </SectionCard>
        </>
      )}

      {step === 1 && identificationComplete && (
        <SectionCard
          number="4"
          title={S.SECTION_VISUAL}
          subtitle={S.COL_DESCRIPTION}
          accentColor={sectionColors.visual}
          index={3}
          theme={theme}
          cf={cf}
        >
          {form.visualInspection.map((row, idx) => (
            <Box key={row.itemKey} sx={cf.visualRow(idx)}>
              <StackRow gap={1} alignItems="flex-start">
                <Chip
                  label={row.srNo}
                  size="small"
                  sx={theme.workflow.formElements.primaryLightChip}
                />
                <Typography sx={cf.visualRowTitle}>{row.description}</Typography>
              </StackRow>

              <Box sx={cf.visualInspectionGrid}>
                <TextFieldField
                  label={S.COL_OBSERVATIONS}
                  required
                  value={row.observations}
                  onChange={(v) => {
                    const next = [...form.visualInspection];
                    next[idx] = { ...next[idx], observations: v };
                    patch({ visualInspection: next });
                  }}
                  error={validationErrors[`visualInspection.${idx}.observations`]}
                  theme={theme}
                  fieldPath={`visualInspection.${idx}.observations`}
                />
                <TextFieldField
                  label={S.COL_REMARK}
                  value={row.remark}
                  onChange={(v) => {
                    const next = [...form.visualInspection];
                    next[idx] = { ...next[idx], remark: v };
                    patch({ visualInspection: next });
                  }}
                  error={validationErrors[`visualInspection.${idx}.remark`]}
                  theme={theme}
                  fieldPath={`visualInspection.${idx}.remark`}
                />
              </Box>

              <VisualInspectionMediaField
                mediaExisting={row.mediaExisting}
                onMediaExistingChange={(next) => {
                  const rows = [...form.visualInspection];
                  rows[idx] = {
                    ...rows[idx],
                    mediaFile: null,
                    mediaExisting: next,
                    mediaUrl: next?.fileUrl ?? null,
                  };
                  patch({ visualInspection: rows });
                }}
                theme={theme}
              />

              {row.subItems?.length ? (
                <Box sx={cf.visualSubGrid}>
                  {row.subItems.map((sub, si) => (
                    <React.Fragment key={sub.itemKey}>
                      <Typography sx={cf.visualSubLabel}>{sub.description}</Typography>
                      <TextFieldField
                        label={S.COL_OBSERVATIONS}
                        required
                        value={sub.observations}
                        onChange={(v) => {
                          const next = [...form.visualInspection];
                          const subs = [...(next[idx].subItems ?? [])];
                          subs[si] = { ...subs[si], observations: v };
                          next[idx] = { ...next[idx], subItems: subs };
                          patch({ visualInspection: next });
                        }}
                        error={validationErrors[`visualInspection.${idx}.subItems.${si}.observations`]}
                        theme={theme}
                        fieldPath={`visualInspection.${idx}.subItems.${si}.observations`}
                      />
                      <TextFieldField
                        label={S.COL_REMARK}
                        value={sub.remark}
                        onChange={(v) => {
                          const next = [...form.visualInspection];
                          const subs = [...(next[idx].subItems ?? [])];
                          subs[si] = { ...subs[si], remark: v };
                          next[idx] = { ...next[idx], subItems: subs };
                          patch({ visualInspection: next });
                        }}
                        error={validationErrors[`visualInspection.${idx}.subItems.${si}.remark`]}
                        theme={theme}
                        fieldPath={`visualInspection.${idx}.subItems.${si}.remark`}
                      />
                    </React.Fragment>
                  ))}
                </Box>
              ) : null}
            </Box>
          ))}
        </SectionCard>
      )}

      {step === 2 && identificationComplete && (
        <SectionCard
          number="5"
          title={S.SECTION_WEIGHMENT}
          accentColor={sectionColors.clearance}
          index={4}
          theme={theme}
          cf={cf}
        >
          <FieldGrid theme={theme} cf={cf}>
            <TextFieldField
              label={S.WEIGHT_WITHOUT}
              required={req("weightWithoutHarness")}
              value={form.weightWithoutHarness}
              onChange={(v) =>
                patch({ weightWithoutHarness: sanitizeNumericAnalysedResultInput(v) })
              }
              type="text"
              placeholder="Enter weight"
              theme={theme}
              error={validationErrors.weightWithoutHarness}
              fieldPath="weightWithoutHarness"
            />
            <TextFieldField
              label={S.WEIGHT_WITH}
              required={req("weightWithHarness")}
              value={form.weightWithHarness}
              onChange={(v) =>
                patch({ weightWithHarness: sanitizeNumericAnalysedResultInput(v) })
              }
              type="text"
              placeholder="Enter weight"
              theme={theme}
              error={validationErrors.weightWithHarness}
              fieldPath="weightWithHarness"
            />
            <TextFieldField
              label={S.WEIGHSCALE}
              required={req("weighscaleEquipment")}
              value={form.weighscaleEquipment}
              onChange={(v) => patch({ weighscaleEquipment: v })}
              theme={theme}
              error={validationErrors.weighscaleEquipment}
              fieldPath="weighscaleEquipment"
            />
            <DateField
              label={S.CALIBRATION_DUE}
              required={req("calibrationDueDate")}
              value={form.calibrationDueDate}
              onChange={(v) => patch({ calibrationDueDate: v })}
              theme={theme}
              error={validationErrors.calibrationDueDate}
              fieldPath="calibrationDueDate"
            />
          </FieldGrid>
        </SectionCard>
      )}

      {step === 3 && identificationComplete && (
        <SectionCard
          number="6"
          title={S.SECTION_DIMENSIONAL}
          accentColor={sectionColors.dimensional}
          index={5}
          theme={theme}
          cf={cf}
        >
          {validationErrors.dimensionalData ? (
            <Typography data-rmc-field="dimensionalData" color="error" variant="caption" sx={{ display: "block", mb: 1 }}>
              {validationErrors.dimensionalData}
            </Typography>
          ) : null}
          {!motorStage ? (
            <Box sx={theme.workflow.formElements.emptyStateBox}>
              <Typography sx={casingTheme.emptyStateSubtitle}>{SF.EMPTY_DIM_SUBTITLE}</Typography>
            </Box>
          ) : dimensionalParametersErrorMessage ? (
            <Typography sx={{ color: theme.palette.danger, fontWeight: 600 }}>
              {dimensionalParametersErrorMessage}
            </Typography>
          ) : loadingDimensionalParams ? (
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 2 }}>
              <CircularProgress
                size={22}
                thickness={5}
                sx={{ color: theme.palette.primaryLight }}
              />
              <Typography
                sx={{ fontSize: "0.8rem", color: theme.palette.textSub, fontWeight: 500 }}
              >
                {SF.LOADING_MOTOR_PARAMS}
              </Typography>
            </Stack>
          ) : form.dimensionalData.length === 0 ? (
            <Box sx={theme.workflow.formElements.emptyStateBox}>
              <Typography sx={casingTheme.emptyStateSubtitle}>
                {dimensionalParametersErrorMessage ||
                  `No dimensional parameters for motor ${motorStage}.`}
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ ...casingTheme.tableContainer, mt: 0.5, overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={theme.workflow.formElements.tableHeader}>#</TableCell>
                    <TableCell sx={theme.workflow.formElements.tableHeader}>Dimension</TableCell>
                    <TableCell sx={theme.workflow.formElements.tableHeader}>{S.COL_SPEC}</TableCell>
                    {DIM_COLUMNS.map((col) => (
                      <TableCell
                        key={col.key}
                        align="center"
                        sx={theme.workflow.formElements.tableHeader}
                      >
                        {col.label}
                        <RequiredMark theme={theme} />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {form.dimensionalData.map((row, idx) => {
                    const spec = row.referenceRange;
                    const isLooseFlap = isLooseFlapDimensionalParam(row);
                    return (
                      <TableRow key={row.paramId || idx} sx={casingTheme.dataRow(idx % 2 === 0)}>
                        <TableCell sx={theme.workflow.formElements.tableCell}>
                          {row.sequenceNo}
                        </TableCell>
                        <TableCell sx={theme.workflow.formElements.tableCell}>
                          <Typography sx={casingTheme.paramNameText}>{row.paramName}</Typography>
                          <Chip
                            label={row.side}
                            size="small"
                            sx={{ height: 18, fontSize: "0.6rem", mt: 0.4 }}
                          />
                        </TableCell>
                        <TableCell sx={theme.workflow.formElements.tableCell}>
                          <SpecRangeChip
                            min={spec.minValue}
                            max={spec.maxValue}
                            unit={spec.unit}
                            theme={theme}
                            cf={cf}
                          />
                        </TableCell>
                        {isLooseFlap ? (
                          <>
                            <TableCell colSpan={2} sx={theme.workflow.formElements.tableCell}>
                              <Box data-rmc-field={`dimensionalData.${idx}.looseFlap.arcLength`}>
                                <CasingDeferredInput
                                  size="small"
                                  fullWidth
                                  type="number"
                                  placeholder={S.COL_ARC_LENGTH}
                                  value={row.looseFlap?.arcLength ?? ""}
                                  onChange={(value) => {
                                    const next = [...form.dimensionalData];
                                    next[idx] = {
                                      ...next[idx],
                                      looseFlap: {
                                        ...(next[idx].looseFlap ?? EMPTY_LOOSE_FLAP()),
                                        arcLength: value,
                                      },
                                    };
                                    patch({ dimensionalData: next });
                                  }}
                                  error={Boolean(validationErrors[`dimensionalData.${idx}.looseFlap.arcLength`])}
                                  sx={casingWhiteInputSx({
                                    ...theme.workflow.formElements.cellField,
                                    ...casingTheme.dimInput,
                                  })}
                                />
                              </Box>
                            </TableCell>
                            <TableCell colSpan={2} sx={theme.workflow.formElements.tableCell}>
                              <Box data-rmc-field={`dimensionalData.${idx}.looseFlap.axialLength`}>
                                <CasingDeferredInput
                                  size="small"
                                  fullWidth
                                  type="number"
                                  placeholder={S.COL_AXIAL_LENGTH}
                                  value={row.looseFlap?.axialLength ?? ""}
                                  onChange={(value) => {
                                    const next = [...form.dimensionalData];
                                    next[idx] = {
                                      ...next[idx],
                                      looseFlap: {
                                        ...(next[idx].looseFlap ?? EMPTY_LOOSE_FLAP()),
                                        axialLength: value,
                                      },
                                    };
                                    patch({ dimensionalData: next });
                                  }}
                                  error={Boolean(validationErrors[`dimensionalData.${idx}.looseFlap.axialLength`])}
                                  sx={casingWhiteInputSx({
                                    ...theme.workflow.formElements.cellField,
                                    ...casingTheme.dimInput,
                                  })}
                                />
                              </Box>
                            </TableCell>
                          </>
                        ) : (
                          DIM_COLUMNS.map((col) => (
                            <TableCell key={col.key} sx={theme.workflow.formElements.tableCell}>
                              <Box data-rmc-field={`dimensionalData.${idx}.readings.${col.key}`}>
                                <CasingDeferredInput
                                  size="small"
                                  fullWidth
                                  type="number"
                                  placeholder={col.label}
                                  value={row.readings[col.key]}
                                  onChange={(value) => {
                                    const next = [...form.dimensionalData];
                                    next[idx] = {
                                      ...next[idx],
                                      readings: { ...next[idx].readings, [col.key]: value },
                                    };
                                    patch({ dimensionalData: next });
                                  }}
                                  error={Boolean(validationErrors[`dimensionalData.${idx}.readings.${col.key}`])}
                                  sx={casingWhiteInputSx({
                                    ...theme.workflow.formElements.cellField,
                                    ...casingTheme.dimInput,
                                  })}
                                />
                              </Box>
                            </TableCell>
                          ))
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>
      )}

      {step === 4 && identificationComplete && (
        <SectionCard
          number="7"
          title={S.SECTION_MOCK_TRIAL}
          accentColor={sectionColors.mockTrial}
          index={6}
          disabled={!String(form.motorStageApi ?? "").trim()}
          theme={theme}
          cf={cf}
        >
          <RocketMotorCasingMockTrialPanel
            value={form.mockTrial}
            onChange={(mockTrial) => patch({ mockTrial })}
            disabled={!String(form.motorStageApi ?? "").trim()}
            validationErrors={validationErrors}
            theme={theme}
            cf={cf}
          />
        </SectionCard>
      )}
      {step === 5 && identificationComplete && (
        <SectionCard
          number="8"
          title={S.SECTION_UPLOAD_REPORT}
          accentColor={sectionColors.mockTrial}
          index={7}
          disabled={!String(form.motorStageApi ?? "").trim()}
          theme={theme}
          cf={cf}
        >
            <CasingReportUpload form={form} patch={patch} validationErrors={validationErrors} theme={theme} />
        </SectionCard>
      )}
    </Box>
  );
};

export default MotorCasingCreateForm;
