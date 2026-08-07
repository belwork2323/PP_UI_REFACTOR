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
import MediaUpload from "../../../../../components/common/MediaUpload";
import { FILE_PICKER_ACCEPT } from "../../../../../../utils/FileUtils";
import VisualInspectionMediaField from "./VisualInspectionMediaField";
import StackRow from "../../../../../components/common/StackRow";
import { STRINGS } from "../../../../../../app/config/strings";
import {
  type InsulationType,
  CASING_DETECTOR_TYPE_OPTIONS,
  DIM_READING_KEYS,
  type RocketMotorCasingFormData,
  CASING_FORM_STEP_COUNT,
  EMPTY_LOOSE_FLAP,
  createEmptyRadiographyPlanRow,
  isLooseFlapDimensionalParam,
  validateCasingFormStep,
  isCasingIdentificationComplete,
  createEmptyMockTrialSlot,
  createInitialThermalProperties,
  createInitialMechanicalProperties,
} from "../../../../../../data/models/user/RocketMotorCasingFormModel";
import CasingFormStepNav from "./CasingFormStepNav";
import RocketMotorCasingMockTrialSchemaPanel from "./RocketMotorCasingMockTrialSchemaPanel";
import type { useRocketMotorCasingLookups } from "../../../../../../hooks/user/sourcing/useRocketMotorCasingLookups";
import {
  DateField,
  FieldGrid,
  PropertiesTable,
  ReceiptStatusField,
  SectionCard,
  ProjectSelectField,
  SelectField,
  SpecRangeChip,
  SubsectionTitle,
  TextFieldField,
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
  theme: any;
};

const MotorCasingCreateForm = ({
  form,
  setForm,
  lookups,
  dimensionalParameters,
  dimensionalParametersErrorMessage,
  motorStage,
  subDepartmentId,
  loadingDimensionalParams = false,
  lockIdentification = false,
  showDeleteCasing = false,
  onDeleteCasing,
  deleteLoading = false,
  theme,
}: Props) => {
  const casingTheme = theme.sourcing.rocketMotor.casingForm;
  const cf = theme.sourcing.rocketMotor.createForm;
  const sectionColors = casingTheme.sectionColors;
  const patch = (partial: Partial<RocketMotorCasingFormData>) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const onInsulationTypeChange = (type: string) => {
    const next = type === "ROCASIN" || type === "EPDM" ? (type as InsulationType) : ("" as const);
    setForm((prev) => ({
      ...prev,
      insulationType: next,
      ...(next
        ? {}
        : { mechanicalProperties: {}, thermalProperties: {}, insulationSpecifications: null }),
    }));
  };
  useEffect(() => {
    if (!form.insulationType) return;

    const loadSpecifications = async () => {
      const response = await rocketMotorCasingController.fetchSpecification(form.insulationType);

      if (response.success) {
        setForm((prev) => {
          const spec = response.data;
          // If the form already has saved mechanical/thermal values, preserve them.
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
      }
    };

    loadSpecifications();
  }, [form.insulationType]);
  const updateMech = (
    paramKey: string,
    field: "specification" | "reported" | "acemSpec",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      mechanicalProperties: {
        ...prev.mechanicalProperties,
        [paramKey]: { ...prev.mechanicalProperties[paramKey], [field]: value },
      },
    }));
  };

  const updateThermal = (
    key: string,
    field: "specification" | "reported" | "acemSpec",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      thermalProperties: {
        ...prev.thermalProperties,
        [key]: { ...prev.thermalProperties[key], [field]: value },
      },
    }));
  };

  const receiptLabels = { received: S.RECEIVED, notReceived: S.NOT_RECEIVED };

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
    if (stage && !opts.some((o) => o.value === stage)) {
      opts.unshift({ value: stage, label: `Stage ${stage}`, meta: null });
    }
    return opts;
  }, [stageOptions, form.motorStageApi]);

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

  const mechanicalSpec =
    specifications.find((x) => x.category === "Rubber Mechanical Properties")?.parameters ?? [];

  const thermalSpec =
    specifications.find((x) => x.category === "Rubber Thermal Properties")?.parameters ?? [];
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
    setStepError(null);
  }, [form]);

  useEffect(() => {
    if (!identificationComplete && step > 0) {
      setStep(0);
      setStepError(null);
    }
  }, [identificationComplete, step]);

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
                value={form.projectId}
                onChange={(v) => {
                  if (lockIdentification) return;
                  const match = identificationProjects.find((p) => p.projectId === v);
                  patch({
                    projectId: v,
                    projectName: match?.projectName ?? "",
                  });
                }}
                projects={identificationProjects}
                loading={lookups.loading && !lockIdentification}
                placeholder={S.SELECT_PROJECT}
                disabled={lockIdentification}
                theme={theme}
                cf={cf}
              />
              <SelectField
                label={S.MOTOR_STAGE}
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
                disabled={lockIdentification || lookups.loading || loadingDimensionalParams}
                theme={theme}
              />
              <TextFieldField
                label={S.MOTOR_ID}
                value={form.motorId}
                onChange={(v) => {
                  if (lockIdentification) return;
                  patch({ motorId: v });
                }}
                placeholder={S.MOTOR_ID_PH}
                disabled={lockIdentification}
                theme={theme}
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
              />
              <TextFieldField
                label={S.RADIOGRAPHY_PLAN_NAME}
                value={form.radiographyPlanName}
                onChange={(v) => patch({ radiographyPlanName: v })}
                placeholder={S.RADIOGRAPHY_PLAN_NAME_PH}
                disabled={!identificationComplete}
                theme={theme}
              />
            </FieldGrid>
            <TableContainer sx={{ ...casingTheme.tableContainer, mt: 1.5, overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    {[
                      S.COL_RADIOGRAPHY_SR,
                      S.COL_RADIOGRAPHY_SECTIONS,
                      S.COL_RADIOGRAPHY_ORIENTATIONS,
                      S.COL_RADIOGRAPHY_SFD,
                      S.COL_RADIOGRAPHY_NORMAL,
                      S.COL_RADIOGRAPHY_TANGENTIAL,
                      S.COL_RADIOGRAPHY_DETECTOR,
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
                            inputProps={{ inputMode: "decimal" }}
                            sx={{
                              ...theme.workflow.formElements.cellField,
                              ...casingTheme.dimInput,
                            }}
                          />
                        </TableCell>
                      ))}
                      <TableCell sx={theme.workflow.formElements.tableCell}>
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
                          SelectProps={{ displayEmpty: true }}
                          sx={{
                            ...theme.workflow.formElements.cellField,
                            ...casingTheme.dimInput,
                          }}
                        >
                          <MenuItem value="">
                            <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                              {S.RADIOGRAPHY_DETECTOR_PH}
                            </Typography>
                          </MenuItem>
                          {CASING_DETECTOR_TYPE_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
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
              />
              <DateField
                label={S.RECEIVING_DATE}
                value={form.receivingDate}
                onChange={(v) => patch({ receivingDate: v })}
                theme={theme}
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
              />
              <TextFieldField
                label={S.UNIT}
                value={form.itemsUnit}
                onChange={(v) => patch({ itemsUnit: v })}
                theme={theme}
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
              />
              <DateField
                label={S.CLEARANCE_DATE}
                value={form.clearanceDate}
                onChange={(v) => patch({ clearanceDate: v })}
                theme={theme}
              />
              <TextFieldField
                label={S.CLEARANCE_AUTHORITY}
                value={form.clearanceAuthority}
                onChange={(v) => patch({ clearanceAuthority: v })}
                theme={theme}
              />
              <TextFieldField
                label={S.CLEARANCE_DETAILS}
                value={form.clearanceDetails}
                onChange={(v) => patch({ clearanceDetails: v })}
                multiline
                rows={2}
                fullWidth
                theme={theme}
              />
            </FieldGrid>

            <Box sx={cf.divider} />
            <SubsectionTitle cf={cf}>{S.SECTION_INSULATION}</SubsectionTitle>
            <FieldGrid theme={theme} cf={cf}>
              <DateField
                label={S.CURING_DATE}
                value={form.insulationCuringDate}
                onChange={(v) => patch({ insulationCuringDate: v })}
                theme={theme}
              />
              <SelectField
                label={S.INSULATION_TYPE}
                value={form.insulationType}
                onChange={onInsulationTypeChange}
                options={[
                  { value: "ROCASIN", label: S.ROCASIN },
                  { value: "EPDM", label: S.EPDM },
                ]}
                placeholder={S.SELECT_INSULATION_TYPE}
                theme={theme}
              />
              <TextFieldField
                label={S.REPORT_NO}
                value={form.insulationReportNo}
                onChange={(v) => patch({ insulationReportNo: v })}
                theme={theme}
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
              <MediaUpload
                value={form.insulationReportFile}
                onChange={(file) => patch({ insulationReportFile: file })}
                existingFile={form.insulationReportExisting ?? null}
                onClearExisting={() =>
                  patch({ insulationReportExisting: null, insulationReportUrl: null })
                }
                label={S.REPORT_UPLOAD}
                description="PDF or image"
                accept={FILE_PICKER_ACCEPT.IMAGE_PDF}
                uploadedFileLabel={S.UPLOADED_FILE_LABEL}
                changeFileLabel={S.CHANGE_FILE}
                removeFileLabel={S.REMOVE_FILE}
                openFileLabel={S.OPEN_FILE}
                pendingUploadHint={S.PENDING_UPLOAD_HINT}
              />
            </Box>
            {mechanicalSpec.length > 0 && (
              <>
                <Box sx={cf.divider} />
                <SubsectionTitle cf={cf}>{S.MECH_PROPERTIES}</SubsectionTitle>
                <PropertiesTable
                  theme={theme}
                  columns={[S.COL_PARAMETER, S.COL_SPECIFICATION, S.REPORTED, S.TEST_RESULT_ACEM]}
                  rows={mechanicalSpec.map((item) => (
                    <tr key={item.specificationCode}>
                      <td>{`${item.specificationName} (${item.referenceRange.unit})`}</td>
                      <td>
                        <Chip
                          size="small"
                          label={`${item.referenceRange.minValue} - ${item.referenceRange.maxValue}`}
                          sx={theme.workflow.formElements.cellField}
                        />
                      </td>

                      <td>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          value={form.mechanicalProperties[item.specificationCode]?.reported ?? ""}
                          onChange={(e) =>
                            updateMech(item.specificationCode, "reported", e.target.value)
                          }
                          sx={theme.workflow.formElements.cellField}
                        />
                      </td>

                      <td>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          value={form.mechanicalProperties[item.specificationCode]?.acemSpec ?? ""}
                          onChange={(e) =>
                            updateMech(item.specificationCode, "acemSpec", e.target.value)
                          }
                          sx={theme.workflow.formElements.cellField}
                        />
                      </td>
                    </tr>
                  ))}
                />
              </>
            )}
            {thermalSpec.length > 0 && (
              <>
                <Box sx={{ mt: 2 }} />
                <SubsectionTitle cf={cf}>{S.THERMAL_PROPERTIES}</SubsectionTitle>
                <PropertiesTable
                  theme={theme}
                  columns={[S.COL_PARAMETER, S.COL_SPECIFICATION, S.REPORTED, S.TEST_RESULT_ACEM]}
                  rows={thermalSpec.map((item) => (
                    <tr key={item.specificationCode}>
                      <td>{`${item.specificationName} (${item.referenceRange.unit})`}</td>

                      <td>
                        <Chip
                          size="small"
                          label={`${item.referenceRange.minValue} - ${item.referenceRange.maxValue}`}
                          sx={theme.workflow.formElements.cellField}
                        />
                      </td>

                      <td>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          value={form.thermalProperties[item.specificationCode]?.reported ?? ""}
                          onChange={(e) =>
                            updateThermal(item.specificationCode, "reported", e.target.value)
                          }
                          sx={theme.workflow.formElements.cellField}
                        />
                      </td>

                      <td>
                        <TextField
                          size="small"
                          fullWidth
                          type="number"
                          value={form.thermalProperties[item.specificationCode]?.acemSpec ?? ""}
                          onChange={(e) =>
                            updateThermal(item.specificationCode, "acemSpec", e.target.value)
                          }
                          sx={theme.workflow.formElements.cellField}
                        />
                      </td>
                    </tr>
                  ))}
                />
              </>
            )}

            <Box sx={cf.divider} />
            <Box sx={cf.ndtSection}>
              <SubsectionTitle cf={cf}>{S.SECTION_NDT}</SubsectionTitle>
              <Box sx={cf.ndtDatesRow}>
                <DateField
                  label={S.POST_PPT_UT}
                  value={form.postPptUtDate}
                  onChange={(v) => patch({ postPptUtDate: v })}
                  theme={theme}
                />
                <DateField
                  label={S.NDT_DATE}
                  value={form.ndtDate}
                  onChange={(v) => patch({ ndtDate: v })}
                  theme={theme}
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
                />
                <TextFieldField
                  label={S.ACEM_NDT}
                  value={form.acemNdtObservations}
                  onChange={(v) => patch({ acemNdtObservations: v })}
                  multiline
                  rows={3}
                  theme={theme}
                />
                <TextFieldField
                  label={S.PROJECT_RUBBER}
                  value={form.projectRubberSurfaceObservations}
                  onChange={(v) => patch({ projectRubberSurfaceObservations: v })}
                  multiline
                  rows={3}
                  theme={theme}
                />
                <TextFieldField
                  label={S.OTHER_DETAILS}
                  value={form.otherDetails}
                  onChange={(v) => patch({ otherDetails: v })}
                  multiline
                  rows={3}
                  theme={theme}
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
                  value={row.observations}
                  onChange={(v) => {
                    const next = [...form.visualInspection];
                    next[idx] = { ...next[idx], observations: v };
                    patch({ visualInspection: next });
                  }}
                  theme={theme}
                />
                <TextFieldField
                  label={S.COL_REMARK}
                  value={row.remark}
                  onChange={(v) => {
                    const next = [...form.visualInspection];
                    next[idx] = { ...next[idx], remark: v };
                    patch({ visualInspection: next });
                  }}
                  theme={theme}
                />
              </Box>

              <VisualInspectionMediaField
                mediaFile={row.mediaFile}
                mediaExisting={row.mediaExisting}
                onMediaFileChange={(file) => {
                  const next = [...form.visualInspection];
                  next[idx] = { ...next[idx], mediaFile: file };
                  patch({ visualInspection: next });
                }}
                onClearExisting={() => {
                  const next = [...form.visualInspection];
                  next[idx] = { ...next[idx], mediaExisting: null, mediaUrl: null };
                  patch({ visualInspection: next });
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
                        value={sub.observations}
                        onChange={(v) => {
                          const next = [...form.visualInspection];
                          const subs = [...(next[idx].subItems ?? [])];
                          subs[si] = { ...subs[si], observations: v };
                          next[idx] = { ...next[idx], subItems: subs };
                          patch({ visualInspection: next });
                        }}
                        theme={theme}
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
                        theme={theme}
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
              value={form.weightWithoutHarness}
              onChange={(v) => patch({ weightWithoutHarness: v })}
              type="number"
              theme={theme}
            />
            <TextFieldField
              label={S.WEIGHT_WITH}
              value={form.weightWithHarness}
              onChange={(v) => patch({ weightWithHarness: v })}
              type="number"
              theme={theme}
            />
            <TextFieldField
              label={S.WEIGHSCALE}
              value={form.weighscaleEquipment}
              onChange={(v) => patch({ weighscaleEquipment: v })}
              theme={theme}
            />
            <DateField
              label={S.CALIBRATION_DUE}
              value={form.calibrationDueDate}
              onChange={(v) => patch({ calibrationDueDate: v })}
              theme={theme}
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
                              <TextField
                                size="small"
                                fullWidth
                                type="number"
                                placeholder={S.COL_ARC_LENGTH}
                                value={row.looseFlap?.arcLength ?? ""}
                                onChange={(e) => {
                                  const next = [...form.dimensionalData];
                                  next[idx] = {
                                    ...next[idx],
                                    looseFlap: {
                                      ...(next[idx].looseFlap ?? EMPTY_LOOSE_FLAP()),
                                      arcLength: e.target.value,
                                    },
                                  };
                                  patch({ dimensionalData: next });
                                }}
                                sx={{
                                  ...theme.workflow.formElements.cellField,
                                  ...casingTheme.dimInput,
                                }}
                              />
                            </TableCell>
                            <TableCell colSpan={2} sx={theme.workflow.formElements.tableCell}>
                              <TextField
                                size="small"
                                fullWidth
                                type="number"
                                placeholder={S.COL_AXIAL_LENGTH}
                                value={row.looseFlap?.axialLength ?? ""}
                                onChange={(e) => {
                                  const next = [...form.dimensionalData];
                                  next[idx] = {
                                    ...next[idx],
                                    looseFlap: {
                                      ...(next[idx].looseFlap ?? EMPTY_LOOSE_FLAP()),
                                      axialLength: e.target.value,
                                    },
                                  };
                                  patch({ dimensionalData: next });
                                }}
                                sx={{
                                  ...theme.workflow.formElements.cellField,
                                  ...casingTheme.dimInput,
                                }}
                              />
                            </TableCell>
                          </>
                        ) : (
                          DIM_COLUMNS.map((col) => (
                            <TableCell key={col.key} sx={theme.workflow.formElements.tableCell}>
                              <TextField
                                size="small"
                                fullWidth
                                type="number"
                                placeholder={col.label}
                                value={row.readings[col.key]}
                                onChange={(e) => {
                                  const next = [...form.dimensionalData];
                                  next[idx] = {
                                    ...next[idx],
                                    readings: { ...next[idx].readings, [col.key]: e.target.value },
                                  };
                                  patch({ dimensionalData: next });
                                }}
                                sx={{
                                  ...theme.workflow.formElements.cellField,
                                  ...casingTheme.dimInput,
                                }}
                              />
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
          <RocketMotorCasingMockTrialSchemaPanel
            motorStage={form.motorStageApi || motorStage}
            subDepartmentId={subDepartmentId}
            slot={form.mockTrial}
            onSlotChange={(mockTrial) => patch({ mockTrial })}
            theme={theme}
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
          <CasingReportUpload form={form} patch={patch} theme={theme} />
        </SectionCard>
      )}
    </Box>
  );
};

export default MotorCasingCreateForm;
