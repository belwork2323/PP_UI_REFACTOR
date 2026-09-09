import React from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { icons } from "@app/theme/icons";
import { STRINGS } from "@app/config/strings";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";
import SkeletonRow from "@ui/components/common/SkeletonRow";
import useMaterialsMasterHook from "@hooks/admin/MasterData/useMaterialsMasterHook";
import type { MaterialsMasterListPayload } from "@data/models/admin/MasterData/MaterialsMasterModel";
import MaterialsMasterFormDialog from "./MaterialsMasterFormDialog";

const S = STRINGS.MASTER_DATA;

type Props = {
  activeFilter: "ALL" | "ACTIVE" | "INACTIVE";
  refreshKey?: number;
  t: any;
  onListPayloadChange?: (payload: MaterialsMasterListPayload | null) => void;
  onStatsChange?: (stats: { total: number; active: number; inactive: number }) => void;
};

const MaterialsMasterPanel = ({
  activeFilter,
  refreshKey,
  t,
  onListPayloadChange,
  onStatsChange,
}: Props) => {
  const hook = useMaterialsMasterHook({
    activeFilter,
    refreshKey,
    onListPayloadChange,
    onStatsChange,
  });
  const { table, tableCell } = t;
  const searchTheme = t.batchListShell?.inputs;
  const formOpen = hook.inlineMode != null;
  const isEdit = hook.inlineMode === "edit";

  return (
    <Box>
      <Paper elevation={0} sx={table.paper}>
        <Box sx={t.tableSearchBar}>
          <TextField
            size="small"
            fullWidth
            margin="none"
            value={hook.search}
            onChange={(e) => hook.setSearch(e.target.value)}
            placeholder={S.TOOLBAR.SEARCH_PLACEHOLDER}
            sx={{
              ...(searchTheme?.search ?? t.searchField),
              m: 0,
              mb: 0,
              mt: 0,
              flex: 1,
              minWidth: 0,
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={searchTheme?.startIcon?.search} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Divider sx={table.divider} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={table.headerRow}>
                <TableCell sx={table.headerCell}>Code</TableCell>
                <TableCell sx={table.headerCell}>Name</TableCell>
                <TableCell sx={table.headerCell}>Type</TableCell>
                <TableCell sx={table.headerCell}>Raw type</TableCell>
                <TableCell sx={table.headerCell}>Grades</TableCell>
                <TableCell sx={table.headerCell}>Specs</TableCell>
                <TableCell sx={table.headerCell}>{S.TABLE.COL_ACTIVE}</TableCell>
                <TableCell sx={{ ...table.headerCell, ...table.headerCellActions }}>{S.TABLE.COL_ACTIONS}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hook.loading ? (
                <SkeletonRow columns={8} />
              ) : hook.paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography sx={table.emptyText}>{S.TABLE.EMPTY}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                hook.paginated.map((row) => (
                  <TableRow key={row.materialId} sx={table.row}>
                    <TableCell sx={table.cell}>
                      <Typography sx={table.bodyText}>{row.materialCode}</Typography>
                    </TableCell>
                    <TableCell sx={table.cell}>
                      <Typography sx={table.bodyText}>{row.materialName}</Typography>
                    </TableCell>
                    <TableCell sx={table.cell}>
                      <Chip size="small" label={row.materialType} variant="outlined" />
                    </TableCell>
                    <TableCell sx={table.cell}>
                      <Typography sx={table.bodyText}>
                        {row.rawMaterialType === "ACEM" ? "ACEM" : "Normal"}
                      </Typography>
                      {row.rawMaterialType === "ACEM" && row.preparationType ? (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {row.preparationType}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell sx={table.cell}>{row.grades.length}</TableCell>
                    <TableCell sx={table.cell}>{row.specifications.length}</TableCell>
                    <TableCell sx={table.cell}>
                      <Chip
                        size="small"
                        label={row.isActive ? S.TABLE.YES : S.TABLE.NO}
                        color={row.isActive ? "success" : "default"}
                        variant={row.isActive ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell sx={table.cellActionsWrapper}>
                      <Box sx={tableCell.actionsBox}>
                        <Tooltip title={S.TABLE.EDIT}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={hook.saving || formOpen}
                              onClick={() => hook.openEdit(row)}
                              sx={tableCell.editButton}
                            >
                              <icons.Edit sx={tableCell.editIcon} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={S.TABLE.DISABLE}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={!row.isActive || hook.saving || formOpen}
                              onClick={() => hook.setDisableTarget(row)}
                              sx={tableCell.deleteButton}
                            >
                              <icons.Delete sx={tableCell.deleteIcon} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={hook.items.length}
          page={hook.page}
          onPageChange={(_e, p) => hook.setPage(p)}
          rowsPerPage={hook.rowsPerPage}
          onRowsPerPageChange={(e) => hook.setRowsPerPage(Number(e.target.value))}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>

      <Box sx={t.addRowBar}>
        <Button
          variant="contained"
          startIcon={<icons.projectMgmt.add />}
          onClick={hook.openCreate}
          disabled={hook.loading || formOpen}
          sx={t.pageHeader.newProjectButton}
        >
          {S.PAGE.NEW_BUTTON}
        </Button>
      </Box>

      <MaterialsMasterFormDialog
        open={formOpen}
        isEdit={isEdit}
        form={hook.form}
        saving={hook.saving}
        onClose={hook.closeInline}
        onSave={() => void hook.saveForm()}
        onChange={hook.setForm}
        t={t}
      />

      <ConfirmAlertDialog
        open={!!hook.disableTarget}
        title={S.DISABLE_DIALOG.TITLE}
        message={
          hook.disableTarget
            ? S.DISABLE_DIALOG.BODY(hook.disableTarget.materialName || hook.disableTarget.materialCode)
            : ""
        }
        confirmLabel={hook.disabling ? S.DISABLE_DIALOG.DISABLING : S.DISABLE_DIALOG.CONFIRM}
        cancelLabel={S.DISABLE_DIALOG.CANCEL}
        onConfirm={hook.confirmDisable}
        onCancel={() => !hook.disabling && hook.setDisableTarget(null)}
        confirmDisabled={hook.disabling}
      />
    </Box>
  );
};

export default MaterialsMasterPanel;
