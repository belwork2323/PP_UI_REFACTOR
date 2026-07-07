import { useMemo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getTrimmingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/trimming_theme";
import { STRINGS } from "../../../../../app/config/strings";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import { mapTrimmingDetailsForDisplay } from "../../../../../data/models/user/TrimmingFormModel";
import TrimmingDetailsContent from "./components/TrimmingDetailsContent";

const FH = STRINGS.MANUFACTURING.FORM_HEADER;
const TR = STRINGS.MANUFACTURING.TRIMMING;

const { straighten: StraightenRoundedIcon } = icons.user.manufacturing.trimming.form;

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
} = icons.user.manufacturing.trimming.list;

const STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

type TrimmingDetailsViewProps = {
  row: Record<string, unknown>;
  data: Record<string, unknown> | null;
  loading: boolean;
  onBack: () => void;
};

const TrimmingDetailsView = ({ row, data, loading, onBack }: TrimmingDetailsViewProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const dt = useMemo(() => getTrimmingTheme(theme).details, [theme]);

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(STATUS_CONFIG).map(([status, cfg]) => [
          status,
          { ...cfg, ...dt.bannerStatusConfig[status] },
        ]),
      ),
    [dt],
  );

  const detailView = useMemo(() => mapTrimmingDetailsForDisplay(data), [data]);

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
              <StraightenRoundedIcon sx={dt.bannerIcon} />
              <Box>
                <Typography sx={dt.bannerTitle}>{TR.TITLE}</Typography>
                <Typography sx={dt.bannerSubtitle}>
                  {detailView?.batchId || String(row?.batchId ?? "")}
                  {detailView?.formId ? ` · ${detailView.formId}` : ""}
                  {row?.batchType ? ` · ${String(row.batchType)}` : ""}
                </Typography>
              </Box>
            </Stack>
            <UserWorkflowStatusCell
              status={(row?.trStatus ?? row?.status) as string | undefined}
              statusConfig={statusConfig}
              rejectedStatus={OPERATION_STATUS.REJECTED}
              rejectionReason={(row?.rejectionReason as string | null) ?? null}
              theme={theme}
            />
          </Stack>
        </Box>

        <Box sx={dt.body}>
          <TrimmingDetailsContent
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

export default TrimmingDetailsView;
