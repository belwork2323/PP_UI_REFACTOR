import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { STATIC_TEST_FACILITY_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { StaticTestFacilityFormState } from "../../../../../data/models/user/StaticTestFacilityFormModel";
import type { StfSubType } from "../../../../../schema-engine";
import STFFlowBar from "./STFFlowBar";
import STFSchemaPanel from "./STFSchemaPanel";

const S = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;
const { rocketLaunch: RocketLaunchRoundedIcon } = icons.user.qualityControl.staticTestFacility.form;

type StaticTestFacilityFormProps = {
  batch?: { batchId?: string } | null;
  formData: StaticTestFacilityFormState;
  subDepartmentId?: number;
  selectedMotorType: StfSubType | "";
  motorIdNo: string;
  isEditMode?: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  flowBarTheme: any;
  onMotorTypeChange: (value: string) => void;
  onMotorIdNoChange: (value: string) => void;
  onLoadStfForm: () => void;
  onFormValuesChange: (values: import("../../../../../schema-engine").SchemaFormValues) => void;
  theme: any;
};

const StaticTestFacilityForm = ({
  batch,
  formData,
  subDepartmentId,
  selectedMotorType,
  motorIdNo,
  isEditMode = false,
  schemaLoading = false,
  schemaError = null,
  flowBarTheme,
  onMotorTypeChange,
  onMotorIdNoChange,
  onLoadStfForm,
  onFormValuesChange,
  theme,
}: StaticTestFacilityFormProps) => {
  const BRAND = STATIC_TEST_FACILITY_BRAND;
  const isReady = formData.schemaFormLoaded && formData.stfSchema;
  const motorTypeLabel =
    selectedMotorType === "MAIN_MOTOR"
      ? "Main Motor"
      : selectedMotorType === "BEM"
        ? "BEM"
        : "";

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      {isEditMode ? (
        <Box
          sx={{
            mb: 2.5,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            background: "rgba(192,57,43,0.05)",
            border: "1.5px solid rgba(192,57,43,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 1.2,
          }}
        >
          <Typography sx={{ fontSize: "0.8rem", color: BRAND.danger, fontWeight: 600 }}>
            {S.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      ) : null}

      <Box
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.border}`,
          background: `linear-gradient(135deg, ${BRAND.surface} 0%, #fff 100%)`,
          px: 2,
          py: 1.75,
          mb: 2.5,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} gap={1.5}>
          <Stack direction="row" alignItems="center" gap={1.5} flex={1}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: `linear-gradient(135deg,${BRAND.primary},${BRAND.primaryLight})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 14px ${BRAND.primary}40`,
              }}
            >
              <RocketLaunchRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: BRAND.text }}>
                {S.TITLE}
              </Typography>
              <Typography sx={{ fontSize: "0.74rem", color: BRAND.textSub, mt: 0.2 }}>
                {S.SUBTITLE}
                {batch?.batchId ? ` · ${batch.batchId}` : ""}
              </Typography>
            </Box>
          </Stack>
          {motorTypeLabel ? (
            <Chip
              label={motorTypeLabel}
              size="small"
              sx={{
                height: 26,
                fontWeight: 700,
                fontSize: "0.7rem",
                alignSelf: { xs: "flex-start", sm: "center" },
                background: "rgba(27,79,114,0.1)",
                color: BRAND.primary,
                border: `1px solid ${BRAND.primary}44`,
              }}
            />
          ) : null}
        </Stack>
      </Box>

      <STFFlowBar
        selectedMotorType={selectedMotorType}
        motorIdNo={motorIdNo}
        formLoaded={Boolean(isReady)}
        schemaLoading={schemaLoading}
        onMotorTypeChange={onMotorTypeChange}
        onMotorIdNoChange={onMotorIdNoChange}
        onLoadForm={onLoadStfForm}
        theme={flowBarTheme}
      />

      {schemaLoading && !isReady ? (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.border}`,
            background: theme.palette.surface,
            px: 2,
            py: 5,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={28} />
        </Box>
      ) : null}

      {isReady ? (
        <STFSchemaPanel
          schema={formData.stfSchema}
          formValues={formData.schemaFormValues}
          savedSections={formData.savedSections}
          subDepartmentId={subDepartmentId}
          batchId={batch?.batchId}
          onChange={onFormValuesChange}
          loading={schemaLoading}
          error={schemaError}
        />
      ) : null}
    </Box>
  );
};

export default StaticTestFacilityForm;
