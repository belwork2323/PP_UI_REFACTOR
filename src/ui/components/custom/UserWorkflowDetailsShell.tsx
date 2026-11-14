import type { ElementType, ReactNode } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { OPERATION_STATUS } from "@hooks/operationStatus";
import UserWorkflowStatusCell from "./UserWorkflowStatusCell";

type DetailsThemeSlice = {
  page?: object;
  document?: object;
  banner?: object;
  bannerIcon?: object;
  bannerTitle?: object;
  bannerSubtitle?: object;
  body?: object;
  loadingBox?: object;
  emptyText?: object;
};

type UserWorkflowDetailsShellProps = {
  dt: DetailsThemeSlice;
  theme: any;
  title: string;
  subtitle?: string;
  icon: ElementType;
  status?: string | null;
  statusConfig: Record<string, any>;
  rejectionReason?: string | null;
  onBack: () => void;
  backLabel: string;
  loading?: boolean;
  loadingText?: string;
  children?: ReactNode;
};

/** Shared read-only details chrome: back + title/status banner + body. */
const UserWorkflowDetailsShell = ({
  dt,
  theme,
  title,
  subtitle,
  icon: Icon,
  status,
  statusConfig,
  rejectionReason = null,
  onBack,
  backLabel,
  loading = false,
  loadingText,
  children,
}: UserWorkflowDetailsShellProps) => (
  <Box sx={dt.page}>
    <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
      <Button
        variant="text"
        size="small"
        startIcon={<ArrowBackRoundedIcon />}
        onClick={onBack}
        sx={theme.workflow.formHeader.backButton}
      >
        {backLabel}
      </Button>
    </Stack>

    <Box sx={dt.document}>
      <Box sx={dt.banner}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          gap={2}
        >
          <Stack direction="row" alignItems="flex-start" gap={1.5}>
            <Icon sx={dt.bannerIcon} />
            <Box>
              <Typography sx={dt.bannerTitle}>{title}</Typography>
              {subtitle ? <Typography sx={dt.bannerSubtitle}>{subtitle}</Typography> : null}
            </Box>
          </Stack>
          <UserWorkflowStatusCell
            status={status ?? undefined}
            statusConfig={statusConfig}
            rejectedStatus={OPERATION_STATUS.REJECTED}
            rejectionReason={rejectionReason}
            theme={theme}
          />
        </Stack>
      </Box>

      <Box sx={dt.body}>
        {loading ? (
          <Box sx={dt.loadingBox}>
            <CircularProgress size={36} sx={{ color: theme.palette.primaryLight }} />
            {loadingText ? <Typography sx={dt.emptyText}>{loadingText}</Typography> : null}
          </Box>
        ) : (
          children
        )}
      </Box>
    </Box>
  </Box>
);

export default UserWorkflowDetailsShell;
