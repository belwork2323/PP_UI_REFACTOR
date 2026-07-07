import { useMemo, useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useThemeStore } from "../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { TRIMMING_BRAND } from "../../../../app/theme/custom_themes/user/manufacturing/trimming_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { isApproverActionableStatus } from "../../../../app/theme/approver";
import { icons } from "../../../../app/theme/icons";
import type { TrimmingDetailView } from "../../../../data/models/user/TrimmingFormModel";
import { ReportPreviewDialog } from "../components/ReportPdf";
import TrimmingDetailsContent from "../../user/manufacturing/Trimming/components/TrimmingDetailsContent";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  close: CloseRoundedIcon,
  straighten: StraightenRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.manufacturing.trimming;

export type TrimmingApproverDetailItem = Record<string, unknown> & {
  formId?: string | null;
  batchId?: string | null;
  status?: string | null;
  trStatus?: string | null;
};

type TrimmingApproverDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: TrimmingApproverDetailItem | null;
  detailView: TrimmingDetailView | null;
  loading: boolean;
  onApprove: (item: TrimmingApproverDetailItem) => void;
  onReject: (item: TrimmingApproverDetailItem) => void;
  theme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const TrimmingApproverDetailDialog = ({
  open,
  onClose,
  item,
  detailView,
  loading,
  onApprove,
  onReject,
  theme,
}: TrimmingApproverDetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const manufacturingTheme = useMemo(() => getManufacturingTheme(mode), [mode]);

  if (!item) return null;

  const rowStatus = String(item.trStatus ?? item.status ?? detailView?.status ?? "");
  const canApproveOrReject = isApproverActionableStatus(rowStatus);
  const motorIds = (detailView?.motors ?? []).map((motor) => motor.motorId).filter(Boolean);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: theme.dialog.paper }}>
        <Box
          sx={{
            ...theme.dialog.header,
            background: `linear-gradient(135deg, ${TRIMMING_BRAND.tr}, ${TRIMMING_BRAND.trLight})`,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <StraightenRoundedIcon sx={theme.dialog.headerIcon} />
            <Box>
              <Typography sx={theme.dialog.headerTitle}>Trimming Submission</Typography>
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
          <TrimmingDetailsContent
            detailView={detailView}
            row={{
              ...item,
              status: rowStatus || detailView?.status,
              trStatus: rowStatus || detailView?.status,
            }}
            loading={loading}
            theme={manufacturingTheme}
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
        department="manufacturing"
        subDepartment="trimming"
        dialogTitle={`Trimming Report — ${item.batchId}`}
      />
    </>
  );
};

export default TrimmingApproverDetailDialog;
