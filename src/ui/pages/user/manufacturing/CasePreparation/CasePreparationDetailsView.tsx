import { useMemo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CleaningServicesRoundedIcon from "@mui/icons-material/CleaningServicesRounded";
import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { STRINGS } from "../../../../../app/config/strings";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import { mapCasePreparationDetailsForDisplay } from "../../../../../data/models/user/CasePreparationFormModel";
import type { SchemaDocumentV2 } from "../../../../../schema-engine";
import CasePreparationDetailsContent from "./components/CasePreparationDetailsContent";

const FH = STRINGS.MANUFACTURING.FORM_HEADER;

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
} = icons.user.manufacturing.casePreparation.list;

const STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

type CasePreparationDetailsViewProps = {
  row: Record<string, unknown>;
  data: Record<string, unknown> | null;
  schema?: SchemaDocumentV2 | null;
  loading: boolean;
  onBack: () => void;
};

const CasePreparationDetailsView = ({ row, data, schema, loading, onBack }: CasePreparationDetailsViewProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getManufacturingTheme(mode), [mode]);
  const dt = theme.manufacturing.casePreparation.details;

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

  const detailView = useMemo(
    () =>
      mapCasePreparationDetailsForDisplay(data, schema, {
        preferredMotorIds: Array.isArray(row.motorIds) ? (row.motorIds as Array<string | number>) : null,
      }),
    [data, row.motorIds, schema],
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
              <CleaningServicesRoundedIcon sx={dt.bannerIcon} />
              <Box>
                <Typography sx={dt.bannerTitle}>{STRINGS.MANUFACTURING.CASE_PREP.TITLE}</Typography>
                <Typography sx={dt.bannerSubtitle}>
                  {detailView?.batchId || String(row?.batchId ?? "")}
                  {row?.batchType ? ` · ${String(row.batchType)}` : ""}
                </Typography>
              </Box>
            </Stack>
            <UserWorkflowStatusCell
              status={(row?.cpStatus ?? row?.status) as string | undefined}
              statusConfig={statusConfig}
              rejectedStatus={OPERATION_STATUS.REJECTED}
              rejectionReason={(row?.rejectionReason as string | null) ?? null}
              theme={theme}
            />
          </Stack>
        </Box>

        <Box sx={dt.body}>
          <CasePreparationDetailsContent
            detailView={detailView}
            row={row}
            loading={loading}
            theme={theme}
            resetMotorOnFormId={detailView?.formId ?? null}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default CasePreparationDetailsView;
