import { useMemo } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import getQualityControlTheme from "../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { getQcDivisionTheme } from "../../../../app/theme/custom_themes/user/qualityControl/qc_division_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import type { QCDivisionDetailView } from "../../../../data/models/user/QualityControlFormModel";
import type { QualityControlFormState } from "../../../../data/models/user/QualityControlFormModel";
import PremixStatusChip, {
  PremixCountsSummary,
} from "../../user/manufacturing/RawMaterial/components/PremixStatusChip";
import type { PremixSubmissionStatus } from "../../../../data/models/user/RawMaterialPreparationModel";
import QCDivisionDetailsContent from "../../user/qualityControl/QCDivision/components/QCDivisionDetailsContent";
import QCPartialItemNavigation from "../../user/qualityControl/QCDivision/QCPartialItemNavigation";
import {
  PARTIAL_ITEM_STATUS_CHIP,
  type QcApprovalTableRow,
  type QcPartialItemStatus,
  type QcPartialNavItem,
} from "../../../../hooks/user/qualityControl/qcDivisionApprovalUnits";
import {
  canApproverActionEntireQcDivisionForm,
  isQcPartialItemApproverActionable,
  isQcPartialItemApproverTabDisabled,
} from "../../../../hooks/approver/qualityControl/qcDivisionApproverGuards";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;
const {
  approved: ApproveIcon,
  rejected: RejectIcon,
} = icons.approver.qualityControl.qcDivision;

type QCDivisionApproverReviewContentProps = {
  detailView: QCDivisionDetailView | null;
  formData: QualityControlFormState;
  loading: boolean;
  schemaLoading?: boolean;
  subDepartmentId?: number | null;
  activeDivisionGroupIndex: number;
  activeDivisionSubIndex: number;
  onActiveDivisionGroupIndexChange: (index: number) => void;
  onActiveDivisionSubIndexChange: (index: number) => void;
  partialNavItems: QcPartialNavItem[];
  activePartialNavIndex: number;
  onActivePartialNavIndexChange: (index: number) => void;
  divisionStatusByFlowKey: Record<string, QcPartialItemStatus>;
  divisionApprovalRows: QcApprovalTableRow[];
  finalApprovalRows: QcApprovalTableRow[];
  formStatus?: string | null;
  formSubmissionType?: string | null;
  onApproveUnit: () => void;
  onRejectUnit: () => void;
  onApproveForm?: () => void;
  onRejectForm?: () => void;
  actionLoading?: boolean;
  qcTheme: ReturnType<typeof getQualityControlTheme>;
  approverTheme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const StatusOverviewTable = ({
  title,
  rows,
  showDivision,
}: {
  title: string;
  rows: QcApprovalTableRow[];
  showDivision?: boolean;
}) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      overflow: "hidden",
    }}
  >
    <Typography sx={{ px: 1.25, py: 1, fontSize: "0.74rem", fontWeight: 700 }}>
      {title}
    </Typography>
    <Table size="small">
      <TableHead>
        <TableRow sx={{ bgcolor: "action.hover" }}>
          {showDivision ? (
            <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
              {S.FINAL_APPROVAL_COL_DIVISION}
            </TableCell>
          ) : null}
          <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
            {S.DIVISION_APPROVAL_COL_UNIT}
          </TableCell>
          <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
            {S.DIVISION_APPROVAL_COL_TYPE}
          </TableCell>
          <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
            {S.DIVISION_APPROVAL_COL_STATUS}
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => {
          const chip = PARTIAL_ITEM_STATUS_CHIP[row.status] ?? PARTIAL_ITEM_STATUS_CHIP.TO_BE_INITIATED;
          return (
            <TableRow key={row.id}>
              {showDivision ? (
                <TableCell sx={{ fontSize: "0.74rem" }}>{row.divisionLabel}</TableCell>
              ) : null}
              <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{row.unitLabel}</TableCell>
              <TableCell sx={{ fontSize: "0.74rem" }}>{row.submissionType || "—"}</TableCell>
              <TableCell>
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    px: 0.9,
                    py: 0.25,
                    borderRadius: 999,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    bgcolor: chip.bg,
                    color: chip.color,
                    border: `1px solid ${chip.border}`,
                  }}
                >
                  {chip.label}
                </Box>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </Box>
);

const QCDivisionApproverReviewContent = ({
  detailView,
  formData,
  loading,
  schemaLoading = false,
  subDepartmentId,
  activeDivisionGroupIndex,
  activeDivisionSubIndex,
  onActiveDivisionGroupIndexChange,
  onActiveDivisionSubIndexChange,
  partialNavItems,
  activePartialNavIndex,
  onActivePartialNavIndexChange,
  divisionStatusByFlowKey,
  divisionApprovalRows,
  finalApprovalRows,
  formStatus = null,
  formSubmissionType = null,
  onApproveUnit,
  onRejectUnit,
  onApproveForm,
  onRejectForm,
  actionLoading = false,
  qcTheme,
  approverTheme,
}: QCDivisionApproverReviewContentProps) => {
  const palette = qcTheme.palette;
  const statusConfig = getQcDivisionTheme(qcTheme).details.bannerStatusConfig as Record<
    string,
    { color: string; bg: string; border: string }
  >;

  const derivedUnitCounts = useMemo(() => {
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      inProgress: 0,
      toBeInitiated: 0,
      total: 0,
    };
    const allUnits = finalApprovalRows.length ? finalApprovalRows : divisionApprovalRows;
    allUnits.forEach((row) => {
      counts.total += 1;
      if (row.status === "WAITING_FOR_APPROVAL") counts.pending += 1;
      else if (row.status === "APPROVED") counts.approved += 1;
      else if (row.status === "REJECTED") counts.rejected += 1;
      else if (row.status === "IN_PROGRESS") counts.inProgress += 1;
      else counts.toBeInitiated += 1;
    });
    return counts;
  }, [divisionApprovalRows, finalApprovalRows]);

  const activeItem = partialNavItems[activePartialNavIndex] ?? null;
  const canApproveOrRejectUnit = isQcPartialItemApproverActionable(activeItem?.status);
  const canApproveOrRejectForm = canApproverActionEntireQcDivisionForm({
    formSubmissionType: formSubmissionType || detailView?.formSubmissionType,
    status: detailView?.status ?? formStatus,
    divisionStatusByFlowKey,
  });

  if (loading) {
    return (
      <Box sx={approverTheme.dialog.loadingContainer}>
        <CircularProgress size={36} sx={approverTheme.dialog.loadingSpinner} />
        <Typography sx={approverTheme.dialog.loadingText}>Loading submission details…</Typography>
      </Box>
    );
  }

  if (!detailView) {
    return <Typography sx={approverTheme.dialog.emptyText}>{S.DETAILS_NO_DATA}</Typography>;
  }

  return (
    <Stack spacing={1.25}>
      <Box
        sx={{
          border: `1px solid ${palette.border}`,
          borderRadius: 2,
          px: 1.25,
          py: 1,
          background: palette.surface,
        }}
      >
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: palette.textSub, mb: 0.75 }}>
          {S.APPROVER_UNIT_COUNTS_LABEL}
        </Typography>
        <PremixCountsSummary
          pending={derivedUnitCounts.pending}
          approved={derivedUnitCounts.approved}
          rejected={derivedUnitCounts.rejected}
          inProgress={derivedUnitCounts.inProgress}
          toBeInitiated={derivedUnitCounts.toBeInitiated}
          total={derivedUnitCounts.total}
          statusConfig={statusConfig}
        />
      </Box>

      {canApproveOrRejectForm ? (
        <Box
          sx={{
            border: `1px solid ${palette.border}`,
            borderRadius: 2,
            px: 1.25,
            py: 1,
            background: palette.surface,
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            gap={1}
          >
            <Typography sx={{ fontSize: "0.74rem", color: palette.textSub, fontWeight: 600 }}>
              {S.FORM_APPROVER_ACTIONS_HINT}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
              <Button
                variant="contained"
                size="small"
                startIcon={<RejectIcon />}
                disabled={actionLoading || !onRejectForm}
                onClick={onRejectForm}
                sx={approverTheme.dialog.rejectAction}
              >
                {S.FORM_APPROVER_REJECT}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<ApproveIcon />}
                disabled={actionLoading || !onApproveForm}
                onClick={onApproveForm}
                sx={approverTheme.dialog.approveAction}
              >
                {S.FORM_APPROVER_APPROVE}
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : null}

      {finalApprovalRows.length > 0 ? (
        <StatusOverviewTable
          title={S.APPROVER_STATUS_OVERVIEW_TITLE}
          rows={finalApprovalRows}
          showDivision
        />
      ) : divisionApprovalRows.length > 0 ? (
        <StatusOverviewTable title={S.APPROVER_STATUS_OVERVIEW_TITLE} rows={divisionApprovalRows} />
      ) : null}

      {partialNavItems.length > 0 ? (
        <Box
          sx={{
            borderRadius: 2.5,
            border: `1px solid ${palette.border}`,
            background: palette.surface,
            px: 1.5,
            py: 1.25,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
            mb={1}
          >
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: palette.primary }}>
              {activeItem ? `${activeItem.kind} · ${activeItem.label}` : S.UNIT_APPROVER_NO_ACTIONABLE}
            </Typography>
            {activeItem ? (
              <PremixStatusChip
                status={activeItem.status as PremixSubmissionStatus}
                statusConfig={statusConfig}
              />
            ) : null}
          </Stack>

          <Typography sx={{ fontSize: "0.72rem", color: palette.textSub, mb: 1 }}>
            {S.UNIT_APPROVER_NAV_HINT}
          </Typography>

          <QCPartialItemNavigation
            items={partialNavItems}
            activeIndex={activePartialNavIndex}
            onActiveIndexChange={(index) => {
              if (isQcPartialItemApproverTabDisabled(partialNavItems[index]?.status)) return;
              onActivePartialNavIndexChange(index);
            }}
            loading={actionLoading || schemaLoading}
          />

          {activeItem && !isQcPartialItemApproverTabDisabled(activeItem.status) ? (
            canApproveOrRejectUnit ? (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                gap={1}
                mt={1.25}
                justifyContent="flex-end"
              >
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<RejectIcon />}
                  disabled={actionLoading}
                  onClick={onRejectUnit}
                  sx={approverTheme.dialog.rejectAction}
                >
                  {S.UNIT_APPROVER_REJECT} {activeItem.label}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<ApproveIcon />}
                  disabled={actionLoading}
                  onClick={onApproveUnit}
                  sx={approverTheme.dialog.approveAction}
                >
                  {S.UNIT_APPROVER_APPROVE} {activeItem.label}
                </Button>
              </Stack>
            ) : null
          ) : (
            <Typography sx={{ mt: 1, fontSize: "0.74rem", color: palette.textSub }}>
              {S.UNIT_APPROVER_NO_ACTIONABLE}
            </Typography>
          )}
        </Box>
      ) : null}

      <QCDivisionDetailsContent
        detailView={detailView}
        row={{
          status: formStatus || detailView.status,
          qcDivStatus: formStatus || detailView.status,
        }}
        formData={formData}
        subDepartmentId={subDepartmentId ?? undefined}
        loading={loading}
        schemaLoading={schemaLoading || loading}
        activeDivisionGroupIndex={activeDivisionGroupIndex}
        activeDivisionSubIndex={activeDivisionSubIndex}
        onActiveDivisionGroupIndexChange={onActiveDivisionGroupIndexChange}
        onActiveDivisionSubIndexChange={onActiveDivisionSubIndexChange}
        theme={qcTheme}
        resetOnFormId={detailView.formId}
      />
    </Stack>
  );
};

export default QCDivisionApproverReviewContent;
