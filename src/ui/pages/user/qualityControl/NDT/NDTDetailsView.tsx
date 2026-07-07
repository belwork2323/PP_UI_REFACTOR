import { useMemo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { getNdtTheme } from "../../../../../app/theme/custom_themes/user/qualityControl/ndt_theme";
import { STRINGS } from "../../../../../app/config/strings";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import { mapNDTDetailsForDisplay } from "../../../../../data/models/user/NDTFormModel";
import { NDT_STATUS_CONFIG } from "./NDTList";
import NDTDetailsContent from "./components/NDTDetailsContent";

const FH = STRINGS.QUALITY_CONTROL.FORM_HEADER;
const NDT = STRINGS.QUALITY_CONTROL.NDT;

const { biotech: BiotechRoundedIcon } = icons.user.qualityControl.ndt.form;

type NDTDetailsViewProps = {
  row: Record<string, unknown>;
  data: Record<string, unknown> | null;
  loading: boolean;
  onBack: () => void;
};

const NDTDetailsView = ({ row, data, loading, onBack }: NDTDetailsViewProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const dt = useMemo(() => getNdtTheme(theme).details, [theme]);

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(NDT_STATUS_CONFIG).map(([status, cfg]) => [
          status,
          { ...cfg, ...dt.bannerStatusConfig[status] },
        ]),
      ),
    [dt],
  );

  const detailView = useMemo(() => mapNDTDetailsForDisplay(data), [data]);

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
              <BiotechRoundedIcon sx={dt.bannerIcon} />
              <Box>
                <Typography sx={dt.bannerTitle}>{NDT.TITLE}</Typography>
                <Typography sx={dt.bannerSubtitle}>
                  {detailView?.batchId || String(row?.batchId ?? "")}
                  {detailView?.formId ? ` · ${detailView.formId}` : ""}
                  {row?.batchType ? ` · ${String(row.batchType)}` : ""}
                </Typography>
              </Box>
            </Stack>
            <UserWorkflowStatusCell
              status={(row?.ndtStatus ?? row?.status) as string | undefined}
              statusConfig={statusConfig}
              rejectedStatus={OPERATION_STATUS.REJECTED}
              rejectionReason={(row?.rejectionReason as string | null) ?? null}
              theme={theme}
            />
          </Stack>
        </Box>

        <Box sx={dt.body}>
          <NDTDetailsContent
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

export default NDTDetailsView;
