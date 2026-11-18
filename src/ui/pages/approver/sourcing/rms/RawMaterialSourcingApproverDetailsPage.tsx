import { useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";

import { STRINGS } from "@app/config/strings";
import { useThemeStore } from "@app/store/themeStore";
import { useAuthStore } from "@app/store/authStore";
import { isApproverActionableStatus } from "@app/theme/approver";
import { icons } from "@app/theme/icons";
import { getRawMaterialSourcingApproverTheme } from "@app/theme/custom_themes/approver/sourcing/rms/rawMaterialSourcingApprover_theme";
import { getOperationStatusConfig } from "@hooks/operationStatus";
import { useFilePreview } from "@hooks/useFilePreview";
import {
  normalizeRawMaterialStatus,
  type MaterialBlock,
} from "@data/models/user/sourcing/rms/RawMaterialSourcingModel";
import AppButton from "@ui/components/common/Button";
import FilePreviewDialog from "@ui/components/common/FilePreviewDialog";
import UserWorkflowDetailsShell from "@ui/components/custom/UserWorkflowDetailsShell";
import useWorkflowDetailsStatusConfig from "@ui/components/custom/useWorkflowDetailsStatusConfig";
import { ReportPreviewDialog } from "@ui/pages/approver/components/ReportPdf";
import type { ApproverWorkflowDetailsPageProps } from "@ui/pages/approver/components/approverWorkflowTypes";
import ApproverMaterialBlockSection from "./components/ApproverMaterialBlockSection";

const BL = STRINGS.SOURCING.BATCH_LIST;
const FH = STRINGS.MANUFACTURING.FORM_HEADER;

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  inventory: InventoryRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.sourcing.rawMaterialSourcing;

const {
  pending: HourglassEmptyRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
} = icons.user.sourcing.rawMaterialBatchList;

const STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const RawMaterialSourcingApproverDetailsPage = ({
  item,
  loading,
  onBack,
  onApprove,
  onReject,
}: ApproverWorkflowDetailsPageProps) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getRawMaterialSourcingApproverTheme(mode), [mode]);
  const [pdfOpen, setPdfOpen] = useState(false);
  const subDepartmentId = useAuthStore(
    (s) =>
      s.user?.allSubDepartments.find((sd) => sd.slugs?.subDept === "raw-material")
        ?.subDepartmentId,
  );
  const { preview, openFile, closePreview, downloadCurrent } = useFilePreview();

  const statusConfig = useWorkflowDetailsStatusConfig(
    STATUS_CONFIG,
    theme.details.bannerStatusConfig,
  );

  const displayStatus = normalizeRawMaterialStatus(String(item.status ?? ""));
  const canApproveOrReject = isApproverActionableStatus(displayStatus);
  const blocks: MaterialBlock[] = item.qcBlocks ?? [];
  const subtitle = `${item.lotId ?? item.batchId}${
    item.materialName || item.materialCode
      ? ` · ${item.materialName || item.materialCode}`
      : ""
  }`;

  return (
    <>
      <UserWorkflowDetailsShell
        dt={theme.details}
        theme={theme}
        title={BL.LOT_DETAILS_TITLE}
        subtitle={subtitle}
        icon={InventoryRoundedIcon}
        status={displayStatus}
        statusConfig={statusConfig}
        rejectionReason={item.rejectionReason ?? item.remarks ?? null}
        onBack={onBack}
        backLabel={FH.BACK_TO_LIST}
        loading={loading}
        loadingText="Loading raw material details..."
      >
        <Stack direction="row" justifyContent="flex-end" mb={2}>
          <AppButton
            size="small"
            variant="contained"
            fullWidth={false}
            startIcon={<PictureAsPdfRoundedIcon sx={theme.dialog.pdfButtonIcon} />}
            onClick={() => setPdfOpen(true)}
            sx={{
              ...theme.dialog.pdfButton,
              background: theme.palette.primaryLight,
              color: theme.palette.white,
              border: "none",
              "&:hover": { background: theme.palette.primary },
            }}
          >
            View as PDF
          </AppButton>
        </Stack>

        {blocks.length ? (
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
          <Typography sx={theme.details.emptyText}>
            No raw material details available for this form.
          </Typography>
        )}

        <Box
          sx={{
            ...theme.dialog.footer,
            px: 0,
            mt: 3,
            background: "transparent",
            borderTop: `1px solid ${theme.palette.border}`,
          }}
        >
          <AppButton
            variant="outlined"
            size="medium"
            fullWidth={false}
            onClick={onBack}
            sx={theme.dialog.closeAction}
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
                sx={theme.dialog.rejectAction}
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
                sx={theme.dialog.approveAction}
              >
                Approve
              </AppButton>
            </>
          ) : null}
        </Box>
      </UserWorkflowDetailsShell>

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
