import { useMemo, useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useThemeStore } from "../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { icons } from "../../../../app/theme/icons";
import { STRINGS } from "../../../../app/config/strings";
import type { QCDivisionDetailView } from "../../../../data/models/user/QualityControlFormModel";
import type { QualityControlFormState } from "../../../../data/models/user/QualityControlFormModel";
import type {
  QcApprovalTableRow,
  QcPartialItemStatus,
  QcPartialNavItem,
} from "../../../../hooks/user/qualityControl/qcDivisionApprovalUnits";
import { ReportPreviewDialog } from "../components/ReportPdf";
import QCDivisionApproverReviewContent from "./QCDivisionApproverReviewContent";

const {
  close: CloseRoundedIcon,
  factCheck: FactCheckRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.qualityControl.qcDivision;

const QC_ACCENT = {
  primary: "#1565C0",
  primaryLight: "#1976D2",
};

export type QCDivisionApproverDetailItem = Record<string, unknown> & {
  formId?: string | null;
  batchId?: string | null;
  motorId?: string | null;
  status?: string | null;
  qcDivStatus?: string | null;
};

type QCDivisionApproverDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: QCDivisionApproverDetailItem | null;
  detailView: QCDivisionDetailView | null;
  formData: QualityControlFormState;
  subDepartmentId?: number | null;
  loading: boolean;
  schemaLoading?: boolean;
  activeDivisionGroupIndex: number;
  activeDivisionSubIndex: number;
  onActiveDivisionGroupIndexChange: (index: number) => void;
  onActiveDivisionSubIndexChange: (index: number) => void;
  partialNavItems: QcPartialNavItem[];
  activePartialNavIndex: number;
  onActivePartialNavIndexChange: (index: number) => void;
  divisionStatusByFlowKey: Record<string, QcPartialItemStatus>;
  divisionApprovalRows: QcApprovalTableRow[];
  finalApprovalRows: QcApprovalTableRow[];
  canApproveForm: boolean;
  onApprove: (item: QCDivisionApproverDetailItem) => void;
  onReject: (item: QCDivisionApproverDetailItem) => void;
  onApproveForm: (item: QCDivisionApproverDetailItem) => void;
  onRejectForm: (item: QCDivisionApproverDetailItem) => void;
  actionLoading?: boolean;
  theme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const QCDivisionApproverDetailDialog = ({
  open,
  onClose,
  item,
  detailView,
  formData,
  subDepartmentId,
  loading,
  schemaLoading = false,
  activeDivisionGroupIndex,
  activeDivisionSubIndex,
  onActiveDivisionGroupIndexChange,
  onActiveDivisionSubIndexChange,
  partialNavItems,
  activePartialNavIndex,
  onActivePartialNavIndexChange,
  divisionStatusByFlowKey,
  divisionApprovalRows,
  finalApprovalRows,
  canApproveForm,
  onApprove,
  onReject,
  onApproveForm,
  onRejectForm,
  actionLoading = false,
  theme,
}: QCDivisionApproverDetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const qcTheme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const strings = STRINGS.QUALITY_CONTROL.QC_DIVISION;

  if (!item) return null;

  const rowStatus = String(item.qcDivStatus ?? item.status ?? detailView?.status ?? "");
  const divisionCount = detailView?.divisionCount ?? formData.divisionEntries?.length ?? 0;
  const unitLabel = partialNavItems[activePartialNavIndex]?.label;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            ...theme.dialog.paper,
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            ...theme.dialog.header,
            background: `linear-gradient(135deg, ${QC_ACCENT.primary}, ${QC_ACCENT.primaryLight})`,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <FactCheckRoundedIcon sx={theme.dialog.headerIcon} />
            <Box>
              <Typography sx={theme.dialog.headerTitle}>{strings.TITLE} Submission</Typography>
              <Typography sx={theme.dialog.headerSubtitle}>
                {item.batchId}
                {loading ? " · loading…" : item.formId ? ` · ${item.formId}` : ""}
                {!loading && unitLabel ? ` · ${unitLabel}` : ""}
                {!loading && divisionCount > 0
                  ? ` · ${divisionCount} division${divisionCount === 1 ? "" : "s"}`
                  : ""}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center">
            {loading ? <CircularProgress size={16} sx={{ color: alpha("#fff", 0.7) }} /> : null}
            <Button
              size="small"
              variant="contained"
              startIcon={<PictureAsPdfRoundedIcon sx={{ fontSize: "14px !important" }} />}
              onClick={() => setPdfOpen(true)}
              disabled={loading || !item.formId || actionLoading}
              sx={theme.dialog.pdfButton}
            >
              View as PDF
            </Button>
            <IconButton onClick={onClose} size="small" sx={theme.dialog.closeButton}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={{ ...theme.dialog.content, overflow: "auto" }}>
          <QCDivisionApproverReviewContent
            detailView={detailView}
            formData={formData}
            loading={loading}
            schemaLoading={schemaLoading}
            subDepartmentId={subDepartmentId}
            activeDivisionGroupIndex={activeDivisionGroupIndex}
            activeDivisionSubIndex={activeDivisionSubIndex}
            onActiveDivisionGroupIndexChange={onActiveDivisionGroupIndexChange}
            onActiveDivisionSubIndexChange={onActiveDivisionSubIndexChange}
            partialNavItems={partialNavItems}
            activePartialNavIndex={activePartialNavIndex}
            onActivePartialNavIndexChange={onActivePartialNavIndexChange}
            divisionStatusByFlowKey={divisionStatusByFlowKey}
            divisionApprovalRows={divisionApprovalRows}
            finalApprovalRows={finalApprovalRows}
            formStatus={rowStatus}
            formSubmissionType={detailView?.formSubmissionType}
            onApproveUnit={() => onApprove(item)}
            onRejectUnit={() => onReject(item)}
            onApproveForm={canApproveForm ? () => onApproveForm(item) : undefined}
            onRejectForm={canApproveForm ? () => onRejectForm(item) : undefined}
            actionLoading={actionLoading}
            qcTheme={qcTheme}
            approverTheme={theme}
          />
        </DialogContent>

        <Box sx={theme.dialog.footer}>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={loading || schemaLoading || actionLoading}
            sx={theme.dialog.closeAction}
          >
            Close
          </Button>
        </Box>
      </Dialog>

      <ReportPreviewDialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        formId={item.formId}
        department="qualityControl"
        subDepartment="qc-division"
        dialogTitle={`QC Division Report — ${item.batchId}`}
      />
    </>
  );
};

export default QCDivisionApproverDetailDialog;
