import { useMemo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { getQcDivisionTheme } from "../../../../../app/theme/custom_themes/user/qualityControl/qc_division_theme";
import { STRINGS } from "../../../../../app/config/strings";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import UserWorkflowStatusCell from "../../../../components/custom/UserWorkflowStatusCell";
import { mapQCDivisionDetailsForDisplay } from "../../../../../data/models/user/QualityControlFormModel";
import type { QualityControlFormState } from "../../../../../data/models/user/QualityControlFormModel";
import { QC_DIV_STATUS_CONFIG } from "./QCDivisionList";
import QCDivisionDetailsContent from "./components/QCDivisionDetailsContent";

const FH = STRINGS.QUALITY_CONTROL.FORM_HEADER;
const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

const { science: ScienceRoundedIcon } = icons.user.qualityControl.qcDivision.form;

type QCDivisionDetailsViewProps = {
  row: Record<string, unknown>;
  data: Record<string, unknown> | null;
  formData: QualityControlFormState;
  subDepartmentId?: number;
  loading: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  activeDivisionGroupIndex: number;
  activeDivisionSubIndex: number;
  onActiveDivisionGroupIndexChange: (index: number) => void;
  onActiveDivisionSubIndexChange: (index: number) => void;
  onBack: () => void;
};

const QCDivisionDetailsView = ({
  row,
  data,
  formData,
  subDepartmentId,
  loading,
  schemaLoading = false,
  schemaError = null,
  activeDivisionGroupIndex,
  activeDivisionSubIndex,
  onActiveDivisionGroupIndexChange,
  onActiveDivisionSubIndexChange,
  onBack,
}: QCDivisionDetailsViewProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const dt = useMemo(() => getQcDivisionTheme(theme).details, [theme]);

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(QC_DIV_STATUS_CONFIG).map(([status, cfg]) => [
          status,
          { ...cfg, ...dt.bannerStatusConfig[status] },
        ]),
      ),
    [dt],
  );

  const detailView = useMemo(() => mapQCDivisionDetailsForDisplay(data), [data]);

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
              <ScienceRoundedIcon sx={dt.bannerIcon} />
              <Box>
                <Typography sx={dt.bannerTitle}>{S.TITLE}</Typography>
                <Typography sx={dt.bannerSubtitle}>
                  {detailView?.batchId || String(row?.batchId ?? "")}
                  {detailView?.formId ? ` · ${detailView.formId}` : ""}
                </Typography>
              </Box>
            </Stack>
            <UserWorkflowStatusCell
              status={(row?.qcDivStatus ?? row?.status) as string | undefined}
              statusConfig={statusConfig}
              rejectedStatus={OPERATION_STATUS.REJECTED}
              rejectionReason={(row?.rejectionReason as string | null) ?? null}
              theme={theme}
            />
          </Stack>
        </Box>

        <Box sx={dt.body}>
          <QCDivisionDetailsContent
            detailView={detailView}
            row={row}
            formData={formData}
            subDepartmentId={subDepartmentId}
            loading={loading}
            schemaLoading={schemaLoading}
            schemaError={schemaError}
            activeDivisionGroupIndex={activeDivisionGroupIndex}
            activeDivisionSubIndex={activeDivisionSubIndex}
            onActiveDivisionGroupIndexChange={onActiveDivisionGroupIndexChange}
            onActiveDivisionSubIndexChange={onActiveDivisionSubIndexChange}
            theme={theme}
            resetOnFormId={detailView?.formId ?? null}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default QCDivisionDetailsView;
