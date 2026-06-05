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
  IconButton,
  Tooltip,
} from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import SkeletonRow from "../../../../components/common/SkeletonRow";

import {
  getProjectId,
  getProjectName,
  getProjectDescription,
  formatDateTime,
} from "./ProjectConfigs";

const TABLE_COLS = [
  "Project ID",
  "Project Name",
  "Description",
  "Created On",
  "Actions",
];

const ProjectListTable = ({
  data = [],
  loading = false,
  page = 0,
  totalCount = 0,
  rowsPerPage = 10,
  t,
  onEdit,
  onDelete,
  onPageChange,
  onRowsPerPageChange,
}: any) => {
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length);

  return (
    <TableContainer component={Paper} sx={t.table.containerSx}>
      <Table stickyHeader>
        <TableHead>
          <TableRow sx={t.table.headerRow}>
            {TABLE_COLS.map((col) => (
              <TableCell key={col} sx={t.table.headerCell}>
                <Typography sx={t.table.headerText}>{col}</Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading
            ? Array.from({ length: Math.min(5, rowsPerPage) }).map((_, idx) => (
                <SkeletonRow
                  key={`skeleton-${idx}`}
                  columns={TABLE_COLS.length}
                  sx={t.table.bodyRow}
                />
              ))
            : data.map((project: any) => (
                <TableRow key={project.projectId} sx={t.table.bodyRow}>
                  <TableCell sx={t.table.bodyCell}>
                    <Typography sx={t.table.bodyText}>
                      {getProjectId(project)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={t.table.bodyCell}>
                    <Typography sx={t.table.bodyText}>
                      {getProjectName(project)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={t.table.bodyCell}>
                    <Typography sx={t.table.bodyText} noWrap>
                      {getProjectDescription(project)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={t.table.bodyCell}>
                    <Typography sx={t.table.bodyText}>
                      {formatDateTime(project.createdOn)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={t.table.bodyCell}>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(project)}
                          sx={t.table.actionButton}
                        >
                          <icons.Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => onDelete(project)}
                          sx={t.table.actionButton}
                        >
                          <icons.Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}

          {!loading && emptyRows > 0 && (
            <TableRow style={{ height: 56 * emptyRows }}>
              <TableCell colSpan={TABLE_COLS.length} sx={t.table.emptyCell}>
                <Typography sx={t.table.emptyText}>No projects found</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        sx={t.table.pagination}
      />
    </TableContainer>
  );
};

export default ProjectListTable;
