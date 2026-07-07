import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Stack,
  Typography,
  Chip,
  Card,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";

import { useThemeStore } from "../../../../app/store/themeStore";
import { getRawMaterialApproverTheme } from "../../../../app/theme/custom_themes/approver/sourcing/rawMaterialApprover_theme";
import getApproverSourcingFilterStyles from "./approverSourcingFilterStyles";
import { isApproverActionableStatus } from "../../../../app/theme/approver";
import { icons } from "../../../../app/theme/icons";
import useRawMaterialApproverHook, {
  type RawMaterialApproverAppliedFilters,
} from "../../../../hooks/approver/sourcing/useRawMaterialApproverHook";
import ApproverList from "../components/ApproverList";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import FilterPanelHeader from "../../../components/custom/FilterPanelHeader";
import FilterToggleButton from "../../../components/custom/FilterToggleButton";
import { ReportPreviewDialog } from "../components/ReportPdf";
import { STRINGS } from "../../../../app/config/strings";

const BL = STRINGS.SOURCING.BATCH_LIST;

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  visibility: VisibilityRoundedIcon,
  close: CloseRoundedIcon,
  inventory: InventoryRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.sourcing.rawMaterialProcurement;

// ─── Dialog ───────────────────────────────────────────────────────────────────

type DetailDialogProps = {
  open: boolean;
  onClose: () => void;
  item: any | null;
  loading: boolean;
  onApprove: (item: any) => void;
  onReject: (item: any) => void;
  theme: ReturnType<typeof getRawMaterialApproverTheme>;
};

const RawMaterialDetailDialog = ({ open, onClose, item, loading, onApprove, onReject, theme }: DetailDialogProps) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: theme.dialog.paper }}>
        <Box sx={theme.dialog.header}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <InventoryRoundedIcon sx={theme.dialog.headerIcon} />
            <Box>
              <Typography sx={theme.dialog.headerTitle}>Raw Material Submission</Typography>
              <Typography sx={theme.dialog.headerSubtitle}>
                {item.lotId ?? item.batchId} · {item.materialName ?? item.materialCode}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center">
            <Button
              size="small"
              variant="contained"
              startIcon={<PictureAsPdfRoundedIcon sx={{ fontSize: "14px !important" }} />}
              onClick={() => setPdfOpen(true)}
              sx={theme.dialog.pdfButton}
            >
              View as PDF
            </Button>
            <IconButton onClick={onClose} size="small" sx={theme.dialog.closeButton}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={theme.dialog.content}>
          {loading ? (
            <Box sx={theme.dialog.loadingContainer}>
              <CircularProgress size={32} sx={theme.dialog.loadingSpinner} />
              <Typography sx={theme.dialog.loadingText}>Loading raw material details...</Typography>
            </Box>
          ) : item.qcBlocks?.length ? (
            item.qcBlocks.map((block: any, bi: number) => (
              <Box key={bi} sx={theme.dialog.blockWrapper(bi === item.qcBlocks.length - 1)}>
                <Stack direction="row" alignItems="center" gap={1} mb={1}>
                  <Chip label={block.material} size="small" sx={theme.chips.material} />
                  <Typography sx={theme.dialog.blockMeta}>
                    Man. Lot/Batch No.:{" "}
                    <Box component="span" sx={theme.dialog.blockMetaStrong}>
                      {block.lotNo || "—"}
                    </Box>
                  </Typography>
                </Stack>
                <TableContainer sx={theme.dialog.innerTableContainer}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {["Material", "Man. Lot/Batch No.", "Specification", "Ref. Range", "Analyzed Result", "Remarks"].map(
                          (h, i) => (
                            <TableCell key={h} sx={theme.dialog.innerHeaderCell(i === 0)}>
                              {h}
                            </TableCell>
                          ),
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {block.rows.map((row: any, ri: number) => (
                        <TableRow key={ri} sx={theme.dialog.innerRow(ri)}>
                          <TableCell sx={theme.dialog.innerCell}>
                            {ri === 0 && <Chip label={block.material} size="small" sx={theme.chips.inlineMaterial} />}
                          </TableCell>
                          <TableCell sx={theme.dialog.innerLotText}>{ri === 0 ? block.lotNo || "—" : ""}</TableCell>
                          <TableCell sx={theme.dialog.innerSpecText}>{row.specification}</TableCell>
                          <TableCell sx={theme.dialog.innerCell}>
                            <Chip label={row.refRange} size="small" sx={theme.chips.refRange} />
                          </TableCell>
                          <TableCell sx={theme.dialog.innerResultText}>{row.analysedResult || "—"}</TableCell>
                          <TableCell sx={theme.dialog.innerRemarksText}>{row.remarks || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))
          ) : (
            <Typography sx={theme.dialog.emptyText}>No raw material details available for this form.</Typography>
          )}
        </DialogContent>

        <Box sx={theme.dialog.footer}>
          <Button variant="outlined" onClick={onClose} sx={theme.dialog.closeAction}>
            Close
          </Button>
          <Button variant="contained" startIcon={<CancelRoundedIcon />} onClick={() => onReject(item)} disabled={loading} sx={theme.dialog.rejectAction}>
            Reject
          </Button>
          <Button variant="contained" startIcon={<CheckCircleRoundedIcon />} onClick={() => onApprove(item)} disabled={loading} sx={theme.dialog.approveAction}>
            Approve
          </Button>
        </Box>
      </Dialog>

      <ReportPreviewDialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        formId={item.lotId ?? item.batchId}
        department="sourcing"
        subDepartment="raw-material"
        dialogTitle={`Raw Material Report — ${item.lotId ?? item.batchId}`}
      />
    </>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const RawMaterialApproverPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getRawMaterialApproverTheme(mode), [mode]);
  const filterStyles = useMemo(() => getApproverSourcingFilterStyles(mode), [mode]);

  const {
    selected,
    detailsLoading,
    dialogProps,
    requestApprove,
    requestReject,
    handleViewDetails,
    handleCloseDetail,
    statusMeta,
    appliedFilters,
    applyPanelFilters,
    clearListFilters,
    activeFilterCount,
    listFiltersRecord,
    materialOptions,
    materialsLoading,
    statusFilter,
    setStatusFilter,
    statusTabs,
    statusDropdownValues,
    filterAllLabel,
  } = useRawMaterialApproverHook();

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftMaterial, setDraftMaterial] = useState(filterAllLabel);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftStatus, setDraftStatus] = useState(filterAllLabel);

  const syncDraftsFromApplied = useCallback(() => {
    setDraftMaterial(appliedFilters.materialCode || filterAllLabel);
    setDraftFrom(appliedFilters.fromDate);
    setDraftTo(appliedFilters.toDate);
    setDraftStatus(statusFilter);
  }, [appliedFilters, filterAllLabel, statusFilter]);

  const filterWasOpen = useRef(false);
  useEffect(() => {
    if (filterOpen && !filterWasOpen.current) {
      syncDraftsFromApplied();
    }
    filterWasOpen.current = filterOpen;
  }, [filterOpen, syncDraftsFromApplied]);

  useEffect(() => {
    if (!filterOpen) return;
    setDraftStatus(statusFilter);
  }, [statusFilter, filterOpen]);

  const filterToggleSx = useMemo(
    () => ({
      filterBtn: (active: boolean) => ({
        display: "flex",
        alignItems: "center",
        gap: 0.6,
        cursor: "pointer",
        flexShrink: 0,
        px: 1.2,
        py: 0.55,
        borderRadius: 2,
        border: `1px solid ${active ? theme.palette.primaryLight : alpha(theme.palette.primaryLight, 0.35)}`,
        bgcolor: active ? alpha(theme.palette.primaryLight, 0.1) : "transparent",
        color: active ? theme.palette.primaryLight : theme.palette.textSub,
        transition: "all 0.15s",
        userSelect: "none",
        "&:hover": {
          bgcolor: alpha(theme.palette.primaryLight, 0.08),
          borderColor: theme.palette.primaryLight,
          color: theme.palette.primaryLight,
        },
      }),
      filterBtnText: { fontSize: "0.72rem", fontWeight: 700, lineHeight: 1 },
      filterBtnIcon: { fontSize: 14 },
      filterBtnChevron: { fontSize: 14, ml: 0.2 },
      filterBadgePill: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: alpha(theme.palette.primaryLight, 0.2),
        color: theme.palette.primaryLight,
        borderRadius: "50%",
        width: 16,
        height: 16,
        fontSize: "0.58rem",
        fontWeight: 800,
      },
    }),
    [theme.palette],
  );

  const handleApplyPanelFilters = () => {
    let from = draftFrom;
    let to = draftTo;
    if (from && to && from > to) {
      const swap = from;
      from = to;
      to = swap;
    }

    const next: RawMaterialApproverAppliedFilters & { status: string } = {
      materialCode: draftMaterial === filterAllLabel ? "" : draftMaterial,
      fromDate: from,
      toDate: to,
      status: draftStatus,
    };
    applyPanelFilters(next);
    setFilterOpen(false);
  };

  const handleClearAllFilters = () => {
    clearListFilters();
    setDraftMaterial(filterAllLabel);
    setDraftFrom("");
    setDraftTo("");
    setDraftStatus(filterAllLabel);
  };

  const formatReceiptDate = (value?: string) => {
    if (!value) return "—";
    const parsed = dayjs(value);
    return parsed.isValid()
      ? parsed.format("DD MMM YYYY")
      : value;
  };

  const searchBarEnd = (
    <FilterToggleButton
      label={STRINGS.SOURCING.BATCH_LIST.FILTERS_TOGGLE}
      count={activeFilterCount}
      isOpen={filterOpen}
      onClick={() => setFilterOpen((open) => !open)}
      sx={filterToggleSx.filterBtn(filterOpen || activeFilterCount > 0)}
      iconSx={filterToggleSx.filterBtnIcon}
      textSx={filterToggleSx.filterBtnText}
      badgeSx={filterToggleSx.filterBadgePill}
      chevronSx={filterToggleSx.filterBtnChevron}
    />
  );

  const filterExtension = filterOpen ? (
    <Stack
      spacing={1.5}
      sx={{
        mt: 1.5,
        pt: 2,
        borderTop: `1px solid ${alpha(theme.palette.border, 0.55)}`,
      }}
    >
      <FilterPanelHeader
        title={STRINGS.SOURCING.BATCH_LIST.FILTERS_TITLE}
        count={activeFilterCount}
        onClear={handleClearAllFilters}
        clearLabel={STRINGS.SOURCING.BATCH_LIST.FILTERS_CLEAR}
        containerSx={{ alignItems: "center", pb: 0.5 }}
        iconSx={{ fontSize: 18, color: theme.palette.primaryLight }}
        labelSx={{ fontSize: "0.82rem", fontWeight: 700, color: theme.palette.text }}
        badgeSx={{
          minWidth: 20,
          height: 20,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.65rem",
          fontWeight: 800,
          bgcolor: alpha(theme.palette.primaryLight, 0.15),
          color: theme.palette.primaryLight,
        }}
        clearChipSx={{
          fontWeight: 700,
          fontSize: "0.75rem",
          height: "28px",
          px: 0.5,
          borderColor: alpha(theme.palette.danger, 0.35),
          color: theme.palette.danger,
          "& .MuiChip-label": { px: 1.5 },
        }}
      />

      <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} flexWrap="wrap" useFlexGap>
        <Stack
          direction="row"
          spacing={1}
          alignItems="flex-start"
          sx={{ minWidth: { xs: "100%", sm: 180 }, flex: { lg: "0 0 auto" } }}
        >
          <TextField
            select
            size="small"
            label={STRINGS.SOURCING.BATCH_LIST.FILTERS_MATERIAL}
            value={draftMaterial}
            onChange={(event) => setDraftMaterial(event.target.value)}
            disabled={materialsLoading}
            fullWidth
            sx={filterStyles.field}
            SelectProps={filterStyles.selectProps}
          >
            <MenuItem value={filterAllLabel}>{STRINGS.SOURCING.BATCH_LIST.FILTERS_ALL_MATERIALS}</MenuItem>
            {!materialsLoading &&
              materialOptions.map((material) => (
                <MenuItem key={material.materialCode} value={material.materialCode}>
                  {material.materialCode} — {material.materialName}
                </MenuItem>
              ))}
          </TextField>
          {materialsLoading ? (
            <CircularProgress size={18} sx={{ mt: 0.75, color: theme.palette.primaryLight }} />
          ) : null}
        </Stack>

        <TextField
          select
          size="small"
          label={STRINGS.SOURCING.BATCH_LIST.FILTERS_STATUS}
          value={draftStatus}
          onChange={(event) => setDraftStatus(event.target.value)}
          sx={filterStyles.fieldWide}
          SelectProps={filterStyles.selectProps}
        >
          {statusDropdownValues.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={STRINGS.SOURCING.BATCH_LIST.FILTERS_FROM_DATE}
            format="YYYY-MM-DD"
            value={draftFrom ? dayjs(draftFrom) : null}
            onChange={(value) => setDraftFrom(value && value.isValid() ? value.format("YYYY-MM-DD") : "")}
            slotProps={{
              textField: {
                size: "small",
                sx: filterStyles.fieldDate,
              },
            }}
          />
          <DatePicker
            label={STRINGS.SOURCING.BATCH_LIST.FILTERS_TO_DATE}
            format="YYYY-MM-DD"
            value={draftTo ? dayjs(draftTo) : null}
            onChange={(value) => setDraftTo(value && value.isValid() ? value.format("YYYY-MM-DD") : "")}
            slotProps={{
              textField: {
                size: "small",
                sx: filterStyles.fieldDate,
              },
            }}
          />
        </LocalizationProvider>
      </Stack>

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setFilterOpen(false)}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {STRINGS.SOURCING.BATCH_LIST.FILTERS_CLOSE_PANEL}
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleApplyPanelFilters}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            bgcolor: theme.palette.primary,
            "&:hover": { bgcolor: theme.palette.primaryLight },
          }}
        >
          {STRINGS.SOURCING.BATCH_LIST.FILTERS_APPLY}
        </Button>
      </Stack>
    </Stack>
  ) : null;

  return (
    <ApproverList
      department="sourcing"
      subDepartment="raw-material"
      statusField="status"
      statusMeta={statusMeta}
      statusTabsOverride={statusTabs}
      activeStatusOverride={statusFilter}
      onActiveStatusChange={setStatusFilter}
      listFilters={listFiltersRecord}
      searchBarEnd={searchBarEnd}
      filterExtension={filterExtension}
      searchKeys={["lotId", "procurementId", "materialCode", "materialName", "supplyOrderNo", "manufacturerName", "submittedBy"]}
      searchPlaceholder={STRINGS.APPROVER.LIST.SEARCH_PLACEHOLDER([
        "lot ID",
        "procurement ID",
        "material code",
        "manufacturer",
      ])}
    >
      {(filtered) => (
        <>
          <Card sx={theme.table.containerCard} elevation={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {[
                      BL.COL_LOT_ID,
                      BL.COL_PROCUREMENT_ID,
                      BL.COL_MATERIAL_CODE,
                      BL.COL_MATERIAL_NAME,
                      BL.COL_SUPPLY_ORDER,
                      BL.COL_RECEIPT_DATE,
                      BL.COL_MANUFACTURER,
                      BL.COL_CREATED_BY,
                      BL.COL_CREATED_ON,
                      BL.COL_RM_STATUS,
                    ].map((h) => (
                      <TableCell key={h} sx={theme.table.headerCell}>{h}</TableCell>
                    ))}
                    <TableCell sx={{ ...theme.table.headerCell, textAlign: "center" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row: any, idx: number) => (
                    <TableRow key={row.lotId ?? row.id ?? row.formId ?? idx} sx={theme.table.row(idx)}>
                      <TableCell sx={theme.table.bodyCell}>
                        <Typography sx={theme.table.batchIdText}>{row.lotId ?? row.batchId}</Typography>
                      </TableCell>
                      <TableCell sx={theme.table.bodyCell}>
                        <Typography sx={theme.table.subtleText}>{row.procurementId ?? "—"}</Typography>
                      </TableCell>
                      <TableCell sx={theme.table.bodyCell}>
                        <Chip label={row.materialCode ?? row.batchType} size="small" sx={theme.chips.type} />
                      </TableCell>
                      <TableCell sx={theme.table.bodyCell}>
                        <Typography sx={{ fontSize: "0.82rem" }}>{row.materialName ?? "—"}</Typography>
                      </TableCell>
                      <TableCell sx={{ ...theme.table.bodyCell, ...theme.table.subtleText }}>
                        {row.supplyOrderNo ?? "—"}
                      </TableCell>
                      <TableCell sx={{ ...theme.table.bodyCell, ...theme.table.dateText }}>
                        {formatReceiptDate(row.receiptDate)}
                      </TableCell>
                      <TableCell sx={{ ...theme.table.bodyCell, ...theme.table.subtleText }}>
                        {row.manufacturerName ?? "—"}
                      </TableCell>
                      <TableCell sx={theme.table.bodyCell}>{row.submittedBy}</TableCell>
                      <TableCell sx={{ ...theme.table.bodyCell, ...theme.table.dateText }}>
                        {new Date(row.createdOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </TableCell>
                      <TableCell sx={theme.table.bodyCell}>
                        <Chip label={row.status} size="small" sx={theme.chips.status(statusMeta[row.status])} />
                      </TableCell>
                      <TableCell sx={{ ...theme.table.bodyCell, ...theme.table.actionCell }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityRoundedIcon sx={{ fontSize: "13px !important" }} />}
                          onClick={() => handleViewDetails(row)}
                          disabled={!isApproverActionableStatus(row.status)}
                          sx={theme.table.actionButton(isApproverActionableStatus(row.status))}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <RawMaterialDetailDialog
            open={!!selected}
            onClose={handleCloseDetail}
            item={selected}
            loading={detailsLoading}
            onApprove={requestApprove}
            onReject={requestReject}
            theme={theme}
          />

          <ApproverActionDialog {...dialogProps} />
        </>
      )}
    </ApproverList>
  );
};

export default RawMaterialApproverPage;
