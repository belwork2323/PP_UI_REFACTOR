import { useMemo, useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";

import { useThemeStore } from "../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { icons } from "../../../../app/theme/icons";
import type { TrimmingDetailView } from "../../../../data/models/user/TrimmingFormModel";
import { ReportPreviewDialog } from "../components/ReportPdf";
import TrimmingApproverReviewContent from "./TrimmingApproverReviewContent";

const {
  close: CloseRoundedIcon,
  straighten: StraightenRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.manufacturing.trimming;

export type TrimmingApproverDetailItem = Record<string, unknown> & {
  formId?: string | null;
  batchId?: string | null;
  motorId?: string | null;
  status?: string | null;
  trStatus?: string | null;
  detailView?: TrimmingDetailView | null;
};

type TrimmingApproverDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: TrimmingApproverDetailItem | null;
  loading: boolean;
  activeMotorId?: string | null;
  onActiveMotorChange?: (motorId: string) => void;
  onApprove: (item: TrimmingApproverDetailItem) => void;
  onReject: (item: TrimmingApproverDetailItem) => void;
  onApproveForm?: (item: TrimmingApproverDetailItem) => void;
  onRejectForm?: (item: TrimmingApproverDetailItem) => void;
  actionLoading?: boolean;
  theme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const TrimmingApproverDetailDialog = ({
  open,
  onClose,
  item,
  loading,
  activeMotorId = null,
  onActiveMotorChange,
  onApprove,
  onReject,
  onApproveForm,
  onRejectForm,
  actionLoading = false,
  theme,
}: TrimmingApproverDetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const manufacturingTheme = useMemo(() => getManufacturingTheme(mode), [mode]);

  if (!item) return null;

  const detailView = item.detailView ?? null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: theme.dialog.paper }}>
        <Box sx={theme.dialog.header}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <StraightenRoundedIcon sx={theme.dialog.headerIcon} />
            <Box>
              <Typography sx={theme.dialog.headerTitle}>Trimming Submission</Typography>
              <Typography sx={theme.dialog.headerSubtitle}>
                {item.batchId}
                {loading ? " · loading…" : activeMotorId ? ` · ${activeMotorId}` : ""}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center">
            {loading ? <CircularProgress size={16} sx={{ color: theme.dialog.headerIcon.color }} /> : null}
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
          <TrimmingApproverReviewContent
            detailView={detailView}
            loading={loading}
            activeMotorId={activeMotorId}
            onActiveMotorChange={onActiveMotorChange ?? (() => undefined)}
            onApprove={() => onApprove(item)}
            onReject={() => onReject(item)}
            onApproveForm={onApproveForm ? () => onApproveForm(item) : undefined}
            onRejectForm={onRejectForm ? () => onRejectForm(item) : undefined}
            actionLoading={actionLoading}
            formStatus={String(item.trStatus ?? item.status ?? "")}
            manufacturingTheme={manufacturingTheme}
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
        department="manufacturing"
        subDepartment="trimming"
        dialogTitle={`Trimming Report — ${item.batchId}`}
      />
    </>
  );
};

export default TrimmingApproverDetailDialog;
