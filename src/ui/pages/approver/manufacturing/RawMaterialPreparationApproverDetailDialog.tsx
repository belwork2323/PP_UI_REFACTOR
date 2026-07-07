import { useMemo, useState } from "react";
import { Box, Button, Dialog, DialogContent, IconButton, Stack, Typography } from "@mui/material";
import { useThemeStore } from "../../../../app/store/themeStore";
import getManufacturingTheme from "../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { isApproverActionableStatus } from "../../../../app/theme/approver";
import { icons } from "../../../../app/theme/icons";
import { ReportPreviewDialog } from "../components/ReportPdf";
import RawMaterialPreparationDetailsContent from "../../user/manufacturing/RawMaterial/components/RawMaterialPreparationDetailsContent";
import type {
  RawMaterialPrepApproverDetailView,
  RawMaterialPrepWeightmentSheet,
} from "../../../../data/models/user/RawMaterialPreparationModel";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  close: CloseRoundedIcon,
  build: BuildRoundedIcon,
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
  onApprove: (item: RawMaterialPreparationApproverDetailItem) => void;
  onReject: (item: RawMaterialPreparationApproverDetailItem) => void;
  theme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const RawMaterialPreparationApproverDetailDialog = ({
  open,
  onClose,
  item,
  loading,
  onApprove,
  onReject,
  theme,
}: RawMaterialPreparationApproverDetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const manufacturingTheme = useMemo(() => getManufacturingTheme(mode), [mode]);

  if (!item) return null;

  const canApproveOrReject = isApproverActionableStatus(item.status);
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
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: theme.dialog.paper }}>
        <Box sx={theme.dialog.header}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <BuildRoundedIcon sx={theme.dialog.headerIcon} />
            <Box>
              <Typography sx={theme.dialog.headerTitle}>Raw Material Preparation Submission</Typography>
              <Typography sx={theme.dialog.headerSubtitle}>
                {item.batchId}
                {item.motorId ? ` · ${item.motorId}` : ""}
              </Typography>
            </Box>
          </Stack>
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
          <RawMaterialPreparationDetailsContent
            detailView={detailView}
            weightmentSheet={weightmentSheet}
            row={item}
            loading={loading}
            theme={manufacturingTheme}
            resetPremixOnFormId={item.formId ?? null}
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
        subDepartment="raw-material-prep"
        dialogTitle={`RMP Report — ${item.batchId}`}
      />
    </>
  );
};

export default RawMaterialPreparationApproverDetailDialog;
