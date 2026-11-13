import type { ReactNode } from "react";
import { Chip, type SxProps, type Theme } from "@mui/material";

import DataTable, { type DataTableColumn } from "@ui/components/common/DataTable";

type SxObject = Record<string, unknown>;

export type SpecificationResultRow = {
  key: string;
  specification: ReactNode;
  refRange: string;
  analysedResult: string;
  acemQcResult: string;
  failed?: boolean;
  /** Shown only when the table has a status column. */
  statusLabel?: string | null;
};

export type SpecificationResultTableStyles = {
  container?: SxProps<Theme>;
  headerCell: SxObject | ((columnIndex: number) => SxObject);
  row: (index: number, failed: boolean) => SxProps<Theme>;
  refChip: SxObject;
  cells: {
    specification?: SxObject;
    refRange?: SxObject;
    analysedResult?: (failed: boolean) => SxObject;
    acemQcResult?: SxObject;
    status?: SxObject;
  };
  statusChip?: (failed: boolean) => SxObject;
};

type SpecificationResultTableProps = {
  rows: SpecificationResultRow[];
  styles: SpecificationResultTableStyles;
  /** Extra columns rendered before the specification columns (e.g. material, lot). */
  leadingColumns?: DataTableColumn<SpecificationResultRow>[];
  showStatus?: boolean;
};

const HEADERS = {
  specification: "Qualification Parameter",
  refRange: "Specification",
  analysedResult: "Analyze Result @ Source",
  acemQcResult: "ACEM QC Result",
  status: "Status",
};

/** Read-only qualification parameter / specification / result table. */
const SpecificationResultTable = ({
  rows,
  styles,
  leadingColumns = [],
  showStatus = false,
}: SpecificationResultTableProps) => {
  const columns: DataTableColumn<SpecificationResultRow>[] = [
    ...leadingColumns,
    {
      key: "specification",
      header: HEADERS.specification,
      cellSx: styles.cells.specification,
      render: (row) => row.specification,
    },
    {
      key: "refRange",
      header: HEADERS.refRange,
      cellSx: styles.cells.refRange,
      render: (row) => <Chip label={row.refRange} size="small" sx={styles.refChip} />,
    },
    {
      key: "analysedResult",
      header: HEADERS.analysedResult,
      cellSx: (row) => styles.cells.analysedResult?.(Boolean(row.failed)) ?? {},
      render: (row) => row.analysedResult || "—",
    },
    {
      key: "acemQcResult",
      header: HEADERS.acemQcResult,
      cellSx: styles.cells.acemQcResult,
      render: (row) => row.acemQcResult || "—",
    },
    ...(showStatus
      ? [
          {
            key: "status",
            header: HEADERS.status,
            cellSx: styles.cells.status,
            render: (row: SpecificationResultRow) =>
              row.statusLabel ? (
                <Chip
                  label={row.statusLabel}
                  size="small"
                  sx={styles.statusChip?.(Boolean(row.failed))}
                />
              ) : (
                "—"
              ),
          },
        ]
      : []),
  ];

  return (
    <DataTable
      size="small"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.key}
      containerSx={styles.container}
      headerCellSx={styles.headerCell}
      rowSx={(row, index) => styles.row(index, Boolean(row.failed))}
    />
  );
};

export default SpecificationResultTable;
