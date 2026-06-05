import React from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Typography,
  Divider,
  Chip,               // ← Added here
} from "@mui/material";

import { icons } from "../../../../../../app/theme/icons"

import UserAvatar from "../../../../../components/common/UserAvatar";
import RoleChip from "../../../../../components/custom/RoleChip";
import StatusChip from "../../../../../components/common/StatusChip";
import UserActions from "../../../../../components/common/UserActions";
import SkeletonRow from "../../../../../components/common/SkeletonRow";
import SubDeptChips from "../../../../../components/custom/SubDeptChips";

// Shared utilities
import {
  roleConfig,
  statusConfig,
  getDeptConfig,
  getDisplayName,
  getUsername,
  getDept,
  getSubDepts,
  getStatus,
  getCreatedOn,
  getCreatedBy,
} from "./UserConfigs";

// const TABLE_COLS = [
//   "User", "Username", "Role", "Department",
//   "Sub-Departments", "Status", "Created On", "Created By", "Actions",
// ];

const TABLE_COLS = [
  "User", "Username", "Role", 
  "Sub-Departments", "Status", "Actions",
];

const UserListTable = ({
  paginated,
  filtered,
  loading,
  departments,
  page,
  totalCount,
  rowsPerPage,
  t,
  onEdit,
  onDelete,
  onPageChange,
  onRowsPerPageChange,
}: any) => {
  const { table, tableCell } = t;

  return (
    <Paper elevation={0} sx={table.paper}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {TABLE_COLS.map(h => (
                <TableCell key={h} sx={{
                  ...table.headerCell,
                  ...(h === "Actions" && table.headerCellActions),
                }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, i) => (
                <SkeletonRow key={i} columns={TABLE_COLS.length} sx={table.cell} />
              ))
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={TABLE_COLS.length} sx={table.emptyCell}>
                  <icons.userMgmt.personOutline sx={table.emptyIcon} />
                  <Typography sx={table.emptyText}>No users found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map(user => {
                const name = getDisplayName(user);
                const dept = getDept(user);
                const dc = getDeptConfig(dept, departments);
                const normalizedRole = String(user?.role ?? "").trim().toLowerCase();
                const showNotApplicableSubDepartments =
                  normalizedRole === "admin" || normalizedRole === "system manager";

                return (
                  <TableRow key={user.id} sx={table.row}>
                    <TableCell sx={table.cell}>
                      <Box sx={tableCell.userBox}>
                        <UserAvatar name={name} />
                        <Typography sx={tableCell.userName}>{name}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell sx={table.cell}>
                      <Box sx={tableCell.usernameBox}>
                        <icons.userMgmt.userId sx={tableCell.usernameIcon} />
                        <Typography sx={tableCell.usernameText}>{getUsername(user)}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell sx={table.cell}>
                      <RoleChip role={user.role} />
                    </TableCell>

                    {/* <TableCell sx={table.cell}>
                      <Chip label={dept} size="small" sx={tableCell.deptChip(dc)} />
                    </TableCell> */}

                    <TableCell sx={table.cellSubDepts}>
                      {showNotApplicableSubDepartments ? (
                        <Chip label="Not Applicable" size="small" sx={tableCell.subDeptChip} />
                      ) : (
                        <SubDeptChips
                          subDepts={getSubDepts(user)}
                          chipSx={tableCell.subDeptChip}
                        />
                      )}
                    </TableCell>

                    <TableCell sx={table.cell}>
                      <StatusChip status={getStatus(user)} />
                    </TableCell>

                    {/* <TableCell sx={table.cell}>
                      {getCreatedOn(user) ? (
                        <Box>
                          <Typography sx={tableCell.createdOnDate}>
                            {new Date(getCreatedOn(user)).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </Typography>
                          <Typography sx={tableCell.createdOnTime}>
                            {new Date(getCreatedOn(user)).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography sx={tableCell.createdOnEmpty}>—</Typography>
                      )}
                    </TableCell>

                    <TableCell sx={table.cell}>
                      {getCreatedBy(user) ? (
                        <Box>
                          <Box sx={tableCell.createdByBox}>
                            <icons.userMgmt.userId sx={tableCell.createdByIcon} />
                            <Typography sx={tableCell.createdByUsername}>
                              {getCreatedBy(user).username}
                            </Typography>
                          </Box>
                          <RoleChip role={getCreatedBy(user).role} size="small" />
                        </Box>
                      ) : (
                        <Typography sx={tableCell.createdByEmpty}>—</Typography>
                      )}
                    </TableCell> */}

                    <TableCell sx={table.cellActionsWrapper}>
                      <UserActions
                        onEdit={() => onEdit(user)}
                        onDelete={() => onDelete(user)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={table.divider} />
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 8, 15, 25]}
        sx={table.pagination}
      />
    </Paper>
  );
};

export default UserListTable;