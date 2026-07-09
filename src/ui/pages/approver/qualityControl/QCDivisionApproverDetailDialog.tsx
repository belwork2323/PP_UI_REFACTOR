import { useMemo, useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useThemeStore } from "../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { isApproverActionableStatus } from "../../../../app/theme/approver";
import { icons } from "../../../../app/theme/icons";
import { STRINGS } from "../../../../app/config/strings";
import type { QCDivisionDetailView } from "../../../../data/models/user/QualityControlFormModel";
import type { QualityControlFormState } from "../../../../data/models/user/QualityControlFormModel";
import { ReportPreviewDialog } from "../components/ReportPdf";
import QCDivisionDetailsContent from "../../user/qualityControl/QCDivision/components/QCDivisionDetailsContent";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
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
  onApprove: (item: QCDivisionApproverDetailItem) => void;
  onReject: (item: QCDivisionApproverDetailItem) => void;
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
  onApprove,
  onReject,
  theme,
}: QCDivisionApproverDetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const qcTheme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const strings = STRINGS.QUALITY_CONTROL.QC_DIVISION;

  if (!item) return null;

  const rowStatus = String(item.qcDivStatus ?? item.status ?? detailView?.status ?? "");
  const canApproveOrReject = isApproverActionableStatus(rowStatus);
  const divisionCount = detailView?.divisionCount ?? formData.divisionEntries?.length ?? 0;
  const actionableItem = { ...item, status: rowStatus, qcDivStatus: rowStatus };

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
              disabled={loading || !item.formId}
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
          <QCDivisionDetailsContent
            detailView={detailView}
            row={{
              ...item,
              status: rowStatus || detailView?.status,
              qcDivStatus: rowStatus || detailView?.status,
            }}
            formData={formData}
            subDepartmentId={subDepartmentId ?? undefined}
            loading={loading}
            schemaLoading={schemaLoading || loading}
            activeDivisionGroupIndex={activeDivisionGroupIndex}
            activeDivisionSubIndex={activeDivisionSubIndex}
            onActiveDivisionGroupIndexChange={onActiveDivisionGroupIndexChange}
            onActiveDivisionSubIndexChange={onActiveDivisionSubIndexChange}
            theme={qcTheme}
            resetOnFormId={detailView?.formId ?? item.formId ?? null}
          />
        </DialogContent>

        <Box sx={theme.dialog.footer}>
          <Button variant="outlined" onClick={onClose} disabled={loading || schemaLoading} sx={theme.dialog.closeAction}>
            Close
          </Button>
          {canApproveOrReject ? (
            <>
              <Button
                variant="contained"
                startIcon={<CancelRoundedIcon />}
                onClick={() => onReject(actionableItem)}
                disabled={loading || schemaLoading}
                sx={theme.dialog.rejectAction}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircleRoundedIcon />}
                onClick={() => onApprove(actionableItem)}
                disabled={loading || schemaLoading}
                sx={theme.dialog.approveAction}
              >
                Approve
              </Button>
            </>
          ) : null}
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
