import { Box, Stack, Typography } from "@mui/material";
import AppTextField from "@ui/components/common/AppTextField";
import { STRINGS } from "@app/config/strings";
import { DateTimeField } from "@ui/components/common/DateField";
import AppDropdown from "@ui/components/common/AppDropdown";
import type {
  BlendingStylePreparationDetails,
  PreparationLotDropdownOption,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import MandatoryFormField, {
  mandatoryFieldInputSx,
} from "@ui/components/validation/ValidatedFormField";
import type { ValidationErrors } from "@/data/validation/submissionIntent";
import useValidationDisplay, {
  type ValidationAttemptFlags,
} from "@/ui/components/validation/useValidationDisplay";
import { blockBlendingStylePreparationPath } from "@data/validation/adapters/sourcing/rms/rawMaterialSourcing.validation";
import {
  CODE_REF_MAX,
  DECIMAL_MAX_LENGTH,
  DECIMAL_MAX_LENGTH_SIGNED,
  REMARKS_MAX,
} from "@data/validation/inputLimits";
import {
  sanitizeNumericAnalysedResultInput,
  sanitizePositiveNumericInput,
} from "@data/validation/specResultValidation";

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
  const fieldSx = (
    field: keyof BlendingStylePreparationDetails,
    hasError: boolean,
  ) =>
    mandatoryFieldInputSx(
      theme.workflow.formElements.metaRowTextField,
      hasError,
      theme,
    );

  const updateField = <K extends keyof BlendingStylePreparationDetails>(
    field: K,
    value: BlendingStylePreparationDetails[K],
  ) => {
    onChange({ ...details, [field]: value });
  };

  /** Keep exact digit string — never coerce through JS Number (precision loss). */
  const parseNumericInput = (
    value: string,
    options?: { positiveOnly?: boolean },
  ): string =>
    options?.positiveOnly
      ? sanitizePositiveNumericInput(value)
      : sanitizeNumericAnalysedResultInput(value);

  const mfgLotPlaceholder = loadingLots
    ? FORM_STRINGS.LOADING_APPROVED_LOTS
    : mfgLotOptions.length > 0
      ? FORM_STRINGS.SELECT_LOT_PLACEHOLDER
      : FORM_STRINGS.NO_APPROVED_LOTS;

  const specStyles = theme.sourcing.rawMaterial.specificationForm;

  return (
    <Box sx={specStyles.subPanel}>
      <Typography sx={specStyles.subPanelTitle}>
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
              sx={fieldSx(
                "mfgBatchLotNo",
                Boolean(visibleError(fieldPath("mfgBatchLotNo"))),
              )}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={labels.TOTAL_QTY}
            error={visibleError(fieldPath("totalQty"))}
            theme={theme}
          >
            <AppTextField
              compact
              size="small"
              fullWidth
              type="text"
              inputMode="decimal"
              value={details.totalQty ?? ""}
              disabled={disabled}
              onChange={(e) =>
                updateField(
                  "totalQty",
                  parseNumericInput(e.target.value, { positiveOnly: true }),
                )
              }
              error={Boolean(visibleError(fieldPath("totalQty")))}
              inputProps={{ maxLength: DECIMAL_MAX_LENGTH }}
              sx={fieldSx(
                "totalQty",
                Boolean(visibleError(fieldPath("totalQty"))),
              )}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={labels.EQUIPMENT_ID}
            error={visibleError(fieldPath("equipmentId"))}
            theme={theme}
          >
            <AppTextField
              compact
              size="small"
              fullWidth
              value={details.equipmentId}
              disabled={disabled}
              onChange={(e) => updateField("equipmentId", e.target.value)}
              error={Boolean(visibleError(fieldPath("equipmentId")))}
              inputProps={{ maxLength: CODE_REF_MAX }}
              sx={fieldSx(
                "equipmentId",
                Boolean(visibleError(fieldPath("equipmentId"))),
              )}
            />
          </MandatoryFormField>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <MandatoryFormField
            label={labels.AGITATOR_RPM}
            error={visibleError(fieldPath("agitatorRpm"))}
            theme={theme}
          >
            <AppTextField
              compact
              size="small"
              fullWidth
              type="text"
              inputMode="decimal"
              value={details.agitatorRpm ?? ""}
              disabled={disabled}
              onChange={(e) =>
                updateField("agitatorRpm", parseNumericInput(e.target.value))
              }
              error={Boolean(visibleError(fieldPath("agitatorRpm")))}
              inputProps={{ maxLength: DECIMAL_MAX_LENGTH_SIGNED }}
              sx={fieldSx(
                "agitatorRpm",
                Boolean(visibleError(fieldPath("agitatorRpm"))),
              )}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={labels.PROCESS_TEMP}
            error={visibleError(fieldPath("processTemp"))}
            theme={theme}
          >
            <AppTextField
              compact
              size="small"
              fullWidth
              type="text"
              inputMode="decimal"
              value={details.processTemp ?? ""}
              disabled={disabled}
              onChange={(e) =>
                updateField("processTemp", parseNumericInput(e.target.value))
              }
              error={Boolean(visibleError(fieldPath("processTemp")))}
              inputProps={{ maxLength: DECIMAL_MAX_LENGTH_SIGNED }}
              sx={fieldSx(
                "processTemp",
                Boolean(visibleError(fieldPath("processTemp"))),
              )}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={labels.JACKET_TEMP}
            error={visibleError(fieldPath("jacketTemp"))}
            theme={theme}
          >
            <AppTextField
              compact
              size="small"
              fullWidth
              type="text"
              inputMode="decimal"
              value={details.jacketTemp ?? ""}
              disabled={disabled}
              onChange={(e) =>
                updateField("jacketTemp", parseNumericInput(e.target.value))
              }
              error={Boolean(visibleError(fieldPath("jacketTemp")))}
              inputProps={{ maxLength: DECIMAL_MAX_LENGTH_SIGNED }}
              sx={fieldSx(
                "jacketTemp",
                Boolean(visibleError(fieldPath("jacketTemp"))),
              )}
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
              sx={fieldSx(
                "processStartTime",
                Boolean(visibleError(fieldPath("processStartTime"))),
              )}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={labels.PROCESS_END_TIME}
            error={visibleError(fieldPath("processEndTime"))}
            theme={theme}
          >
            <DateTimeField
              value={details.processEndTime}
              minDate={details.processStartTime}
              requiresMinDateTime
              disabled={disabled}
              onChange={(value) => updateField("processEndTime", value)}
              error={Boolean(visibleError(fieldPath("processEndTime")))}
              sx={fieldSx(
                "processEndTime",
                Boolean(visibleError(fieldPath("processEndTime"))),
              )}
            />
          </MandatoryFormField>
        </Stack>

        <MandatoryFormField
          label={labels.OTHER_OBSERVATIONS}
          error={visibleError(fieldPath("otherObservations"))}
          theme={theme}
          required={false}
        >
          <AppTextField
            size="small"
            fullWidth
            multiline
            minRows={4}
            maxRows={8}
            value={details.otherObservations}
            disabled={disabled}
            onChange={(e) => updateField("otherObservations", e.target.value)}
            inputProps={{ maxLength: REMARKS_MAX }}
            error={Boolean(visibleError(fieldPath("otherObservations")))}
            sx={{
              ...fieldSx(
                "otherObservations",
                Boolean(visibleError(fieldPath("otherObservations"))),
              ),
              // Override metaRowTextField's fixed 32px height so multiline text stays inside.
              "& .MuiOutlinedInput-root, & .MuiPickersOutlinedInput-root": {
                height: "auto",
                minHeight: 96,
                maxHeight: "none",
                alignItems: "flex-start",
                py: 1,
              },
              "& .MuiInputBase-inputMultiline": {
                py: 0.5,
                px: 0.25,
                lineHeight: 1.45,
                overflow: "auto",
                resize: "vertical",
              },
            }}
          />
        </MandatoryFormField>
      </Stack>
    </Box>
  );
};

export default BlendingStylePreparationSection;
