import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import {
  isPostCureInhibitionOperation,
  POST_CURE_INHIBITOR_TYPE_OPTIONS,
  POST_CURE_OPERATION_OPTIONS,
} from "../../../../../hooks/user/manufacturing/postCureConfig";
import { DateTimeField } from "../../../../components/common/DateField";
import CasePrepSelect from "../CasePreparation/CasePrepSelect";

const S = STRINGS.MANUFACTURING.POST_CURE;

type PostCureFlowBarProps = {
  activeMotorId: string;
  draftMotorReceiptDate: string;
  draftOperation: string;
  draftInhibitorType: string;
  canLoadForm: boolean;
  schemaLoading?: boolean;
  onDraftMotorReceiptDateChange: (value: string) => void;
  onDraftOperationChange: (value: string) => void;
  onDraftInhibitorTypeChange: (value: string) => void;
  onLoadForm: () => void;
  theme: any;
};

const PostCureFlowBar = ({
  activeMotorId,
  draftMotorReceiptDate,
  draftOperation,
  draftInhibitorType,
  canLoadForm,
  schemaLoading = false,
  onDraftMotorReceiptDateChange,
  onDraftOperationChange,
  onDraftInhibitorTypeChange,
  onLoadForm,
  theme,
}: PostCureFlowBarProps) => {
  const flowBar =
    theme.manufacturing?.postCure?.flowBar ?? theme.manufacturing?.casePreparation?.flowBar ?? {};
  const showInhibitionFields = isPostCureInhibitionOperation(draftOperation);

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${theme.palette.border}`,
        background: theme.palette.surface,
        px: { xs: 1.25, sm: 1.5 },
        py: 1.25,
      }}
    >
      <Typography
        sx={{
          fontSize: "0.84rem",
          fontWeight: 800,
          color: theme.palette.primary,
          mb: 1.5,
        }}
      >
        {S.PANEL_TITLE}
        {activeMotorId ? ` - ${activeMotorId}` : ""}
      </Typography>

      <Stack spacing={1.5}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            flexWrap: "wrap",
            gap: 2,
            alignItems: { md: "flex-end" },
          }}
        >
          <Box sx={flowBar.selectField?.(280)}>
            <Typography component="label" sx={flowBar.selectLabel}>
              {S.MOTOR_RECEIVED_AT_LABEL}
            </Typography>
            <DateTimeField
              value={draftMotorReceiptDate}
              onChange={onDraftMotorReceiptDateChange}
              placeholder={S.MOTOR_RECEIVED_AT_PLACEHOLDER}
              compact
              sx={flowBar.selectInput?.(Boolean(draftMotorReceiptDate))}
            />
          </Box>

          <CasePrepSelect
            label={S.OPERATION_LABEL}
            value={draftOperation}
            placeholder={S.OPERATION_PLACEHOLDER}
            options={POST_CURE_OPERATION_OPTIONS}
            width={240}
            theme={theme}
            onChange={onDraftOperationChange}
          />
        </Box>

        {showInhibitionFields ? (
          <Box
            sx={{
              borderRadius: 2,
              border: `1px solid ${theme.palette.border}`,
              background: "rgba(21,101,192,0.03)",
              px: 1.25,
              py: 1.25,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: theme.palette.primary,
                mb: 1.25,
              }}
            >
              {S.INHIBITION_SECTION_TITLE}
            </Typography>
            <CasePrepSelect
              label={S.INHIBITOR_TYPE_LABEL}
              value={draftInhibitorType}
              placeholder={S.INHIBITOR_TYPE_PLACEHOLDER}
              options={POST_CURE_INHIBITOR_TYPE_OPTIONS}
              width={260}
              theme={theme}
              onChange={onDraftInhibitorTypeChange}
            />
          </Box>
        ) : null}

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="small"
            onClick={onLoadForm}
            disabled={!canLoadForm || schemaLoading}
            startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {schemaLoading ? S.SCHEMA_LOADING : S.LOAD_FORM}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default PostCureFlowBar;
