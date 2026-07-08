import { useMemo, useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useThemeStore } from "../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { isApproverActionableStatus } from "../../../../app/theme/approver";
import { icons } from "../../../../app/theme/icons";
import { STRINGS } from "../../../../app/config/strings";
import type { NDTDetailView } from "../../../../data/models/user/NDTFormModel";
import { ReportPreviewDialog } from "../components/ReportPdf";
import NDTDetailsContent from "../../user/qualityControl/NDT/components/NDTDetailsContent";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  close: CloseRoundedIcon,
  radar: RadarRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.qualityControl.ndt;

const NDT_ACCENT = {
  primary: "#1565C0",
  primaryLight: "#1976D2",
};

export type NDTApproverDetailItem = Record<string, unknown> & {
  formId?: string | null;
  batchId?: string | null;
  batchType?: string | null;
  status?: string | null;
  ndtStatus?: string | null;
};

type NDTApproverDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: NDTApproverDetailItem | null;
  detailView: NDTDetailView | null;
  loading: boolean;
  onApprove: (item: NDTApproverDetailItem) => void;
  onReject: (item: NDTApproverDetailItem) => void;
  theme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const NDTApproverDetailDialog = ({
  open,
  onClose,
  item,
  detailView,
  loading,
  onApprove,
  onReject,
  theme,
}: NDTApproverDetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const qcTheme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const strings = STRINGS.QUALITY_CONTROL.NDT;

  if (!item) return null;

  const rowStatus = String(item.ndtStatus ?? item.status ?? detailView?.status ?? "");
  const canApproveOrReject = isApproverActionableStatus(rowStatus);
  const motorIds = (detailView?.motors ?? []).map((motor) => motor.motorId).filter(Boolean);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: theme.dialog.paper }}>
        <Box
          sx={{
            ...theme.dialog.header,
            background: `linear-gradient(135deg, ${NDT_ACCENT.primary}, ${NDT_ACCENT.primaryLight})`,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <RadarRoundedIcon sx={theme.dialog.headerIcon} />
            <Box>
              <Typography sx={theme.dialog.headerTitle}>{strings.TITLE} Submission</Typography>
              <Typography sx={theme.dialog.headerSubtitle}>
                {item.batchId}
                {loading ? " · loading…" : item.formId ? ` · ${item.formId}` : ""}
                {!loading && motorIds.length > 0
                  ? ` · ${motorIds.length} motor${motorIds.length === 1 ? "" : "s"}`
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

        <DialogContent sx={theme.dialog.content}>
          <NDTDetailsContent
            detailView={detailView}
            row={{
              ...item,
              status: rowStatus || detailView?.status,
              ndtStatus: rowStatus || detailView?.status,
            }}
            loading={loading}
            theme={qcTheme}
            resetOnFormId={detailView?.formId ?? item.formId ?? null}
          />
        </DialogContent>

        <Box sx={theme.dialog.footer}>
          <Button variant="outlined" onClick={onClose} disabled={loading} sx={theme.dialog.closeAction}>
            Close
          </Button>
          {canApproveOrReject ? (
            <>
              <Button
                variant="contained"
                startIcon={<CancelRoundedIcon />}
                onClick={() => onReject(item)}
                disabled={loading}
                sx={theme.dialog.rejectAction}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircleRoundedIcon />}
                onClick={() => onApprove(item)}
                disabled={loading}
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
        subDepartment="ndt"
        dialogTitle={`${strings.TITLE} Report — ${item.batchId}`}
      />
    </>
  );
};

export default NDTApproverDetailDialog;
