import { TableCell, Typography } from "@mui/material";
import { STRINGS } from "@app/config/strings";
import type { MasterDataAuditFields, MasterDataPersonInfo } from "@data/models/admin/MasterData/MasterDataModel";

const S = STRINGS.MASTER_DATA;

export const MASTER_DATA_AUDIT_COLUMN_COUNT = 4;

export const formatMasterDataPerson = (person?: MasterDataPersonInfo | null) => {
  const name = person?.fullName?.trim();
  if (name) return name;
  const id = person?.id?.trim();
  return id || "—";
};

export const formatMasterDataDateTime = (value?: string | null) => {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

type TableTheme = {
  headerCell: object;
  cell: object;
  bodyText: object;
};

type HeaderProps = {
  table: TableTheme;
};

export const MasterDataAuditHeaderCells = ({ table }: HeaderProps) => (
  <>
    <TableCell sx={table.headerCell}>{S.TABLE.COL_CREATED_BY}</TableCell>
    <TableCell sx={table.headerCell}>{S.TABLE.COL_CREATED_ON}</TableCell>
    <TableCell sx={table.headerCell}>{S.TABLE.COL_UPDATED_BY}</TableCell>
    <TableCell sx={table.headerCell}>{S.TABLE.COL_UPDATED_ON}</TableCell>
  </>
);

type RowProps = {
  record?: Partial<MasterDataAuditFields> | null;
  table: TableTheme;
};

export const MasterDataAuditRowCells = ({ record, table }: RowProps) => (
  <>
    <TableCell sx={table.cell}>
      <Typography sx={table.bodyText} noWrap>
        {formatMasterDataPerson(record?.createdBy)}
      </Typography>
    </TableCell>
    <TableCell sx={table.cell}>
      <Typography sx={table.bodyText} noWrap>
        {formatMasterDataDateTime(record?.createdOn)}
      </Typography>
    </TableCell>
    <TableCell sx={table.cell}>
      <Typography sx={table.bodyText} noWrap>
        {formatMasterDataPerson(record?.updatedBy)}
      </Typography>
    </TableCell>
    <TableCell sx={table.cell}>
      <Typography sx={table.bodyText} noWrap>
        {formatMasterDataDateTime(record?.updatedOn)}
      </Typography>
    </TableCell>
  </>
);
