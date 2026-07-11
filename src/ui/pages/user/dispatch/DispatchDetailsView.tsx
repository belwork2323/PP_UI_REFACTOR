import { useMemo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { icons } from "../../../../app/theme/icons";
import getDispatchTheme from "../../../../app/theme/custom_themes/user/dispatch/dispatch_theme";
import { STRINGS } from "../../../../app/config/strings";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../hooks/operationStatus";
import UserWorkflowStatusCell from "../../../components/custom/UserWorkflowStatusCell";
import { mapDispatchDetailsForDisplay } from "../../../../data/models/user/DispatchApiModel";
import { DISPATCH_STATUS_CONFIG } from "./DispatchList";
import DispatchDetailsContent from "./components/DispatchDetailsContent";

const FH = STRINGS.QUALITY_CONTROL.FORM_HEADER;
const D = STRINGS.DISPATCH;

const { localShipping: LocalShippingRoundedIcon } = icons.user.dispatch.form;

const dispatchPageTheme = {
  palette: {
    primary: "#1B4F72",
    primaryLight: "#2E86C1",
    success: "#0E6655",
    danger: "#C0392B",
    warning: "#D4AC0D",
    border: "#D5D8DC",
    text: "#1C2833",
    textSub: "#5D6D7E",
    surface: "#F4F6F8",
    pageBg: "#fff",
  },
  workflow: {
    formHeader: {
      backButton: {
        fontWeight: 700,
        fontSize: "0.78rem",
        textTransform: "none",
        color: "#5D6D7E",
        px: 1.5,
        py: 0.8,
        borderRadius: 2,
        flexShrink: 0,
        "&:hover": {
          background: "rgba(213,216,220,0.5)",
          color: "#1C2833",
        },
      },
    },
  },
};

type DispatchDetailsViewProps = {
  row: Record<string, unknown>;
  data: Record<string, unknown> | null;
  loading: boolean;
  onBack: () => void;
};

const DispatchDetailsView = ({ row, data, loading, onBack }: DispatchDetailsViewProps) => {
  const theme = dispatchPageTheme;
  const dt = useMemo(() => getDispatchTheme(theme).details, []);

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(DISPATCH_STATUS_CONFIG).map(([status, cfg]) => [
          status,
          { ...cfg, ...dt.bannerStatusConfig[status] },
        ]),
      ),
    [dt],
  );

  const detailView = useMemo(() => mapDispatchDetailsForDisplay(data), [data]);

  return (
    <Box sx={dt.page}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
        <Button
          variant="text"
          size="small"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={onBack}
          sx={theme.workflow.formHeader.backButton}
        >
          {FH.BACK_TO_LIST}
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
              <LocalShippingRoundedIcon sx={dt.bannerIcon} />
              <Box>
                <Typography sx={dt.bannerTitle}>{D.TITLE}</Typography>
                <Typography sx={dt.bannerSubtitle}>
                  {detailView?.batchId || String(row?.batchId ?? "")}
                  {detailView?.formId ? ` · ${detailView.formId}` : ""}
                  {row?.batchType ? ` · ${String(row.batchType)}` : ""}
                </Typography>
              </Box>
            </Stack>
            <UserWorkflowStatusCell
              status={(row?.dispatchStatus ?? row?.status) as string | undefined}
              statusConfig={statusConfig}
              rejectedStatus={OPERATION_STATUS.REJECTED}
              rejectionReason={(row?.rejectionReason as string | null) ?? null}
              theme={theme}
            />
          </Stack>
        </Box>

        <Box sx={dt.body}>
          <DispatchDetailsContent
            detailView={detailView}
            row={row}
            loading={loading}
            theme={theme}
            resetOnFormId={detailView?.formId ?? null}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default DispatchDetailsView;
