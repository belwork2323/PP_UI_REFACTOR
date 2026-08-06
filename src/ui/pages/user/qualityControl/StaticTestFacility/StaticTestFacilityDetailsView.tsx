import { useMemo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { getStfTheme } from "../../../../../app/theme/custom_themes/user/qualityControl/stf_theme";
import { STRINGS } from "../../../../../app/config/strings";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import { mapBemDetailsForDisplay, mapStfDetailsForDisplay } from "../../../../../data/models/user/StaticTestFacilityApiModel";
import { STF_STATUS_CONFIG } from "./StaticTestFacilityList";
import STFDetailsContent from "./components/STFDetailsContent";

const FH = STRINGS.QUALITY_CONTROL.FORM_HEADER;
const STF = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;

const { rocketLaunch: RocketLaunchRoundedIcon } = icons.user.qualityControl.staticTestFacility.form;

type STFDetailsViewProps = {
  row: Record<string, unknown>;
  data: Record<string, unknown> | null;
  loading: boolean;
  onBack: () => void;
};

const StaticTestFacilityDetailsView = ({ row, data, loading, onBack }: STFDetailsViewProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const dt = useMemo(() => getStfTheme(theme).details, [theme]);

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(STF_STATUS_CONFIG).map(([status, cfg]) => [
          status,
          { ...cfg, ...dt.bannerStatusConfig[status] },
        ]),
      ),
    [dt],
  );

  const detailView = useMemo(() => {
    if (!data) return null;
    const root = data as Record<string, unknown>;
    const isBemMotor =
      String(root.subType ?? "").toUpperCase() === "BEM" &&
      !Array.isArray(root.motors) &&
      Boolean(root.staticTestingDetails ?? root.motorId);
    return isBemMotor ? mapBemDetailsForDisplay(root) : mapStfDetailsForDisplay(data);
  }, [data]);

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
              <RocketLaunchRoundedIcon sx={dt.bannerIcon} />
              <Box>
                <Typography sx={dt.bannerTitle}>{STF.TITLE}</Typography>
                <Typography sx={dt.bannerSubtitle}>
                  {detailView?.batchType === "BEM"
                    ? [
                        detailView.bemNo ? `BEM No: ${detailView.bemNo}` : null,
                        detailView.stfTestNo ? `${STF.STF_TEST_NO_LABEL}: ${detailView.stfTestNo}` : null,
                      ]
                        .filter(Boolean)
                        .join("   ·   ") || "BEM Motor Details"
                    : [
                        detailView?.batchId || String(row?.batchId ?? ""),
                        detailView?.formId || null,
                        row?.batchType ? String(row.batchType) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                </Typography>
              </Box>
            </Stack>
            <UserWorkflowStatusCell
              status={(row?.stfStatus ?? row?.status) as string | undefined}
              statusConfig={statusConfig}
              rejectedStatus={OPERATION_STATUS.REJECTED}
              rejectionReason={(row?.rejectionReason as string | null) ?? null}
              theme={theme}
            />
          </Stack>
        </Box>

        <Box sx={dt.body}>
          <STFDetailsContent
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

export default StaticTestFacilityDetailsView;
