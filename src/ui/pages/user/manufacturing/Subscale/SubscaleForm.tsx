import { Box, Chip, Stack, Typography } from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { SUBSCALE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/subscale_theme";
import type { SubscaleFormState } from "../../../../../data/models/user/SubscaleFormModel";
import {
  getSubscaleProcessingLabel,
  isMainScaleSubscaleBatch,
} from "../../../../../hooks/user/manufacturing/subscaleHardwareConfig";
import SubscaleSchemaPanel from "./SubscaleSchemaPanel";

const S = STRINGS.MANUFACTURING.SUBSCALE;
const { scale: ScaleRoundedIcon } = icons.user.manufacturing.subscale.form;

type SubscaleFormProps = {
  batch?: { batchId?: string; articleId?: string; batchType?: string | null } | null;
  formData: SubscaleFormState;
  subDepartmentId?: number;
  schemaLoading?: boolean;
  schemaError?: string | null;
  onFormValuesChange: (values: import("../../../../../schema-engine").SchemaFormValues) => void;
  theme: any;
  batchDetails;
  actionLoading?: boolean;
  isEditMode?: boolean;
  onRequestSaveDraft?: () => void;
  onRequestSubmit?: () => void;
};

const SubscaleForm = ({
  batch,
  formData,
  subDepartmentId,
  onFormValuesChange,
  theme,
  batchDetails,
  actionLoading,
  isEditMode,
  onRequestSaveDraft,
  onRequestSubmit,
}: SubscaleFormProps) => {
  const BRAND = SUBSCALE_BRAND;
  const isMainScale = isMainScaleSubscaleBatch(batch?.batchType);
  const processingLabel = getSubscaleProcessingLabel(batch?.batchType);

  return (
    <Box>
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
                background: `linear-gradient(135deg,${BRAND.ss},${BRAND.ssLight})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 4px 14px ${BRAND.ss}40`,
              }}
            >
              <ScaleRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: BRAND.text }}>
                {S.FORM_TITLE}
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub, mt: 0.2 }}>
                {processingLabel}
                {batch?.batchId ? ` · ${batch.batchId}` : ""}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={processingLabel}
            size="small"
            sx={{
              height: 26,
              fontWeight: 700,
              fontSize: "0.72rem",
              alignSelf: { xs: "flex-start", sm: "center" },
              background: isMainScale ? "rgba(21,101,192,0.1)" : "rgba(21,101,192,0.1)",
              color: isMainScale ? BRAND.primary : BRAND.ss,
              border: `1px solid ${isMainScale ? `${BRAND.primaryLight}44` : `${BRAND.ss}44`}`,
            }}
          />
        </Stack>
      </Box>

      {/* {!isReady ? (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.border}`,
            background: theme.palette.surface,
            px: 2,
            py: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <CircularProgress size={28} sx={{ color: BRAND.ss }} />
          <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: BRAND.text }}>
            {S.SCHEMA_LOADING}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: BRAND.textSub, textAlign: "center" }}>
            {S.SCHEMA_LOADING_HINT}
          </Typography>
        </Box>
      ) : null} */}

      <Box
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${theme.palette.border}`,
          background: theme.palette.surface,
          px: { xs: 1, sm: 1.5 },
          py: 1.5,
        }}
      >
        <SubscaleSchemaPanel
          schema={formData.subscaleSchema}
          formValues={formData.schemaFormValues ?? {}}
          savedSections={formData.savedSections}
          subDepartmentId={subDepartmentId}
          batchId={batch?.batchId}
          batchType={batch?.batchType}
          onChange={onFormValuesChange}
          batchDetails={batchDetails}
          actionLoading={actionLoading}
          isEditMode={isEditMode}
          onRequestSaveDraft={onRequestSaveDraft}
          onRequestSubmit={onRequestSubmit}
        />
      </Box>
    </Box>
  );
};

export default SubscaleForm;
