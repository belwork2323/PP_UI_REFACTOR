import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { icons } from "../../../../app/theme/icons";
import { STRINGS } from "../../../../app/config/strings";
import type { DispatchFormState } from "../../../../data/models/user/DispatchFormModel";
import DispatchFlowBar from "./DispatchFlowBar";
import DispatchSchemaPanel from "./DispatchSchemaPanel";

const S = STRINGS.DISPATCH;
const { localShipping: LocalShippingRoundedIcon } = icons.user.dispatch.form;

type DispatchFormProps = {
  batch?: {
    batchId?: string;
    projectId?: string;
    projectName?: string;
  } | null;
  formData: DispatchFormState;
  subDepartmentId?: number;
  isEditMode?: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  flowBarTheme: any;
  onSetupChange: <K extends keyof DispatchFormState>(
    field: K,
    value: DispatchFormState[K],
  ) => void;
  onLoadDispatchForm: () => void;
  onFormValuesChange: (values: import("../../../../schema-engine").SchemaFormValues) => void;
  theme: any;
};

const DispatchForm = ({
  batch,
  formData,
  subDepartmentId,
  isEditMode = false,
  schemaLoading = false,
  schemaError = null,
  flowBarTheme,
  onSetupChange,
  onLoadDispatchForm,
  onFormValuesChange,
  theme,
}: DispatchFormProps) => {
  const BRAND = {
    primary: "#1B4F72",
    primaryLight: "#2E86C1",
    text: "#1C2833",
    textSub: "#5D6D7E",
    surface: "#F4F6F8",
    danger: "#C0392B",
  };
  const isReady = formData.schemaFormLoaded && formData.dispatchSchema;

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
              <LocalShippingRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: BRAND.text }}>
                {S.TITLE}
              </Typography>
              <Typography sx={{ fontSize: "0.74rem", color: BRAND.textSub, mt: 0.2 }}>
                {S.SUBTITLE}
              </Typography>
            </Box>
          </Stack>
          {formData.motorStage ? (
            <Chip
              label={`Stage ${formData.motorStage}`}
              size="small"
              sx={{
                height: 26,
                fontWeight: 700,
                fontSize: "0.7rem",
                background: "rgba(27,79,114,0.1)",
                color: BRAND.primary,
                border: `1px solid ${BRAND.primary}44`,
              }}
            />
          ) : null}
        </Stack>
      </Box>

      <DispatchFlowBar
        batchId={batch?.batchId}
        formData={formData}
        formLoaded={Boolean(isReady)}
        schemaLoading={schemaLoading}
        onSetupChange={onSetupChange}
        onLoadForm={onLoadDispatchForm}
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
            mt: 2.5,
          }}
        >
          <CircularProgress size={28} />
        </Box>
      ) : null}

      {isReady ? (
        <Box sx={{ mt: 2.5 }}>
          <DispatchSchemaPanel
            schema={formData.dispatchSchema}
            formValues={formData.schemaFormValues}
            savedSections={formData.savedSections}
            subDepartmentId={subDepartmentId}
            batchId={batch?.batchId}
            onChange={onFormValuesChange}
            loading={schemaLoading}
            error={schemaError}
          />
        </Box>
      ) : null}
    </Box>
  );
};

export default DispatchForm;
