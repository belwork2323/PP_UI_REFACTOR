import React, { useMemo } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import AdminManagementDataTable from "@ui/components/custom/admin/AdminManagementDataTable";
import type { AdminManagementColumn } from "@ui/components/custom/admin/AdminManagementDataTable";
import {
  getProjectId,
  getProjectName,
  getProjectDescription,
  formatDateTime,
} from "@utils/projectManagementUtils";

const S = STRINGS.PROJECT_MANAGEMENT;

type ProjectManagementListProps = {
  paginated: any[];
  loading: boolean;
  page: number;
  totalCount: number;
  rowsPerPage: number;
  t: any;
  onEdit: (project: any) => void;
  onDelete: (project: any) => void;
  onPageChange: (event: unknown, page: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const ProjectManagementList = ({
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
}: ProjectManagementListProps) => {
  const { table } = t;

  const columns = useMemo<AdminManagementColumn<any>[]>(
    () => [
      {
        id: "projectId",
        label: S.TABLE_COLS[0],
        render: (project) => <Typography sx={table.bodyText}>{getProjectId(project)}</Typography>,
      },
      {
        id: "projectName",
        label: S.TABLE_COLS[1],
        render: (project) => <Typography sx={table.bodyText}>{getProjectName(project)}</Typography>,
      },
      {
        id: "description",
        label: S.TABLE_COLS[2],
        render: (project) => (
          <Typography sx={table.bodyText}>{getProjectDescription(project)}</Typography>
        ),
      },
      {
        id: "createdOn",
        label: S.TABLE_COLS[3],
        render: (project) => (
          <Typography sx={table.bodyText}>{formatDateTime(project.createdOn)}</Typography>
        ),
      },
      // {
      //   id: "actions",
      //   label: S.TABLE_COLS[4],
      //   isActions: true,
      //   render: (project) => (
      //     <UserActions
      //       onEdit={() => onEdit(project)}
      //       onDelete={() => onDelete(project)}
      //     />
      //   ),
      // },
    ],
    [onDelete, onEdit],
  );

  return (
    <AdminManagementDataTable
      columns={columns}
      rows={paginated}
      rowKey={(project) => project.projectId}
      loading={loading}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      emptyState={{
        icon: <icons.projectMgmt.emptyProject sx={t.table.emptyIcon} />,
        message: S.TABLE.EMPTY,
      }}
      theme={t}
    />
  );
};

export default ProjectManagementList;
