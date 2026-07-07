import { useMemo, useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useThemeStore } from "../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { SUBSCALE_BRAND } from "../../../../app/theme/custom_themes/user/manufacturing/subscale_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { isApproverActionableStatus } from "../../../../app/theme/approver";
import { icons } from "../../../../app/theme/icons";
import type { SubscaleDetailView } from "../../../../data/models/user/SubscaleFormModel";
import { ReportPreviewDialog } from "../components/ReportPdf";
import SubscaleDetailsContent from "../../user/manufacturing/Subscale/components/SubscaleDetailsContent";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  close: CloseRoundedIcon,
  scale: ScaleRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.manufacturing.subscale;

export type SubscaleApproverDetailItem = Record<string, unknown> & {
  formId?: string | null;
  batchId?: string | null;
  status?: string | null;
  ssStatus?: string | null;
};

type SubscaleApproverDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: SubscaleApproverDetailItem | null;
  detailView: SubscaleDetailView | null;
  loading: boolean;
  onApprove: (item: SubscaleApproverDetailItem) => void;
  onReject: (item: SubscaleApproverDetailItem) => void;
  theme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const SubscaleApproverDetailDialog = ({
  open,
  onClose,
  item,
  detailView,
  loading,
  onApprove,
  onReject,
  theme,
}: SubscaleApproverDetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const manufacturingTheme = useMemo(() => getManufacturingTheme(mode), [mode]);

  if (!item) return null;

  const rowStatus = String(item.ssStatus ?? item.status ?? detailView?.status ?? "");
  const canApproveOrReject = isApproverActionableStatus(rowStatus);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: theme.dialog.paper }}>
        <Box
          sx={{
            ...theme.dialog.header,
            background: `linear-gradient(135deg, ${SUBSCALE_BRAND.ss}, ${SUBSCALE_BRAND.ssLight})`,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <ScaleRoundedIcon sx={theme.dialog.headerIcon} />
            <Box>
              <Typography sx={theme.dialog.headerTitle}>Subscale Submission</Typography>
              <Typography sx={theme.dialog.headerSubtitle}>
                {item.batchId}
                {loading ? " · loading…" : item.formId ? ` · ${item.formId}` : ""}
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
          <SubscaleDetailsContent
            detailView={detailView}
            row={{
              ...item,
              status: rowStatus || detailView?.status,
              ssStatus: rowStatus || detailView?.status,
            }}
            loading={loading}
            theme={manufacturingTheme}
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
        subDepartment="subscale"
        dialogTitle={`Subscale Report — ${item.batchId}`}
      />
    </>
  );
};

export default SubscaleApproverDetailDialog;
