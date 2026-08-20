import { useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import getDispatchTheme, {
  DISPATCH_BRAND,
} from "../../../../app/theme/custom_themes/user/dispatch/dispatch_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { icons } from "../../../../app/theme/icons";
import { STRINGS } from "../../../../app/config/strings";
import type { DispatchDetailView } from "../../../../data/models/user/DispatchApiModel";
import { ReportPreviewDialog } from "../components/ReportPdf";
import DispatchApproverReviewContent from "./DispatchApproverReviewContent";

const {
  close: CloseRoundedIcon,
  localShipping: LocalShippingRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.dispatch.page;

const DISPATCH_ACCENT = {
  primary: DISPATCH_BRAND.primary,
  primaryLight: DISPATCH_BRAND.primaryLight,
};

export type DispatchApproverDetailItem = Record<string, unknown> & {
  formId?: string | null;
  batchId?: string | null;
  batchType?: string | null;
  status?: string | null;
  dispatchStatus?: string | null;
  detailView?: DispatchDetailView | null;
};

type DispatchApproverDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: DispatchApproverDetailItem | null;
  loading: boolean;
  activeMotorId?: string | null;
  onActiveMotorChange?: (motorId: string) => void;
  onApprove: (item: DispatchApproverDetailItem) => void;
  onReject: (item: DispatchApproverDetailItem) => void;
  actionLoading?: boolean;
  theme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const DispatchApproverDetailDialog = ({
  open,
  onClose,
  item,
  loading,
  activeMotorId = null,
  onActiveMotorChange,
  onApprove,
  onReject,
  actionLoading = false,
  theme,
}: DispatchApproverDetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const dispatchTheme = useMemo(
    () =>
      getDispatchTheme({
        palette: {
          primary: DISPATCH_ACCENT.primary,
          primaryLight: DISPATCH_ACCENT.primaryLight,
          accent: DISPATCH_BRAND.accent,
          danger: DISPATCH_BRAND.danger,
          warn: DISPATCH_BRAND.warn,
          border: DISPATCH_BRAND.border,
          text: DISPATCH_BRAND.text,
          textSub: DISPATCH_BRAND.textSub,
          surface: DISPATCH_BRAND.surface,
          pageBg: "#fff",
        },
      }),
    [],
  );
  const strings = STRINGS.DISPATCH;

  if (!item) return null;

  const detailView = item.detailView ?? null;

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
                {loading ? " · loading…" : activeMotorId ? ` · ${activeMotorId}` : ""}
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

        <DialogContent sx={theme.dialog.content}>
          <DispatchApproverReviewContent
            detailView={detailView}
            loading={loading}
            activeMotorId={activeMotorId}
            onActiveMotorChange={onActiveMotorChange ?? (() => undefined)}
            onApprove={() => onApprove(item)}
            onReject={() => onReject(item)}
            actionLoading={actionLoading}
            dispatchTheme={dispatchTheme}
            approverTheme={theme}
          />
        </DialogContent>

        <Box sx={theme.dialog.footer}>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={loading || actionLoading}
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
        department="dispatch"
        subDepartment="dispatch"
        dialogTitle={`${strings.TITLE} Report — ${item.batchId}`}
      />
    </>
  );
};

export default DispatchApproverDetailDialog;
