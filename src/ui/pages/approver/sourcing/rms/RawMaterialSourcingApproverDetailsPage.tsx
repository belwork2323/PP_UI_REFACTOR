import { useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import type { getRawMaterialSourcingApproverTheme } from "@app/theme/custom_themes/approver/sourcing/rms/rawMaterialSourcingApprover_theme";
import { isApproverActionableStatus } from "@app/theme/approver";
import { icons } from "@app/theme/icons";
import { useAuthStore } from "@app/store/authStore";
import { useFilePreview } from "@hooks/useFilePreview";
import AppButton from "@ui/components/common/Button";
import DetailDialog from "@ui/components/common/DetailDialog";
import FilePreviewDialog from "@ui/components/common/FilePreviewDialog";
import { ReportPreviewDialog } from "@ui/pages/approver/components/ReportPdf";
import type { MaterialBlock } from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import ApproverMaterialBlockSection from "./components/ApproverMaterialBlockSection";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  close: CloseRoundedIcon,
  inventory: InventoryRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.sourcing.rawMaterialSourcing;

type RawMaterialSourcingApproverDetailsPageProps = {
  open: boolean;
  onClose: () => void;
  item: any | null;
  loading: boolean;
  onApprove: (item: any) => void;
  onReject: (item: any) => void;
  theme: ReturnType<typeof getRawMaterialSourcingApproverTheme>;
};

const RawMaterialSourcingApproverDetailsPage = ({
  open,
  onClose,
  item,
  loading,
  onApprove,
  onReject,
  theme,
}: RawMaterialSourcingApproverDetailsPageProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const subDepartmentId = useAuthStore(
    (s) =>
      s.user?.allSubDepartments.find(
        (sd) => sd.slugs?.subDept === "raw-material",
      )?.subDepartmentId,
  );
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();

  if (!item) return null;

  const { dialog } = theme;
  const canApproveOrReject = isApproverActionableStatus(item.status);
  const blocks: MaterialBlock[] = item.qcBlocks ?? [];

  return (
    <>
      <DetailDialog
        open={open}
        onClose={onClose}
        paperSx={dialog.paper}
        headerSx={dialog.header}
        contentSx={dialog.content}
        footerSx={dialog.footer}
        header={
          <>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <InventoryRoundedIcon sx={dialog.headerIcon} />
              <Box>
                <Typography sx={dialog.headerSubtitle}>
                  {item.lotId ?? item.batchId} ·{" "}
                  {item.materialName ?? item.materialCode}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" gap={1} alignItems="center">
              <AppButton
                size="small"
                variant="contained"
                fullWidth={false}
                startIcon={
                  <PictureAsPdfRoundedIcon sx={dialog.pdfButtonIcon} />
                }
                onClick={() => setPdfOpen(true)}
                sx={dialog.pdfButton}
              >
                View as PDF
              </AppButton>
              <IconButton
                onClick={onClose}
                size="small"
                sx={dialog.closeButton}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </>
        }
        footer={
          <>
            <AppButton
              variant="outlined"
              size="medium"
              fullWidth={false}
              onClick={onClose}
              sx={dialog.closeAction}
            >
              Close
            </AppButton>
            {canApproveOrReject ? (
              <>
                <AppButton
                  variant="contained"
                  size="medium"
                  fullWidth={false}
                  startIcon={<CancelRoundedIcon />}
                  onClick={() => onReject(item)}
                  disabled={loading}
                  sx={dialog.rejectAction}
                >
                  Reject
                </AppButton>
                <AppButton
                  variant="contained"
                  size="medium"
                  fullWidth={false}
                  startIcon={<CheckCircleRoundedIcon />}
                  onClick={() => onApprove(item)}
                  disabled={loading}
                  sx={dialog.approveAction}
                >
                  Approve
                </AppButton>
              </>
            ) : null}
          </>
        }
      >
        {item.status === "Rejected" && (
          <Box sx={dialog.errorBanner}>
            <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
              <CancelRoundedIcon sx={dialog.rejectionIcon} />
              <Typography sx={dialog.rejectionTitle}>
                <Chip
                  label={item.status}
                  size="small"
                  sx={dialog.rejectionChip}
                />
              </Typography>
            </Stack>
            <Typography sx={dialog.rejectionReason}>
              <Box component="span" sx={dialog.rejectionReasonLabel}>
                Reason:{" "}
              </Box>
              {item.rejectionReason || item.remarks || ""}
            </Typography>
          </Box>
        )}
        {loading ? (
          <Box sx={dialog.loadingContainer}>
            <CircularProgress size={32} sx={dialog.loadingSpinner} />
            <Typography sx={dialog.loadingText}>
              Loading raw material details...
            </Typography>
          </Box>
        ) : blocks.length ? (
          blocks.map((block, index) => (
            <ApproverMaterialBlockSection
              key={index}
              block={block}
              isLast={index === blocks.length - 1}
              theme={theme}
              subDepartmentId={subDepartmentId}
              openFile={openFile}
            />
          ))
        ) : (
          <Typography sx={dialog.emptyText}>
            No raw material details available for this form.
          </Typography>
        )}
      </DetailDialog>

      <FilePreviewDialog
        preview={preview}
        onClose={closePreview}
        onDownload={downloadCurrent}
        themeColor={theme.palette.primary}
        themeColorLight={theme.palette.primaryLight}
      />

      <ReportPreviewDialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        formId={item.lotId ?? item.batchId}
        department="sourcing"
        subDepartment="raw-material"
        dialogTitle={`Raw Material Report — ${item.lotId ?? item.batchId}`}
      />
    </>
  );
};

export default RawMaterialSourcingApproverDetailsPage;
