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

import { useThemeStore } from "../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { icons } from "../../../../app/theme/icons";
import { STRINGS } from "../../../../app/config/strings";
import type { NDTDetailView } from "../../../../data/models/user/NDTFormModel";
import { ReportPreviewDialog } from "../components/ReportPdf";
import NDTApproverReviewContent from "./NDTApproverReviewContent";

const {
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
  detailView?: NDTDetailView | null;
};

type NDTApproverDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: NDTApproverDetailItem | null;
  loading: boolean;
  activeMotorId?: string | null;
  onActiveMotorChange?: (motorId: string) => void;
  onApprove: (item: NDTApproverDetailItem) => void;
  onReject: (item: NDTApproverDetailItem) => void;
  onApproveForm?: (item: NDTApproverDetailItem) => void;
  onRejectForm?: (item: NDTApproverDetailItem) => void;
  actionLoading?: boolean;
  theme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const NDTApproverDetailDialog = ({
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
}: NDTApproverDetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const qcTheme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const strings = STRINGS.QUALITY_CONTROL.NDT;

  if (!item) return null;

  const detailView = item.detailView ?? null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: theme.dialog.paper }}>
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
          <NDTApproverReviewContent
            detailView={detailView}
            loading={loading}
            activeMotorId={activeMotorId}
            onActiveMotorChange={onActiveMotorChange ?? (() => undefined)}
            onApprove={() => onApprove(item)}
            onReject={() => onReject(item)}
            onApproveForm={onApproveForm ? () => onApproveForm(item) : undefined}
            onRejectForm={onRejectForm ? () => onRejectForm(item) : undefined}
            actionLoading={actionLoading}
            formStatus={String(item.ndtStatus ?? item.status ?? "")}
            qcTheme={qcTheme}
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
        department="qualityControl"
        subDepartment="ndt"
        dialogTitle={`${strings.TITLE} Report — ${item.batchId}`}
      />
    </>
  );
};

export default NDTApproverDetailDialog;
