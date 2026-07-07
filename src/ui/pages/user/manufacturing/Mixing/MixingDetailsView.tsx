import { useMemo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getMixingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import { STRINGS } from "../../../../../app/config/strings";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import { mapMixingDetailsForDisplay } from "../../../../../data/models/user/MixingFormModel";
import MixingDetailsContent from "./components/MixingDetailsContent";

const FH = STRINGS.MANUFACTURING.FORM_HEADER;
const S = STRINGS.MANUFACTURING.MIXING;

const { blender: BlenderRoundedIcon } = icons.user.manufacturing.mixing.form;

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
} = icons.user.manufacturing.mixing.list;

const STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

type MixingDetailsViewProps = {
  row: Record<string, unknown>;
  data: Record<string, unknown> | null;
  loading?: boolean;
  onBack: () => void;
};

const MixingDetailsView = ({ row, data, loading = false, onBack }: MixingDetailsViewProps) => {
  const mode = useThemeStore((state) => state.mode);
  const manufacturingTheme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const dt = useMemo(() => getMixingTheme(manufacturingTheme).details, [manufacturingTheme]);

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

  const detailView = useMemo(() => mapMixingDetailsForDisplay(data), [data]);

  return (
    <Box sx={dt.page}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2}>
        <Button
          variant="text"
          size="small"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={onBack}
          sx={manufacturingTheme.workflow.formHeader.backButton}
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
              <BlenderRoundedIcon sx={dt.bannerIcon} />
              <Box>
                <Typography sx={dt.bannerTitle}>{S.FORM_TITLE}</Typography>
                <Typography sx={dt.bannerSubtitle}>
                  {detailView?.batchId || String(row?.batchId ?? "")}
                  {detailView?.formId ? ` · ${detailView.formId}` : ""}
                </Typography>
              </Box>
            </Stack>
            <UserWorkflowStatusCell
              status={(row?.mxStatus ?? row?.status) as string | undefined}
              statusConfig={statusConfig}
              rejectedStatus={OPERATION_STATUS.REJECTED}
              rejectionReason={(row?.rejectionReason as string | null) ?? null}
              theme={manufacturingTheme}
            />
          </Stack>
        </Box>

        <Box sx={dt.body}>
          <MixingDetailsContent
            detailView={detailView}
            row={row}
            loading={loading}
            manufacturingTheme={manufacturingTheme}
            resetOnFormId={detailView?.formId ?? null}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default MixingDetailsView;
