import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import getQualityControlTheme from "../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { getQcDivisionTheme } from "../../../../app/theme/custom_themes/user/qualityControl/qc_division_theme";
import getRawMaterialPreparationApproverTheme from "../../../../app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { STRINGS } from "../../../../app/config/strings";
import { icons } from "../../../../app/theme/icons";
import type { QCDivisionDetailView } from "../../../../data/models/user/QualityControlFormModel";
import type { QualityControlFormState } from "../../../../data/models/user/QualityControlFormModel";
import { PremixCountsSummary } from "../../user/manufacturing/RawMaterial/components/PremixStatusChip";
import QCDivisionDetailsContent, {
  buildQcDivisionBatchMetaFields,
} from "../../user/qualityControl/QCDivision/components/QCDivisionDetailsContent";
import QCDivisionNavPanel from "../../user/qualityControl/QCDivision/QCDivisionNavPanel";
import QCPartialItemNavigation from "../../user/qualityControl/QCDivision/QCPartialItemNavigation";
import type { QcDivisionCatalogNavTab } from "../../../../hooks/user/qualityControl/qcFlowConfig";
import {
  PARTIAL_ITEM_STATUS_CHIP,
  hasPartialChildNav,
  type QcApprovalTableRow,
  type QcFinalApprovalDivisionGroup,
  type QcPartialItemStatus,
  type QcPartialNavItem,
} from "../../../../hooks/user/qualityControl/qcDivisionApprovalUnits";
import {
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
  divisionNavTabs?: QcDivisionCatalogNavTab[];
  activeDivisionTabKey?: string;
  onActiveDivisionTabKeyChange?: (tabKey: string) => void;
  partialNavItems: QcPartialNavItem[];
  activePartialNavIndex: number;
  onActivePartialNavIndexChange: (index: number) => void;
  divisionStatusByFlowKey: Record<string, QcPartialItemStatus>;
  divisionApprovalRows: QcApprovalTableRow[];
  finalApprovalGroups?: QcFinalApprovalDivisionGroup[];
  finalApprovalRows: QcApprovalTableRow[];
  formStatus?: string | null;
  formSubmissionType?: string | null;
  onApproveUnit: () => void;
  onRejectUnit: () => void;
  actionLoading?: boolean;
  qcTheme: ReturnType<typeof getQualityControlTheme>;
  approverTheme: ReturnType<typeof getRawMaterialPreparationApproverTheme>;
};

const StatusChip = ({ status }: { status: QcPartialItemStatus }) => {
  const chip = PARTIAL_ITEM_STATUS_CHIP[status] ?? PARTIAL_ITEM_STATUS_CHIP.TO_BE_INITIATED;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        px: 1,
        py: 0.3,
        borderRadius: 1,
        fontSize: "0.7rem",
        fontWeight: 700,
        bgcolor: chip.bg,
        color: chip.color,
        border: `1px solid ${chip.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {chip.label}
    </Box>
  );
};

const unitColumnLabel = (group: QcFinalApprovalDivisionGroup): string => {
  if (group.units.some((unit) => unit.kind === "MOTOR")) {
    return S.FINAL_APPROVAL_COL_MOTOR || "Motor";
  }
  if (
    group.units.some((unit) => unit.kind === "FINAL_MIX") &&
    group.units.some((unit) => unit.kind === "PREMIX")
  ) {
    return "Unit";
  }
  if (group.units.some((unit) => unit.kind === "FINAL_MIX")) return "Final Mix";
  if (group.units.some((unit) => unit.kind === "PREMIX")) {
    return S.FINAL_APPROVAL_COL_PREMIX || "Premix";
  }
  return S.FINAL_APPROVAL_COL_UNIT || "Unit";
};

const unitActionLabels = (
  item: QcPartialNavItem | null,
  isRevalidationDivisionTab = false,
) => {
  if (item?.kind === "DIVISION" || isRevalidationDivisionTab) {
    return { approve: S.DIVISION_APPROVER_APPROVE, reject: S.DIVISION_APPROVER_REJECT };
  }
  if (item?.kind === "MOTOR") {
    const motorId = String(item.motorId ?? item.label ?? "").trim();
    return {
      approve: motorId ? `${S.MOTOR_APPROVER_APPROVE} ${motorId}` : S.MOTOR_APPROVER_APPROVE,
      reject: motorId ? `${S.MOTOR_APPROVER_REJECT} ${motorId}` : S.MOTOR_APPROVER_REJECT,
    };
  }
  if (item?.kind === "PREMIX") {
    const premixNo = item.premixNo;
    return {
      approve:
        premixNo != null ? `${S.PREMIX_APPROVER_APPROVE} ${premixNo}` : S.PREMIX_APPROVER_APPROVE,
      reject:
        premixNo != null ? `${S.PREMIX_APPROVER_REJECT} ${premixNo}` : S.PREMIX_APPROVER_REJECT,
    };
  }
  if (item?.kind === "FINAL_MIX") {
    const mixNo = item.finalMixNo ?? item.premixNo;
    const mixLabel =
      String(item.label ?? "").trim() ||
      (mixNo != null ? `Final Mix ${mixNo}` : "");
    return {
      approve: mixLabel ? `Approve ${mixLabel}` : S.PREMIX_APPROVER_APPROVE,
      reject: mixLabel ? `Reject ${mixLabel}` : S.PREMIX_APPROVER_REJECT,
    };
  }
  return { approve: S.UNIT_APPROVER_APPROVE, reject: S.UNIT_APPROVER_REJECT };
};

const COLLAPSED_OVERVIEW_ROWS = 2;

const ApproverStatusOverviewRows = ({
  groups,
  expandedById,
  onToggleGroup,
}: {
  groups: QcFinalApprovalDivisionGroup[];
  expandedById: Record<string, boolean>;
  onToggleGroup: (groupId: string) => void;
}) => (
  <>
    {groups.map((group, index) => {
      const hasUnits = group.units.length > 0;
      const expanded = Boolean(expandedById[group.id]);
      return (
        <Box
          key={group.id}
          sx={{
            borderBottom: index < groups.length - 1 ? "1px solid" : "none",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            onClick={hasUnits ? () => onToggleGroup(group.id) : undefined}
            sx={{
              px: 1.25,
              py: 1,
              bgcolor: "grey.50",
              cursor: hasUnits ? "pointer" : "default",
              "&:hover": hasUnits ? { bgcolor: "action.hover" } : undefined,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
              {hasUnits ? (
                <IconButton
                  size="small"
                  aria-label={expanded ? "Collapse division" : "Expand division"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleGroup(group.id);
                  }}
                  sx={{ color: "text.secondary" }}
                >
                  {expanded ? (
                    <ExpandLessRoundedIcon fontSize="small" />
                  ) : (
                    <ExpandMoreRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              ) : (
                <Box sx={{ width: 34 }} />
              )}
              <Typography
                sx={{
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {group.divisionLabel}
              </Typography>
            </Stack>
            <StatusChip status={group.divisionStatus} />
          </Stack>

          {hasUnits ? (
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  px: 1.25,
                  pb: 1.1,
                  pt: 0.75,
                  bgcolor: "background.default",
                  borderTop: "1px dashed",
                  borderColor: "divider",
                }}
              >
                <TableContainer>
                  <Table
                    size="small"
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      bgcolor: "background.paper",
                      overflow: "hidden",
                      "& th, & td": { borderColor: "divider" },
                    }}
                  >
                    <TableHead>
                      <TableRow sx={{ bgcolor: "action.hover" }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem", width: "55%" }}>
                          {unitColumnLabel(group)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.72rem" }}>
                          {S.FINAL_APPROVAL_COL_STATUS}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.units.map((unit) => (
                        <TableRow key={`${group.id}:${unit.id}`} hover>
                          <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                            {unit.label}
                          </TableCell>
                          <TableCell>
                            <StatusChip status={unit.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Collapse>
          ) : null}
        </Box>
      );
    })}
  </>
);

const ApproverStatusOverview = ({
  title,
  groups,
}: {
  title: string;
  groups: QcFinalApprovalDivisionGroup[];
}) => {
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    groups.forEach((group) => {
      next[group.id] = false;
    });
    setExpandedById(next);
    setShowAll(false);
  }, [groups]);

  const toggleGroup = (groupId: string) => {
    setExpandedById((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  if (!groups.length) return null;

  const canToggleList = groups.length > COLLAPSED_OVERVIEW_ROWS;
  const visibleGroups = canToggleList && !showAll
    ? groups.slice(0, COLLAPSED_OVERVIEW_ROWS)
    : groups;
  const hiddenCount = groups.length - COLLAPSED_OVERVIEW_ROWS;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1.5, py: 0.9, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{title}</Typography>
        <Typography sx={{ fontSize: "0.68rem", color: "text.secondary", fontWeight: 600 }}>
          {groups.length} divisions
        </Typography>
      </Stack>

      <Box sx={{ maxHeight: showAll ? 420 : undefined, overflowY: showAll ? "auto" : "hidden" }}>
        <ApproverStatusOverviewRows
          groups={visibleGroups}
          expandedById={expandedById}
          onToggleGroup={toggleGroup}
        />
      </Box>

      {canToggleList ? (
        <Button
          fullWidth
          size="small"
          onClick={() => setShowAll((prev) => !prev)}
          endIcon={
            showAll ? (
              <ExpandLessRoundedIcon fontSize="small" />
            ) : (
              <ExpandMoreRoundedIcon fontSize="small" />
            )
          }
          sx={{
            borderRadius: 0,
            py: 0.85,
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "none",
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "grey.50",
            color: "text.primary",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          {showAll
            ? S.APPROVER_STATUS_OVERVIEW_SHOW_LESS
            : `${S.APPROVER_STATUS_OVERVIEW_SHOW_MORE} (${hiddenCount})`}
        </Button>
      ) : null}
    </Box>
  );
};

const rowsToFallbackGroups = (rows: QcApprovalTableRow[]): QcFinalApprovalDivisionGroup[] => {
  const byDivision = new Map<string, QcFinalApprovalDivisionGroup>();
  rows.forEach((row) => {
    const key = row.divisionLabel || "Division";
    const existing = byDivision.get(key) ?? {
      id: `division:${key}`,
      divisionKey: key,
      divisionLabel: key,
      divisionStatus: row.unitKind === "DIVISION" ? row.status : "TO_BE_INITIATED",
      units: [],
    };
    if (row.unitKind === "DIVISION" || row.unitLabel === "—") {
      existing.divisionStatus = row.status;
    } else if (row.unitKind === "PREMIX" || row.unitKind === "FINAL_MIX" || row.unitKind === "MOTOR") {
      existing.units.push({
        id: row.id,
        label: row.unitLabel,
        kind: row.unitKind,
        status: row.status,
      });
    }
    byDivision.set(key, existing);
  });
  return Array.from(byDivision.values());
};

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
  divisionNavTabs = [],
  activeDivisionTabKey = "",
  onActiveDivisionTabKeyChange,
  partialNavItems,
  activePartialNavIndex,
  onActivePartialNavIndexChange,
  divisionStatusByFlowKey,
  divisionApprovalRows,
  finalApprovalGroups,
  finalApprovalRows,
  formStatus = null,
  formSubmissionType = null,
  onApproveUnit,
  onRejectUnit,
  actionLoading = false,
  qcTheme,
  approverTheme,
}: QCDivisionApproverReviewContentProps) => {
  const palette = qcTheme.palette;
  const dt = getQcDivisionTheme(qcTheme).details;
  const statusConfig = getQcDivisionTheme(qcTheme).details.bannerStatusConfig as Record<
    string,
    { color: string; bg: string; border: string }
  >;

  const overviewGroups = useMemo(() => {
    if (finalApprovalGroups && finalApprovalGroups.length) return finalApprovalGroups;
    if (finalApprovalRows.length) return rowsToFallbackGroups(finalApprovalRows);
    if (divisionApprovalRows.length) return rowsToFallbackGroups(divisionApprovalRows);
    return [];
  }, [divisionApprovalRows, finalApprovalGroups, finalApprovalRows]);

  const derivedDivisionCounts = useMemo(() => {
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      inProgress: 0,
      toBeInitiated: 0,
      total: 0,
    };
    overviewGroups.forEach((group) => {
      counts.total += 1;
      const status = group.divisionStatus;
      if (status === "WAITING_FOR_APPROVAL") counts.pending += 1;
      else if (status === "APPROVED") counts.approved += 1;
      else if (status === "REJECTED") counts.rejected += 1;
      else if (status === "IN_PROGRESS") counts.inProgress += 1;
      else counts.toBeInitiated += 1;
    });
    return counts;
  }, [overviewGroups]);

  const batchMetaFields = useMemo(
    () =>
      buildQcDivisionBatchMetaFields(detailView, {
        status: formStatus || detailView?.status,
        qcDivStatus: formStatus || detailView?.status,
        batchId: detailView?.batchId,
        formId: detailView?.formId,
      }),
    [detailView, formStatus],
  );

  const activeItem = partialNavItems[activePartialNavIndex] ?? null;
  const isRevalidationDivisionTab = activeDivisionTabKey === "RAW_MATERIAL_REVALIDATION";
  const canApproveOrRejectUnit =
    isQcPartialItemApproverActionable(activeItem?.status) &&
    (activeItem?.kind !== "DIVISION" || isRevalidationDivisionTab);

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
      <Box sx={dt.section}>
        <Typography sx={dt.sectionTitle}>
          <DescriptionRoundedIcon sx={{ fontSize: 18 }} />
          {S.DETAILS_BATCH_SECTION}
        </Typography>
        <Box sx={dt.metaGrid}>
          {batchMetaFields.map((field) => (
            <Box key={field.label} sx={dt.metaItem}>
              <Typography sx={dt.metaLabel}>{field.label}</Typography>
              <Typography sx={dt.metaValue}>{String(field.value ?? "—")}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

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
          pending={derivedDivisionCounts.pending}
          approved={derivedDivisionCounts.approved}
          rejected={derivedDivisionCounts.rejected}
          inProgress={derivedDivisionCounts.inProgress}
          toBeInitiated={derivedDivisionCounts.toBeInitiated}
          total={derivedDivisionCounts.total}
          statusConfig={statusConfig}
        />
      </Box>

      <ApproverStatusOverview
        title={S.APPROVER_STATUS_OVERVIEW_TITLE}
        groups={overviewGroups}
      />

      <QCDivisionNavPanel
        tabs={divisionNavTabs}
        activeTabKey={activeDivisionTabKey}
        statusByTabKey={divisionStatusByFlowKey}
        loading={schemaLoading || actionLoading}
        onTabChange={(tabKey) => onActiveDivisionTabKeyChange?.(tabKey)}
      />

      {partialNavItems.length > 0 ? (
        <>
          {hasPartialChildNav(partialNavItems) ? (
            <QCPartialItemNavigation
              items={partialNavItems}
              activeIndex={activePartialNavIndex}
              onActiveIndexChange={(index) => {
                if (isQcPartialItemApproverTabDisabled(partialNavItems[index]?.status)) return;
                onActivePartialNavIndexChange(index);
              }}
              loading={actionLoading || schemaLoading}
              isTabEnabled={(index) =>
                !isQcPartialItemApproverTabDisabled(partialNavItems[index]?.status)
              }
              getTabDisabledReason={() => S.UNIT_APPROVER_TAB_DISABLED}
            />
          ) : null}

          {activeItem && !isQcPartialItemApproverTabDisabled(activeItem.status) ? (
            canApproveOrRejectUnit ? (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                gap={1}
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
                  {unitActionLabels(activeItem, isRevalidationDivisionTab).reject}
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<ApproveIcon />}
                  disabled={actionLoading}
                  onClick={onApproveUnit}
                  sx={approverTheme.dialog.approveAction}
                >
                  {unitActionLabels(activeItem, isRevalidationDivisionTab).approve}
                </Button>
              </Stack>
            ) : null
          ) : partialNavItems.length > 0 ? (
            <Typography sx={{ fontSize: "0.74rem", color: palette.textSub }}>
              {S.UNIT_APPROVER_NO_ACTIONABLE}
            </Typography>
          ) : null}
        </>
      ) : null}

      <QCDivisionDetailsContent
        detailView={detailView}
        row={{
          status: formStatus || detailView.status,
          qcDivStatus: formStatus || detailView.status,
        }}
        formData={formData}
        subDepartmentId={subDepartmentId ?? undefined}
        loading={false}
        schemaLoading={schemaLoading || loading}
        activeDivisionGroupIndex={activeDivisionGroupIndex}
        activeDivisionSubIndex={activeDivisionSubIndex}
        onActiveDivisionGroupIndexChange={onActiveDivisionGroupIndexChange}
        onActiveDivisionSubIndexChange={onActiveDivisionSubIndexChange}
        theme={qcTheme}
        resetOnFormId={detailView.formId}
        showBatchSection={false}
        hideEntryGroupNav={divisionNavTabs.length > 0 || partialNavItems.length > 0}
      />
    </Stack>
  );
};

export default QCDivisionApproverReviewContent;
