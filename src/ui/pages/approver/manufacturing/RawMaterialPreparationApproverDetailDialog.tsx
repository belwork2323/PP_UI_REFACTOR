import { useMemo, useState } from "react";
import { Box, Button, Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import { useThemeStore } from "../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { icons } from "../../../../app/theme/icons";
import { ReportPreviewDialog } from "../components/ReportPdf";
import RawMaterialPreparationApproverReviewContent from "./RawMaterialPreparationApproverReviewContent";
import type {
  RawMaterialPrepApproverDetailView,
  RawMaterialPrepWeightmentSheet,
} from "../../../../data/models/user/RawMaterialPreparationModel";

const {
  close: CloseRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.manufacturing.rawMaterialPreparation;

export type RawMaterialPreparationApproverDetailItem = Record<string, unknown> & {
  formId?: string | null;
  batchId?: string | null;
  motorId?: string | null;
  status?: string | null;
  detailView?: RawMaterialPrepApproverDetailView | null;
  weightmentSheet?: RawMaterialPrepWeightmentSheet;
};

type RawMaterialPreparationApproverDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: RawMaterialPreparationApproverDetailItem | null;
  loading: boolean;
  activePremixNo?: number | null;
  onActivePremixChange?: (premixNo: number) => void;
  onApprove: (item: RawMaterialPreparationApproverDetailItem) => void;
  onReject: (item: RawMaterialPreparationApproverDetailItem) => void;
  actionLoading?: boolean;
  theme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const RawMaterialPreparationApproverDetailDialog = ({
  open,
  onClose,
  item,
  loading,
  activePremixNo = null,
  onActivePremixChange,
  onApprove,
  onReject,
  actionLoading = false,
  theme,
}: RawMaterialPreparationApproverDetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const manufacturingTheme = useMemo(() => getManufacturingTheme(mode), [mode]);

  if (!item) return null;

  const detailView = item.detailView ?? null;
  const weightmentSheet = item.weightmentSheet ?? {
    mixerBuildingNumber: "",
    weightmentDetails: [],
    validation: {
      compareWithIdentificationSheet: false,
      deviationFound: false,
      deviationMessage: "",
    },
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: theme.dialog.paper }}
      >
        <Box sx={theme.dialog.header}>
          <Box>
            <Typography sx={theme.dialog.headerTitle}>Raw Material Preparation Submission</Typography>
            <Typography sx={theme.dialog.headerSubtitle}>
              {item.batchId}
              {item.motorId ? ` · ${item.motorId}` : ""}
            </Typography>
          </Box>
          <Stack direction="row" gap={1} alignItems="center">
            <Button
              size="small"
              variant="contained"
              startIcon={<PictureAsPdfRoundedIcon sx={{ fontSize: "14px !important" }} />}
              onClick={() => setPdfOpen(true)}
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
          <RawMaterialPreparationApproverReviewContent
            detailView={detailView}
            weightmentSheet={weightmentSheet}
            loading={loading}
            activePremixNo={activePremixNo}
            onActivePremixChange={onActivePremixChange ?? (() => undefined)}
            onApprove={() => onApprove(item)}
            onReject={() => onReject(item)}
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
        subDepartment="raw-material-prep"
        dialogTitle={`RMP Report — ${item.batchId}`}
      />
    </>
  );
};

export default RawMaterialPreparationApproverDetailDialog;
