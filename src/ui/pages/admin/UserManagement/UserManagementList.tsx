import React, { useMemo } from "react";
import { Box, Button, Typography, Chip, IconButton, Tooltip } from "@mui/material";

import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import UserAvatar from "@ui/components/common/UserAvatar";
import RoleChip from "@ui/components/custom/RoleChip";
import StatusChip from "@ui/components/common/StatusChip";
import SubDeptChips from "@ui/components/custom/SubDeptChips";
import TemporaryPasswordReveal from "@ui/components/common/TemporaryPasswordReveal";
import AdminManagementDataTable from "@ui/components/custom/admin/AdminManagementDataTable";
import type { AdminManagementColumn } from "@ui/components/custom/admin/AdminManagementDataTable";

import {
  getDisplayName,
  getUserId,
  getSubDepts,
  getStatus,
} from "@utils/userManagementUtils";

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
  onActivate: (user: any) => void;
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
  onActivate,
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
              <UserAvatar name={name} size={30} sx={tableCell.avatar} />
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
          const normalizedRole = String(user?.role ?? "").trim().toLowerCase();
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
        id: "passwordChange",
        label: S.TABLE_COLS[4],
        render: (user) => {
          const needChange = Boolean(user.mustChangePassword);
          if (!needChange) {
            return (
              <Chip
                label={S.TABLE.PASSWORD_NO}
                size="small"
                sx={{ fontWeight: 600, fontSize: "0.72rem" }}
              />
            );
          }
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
              <Chip
                label={S.TABLE.PASSWORD_NEED_TO_DO}
                size="small"
                color="warning"
                sx={{ fontWeight: 700, fontSize: "0.72rem", width: "fit-content" }}
              />
              {user.temporaryPassword ? (
                <TemporaryPasswordReveal
                  password={user.temporaryPassword}
                  label={S.TABLE.TEMP_PASSWORD_LABEL}
                />
              ) : null}
            </Box>
          );
        },
      },
      {
        id: "status",
        label: S.TABLE_COLS[5],
        render: (user) => <StatusChip status={getStatus(user)} />,
      },
      {
        id: "actions",
        label: S.TABLE_COLS[6],
        isActions: true,
        render: (user) => {
          const isActive = getStatus(user) === "Active";
          if (!isActive) {
            return (
              <Box sx={tableCell.actionsBox}>
                <Tooltip title={S.ACTIONS.ACTIVATE_USER_TOOLTIP}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<icons.userMgmt.activeStatus sx={{ fontSize: 16 }} />}
                    onClick={() => onActivate(user)}
                    sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.72rem" }}
                  >
                    {S.ACTIONS.ACTIVATE_USER}
                  </Button>
                </Tooltip>
              </Box>
            );
          }
          return (
            <Box sx={tableCell.actionsBox}>
              <Tooltip title="Edit user">
                <IconButton size="small" onClick={() => onEdit(user)} sx={tableCell.editButton}>
                  <icons.Edit sx={tableCell.editIcon} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete user">
                <IconButton size="small" onClick={() => onDelete(user)} sx={tableCell.deleteButton}>
                  <icons.Delete sx={tableCell.deleteIcon} />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [tableCell, onEdit, onDelete, onActivate]
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
