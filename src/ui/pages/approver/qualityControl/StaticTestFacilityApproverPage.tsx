import React, { useMemo, useState } from "react";
import { alpha, Button, Chip, Typography } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { useThemeStore } from "@/app/store/themeStore";
import getRawMaterialPreparationApproverTheme from "@/app/theme/custom_themes/approver/manufacturing/rawMaterialPreparationApprover_theme";
import { APPROVER_STATUS_META, canApproverViewBatchDetails } from "@/app/theme/approver";
import { STRINGS } from "@/app/config/strings";

import useStfApproverHook from "@/hooks/approver/qualityControl/useStfApproverHook";
import useOtherBemApproverHook from "@/hooks/approver/qualityControl/useOtherBemApproverHook";
import {
  normalizeApproverBatchStatus,
  getApproverBatchStatusDisplayLabel,
} from "@/data/models/approver/ApproverBatchListModel";

import ApproverSubdepartmentBatchListSection from "../components/ApproverSubdepartmentBatchListSection";
import ApproverActionDialog from "@/ui/components/custom/ApproverActionDialog";
import STFApproverDetailDialog from "./STFApproverDetailDialog";
import ToggleTabs, { ToggleTabOption } from "@/ui/components/common/ToggleTabs";
import BemMotorListTable, { type ColumnConfig } from "../../user/qualityControl/StaticTestFacility/BemMotorListTable";
import {
  mapBemMotorStatusCountsForUi,
  resolveBemMotorStatusTabs,
} from "@/hooks/user/qualityControl/stfFlowConfig";

const BRAND = {
  primary: "#1B4F72",
  qc: "#1565C0",
  qcLight: "#1976D2",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  textSub: "#5D6D7E",
};

export const QC_STATUS_META = APPROVER_STATUS_META;

const formatCreatedOn = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const buildBemApproverColumns = (
  statusMeta: typeof QC_STATUS_META,
  brand: typeof BRAND,
  onViewDetails: (row: any) => void,
): ColumnConfig[] => [
  {
    id: "motorId",
    label: "BEM Motor ID",
    render: (row) => (
      <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: brand.qc }}>
        {row.motorId ?? "—"}
      </Typography>
    ),
  },
  {
    id: "stfTestNo",
    label: "STF Test No.",
    cellSx: { fontSize: "0.78rem", color: brand.textSub },
    render: (row) => row.stfTestNo || "—",
  },
  {
    id: "subType",
    label: "Sub Type",
    render: (row) => (
      <Chip
        label={row.subType ?? "BEM"}
        size="small"
        sx={{
          height: 20,
          fontSize: "0.62rem",
          fontWeight: 700,
          background: alpha(brand.qcLight, 0.1),
          color: brand.qcLight,
          border: `1px solid ${alpha(brand.qcLight, 0.2)}`,
        }}
      />
    ),
  },
  {
    id: "createdBy",
    label: "Created By",
    cellSx: { fontSize: "0.78rem" },
    render: (row) => row.createdBy ?? "—",
  },
  {
    id: "createdAt",
    label: "Created On",
    cellSx: { color: brand.textSub, fontSize: "0.76rem", whiteSpace: "nowrap" },
    render: (row) => formatCreatedOn(row.createdAt ?? row.createdOn),
  },
  {
    id: "status",
    label: "Status",
    render: (row) => {
      const status = normalizeApproverBatchStatus(row.status);
      const meta = statusMeta[status] as { bg?: string; color?: string; border?: string } | undefined;
      return (
        <Chip
          label={getApproverBatchStatusDisplayLabel(status) || "—"}
          size="small"
          sx={{
            height: 20,
            fontSize: "0.62rem",
            fontWeight: 700,
            background: meta?.bg,
            color: meta?.color,
            border: `1px solid ${meta?.border ?? alpha(brand.border, 0.6)}`,
          }}
        />
      );
    },
  },
  {
    id: "actions",
    label: "Action",
    align: "center",
    render: (row) => {
      const status = normalizeApproverBatchStatus(row.status);
      const canView = canApproverViewBatchDetails(status, { allowWhenApproved: true });
      return (
        <Button
          size="small"
          variant="outlined"
          startIcon={<VisibilityRoundedIcon sx={{ fontSize: "13px !important" }} />}
          onClick={() => onViewDetails(row)}
          disabled={!canView}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            fontSize: "0.72rem",
            textTransform: "none",
            px: 1.5,
            py: 0.6,
            borderColor: canView ? brand.qc : brand.border,
            color: canView ? brand.qc : alpha(brand.textSub, 0.4),
            "&:hover": { background: alpha(brand.qc, 0.06) },
            "&:disabled": { borderColor: brand.border },
          }}
        >
          {STRINGS.APPROVER.COMMON.VIEW_DETAILS}
        </Button>
      );
    },
  },
];

const MOTOR_TAB_OPTIONS: ToggleTabOption[] = [
  { label: "ACEM Motors", value: "acem" },
  { label: "Other BEM Motors", value: "other_bem" },
];

const STFApproverPage = () => {
  const [activeMotorTab, setActiveMotorTab] = useState<string>("acem");
  const mode = useThemeStore((state) => state.mode);
  const approverTheme = useMemo(() => getRawMaterialPreparationApproverTheme(mode), [mode]);

  // ACEM Hook & State
  const {
    items: acemItems,
    selected: acemSelected,
    detailsLoading: acemDetailsLoading,
    activeMotorId: acemActiveMotorId,
    dialogProps: acemDialogProps,
    actionLoading: acemActionLoading,
    requestApprove: acemRequestApprove,
    requestReject: acemRequestReject,
    handleViewDetails: acemHandleViewDetails,
    handleCloseDetail: acemHandleCloseDetail,
    handleActiveMotorChange: acemHandleActiveMotorChange,
  } = useStfApproverHook();

  // Other BEM Hook & State
  const {
    items: otherBemItems,
    listLoading: otherBemLoading,
    totalRecords: otherBemTotal,
    page: otherBemPage,
    limit: otherBemLimit,
    search: otherBemSearch,
    statusFilter: otherBemStatus,
    setPage: setOtherBemPage,
    setLimit: setOtherBemLimit,
    setSearch: setOtherBemSearch,
    setStatusFilter: setOtherBemStatus,
    statusCounts: otherBemStatusCounts,
    selected: otherBemSelected,
    detailsLoading: otherBemDetailsLoading,
    detailView: otherBemDetailView,
    dialogProps: otherBemDialogProps,
    requestApprove: otherBemRequestApprove,
    requestReject: otherBemRequestReject,
    handleViewDetails: otherBemHandleViewDetails,
    handleCloseDetail: otherBemHandleCloseDetail,
  } = useOtherBemApproverHook();

  return (
    <React.Fragment>
      <ToggleTabs value={activeMotorTab} options={MOTOR_TAB_OPTIONS} onChange={setActiveMotorTab} />

      {activeMotorTab === "acem" ? (
        <ApproverSubdepartmentBatchListSection
          department="qualityControl"
          subDepartment="static-test-facility"
          items={acemItems}
          statusField="stfStatus"
          statusMeta={QC_STATUS_META}
          onViewDetails={acemHandleViewDetails}
          allowViewDetailsWhenApproved
          tableTheme={{
            accentMain: BRAND.qc,
            accentLight: BRAND.qcLight,
            borderColor: BRAND.border,
            surfaceColor: BRAND.surface,
            textSubColor: BRAND.textSub,
            primaryColor: BRAND.primary,
          }}
        >
          <STFApproverDetailDialog
            open={!!acemSelected}
            onClose={acemHandleCloseDetail}
            item={acemSelected}
            loading={acemDetailsLoading}
            activeMotorId={acemActiveMotorId}
            onActiveMotorChange={acemHandleActiveMotorChange}
            onApprove={acemRequestApprove}
            onReject={acemRequestReject}
            actionLoading={acemActionLoading}
            theme={approverTheme}
            subDepartment="static-test-facility"
          />
          <ApproverActionDialog {...acemDialogProps} />
        </ApproverSubdepartmentBatchListSection>
      ) : (
        <React.Fragment>
          <BemMotorListTable
            rows={otherBemItems}
            totalRecords={otherBemTotal}
            page={otherBemPage - 1}
            rowsPerPage={otherBemLimit}
            search={otherBemSearch}
            activeStatus={otherBemStatus}
            loading={otherBemLoading}
            statusMeta={QC_STATUS_META}
            statusCounts={mapBemMotorStatusCountsForUi(otherBemStatusCounts, otherBemTotal)}
            statusTabs={resolveBemMotorStatusTabs(mapBemMotorStatusCountsForUi(otherBemStatusCounts, otherBemTotal))}
            customColumns={buildBemApproverColumns(QC_STATUS_META, BRAND, otherBemHandleViewDetails)}
            onPageChange={(newPage) => setOtherBemPage(newPage + 1)}
            onRowsPerPageChange={(newLimit) => {
              setOtherBemLimit(newLimit);
              setOtherBemPage(1);
            }}
            onSearchChange={(val) => {
              setOtherBemSearch(val);
              setOtherBemPage(1);
            }}
            onStatusChange={(newStatus) => {
              setOtherBemStatus(newStatus);
              setOtherBemPage(1);
            }}
          />

          {/* Details Dialog for Other BEM Motors */}
          <STFApproverDetailDialog
            open={!!otherBemSelected}
            onClose={otherBemHandleCloseDetail}
            item={otherBemSelected}
            detailView={otherBemDetailView}
            loading={otherBemDetailsLoading}
            onApprove={otherBemRequestApprove}
            onReject={otherBemRequestReject}
            theme={approverTheme}
            subDepartment="other-bem-motors"
          />
          <ApproverActionDialog {...otherBemDialogProps} />
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default STFApproverPage;
