import { Box, Stack, Typography } from "@mui/material";
import AppTextField from "@ui/components/common/AppTextField";
import { STRINGS } from "@app/config/strings";
import DateField, { DateTimeField } from "@ui/components/common/DateField";
import AppDropdown from "@ui/components/common/AppDropdown";
import type {
  AdductPreparationDetails,
  PreparationLotDropdownOption,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import MandatoryFormField, {
  mandatoryFieldInputSx,
} from "@ui/components/validation/ValidatedFormField";
import type { ValidationErrors } from "@/data/validation/submissionIntent";
import useValidationDisplay, {
  type ValidationAttemptFlags,
} from "@/ui/components/validation/useValidationDisplay";
import { blockAdductPath } from "@data/validation/adapters/sourcing/rms/rawMaterialSourcing.validation";
import { DECIMAL_MAX_LENGTH, DECIMAL_MAX_LENGTH_SIGNED } from "@/data/validation/inputLimits";
import {
  sanitizeNumericAnalysedResultInput,
  sanitizePositiveNumericInput,
} from "@/data/validation/specResultValidation";

const L = STRINGS.SOURCING.SPECIFICATION_FORM.ADDUCT_PREPARATION;
const FORM_STRINGS = STRINGS.SOURCING.SPECIFICATION_FORM;

type Props = {
  details: AdductPreparationDetails;
  blockIndex: number;
  tmpLotOptions: PreparationLotDropdownOption[];
  nbdLotOptions: PreparationLotDropdownOption[];
  loadingLots?: boolean;
  onChange: (next: AdductPreparationDetails) => void;
  errors: ValidationErrors;
  validationAttempt: ValidationAttemptFlags;
  theme: any;
  disabled?: boolean;
};

const getLotPlaceholder = (
  loadingLots: boolean,
  optionCount: number,
): string => {
  if (loadingLots) return FORM_STRINGS.LOADING_APPROVED_LOTS;
  if (optionCount > 0) return FORM_STRINGS.SELECT_LOT_PLACEHOLDER;
  return FORM_STRINGS.NO_APPROVED_LOTS;
};

const AdductPreparationSection = ({
  details,
  blockIndex,
  tmpLotOptions,
  nbdLotOptions,
  loadingLots = false,
  onChange,
  errors,
  validationAttempt,
  theme,
  disabled = false,
}: Props) => {
  const { visibleError } = useValidationDisplay(errors, validationAttempt);
  const fieldSx = (field: keyof AdductPreparationDetails, hasError: boolean) =>
    mandatoryFieldInputSx(
      theme.workflow.formElements.metaRowTextField,
      hasError,
      theme,
    );

  const updateField = <K extends keyof AdductPreparationDetails>(
    field: K,
    value: AdductPreparationDetails[K],
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

  const specStyles = theme.sourcing.rawMaterial.specificationForm;

  return (
    <Box sx={specStyles.subPanel}>
      <Typography sx={specStyles.subPanelTitle}>
        {L.SECTION_TITLE}
      </Typography>

      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <MandatoryFormField
            label={L.ADDUCT_BATCH_PREP_DATE}
            error={visibleError(
              blockAdductPath(blockIndex, "adductBatchPrepDate"),
            )}
            theme={theme}
          >
            <DateField
              value={details.adductBatchPrepDate}
              onChange={(value) => updateField("adductBatchPrepDate", value)}
              placeholder="DD-MM-YYYY"
              error={Boolean(
                visibleError(
                  blockAdductPath(blockIndex, "adductBatchPrepDate"),
                ),
              )}
              compact
              sx={{ mb: 0, width: "100%" }}
              inputSx={fieldSx(
                "adductBatchPrepDate",
                Boolean(
                  visibleError(
                    blockAdductPath(blockIndex, "adductBatchPrepDate"),
                  ),
                ),
              )}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={L.TMP_MFG_LOT_NO}
            error={visibleError(blockAdductPath(blockIndex, "tmpMfgLotNo"))}
            theme={theme}
          >
            <AppDropdown
              value={details.tmpMfgLotNo}
              onChange={(value) => updateField("tmpMfgLotNo", value)}
              disabled={disabled}
              loading={loadingLots}
              placeholder={getLotPlaceholder(loadingLots, tmpLotOptions.length)}
              options={tmpLotOptions}
              error={Boolean(
                visibleError(blockAdductPath(blockIndex, "tmpMfgLotNo")),
              )}
              sx={fieldSx(
                "tmpMfgLotNo",
                Boolean(
                  visibleError(blockAdductPath(blockIndex, "tmpMfgLotNo")),
                ),
              )}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={L.TMP_TOTAL_QTY_GM}
            error={visibleError(blockAdductPath(blockIndex, "tmpTotalQtyGm"))}
            theme={theme}
          >
            <AppTextField
              compact
              size="small"
              fullWidth
              type="text"
              inputMode="decimal"
              inputProps={{ maxLength: DECIMAL_MAX_LENGTH }}
              value={details.tmpTotalQtyGm ?? ""}
              disabled={disabled}
              onChange={(e) =>
                updateField(
                  "tmpTotalQtyGm",
                  parseNumericInput(e.target.value, { positiveOnly: true }),
                )
              }
              error={Boolean(
                visibleError(blockAdductPath(blockIndex, "tmpTotalQtyGm")),
              )}
              sx={fieldSx(
                "tmpTotalQtyGm",
                Boolean(
                  visibleError(blockAdductPath(blockIndex, "tmpTotalQtyGm")),
                ),
              )}
            />
          </MandatoryFormField>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <MandatoryFormField
            label={L.NBD_MFG_LOT_NO}
            error={visibleError(blockAdductPath(blockIndex, "nbdMfgLotNo"))}
            theme={theme}
          >
            <AppDropdown
              value={details.nbdMfgLotNo}
              onChange={(value) => updateField("nbdMfgLotNo", value)}
              disabled={disabled}
              loading={loadingLots}
              placeholder={getLotPlaceholder(loadingLots, nbdLotOptions.length)}
              options={nbdLotOptions}
              error={Boolean(
                visibleError(blockAdductPath(blockIndex, "nbdMfgLotNo")),
              )}
              sx={fieldSx(
                "nbdMfgLotNo",
                Boolean(
                  visibleError(blockAdductPath(blockIndex, "nbdMfgLotNo")),
                ),
              )}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={L.NBD_TOTAL_QTY_GM}
            error={visibleError(blockAdductPath(blockIndex, "nbdTotalQtyGm"))}
            theme={theme}
          >
            <AppTextField
              compact
              size="small"
              fullWidth
              type="text"
              inputMode="decimal"
              inputProps={{ maxLength: DECIMAL_MAX_LENGTH }}
              value={details.nbdTotalQtyGm ?? ""}
              disabled={disabled}
              onChange={(e) =>
                updateField(
                  "nbdTotalQtyGm",
                  parseNumericInput(e.target.value, { positiveOnly: true }),
                )
              }
              error={Boolean(
                visibleError(blockAdductPath(blockIndex, "nbdTotalQtyGm")),
              )}
              sx={fieldSx(
                "nbdTotalQtyGm",
                Boolean(
                  visibleError(blockAdductPath(blockIndex, "nbdTotalQtyGm")),
                ),
              )}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={L.RPM}
            error={visibleError(blockAdductPath(blockIndex, "rpm"))}
            theme={theme}
          >
            <AppTextField
              compact
              size="small"
              fullWidth
              type="text"
              inputMode="decimal"
              inputProps={{ maxLength: DECIMAL_MAX_LENGTH_SIGNED }}
              value={details.rpm ?? ""}
              disabled={disabled}
              onChange={(e) =>
                updateField("rpm", parseNumericInput(e.target.value))
              }
              error={Boolean(visibleError(blockAdductPath(blockIndex, "rpm")))}
              sx={fieldSx(
                "rpm",
                Boolean(visibleError(blockAdductPath(blockIndex, "rpm"))),
              )}
            />
          </MandatoryFormField>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <MandatoryFormField
            label={L.PROCESS_TEMP}
            error={visibleError(blockAdductPath(blockIndex, "processTemp"))}
            theme={theme}
          >
            <AppTextField
              compact
              size="small"
              fullWidth
              type="text"
              inputMode="decimal"
              inputProps={{ maxLength: DECIMAL_MAX_LENGTH_SIGNED }}
              value={details.processTemp ?? ""}
              disabled={disabled}
              onChange={(e) =>
                updateField("processTemp", parseNumericInput(e.target.value))
              }
              error={Boolean(
                visibleError(blockAdductPath(blockIndex, "processTemp")),
              )}
              sx={fieldSx(
                "processTemp",
                Boolean(
                  visibleError(blockAdductPath(blockIndex, "processTemp")),
                ),
              )}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={L.JACKET_TEMP}
            error={visibleError(blockAdductPath(blockIndex, "jacketTemp"))}
            theme={theme}
          >
            <AppTextField
              compact
              size="small"
              fullWidth
              type="text"
              inputMode="decimal"
              inputProps={{ maxLength: DECIMAL_MAX_LENGTH_SIGNED }}
              value={details.jacketTemp ?? ""}
              disabled={disabled}
              onChange={(e) =>
                updateField("jacketTemp", parseNumericInput(e.target.value))
              }
              error={Boolean(
                visibleError(blockAdductPath(blockIndex, "jacketTemp")),
              )}
              sx={fieldSx(
                "jacketTemp",
                Boolean(
                  visibleError(blockAdductPath(blockIndex, "jacketTemp")),
                ),
              )}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={L.PROCESS_START_TIME}
            error={visibleError(
              blockAdductPath(blockIndex, "processStartTime"),
            )}
            theme={theme}
          >
            <DateTimeField
              value={details.processStartTime}
              disabled={disabled}
              onChange={(value) => updateField("processStartTime", value)}
              error={Boolean(
                visibleError(blockAdductPath(blockIndex, "processStartTime")),
              )}
              sx={fieldSx(
                "processStartTime",
                Boolean(
                  visibleError(blockAdductPath(blockIndex, "processStartTime")),
                ),
              )}
            />
          </MandatoryFormField>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <MandatoryFormField
            label={L.PROCESS_END_TIME}
            error={visibleError(blockAdductPath(blockIndex, "processEndTime"))}
            theme={theme}
          >
            <DateTimeField
              value={details.processEndTime}
              minDate={details.processStartTime}
              requiresMinDateTime
              disabled={disabled}
              onChange={(value) => updateField("processEndTime", value)}
              error={Boolean(
                visibleError(blockAdductPath(blockIndex, "processEndTime")),
              )}
              sx={fieldSx(
                "processEndTime",
                Boolean(
                  visibleError(blockAdductPath(blockIndex, "processEndTime")),
                ),
              )}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={L.FINAL_ADDUCT_QTY}
            error={visibleError(blockAdductPath(blockIndex, "finalAdductQty"))}
            theme={theme}
          >
            <AppTextField
              compact
              size="small"
              fullWidth
              type="text"
              inputMode="decimal"
              inputProps={{ maxLength: DECIMAL_MAX_LENGTH }}
              value={details.finalAdductQty ?? ""}
              disabled={disabled}
              onChange={(e) =>
                updateField(
                  "finalAdductQty",
                  parseNumericInput(e.target.value, { positiveOnly: true }),
                )
              }
              error={Boolean(
                visibleError(blockAdductPath(blockIndex, "finalAdductQty")),
              )}
              sx={fieldSx(
                "finalAdductQty",
                Boolean(
                  visibleError(blockAdductPath(blockIndex, "finalAdductQty")),
                ),
              )}
            />
          </MandatoryFormField>
          <MandatoryFormField
            label={L.DISPATCH_DATE_TIME}
            error={visibleError(
              blockAdductPath(blockIndex, "dispatchDateTime"),
            )}
            theme={theme}
          >
            <DateTimeField
              value={details.dispatchDateTime}
              disabled={disabled}
              onChange={(value) => updateField("dispatchDateTime", value)}
              error={Boolean(
                visibleError(blockAdductPath(blockIndex, "dispatchDateTime")),
              )}
              sx={fieldSx(
                "dispatchDateTime",
                Boolean(
                  visibleError(blockAdductPath(blockIndex, "dispatchDateTime")),
                ),
              )}
            />
          </MandatoryFormField>
        </Stack>
      </Stack>
    </Box>
  );
};

export default AdductPreparationSection;
