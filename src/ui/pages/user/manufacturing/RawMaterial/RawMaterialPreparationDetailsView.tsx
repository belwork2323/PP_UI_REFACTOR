import { useMemo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import GrainRoundedIcon from "@mui/icons-material/GrainRounded";
import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { STRINGS } from "../../../../../app/config/strings";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import {
  mapRawMaterialPreparationDetailsForDisplay,
  type RawMaterialPreparationDetails,
} from "../../../../../data/models/user/RawMaterialPreparationModel";
import RawMaterialPreparationDetailsContent from "./components/RawMaterialPreparationDetailsContent";

const FH = STRINGS.MANUFACTURING.FORM_HEADER;
const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
} = icons.user.manufacturing.rawMaterial.preparationList;

const STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

type RawMaterialPreparationDetailsViewProps = {
  row: Record<string, unknown>;
  data: RawMaterialPreparationDetails | null;
  loading: boolean;
  onBack: () => void;
};

const RawMaterialPreparationDetailsView = ({ row, data, loading, onBack }: RawMaterialPreparationDetailsViewProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const dt = theme.manufacturing.rawMaterialPrep.details;

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

  const { detailView, weightmentSheet } = useMemo(
    () => mapRawMaterialPreparationDetailsForDisplay(data),
    [data],
  );

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
              <GrainRoundedIcon sx={dt.bannerIcon} />
              <Box>
                <Typography sx={dt.bannerTitle}>{RM.TITLE}</Typography>
                <Typography sx={dt.bannerSubtitle}>
                  {detailView?.batchId || String(row?.batchId ?? "")}
                  {row?.material ? ` · ${String(row.material)}` : ""}
                </Typography>
              </Box>
            </Stack>
            <UserWorkflowStatusCell
              status={row?.rmStatus as string | undefined}
              statusConfig={statusConfig}
              rejectedStatus={OPERATION_STATUS.REJECTED}
              rejectionReason={(row?.rejectionReason as string | null) ?? null}
              theme={theme}
            />
          </Stack>
        </Box>

        <Box sx={dt.body}>
          <RawMaterialPreparationDetailsContent
            detailView={detailView}
            weightmentSheet={weightmentSheet}
            row={row}
            loading={loading}
            theme={theme}
            resetPremixOnFormId={data?.formId ?? null}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default RawMaterialPreparationDetailsView;
