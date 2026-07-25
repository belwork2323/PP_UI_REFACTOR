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

import { useThemeStore } from "../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { icons } from "../../../../app/theme/icons";
import type { MixingDetailView } from "../../../../data/models/user/MixingFormModel";
import { ReportPreviewDialog } from "../components/ReportPdf";
import MixingApproverReviewContent from "./MixingApproverReviewContent";

const {
  close: CloseRoundedIcon,
  blender: BlenderRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.manufacturing.mixing;

export type MixingApproverDetailItem = Record<string, unknown> & {
  formId?: string | null;
  batchId?: string | null;
  status?: string | null;
  mxStatus?: string | null;
  detailView?: MixingDetailView | null;
};

type MixingApproverDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: MixingApproverDetailItem | null;
  loading: boolean;
  activeMixCardId?: string | null;
  onActiveMixCardChange?: (mixCardId: string) => void;
  onApprove: (item: MixingApproverDetailItem) => void;
  onReject: (item: MixingApproverDetailItem) => void;
  onApproveForm?: (item: MixingApproverDetailItem) => void;
  onRejectForm?: (item: MixingApproverDetailItem) => void;
  actionLoading?: boolean;
  theme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const MixingApproverDetailDialog = ({
  open,
  onClose,
  item,
  loading,
  activeMixCardId = null,
  onActiveMixCardChange,
  onApprove,
  onReject,
  onApproveForm,
  onRejectForm,
  actionLoading = false,
  theme,
}: MixingApproverDetailDialogProps) => {
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
            <BlenderRoundedIcon sx={theme.dialog.headerIcon} />
            <Box>
              <Typography sx={theme.dialog.headerTitle}>Mixing Submission</Typography>
              <Typography sx={theme.dialog.headerSubtitle}>
                {item.batchId}
                {loading ? " · loading…" : activeMixCardId ? ` · ${activeMixCardId}` : ""}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center">
            {loading ? (
              <CircularProgress size={16} sx={{ color: theme.dialog.headerIcon.color }} />
            ) : null}
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
          <MixingApproverReviewContent
            detailView={detailView}
            loading={loading}
            activeMixCardId={activeMixCardId}
            onActiveMixCardChange={onActiveMixCardChange ?? (() => undefined)}
            onApprove={() => onApprove(item)}
            onReject={() => onReject(item)}
            onApproveForm={onApproveForm ? () => onApproveForm(item) : undefined}
            onRejectForm={onRejectForm ? () => onRejectForm(item) : undefined}
            actionLoading={actionLoading}
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
        subDepartment="mixing"
        dialogTitle={`Mixing Report — ${item.batchId}`}
      />
    </>
  );
};

export default MixingApproverDetailDialog;
