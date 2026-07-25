import React, { useMemo } from "react";
import { Box, Typography, Chip } from "@mui/material";

import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import UserAvatar from "@ui/components/common/UserAvatar";
import RoleChip from "@ui/components/custom/RoleChip";
import StatusChip from "@ui/components/common/StatusChip";
import UserActions from "@ui/components/common/UserActions";
import SubDeptChips from "@ui/components/custom/SubDeptChips";
import AdminManagementDataTable from "@ui/components/custom/admin/AdminManagementDataTable";
import type { AdminManagementColumn } from "@ui/components/custom/admin/AdminManagementDataTable";

import { getDisplayName, getUserId, getSubDepts, getStatus } from "@utils/userManagementUtils";

const S = STRINGS.USER_MANAGEMENT;

type UserListTableProps = {
  paginated: any[];
  loading: boolean;
  page: number;
  totalCount: number;
  rowsPerPage: number;
  t: any;
  onEdit: (user: any) => void;
  onDelete: (user: any) => void;
  onPageChange: (event: unknown, page: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const UserListTable = ({
  paginated,
  loading,
  page,
  totalCount,
  rowsPerPage,
  t,
  onEdit,
  onDelete,
  onPageChange,
  onRowsPerPageChange,
}: UserListTableProps) => {
  const { table, tableCell } = t;

  const columns = useMemo<AdminManagementColumn<any>[]>(
    () => [
      {
        id: "user",
        label: S.TABLE_COLS[0],
        render: (user) => {
          const name = getDisplayName(user);
          return (
            <Box sx={tableCell.userBox}>
              <UserAvatar name={name} />
              <Typography sx={tableCell.userName}>{name}</Typography>
            </Box>
          );
        },
      },
      {
        id: "userId",
        label: S.TABLE_COLS[1],
        render: (user) => (
          <Box sx={tableCell.usernameBox}>
            <icons.userMgmt.userId sx={tableCell.usernameIcon} />
            <Typography sx={tableCell.usernameText}>{getUserId(user)}</Typography>
          </Box>
        ),
      },
      {
        id: "role",
        label: S.TABLE_COLS[2],
        render: (user) => <RoleChip role={user.role} />,
      },
      {
        id: "subDepts",
        label: S.TABLE_COLS[3],
        cellSx: table.cellSubDepts,
        render: (user) => {
          const normalizedRole = String(user?.role ?? "")
            .trim()
            .toLowerCase();
          const showNotApplicable =
            normalizedRole === "admin" || normalizedRole === "system manager";
          return showNotApplicable ? (
            <Chip label={S.TABLE.NOT_APPLICABLE} size="small" sx={tableCell.subDeptChip} />
          ) : (
            <SubDeptChips subDepts={getSubDepts(user)} chipSx={tableCell.subDeptChip} />
          );
        },
      },
      {
        id: "status",
        label: S.TABLE_COLS[4],
        render: (user) => <StatusChip status={getStatus(user)} />,
      },
      // {
      //   id: "actions",
      //   label: S.TABLE_COLS[5],
      //   isActions: true,
      //   render: (user) => (
      //     <UserActions onEdit={() => onEdit(user)} onDelete={() => onDelete(user)} />
      //   ),
      // },
    ],
    [tableCell, onEdit, onDelete],
  );

  return (
    <AdminManagementDataTable
      columns={columns}
      rows={paginated}
      rowKey={(user) => user.id ?? user.userUUID ?? user.username}
      loading={loading}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      emptyState={{
        icon: <icons.userMgmt.personOutline sx={table.emptyIcon} />,
        message: S.TABLE.EMPTY,
      }}
      theme={t}
    />
  );
};

export default UserListTable;
