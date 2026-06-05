import type { ReactNode } from "react";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

type BatchInfo = {
  lotId: string;
  batchId: string;
  motorId: string;
  motorType?: string;
  priority: string;
  rejectionReason?: string | null;
};

type UserWorkflowFormHeaderProps = {
  batch: BatchInfo;
  isEdit: boolean;
  onBack: () => void;
  newLabel: string;
  /** When set, replaces the batchId · motorId line (raw material Create Lot, etc.) */
  batchHeadingOverride?: { title: string; subtitle?: string };
  includeMotorType?: boolean;
  backLabel?: string;
  editLabel?: string;
  rejectionTitle?: string;
  additionalChips?: ReactNode;
  /** Rendered below batch title, above status chips (e.g. Main Scale / Sub Scale banner). */
  headerBanner?: ReactNode;
  footerContent?: ReactNode;
  headerContentSx?: any;
  theme: any;
};

const UserWorkflowFormHeader = ({
  batch,
  isEdit,
  onBack,
  newLabel,
  batchHeadingOverride,
  includeMotorType = false,
  backLabel = "Back to List",
  editLabel = "Editing Rejected Submission",
  rejectionTitle = "Rejection Reason",
  additionalChips,
  headerBanner,
  footerContent,
  headerContentSx,
  theme,
}: UserWorkflowFormHeaderProps) => {
  return (
    <Box sx={theme.workflow.formHeader.container(isEdit)}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} gap={2} justifyContent="space-between" sx={headerContentSx}>
        <Stack direction="row" alignItems="center" gap={2}>
          <Button
            variant="text"
            size="small"
            startIcon={<ArrowBackRoundedIcon />}
            onClick={onBack}
            sx={theme.workflow.formHeader.backButton}
          >
            {backLabel}
          </Button>

          <Divider orientation="vertical" flexItem sx={theme.workflow.formHeader.divider} />

          <Stack gap={0.3}>
            {batchHeadingOverride ? (
              <Stack gap={0.25}>
                <Typography sx={theme.workflow.formHeader.batchId}>{batchHeadingOverride.title}</Typography>
                {batchHeadingOverride.subtitle ? (
                  <Typography sx={theme.workflow.formHeader.motorId}>{batchHeadingOverride.subtitle}</Typography>
                ) : null}
              </Stack>
            ) : (
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography sx={theme.workflow.formHeader.batchId}>{batch.lotId}</Typography>
                <Typography sx={theme.workflow.formHeader.bullet}>.</Typography>
                <Typography sx={theme.workflow.formHeader.motorId}>{batch.motorId}</Typography>
              </Stack>
            )}
            {headerBanner}
            <Stack direction="row" alignItems="center" gap={0.8} flexWrap="wrap">
              {isEdit ? (
                <Chip
                  icon={<EditRoundedIcon sx={{ fontSize: "12px !important", color: `${theme.palette.danger} !important` }} />}
                  label={editLabel}
                  size="small"
                  sx={theme.workflow.formHeader.chips.edit}
                />
              ) : (
                <Chip label={newLabel} size="small" sx={theme.workflow.formHeader.chips.new} />
              )}
              {includeMotorType && (
                <Chip
                  label={`Motor Type ${batch.motorType ?? "-"}`}
                  size="small"
                  sx={theme.workflow.formHeader.chips.motorType}
                />
              )}
              <Chip label={`Priority: ${batch.priority}`} size="small" sx={theme.workflow.formHeader.chips.priority} />
              {additionalChips}
            </Stack>
          </Stack>
        </Stack>

        {isEdit && batch.rejectionReason && (
          <Box sx={theme.workflow.formHeader.rejectionBox}>
            <Typography sx={theme.workflow.formHeader.rejectionTitle}>{rejectionTitle}</Typography>
            <Typography sx={theme.workflow.formHeader.rejectionText}>{batch.rejectionReason}</Typography>
          </Box>
        )}
      </Stack>

      {footerContent}
    </Box>
  );
};

export default UserWorkflowFormHeader;
