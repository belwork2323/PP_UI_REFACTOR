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
import { isApproverActionableStatus } from "../../../../app/theme/approver";
import { icons } from "../../../../app/theme/icons";
import { STRINGS } from "../../../../app/config/strings";
import type { StfDetailView } from "../../../../data/models/user/StaticTestFacilityApiModel";
import { ReportPreviewDialog } from "../components/ReportPdf";
import STFDetailsContent from "../../user/qualityControl/StaticTestFacility/components/STFDetailsContent";
import STFApproverReviewContent from "./STFApproverReviewContent";
import { OtherBemDetailView } from "@/data/models/approver/OtherBemApiModel";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  close: CloseRoundedIcon,
  rocketLaunch: RocketLaunchRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.qualityControl.staticTestFacility;

const STF_ACCENT = {
  primary: "#1565C0",
  primaryLight: "#1976D2",
};

export type STFApproverDetailItem = Record<string, unknown> & {
  formId?: string | null;
  batchId?: string | null;
  motorId?: string | null;
  batchType?: string | null;
  status?: string | null;
  stfStatus?: string | null;
  bemStatus?: string | null;
  detailView?: StfDetailView | OtherBemDetailView | null;
};

type STFApproverDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: STFApproverDetailItem | null;
  detailView?: StfDetailView | OtherBemDetailView | null;
  loading: boolean;
  activeMotorId?: string | null;
  onActiveMotorChange?: (motorId: string) => void;
  onApprove: (item: STFApproverDetailItem) => void;
  onReject: (item: STFApproverDetailItem) => void;
  onApproveForm?: (item: STFApproverDetailItem) => void;
  onRejectForm?: (item: STFApproverDetailItem) => void;
  actionLoading?: boolean;
  theme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
  subDepartment?: "static-test-facility" | "other-bem-motors" | string;
};

const STFApproverDetailDialog = ({
  open,
  onClose,
  item,
  detailView: detailViewProp,
  loading,
  activeMotorId = null,
  onActiveMotorChange,
  onApprove,
  onReject,
  onApproveForm,
  onRejectForm,
  actionLoading = false,
  theme,
  subDepartment = "static-test-facility",
}: STFApproverDetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  const mode = useThemeStore((state) => state.mode);
  const qcTheme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const strings = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;
  const isAcemFlow = subDepartment === "static-test-facility";

  if (!item) return null;

  const detailView = (isAcemFlow ? item.detailView : detailViewProp ?? item.detailView) as
    | StfDetailView
    | OtherBemDetailView
    | null;

  const rowStatus = String(
    item.stfStatus ?? item.bemStatus ?? item.status ?? detailView?.status ?? "",
  );
  const canApproveOrReject = !isAcemFlow && isApproverActionableStatus(rowStatus);

  const displayId = item.batchId ?? item.motorId ?? (detailView as StfDetailView)?.batchId ?? "";
  const formId = detailView?.formId ?? item.formId ?? null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={isAcemFlow ? "lg" : "xl"}
        fullWidth
        PaperProps={{ sx: { ...theme.dialog.paper, maxHeight: "92vh" } }}
      >
        <Box
          sx={{
            ...theme.dialog.header,
            background: `linear-gradient(135deg, ${STF_ACCENT.primary}, ${STF_ACCENT.primaryLight})`,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <RocketLaunchRoundedIcon sx={theme.dialog.headerIcon} />
            <Box>
              <Typography sx={theme.dialog.headerTitle}>
                {subDepartment === "other-bem-motors" ? "Other BEM Motor" : strings.TITLE}{" "}
                Submission
              </Typography>
              <Typography sx={theme.dialog.headerSubtitle}>
                {displayId}
                {loading ? " · loading…" : activeMotorId ? ` · ${activeMotorId}` : ""}
                {!loading && formId ? ` · ${formId}` : ""}
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
              disabled={loading || !formId || actionLoading}
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
          {isAcemFlow ? (
            <STFApproverReviewContent
              detailView={detailView as StfDetailView | null}
              loading={loading}
              activeMotorId={activeMotorId}
              onActiveMotorChange={onActiveMotorChange ?? (() => undefined)}
              onApprove={() => onApprove(item)}
              onReject={() => onReject(item)}
              onApproveForm={onApproveForm ? () => onApproveForm(item) : undefined}
              onRejectForm={onRejectForm ? () => onRejectForm(item) : undefined}
              actionLoading={actionLoading}
              formStatus={rowStatus}
              qcTheme={qcTheme}
              approverTheme={theme}
            />
          ) : (
            <STFDetailsContent
              detailView={detailView as StfDetailView | null}
              row={{
                ...item,
                status: rowStatus,
                stfStatus: rowStatus,
              }}
              loading={loading}
              theme={qcTheme}
              resetOnFormId={formId}
            />
          )}
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
          {!isAcemFlow && canApproveOrReject ? (
            <>
              <Button
                variant="contained"
                startIcon={<CancelRoundedIcon />}
                onClick={() => onReject(item)}
                disabled={loading || actionLoading}
                sx={theme.dialog.rejectAction}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircleRoundedIcon />}
                onClick={() => onApprove(item)}
                disabled={loading || actionLoading}
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
        formId={formId}
        department="qualityControl"
        subDepartment={subDepartment}
        dialogTitle={`${subDepartment === "other-bem-motors" ? "Other BEM Motor" : strings.TITLE} Report — ${displayId}`}
      />
    </>
  );
};

export default STFApproverDetailDialog;
