import { useMemo } from "react";
import { Chip, Typography } from "@mui/material";

import { STRINGS } from "@app/config/strings";
import { canApproverViewBatchDetails } from "@app/theme/approver";
import { icons } from "@app/theme/icons";
import type { getRawMaterialSourcingApproverTheme } from "@app/theme/custom_themes/approver/sourcing/rms/rawMaterialSourcingApprover_theme";
import { formatDisplayDate, formatDisplayDateTime } from "@utils/dateUtils";
import AppButton from "@ui/components/common/Button";
import Card from "@ui/components/common/Card";
import DataTable, { type DataTableColumn } from "@ui/components/common/DataTable";

const BL = STRINGS.SOURCING.BATCH_LIST;
const { visibility: VisibilityRoundedIcon } = icons.approver.sourcing.rawMaterialSourcing;

type RawMaterialApproverLotTableProps = {
  rows: any[];
  theme: ReturnType<typeof getRawMaterialSourcingApproverTheme>;
  statusMeta: Record<string, any>;
  onViewDetails: (row: any) => void;
};

const RawMaterialApproverLotTable = ({
  rows,
  theme,
  statusMeta,
  onViewDetails,
}: RawMaterialApproverLotTableProps) => {
  const { table, chips } = theme;

  const columns = useMemo<DataTableColumn<any>[]>(
    () => [
      {
        key: "lotId",
        header: BL.COL_LOT_ID,
        render: (row) => (
          <Typography sx={table.batchIdText}>{row.lotId ?? row.batchId}</Typography>
        ),
      },
      {
        key: "sourcingId",
        header: BL.COL_SOURCING_ID,
        render: (row) => <Typography sx={table.subtleText}>{row.sourcingId ?? "—"}</Typography>,
      },
      {
        key: "materialCode",
        header: BL.COL_MATERIAL_CODE,
        render: (row) => (
          <Chip label={row.materialCode ?? row.batchType} size="small" sx={chips.type} />
        ),
      },
      {
        key: "materialName",
        header: BL.COL_MATERIAL_NAME,
        render: (row) => (
          <Typography sx={table.materialNameText}>{row.materialName ?? "—"}</Typography>
        ),
      },
      {
        key: "supplyOrderNo",
        header: BL.COL_SUPPLY_ORDER,
        cellSx: table.subtleText,
        render: (row) => row.supplyOrderNo ?? "—",
      },
      {
        key: "receiptDate",
        header: BL.COL_RECEIPT_DATE,
        cellSx: table.dateText,
        render: (row) => formatDisplayDate(row.receiptDate),
      },
      {
        key: "manufacturerName",
        header: BL.COL_MANUFACTURER,
        cellSx: table.subtleText,
        render: (row) => row.manufacturerName ?? "—",
      },
      { key: "submittedBy", header: BL.COL_CREATED_BY, render: (row) => row.submittedBy },
      {
        key: "createdOn",
        header: BL.COL_CREATED_ON,
        cellSx: table.dateText,
        render: (row) => formatDisplayDateTime(row.createdOn),
      },
      {
        key: "status",
        header: BL.COL_RM_STATUS,
        render: (row) => (
          <Chip label={row.status} size="small" sx={chips.status(statusMeta[row.status])} />
        ),
      },
      {
        key: "action",
        header: "Action",
        headerSx: table.actionHeaderCell,
        cellSx: table.actionCell,
        render: (row) => {
          const canViewDetails = canApproverViewBatchDetails(row.status, {
            allowWhenApproved: true,
          });
          return (
            <AppButton
              size="small"
              variant="outlined"
              fullWidth={false}
              startIcon={<VisibilityRoundedIcon sx={table.actionButtonIcon} />}
              onClick={() => onViewDetails(row)}
              disabled={!canViewDetails}
              sx={table.actionButton(canViewDetails)}
            >
              View Details
            </AppButton>
          );
        },
      },
    ],
    [table, chips, statusMeta, onViewDetails],
  );

  return (
    <Card sx={table.containerCard} elevation={0} disableContent>
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(row, index) => row.lotId ?? row.id ?? row.formId ?? index}
        headerCellSx={table.headerCell}
        bodyCellSx={table.bodyCell}
        rowSx={(_row, index) => table.row(index)}
      />
    </Card>
  );
};

export default RawMaterialApproverLotTable;
