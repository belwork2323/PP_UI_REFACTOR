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
import useInsulationSpecMasterHook from "@hooks/admin/MasterData/useInsulationSpecMasterHook";
import type { InsulationSpecListPayload } from "@data/models/admin/MasterData/InsulationSpecMasterModel";
import InsulationSpecMasterFormDialog from "./InsulationSpecMasterFormDialog";

const S = STRINGS.MASTER_DATA;

type Props = {
  activeFilter: "ALL" | "ACTIVE" | "INACTIVE";
  refreshKey?: number;
  t: any;
  onListPayloadChange?: (payload: InsulationSpecListPayload | null) => void;
  onStatsChange?: (stats: { total: number; active: number; inactive: number }) => void;
};

const InsulationSpecMasterPanel = ({
  activeFilter,
  refreshKey,
  t,
  onListPayloadChange,
  onStatsChange,
}: Props) => {
  const hook = useInsulationSpecMasterHook({
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
            placeholder="Search insulation type…"
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
                <TableCell sx={table.headerCell}>Type</TableCell>
                <TableCell sx={table.headerCell}>Categories</TableCell>
                <TableCell sx={table.headerCell}>Parameters</TableCell>
                <TableCell sx={table.headerCell}>Active</TableCell>
                <TableCell sx={{ ...table.headerCell, ...table.headerCellActions }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hook.loading ? (
                <SkeletonRow columns={5} />
              ) : hook.paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={table.emptyCell}>
                    <icons.Inventory sx={table.emptyIcon} />
                    <Typography sx={table.emptyText}>{S.TABLE.EMPTY}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                hook.paginated.map((row) => {
                  const paramCount = row.specifications.reduce(
                    (n, c) => n + (c.parameters?.length ?? 0),
                    0,
                  );
                  return (
                    <TableRow key={row.id} sx={table.row}>
                      <TableCell sx={table.cell}>
                        <Typography sx={table.bodyText}>{row.insulationType}</Typography>
                      </TableCell>
                      <TableCell sx={table.cell}>
                        <Typography sx={table.bodyText}>{row.specifications.length}</Typography>
                      </TableCell>
                      <TableCell sx={table.cell}>
                        <Typography sx={table.bodyText}>{paramCount}</Typography>
                      </TableCell>
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
                  );
                })
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

      <InsulationSpecMasterFormDialog
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
            ? S.DISABLE_DIALOG.BODY(String(hook.disableTarget.insulationType))
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

export default InsulationSpecMasterPanel;
