import { useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { isApproverActionableStatus } from "../../../../app/theme/approver";
import { icons } from "../../../../app/theme/icons";
import { STRINGS } from "../../../../app/config/strings";
import type { DispatchDetailView } from "../../../../data/models/user/DispatchApiModel";
import { ReportPreviewDialog } from "../components/ReportPdf";
import DispatchDetailsContent from "../../user/dispatch/components/DispatchDetailsContent";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  close: CloseRoundedIcon,
  localShipping: LocalShippingRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.dispatch.page;

const DISPATCH_ACCENT = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
};

const dispatchDetailsTheme = {
  palette: {
    primary: DISPATCH_ACCENT.primary,
    primaryLight: DISPATCH_ACCENT.primaryLight,
    border: "#D5D8DC",
    text: "#1C2833",
    textSub: "#5D6D7E",
    surface: "#F4F6F8",
    pageBg: "#fff",
  },
};

export type DispatchApproverDetailItem = Record<string, unknown> & {
  formId?: string | null;
  batchId?: string | null;
  batchType?: string | null;
  status?: string | null;
  dispatchStatus?: string | null;
};

type DispatchApproverDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: DispatchApproverDetailItem | null;
  detailView: DispatchDetailView | null;
  loading: boolean;
  onApprove: (item: DispatchApproverDetailItem) => void;
  onReject: (item: DispatchApproverDetailItem) => void;
  theme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const DispatchApproverDetailDialog = ({
  open,
  onClose,
  item,
  detailView,
  loading,
  onApprove,
  onReject,
  theme,
}: DispatchApproverDetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const strings = STRINGS.DISPATCH;

  if (!item) return null;

  const rowStatus = String(item.dispatchStatus ?? item.status ?? detailView?.status ?? "");
  const canApproveOrReject = isApproverActionableStatus(rowStatus);
  const motorIds = (detailView?.motors ?? []).map((motor) => motor.motorId).filter(Boolean);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{ sx: { ...theme.dialog.paper, maxHeight: "92vh" } }}
      >
        <Box
          sx={{
            ...theme.dialog.header,
            background: `linear-gradient(135deg, ${DISPATCH_ACCENT.primary}, ${DISPATCH_ACCENT.primaryLight})`,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <LocalShippingRoundedIcon sx={theme.dialog.headerIcon} />
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
          <DispatchDetailsContent
            detailView={detailView}
            row={{
              ...item,
              status: rowStatus || detailView?.status,
              dispatchStatus: rowStatus || detailView?.status,
            }}
            loading={loading}
            theme={dispatchDetailsTheme}
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
                sx={{
                  ...theme.dialog.approveAction,
                  background: `linear-gradient(135deg, ${DISPATCH_ACCENT.primary}, ${DISPATCH_ACCENT.primaryLight})`,
                  "&:hover": {
                    background: DISPATCH_ACCENT.primary,
                  },
                }}
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
        department="dispatch"
        subDepartment="dispatch"
        dialogTitle={`${strings.TITLE} Report — ${item.batchId}`}
      />
    </>
  );
};

export default DispatchApproverDetailDialog;
