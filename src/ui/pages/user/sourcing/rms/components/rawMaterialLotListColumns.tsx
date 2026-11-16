import { Chip, Typography } from "@mui/material";

import { STRINGS } from "@app/config/strings";
import { icons } from "@app/theme/icons";
import { OPERATION_STATUS } from "@hooks/operationStatus";
import { formatDisplayDate, formatDisplayDateTime } from "@utils/dateUtils";
import IconText from "@ui/components/common/IconText";
import type { BatchTableColumn } from "@ui/components/custom/BatchTable";
import UserWorkflowStatusCell from "@ui/components/custom/UserWorkflowStatusCell";

const BL = STRINGS.SOURCING.BATCH_LIST;
const { person: PersonRoundedIcon, calendar: CalendarMonthRoundedIcon } =
  icons.user.sourcing.rawMaterialBatchList;

/** Minimal theme shape shared by user page theme and approver list (batchList tokens). */
export type RawMaterialLotListColumnTheme = {
  palette?: Record<string, unknown>;
  batchList: {
    icon?: object;
    subtleText?: object;
    normalText?: object;
    batchIdText?: object;
    batchTypeChip?: object;
    statusConfig?: Record<string, unknown>;
    chips?: { reasonText?: object };
  };
};

export type RawMaterialLotListColumnOptions = {
  /** Row field for status chips — user: `rmStatus`, approver: `status`. */
  statusField?: string;
  /** Dot path for created-by display — user: `createdBy.fullName`, approver: `submittedBy`. */
  createdByKey?: string;
};

/** `BatchList` / `BatchTable` column config for the raw material lot list (user + approver). */
export const getRawMaterialLotListColumns = (
  theme: RawMaterialLotListColumnTheme,
  statusConfig: Record<string, any>,
  options: RawMaterialLotListColumnOptions = {},
): BatchTableColumn[] => {
  const { batchList } = theme;
  const statusField = options.statusField ?? "rmStatus";
  const createdByKey = options.createdByKey ?? "createdBy.fullName";

  const dateCell = (text: string) => (
    <IconText
      icon={<CalendarMonthRoundedIcon sx={batchList.icon} />}
      text={text}
      textSx={batchList.subtleText}
    />
  );

  return [
    {
      key: "lotId",
      label: BL.COL_LOT_ID,
      render: (v: string) => <Typography sx={batchList.batchIdText}>{v}</Typography>,
    },
    {
      key: "sourcingId",
      label: BL.COL_SOURCING_ID,
      render: (v: string) => <Typography sx={batchList.normalText}>{v || "—"}</Typography>,
    },
    {
      key: "materialCode",
      label: BL.COL_MATERIAL_CODE,
      align: "center",
      render: (v: string) => <Chip label={v} size="small" sx={batchList.batchTypeChip} />,
    },
    {
      key: "materialName",
      label: BL.COL_MATERIAL_NAME,
      render: (v: string) => <Typography sx={batchList.normalText}>{v}</Typography>,
    },
    {
      key: "supplyOrderNo",
      label: BL.COL_SUPPLY_ORDER,
      render: (v: string) => <Typography sx={batchList.subtleText}>{v}</Typography>,
    },
    {
      key: "receiptDate",
      label: BL.COL_RECEIPT_DATE,
      render: (v: string) => dateCell(formatDisplayDate(v)),
    },
    {
      key: "manufacturerName",
      label: BL.COL_MANUFACTURER,
      render: (v: string) => <Typography sx={batchList.subtleText}>{v}</Typography>,
    },
    {
      key: createdByKey,
      label: BL.COL_CREATED_BY,
      render: (v: string) => (
        <IconText
          icon={<PersonRoundedIcon sx={batchList.icon} />}
          text={v ?? BL.UNASSIGNED}
          textSx={batchList.subtleText}
        />
      ),
    },
    {
      key: "createdOn",
      label: BL.COL_CREATED_ON,
      render: (v: string) => dateCell(formatDisplayDateTime(v)),
    },
    {
      key: statusField,
      label: BL.COL_RM_STATUS,
      align: "center",
      render: (v: string, row: any) => (
        <UserWorkflowStatusCell
          status={v}
          statusConfig={statusConfig}
          rejectedStatus={OPERATION_STATUS.REJECTED}
          rejectionReason={row.rejectionReason}
          theme={theme}
        />
      ),
    },
  ];
};
