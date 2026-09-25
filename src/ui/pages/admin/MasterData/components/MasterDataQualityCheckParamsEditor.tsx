import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import CasePrepTextField from "@ui/pages/user/manufacturing/CasePreparation/CasePrepTextField";
import CasePrepSearchableSelect from "@ui/pages/user/manufacturing/CasePreparation/CasePrepSearchableSelect";
import MasterDataEnableDisableField from "./MasterDataEnableDisableField";
import {
  emptyQualityCheckParam,
  type QualityCheckParamFieldErrors,
  type QualityCheckParamForm,
} from "@data/models/admin/MasterData/QualityCheckMasterModel";
import { visibleValidationError } from "../masterDataValidationUtils";
import type { AppDropdownOption } from "@ui/components/common/AppDropdown";

const S = STRINGS.MASTER_DATA;

type Props = {
  title: string;
  params: QualityCheckParamForm[];
  disabled?: boolean;
  isEdit: boolean;
  showErrors: boolean;
  paramErrors?: QualityCheckParamFieldErrors[];
  unitOptions: AppDropdownOption[];
  unitLoading?: boolean;
  theme: any;
  onChange: (next: QualityCheckParamForm[]) => void;
};

/** Nested quality-check parameter editor (Mixing Cycle / legacy QC master). */
const MasterDataQualityCheckParamsEditor = ({
  title,
  params,
  disabled,
  isEdit,
  showErrors,
  paramErrors,
  unitOptions,
  unitLoading,
  theme,
  onChange,
}: Props) => (
  <Stack spacing={1.5}>
    <Typography variant="subtitle2">{title}</Typography>
    {params.map((param, idx) => {
      const locked = isEdit && Boolean(param.isExisting);
      const unitMissing =
        param.specification.unitId == null && !String(param.specification.unit ?? "").trim();
      const unitLocked = locked && !unitMissing;
      const resolvedUnitValue = (() => {
        if (param.specification.unitId != null) {
          return String(param.specification.unitId);
        }
        const unitLabel = String(param.specification.unit ?? "").trim().toLowerCase();
        if (!unitLabel) return "";
        const match = unitOptions.find(
          (item) => String(item.label ?? "").trim().toLowerCase() === unitLabel,
        );
        return match ? String(match.value) : "";
      })();
      const rawErr = paramErrors?.[idx];
      const nameError = visibleValidationError(
        rawErr?.parameterName,
        param.parameterName.trim().length > 0,
        showErrors,
      );
      const minError = visibleValidationError(
        rawErr?.minValue,
        param.specification.minValue != null,
        showErrors,
      );
      const maxError = visibleValidationError(
        rawErr?.maxValue,
        param.specification.maxValue != null,
        showErrors,
      );
      const unitError = visibleValidationError(
        rawErr?.unit,
        param.specification.unitId != null || String(param.specification.unit ?? "").trim().length > 0,
        showErrors,
      );
      const samplesError = visibleValidationError(
        rawErr?.noOfSamples,
        param.noOfSamples !== "",
        showErrors,
      );
      const hasFieldError = Boolean(
        nameError || minError || maxError || unitError || samplesError,
      );

      return (
        <Box
          key={`${param.parameterId || "new"}-${idx}`}
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "flex-start",
            p: 1.5,
            border: "1px solid",
            borderColor: hasFieldError ? "error.main" : "divider",
            borderRadius: 1.5,
            bgcolor: locked ? "action.hover" : "background.paper",
            opacity: !param.isActive ? 0.72 : 1,
          }}
        >
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 120px" },
                gap: 1,
              }}
            >
              <CasePrepTextField
                label={S.QUALITY_CHECKS.PARAM_NAME}
                value={param.parameterName}
                disabled={disabled || locked}
                required={!locked}
                error={Boolean(nameError)}
                helperText={nameError ?? null}
                width="100%"
                theme={theme}
                onChange={(value) => {
                  const next = [...params];
                  next[idx] = { ...param, parameterName: value };
                  onChange(next);
                }}
              />
              <CasePrepTextField
                label={S.QUALITY_CHECKS.PARAM_SAMPLES}
                value={param.noOfSamples === "" ? "" : String(param.noOfSamples)}
                disabled={disabled || locked}
                required={!locked}
                error={Boolean(samplesError)}
                helperText={samplesError ?? null}
                width="100%"
                theme={theme}
                onChange={(value) => {
                  const next = [...params];
                  next[idx] = {
                    ...param,
                    noOfSamples: value === "" ? "" : Number(value),
                  };
                  onChange(next);
                }}
              />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                gap: 1,
              }}
            >
              <CasePrepTextField
                label={S.QUALITY_CHECKS.PARAM_MIN}
                value={param.specification.minValue != null ? String(param.specification.minValue) : ""}
                disabled={disabled || locked}
                error={Boolean(minError)}
                helperText={minError ?? null}
                width="100%"
                theme={theme}
                onChange={(value) => {
                  const next = [...params];
                  next[idx] = {
                    ...param,
                    specification: {
                      ...param.specification,
                      minValue: value === "" ? null : Number(value),
                    },
                  };
                  onChange(next);
                }}
              />
              <CasePrepTextField
                label={S.QUALITY_CHECKS.PARAM_MAX}
                value={param.specification.maxValue != null ? String(param.specification.maxValue) : ""}
                disabled={disabled || locked}
                error={Boolean(maxError)}
                helperText={maxError ?? null}
                width="100%"
                theme={theme}
                onChange={(value) => {
                  const next = [...params];
                  next[idx] = {
                    ...param,
                    specification: {
                      ...param.specification,
                      maxValue: value === "" ? null : Number(value),
                    },
                  };
                  onChange(next);
                }}
              />
              <Box>
                <CasePrepSearchableSelect
                  label={S.QUALITY_CHECKS.PARAM_UNIT}
                  value={resolvedUnitValue}
                  placeholder="Select unit"
                  disabled={disabled || unitLocked || unitLoading}
                  options={unitOptions}
                  width="100%"
                  theme={theme}
                  onChange={(value) => {
                    const option = unitOptions.find((item) => item.value === value);
                    const next = [...params];
                    next[idx] = {
                      ...param,
                      specification: {
                        ...param.specification,
                        unitId: value === "" ? null : Number(value),
                        unit: option ? String(option.label ?? "") : "",
                      },
                    };
                    onChange(next);
                  }}
                />
                {unitError ? (
                  <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                    {unitError}
                  </Typography>
                ) : null}
              </Box>
            </Box>
          </Box>
          <MasterDataEnableDisableField
            checked={param.isActive}
            disabled={disabled}
            labelVariant="caption"
            minWidth={96}
            requireConfirmation={locked}
            confirmName={param.parameterName.trim() || `parameter ${idx + 1}`}
            onChange={(isActive) => {
              const next = [...params];
              next[idx] = { ...param, isActive };
              onChange(next);
            }}
          />
          {!locked ? (
            <IconButton
              size="small"
              disabled={disabled}
              onClick={() => onChange(params.filter((_, i) => i !== idx))}
              aria-label={S.QUALITY_CHECKS.REMOVE_PARAMETER}
              sx={{ mt: 2.75, flexShrink: 0 }}
            >
              <icons.Delete fontSize="small" />
            </IconButton>
          ) : null}
        </Box>
      );
    })}
    <Button
      size="small"
      startIcon={<icons.projectMgmt.add />}
      disabled={disabled}
      onClick={() => onChange([...params, emptyQualityCheckParam()])}
    >
      {S.QUALITY_CHECKS.ADD_PARAMETER}
    </Button>
  </Stack>
);

export default MasterDataQualityCheckParamsEditor;
