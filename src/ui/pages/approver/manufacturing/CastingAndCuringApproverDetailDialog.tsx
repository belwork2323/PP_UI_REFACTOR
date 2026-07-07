import { useMemo, useState } from "react";
import { Box, Button, CircularProgress, Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useThemeStore } from "../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { isApproverActionableStatus } from "../../../../app/theme/approver";
import { icons } from "../../../../app/theme/icons";
import type { CastingCuringDetailView } from "../../../../data/models/user/CastingCuringFormModel";
import { ReportPreviewDialog } from "../components/ReportPdf";
import CastingCuringDetailsContent from "../../user/manufacturing/CastingAndCuring/components/CastingCuringDetailsContent";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  close: CloseRoundedIcon,
  thermostat: ThermostatRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.manufacturing.castingAndCuring;

const CC_BRAND = {
  cc: "#1565C0",
  ccLight: "#1976D2",
};

export type CastingAndCuringApproverDetailItem = Record<string, unknown> & {
  formId?: string | null;
  batchId?: string | null;
  status?: string | null;
};

type CastingAndCuringApproverDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: CastingAndCuringApproverDetailItem | null;
  detailView: CastingCuringDetailView | null;
  loading: boolean;
  onApprove: (item: CastingAndCuringApproverDetailItem) => void;
  onReject: (item: CastingAndCuringApproverDetailItem) => void;
  theme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const CastingAndCuringApproverDetailDialog = ({
  open,
  onClose,
  item,
  detailView,
  loading,
  onApprove,
  onReject,
  theme,
}: CastingAndCuringApproverDetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const manufacturingTheme = useMemo(() => getManufacturingTheme(mode), [mode]);

  if (!item) return null;

  const canApproveOrReject = isApproverActionableStatus(item.status);
  const motorIds = (detailView?.motors ?? []).map((motor) => motor.motorId).filter(Boolean);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: theme.dialog.paper }}>
        <Box
          sx={{
            ...theme.dialog.header,
            background: `linear-gradient(135deg, ${CC_BRAND.cc}, ${CC_BRAND.ccLight})`,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <ThermostatRoundedIcon sx={theme.dialog.headerIcon} />
            <Box>
              <Typography sx={theme.dialog.headerTitle}>Casting & Curing Submission</Typography>
              <Typography sx={theme.dialog.headerSubtitle}>
                {item.batchId}
                {loading ? " · loading…" : item.formId ? ` · ${item.formId}` : ""}
                {!loading && motorIds.length > 0 ? ` · ${motorIds.length} motor${motorIds.length === 1 ? "" : "s"}` : ""}
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
          <CastingCuringDetailsContent
            detailView={detailView}
            row={item}
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
        subDepartment="casting-and-curing"
        dialogTitle={`Casting & Curing Report — ${item.batchId}`}
      />
    </>
  );
};

export default CastingAndCuringApproverDetailDialog;
