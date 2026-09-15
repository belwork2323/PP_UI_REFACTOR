import { alpha, Box, Stack, TextField, Typography } from "@mui/material";
import { STRINGS } from "@app/config/strings";
import { DateTimeField } from "@ui/components/common/DateField";
import AppDropdown from "@ui/components/common/AppDropdown";
import type {
  BlendingStylePreparationDetails,
  PreparationLotDropdownOption,
} from "@data/models/user/RawMaterialProcurementModel";
import MandatoryFormField, { mandatoryFieldInputSx } from "./MandatoryFormField";
import type { ValidationErrors } from "@/data/validation/submissionIntent";
import useValidationDisplay, {
  type ValidationAttemptFlags,
} from "@/ui/components/validation/useValidationDisplay";
import { blockBlendingStylePreparationPath } from "@/data/validation/adapters/rawMaterialSourcing.validation";

const FORM_STRINGS = STRINGS.SOURCING.SPECIFICATION_FORM;

export type BlendingStylePreparationLabels = {
  SECTION_TITLE: string;
  MFG_BATCH_LOT_NO: string;
  TOTAL_QTY: string;
  EQUIPMENT_ID: string;
  AGITATOR_RPM: string;
  PROCESS_TEMP: string;
  JACKET_TEMP: string;
  PROCESS_START_TIME: string;
  PROCESS_END_TIME: string;
  OTHER_OBSERVATIONS: string;
};

type Props = {
  details: BlendingStylePreparationDetails;
  blockIndex: number;
  preparationKey: string;
  labels: BlendingStylePreparationLabels;
  mfgLotOptions: PreparationLotDropdownOption[];
  loadingLots?: boolean;
  onChange: (next: BlendingStylePreparationDetails) => void;
  errors: ValidationErrors;
  validationAttempt: ValidationAttemptFlags;
  theme: any;
  disabled?: boolean;
};

const BlendingStylePreparationSection = ({
  details,
  blockIndex,
  preparationKey,
  labels,
  mfgLotOptions,
  loadingLots = false,
  onChange,
  errors,
  validationAttempt,
  theme,
  disabled = false,
}: Props) => {
  const { visibleError } = useValidationDisplay(errors, validationAttempt);
  const fieldPath = (field: string) =>
    blockBlendingStylePreparationPath(blockIndex, preparationKey, field);
  const fieldSx = (field: keyof BlendingStylePreparationDetails, hasError: boolean) =>
    mandatoryFieldInputSx(theme.workflow.formElements.metaRowTextField, hasError, theme);

  const updateField = <K extends keyof BlendingStylePreparationDetails>(
    field: K,
    value: BlendingStylePreparationDetails[K],
  ) => {
    onChange({ ...details, [field]: value });
  };

  const parseNumericInput = (value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const mfgLotPlaceholder = loadingLots
    ? FORM_STRINGS.LOADING_APPROVED_LOTS
    : mfgLotOptions.length > 0
      ? FORM_STRINGS.SELECT_LOT_PLACEHOLDER
      : FORM_STRINGS.NO_APPROVED_LOTS;

  return (
    <Box
      sx={{
        mx: 2,
        mb: 2,
        p: 2,
        borderRadius: 1.5,
        border: `1px solid ${alpha(theme.palette?.border || "#ccc", 0.55)}`,
        bgcolor: alpha(theme.palette?.primary ?? "#1B4F72", 0.03),
      }}
    >
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: theme.palette.text, mb: 1.5 }}>
        {labels.SECTION_TITLE}
      </Typography>

      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <MandatoryFormField
            label={labels.MFG_BATCH_LOT_NO}
            error={visibleError(fieldPath("mfgBatchLotNo"))}
            theme={theme}
          >
            <AppDropdown
              value={details.mfgBatchLotNo}
              onChange={(value) => updateField("mfgBatchLotNo", value)}
              disabled={disabled}
              loading={loadingLots}
              placeholder={mfgLotPlaceholder}
              options={mfgLotOptions}
              error={Boolean(visibleError(fieldPath("mfgBatchLotNo")))}
              sx={fieldSx("mfgBatchLotNo", Boolean(visibleError(fieldPath("mfgBatchLotNo"))))}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={labels.TOTAL_QTY}
            error={visibleError(fieldPath("totalQty"))}
            theme={theme}
          >
            <TextField
              size="small"
              fullWidth
              type="number"
              value={details.totalQty ?? ""}
              disabled={disabled}
              onChange={(e) => updateField("totalQty", parseNumericInput(e.target.value))}
              error={Boolean(visibleError(fieldPath("totalQty")))}
              sx={fieldSx("totalQty", Boolean(visibleError(fieldPath("totalQty"))))}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={labels.EQUIPMENT_ID}
            error={visibleError(fieldPath("equipmentId"))}
            theme={theme}
          >
            <TextField
              size="small"
              fullWidth
              value={details.equipmentId}
              disabled={disabled}
              onChange={(e) => updateField("equipmentId", e.target.value)}
              error={Boolean(visibleError(fieldPath("equipmentId")))}
              sx={fieldSx("equipmentId", Boolean(visibleError(fieldPath("equipmentId"))))}
            />
          </MandatoryFormField>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <MandatoryFormField
            label={labels.AGITATOR_RPM}
            error={visibleError(fieldPath("agitatorRpm"))}
            theme={theme}
          >
            <TextField
              size="small"
              fullWidth
              type="number"
              value={details.agitatorRpm ?? ""}
              disabled={disabled}
              onChange={(e) => updateField("agitatorRpm", parseNumericInput(e.target.value))}
              error={Boolean(visibleError(fieldPath("agitatorRpm")))}
              sx={fieldSx("agitatorRpm", Boolean(visibleError(fieldPath("agitatorRpm"))))}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={labels.PROCESS_TEMP}
            error={visibleError(fieldPath("processTemp"))}
            theme={theme}
          >
            <TextField
              size="small"
              fullWidth
              type="number"
              value={details.processTemp ?? ""}
              disabled={disabled}
              onChange={(e) => updateField("processTemp", parseNumericInput(e.target.value))}
              error={Boolean(visibleError(fieldPath("processTemp")))}
              sx={fieldSx("processTemp", Boolean(visibleError(fieldPath("processTemp"))))}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={labels.JACKET_TEMP}
            error={visibleError(fieldPath("jacketTemp"))}
            theme={theme}
          >
            <TextField
              size="small"
              fullWidth
              type="number"
              value={details.jacketTemp ?? ""}
              disabled={disabled}
              onChange={(e) => updateField("jacketTemp", parseNumericInput(e.target.value))}
              error={Boolean(visibleError(fieldPath("jacketTemp")))}
              sx={fieldSx("jacketTemp", Boolean(visibleError(fieldPath("jacketTemp"))))}
            />
          </MandatoryFormField>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <MandatoryFormField
            label={labels.PROCESS_START_TIME}
            error={visibleError(fieldPath("processStartTime"))}
            theme={theme}
          >
            <DateTimeField
              value={details.processStartTime}
              disabled={disabled}
              onChange={(value) => updateField("processStartTime", value)}
              error={Boolean(visibleError(fieldPath("processStartTime")))}
              sx={fieldSx("processStartTime", Boolean(visibleError(fieldPath("processStartTime"))))}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={labels.PROCESS_END_TIME}
            error={visibleError(fieldPath("processEndTime"))}
            theme={theme}
          >
            <DateTimeField
              value={details.processEndTime}
              disabled={disabled}
              onChange={(value) => updateField("processEndTime", value)}
              error={Boolean(visibleError(fieldPath("processEndTime")))}
              sx={fieldSx("processEndTime", Boolean(visibleError(fieldPath("processEndTime"))))}
            />
          </MandatoryFormField>
        </Stack>

        <MandatoryFormField label={labels.OTHER_OBSERVATIONS} theme={theme}>
          <TextField
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={details.otherObservations}
            disabled={disabled}
            onChange={(e) => updateField("otherObservations", e.target.value)}
            sx={fieldSx("otherObservations", false)}
          />
        </MandatoryFormField>
      </Stack>
    </Box>
  );
};

export default BlendingStylePreparationSection;
