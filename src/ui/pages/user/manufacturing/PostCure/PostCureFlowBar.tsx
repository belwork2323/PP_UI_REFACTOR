import { Box, Button, Stack, Typography } from "@mui/material";
import { STRINGS } from "../../../../../app/config/strings";
import { DateTimeField } from "../../../../components/common/DateField";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";

const S = STRINGS.MANUFACTURING.POST_CURE;

type PostCureFlowBarProps = {
  activeMotorId: string;
  draftMotorReceiptDate: string;
  canLoadForm: boolean;
  onDraftMotorReceiptDateChange: (value: string) => void;
  onLoadForm: () => void;
  theme: any;
};

const PostCureFlowBar = ({
  activeMotorId,
  draftMotorReceiptDate,
  canLoadForm,
  onDraftMotorReceiptDateChange,
  onLoadForm,
  theme,
}: PostCureFlowBarProps) => {
  const flowBar =
    theme.manufacturing?.postCure?.flowBar ?? theme.manufacturing?.casePreparation?.flowBar ?? {};

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
            justifyContent: "space-between",
          }}
        >
          <Box sx={flowBar.selectField?.(280)}>
            <Typography component="label" sx={flowBar.selectLabel}>
              <FieldLabelWithAsterisk label={S.MOTOR_RECEIVED_AT_LABEL} required />
            </Typography>
            <DateTimeField
              value={draftMotorReceiptDate}
              onChange={onDraftMotorReceiptDateChange}
              placeholder={S.MOTOR_RECEIVED_AT_PLACEHOLDER}
              compact
              sx={flowBar.selectInput?.(Boolean(draftMotorReceiptDate))}
            />
          </Box>

          <Button variant="contained" size="small" onClick={onLoadForm} disabled={!canLoadForm}>
            {S.LOAD_FORM}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default PostCureFlowBar;
