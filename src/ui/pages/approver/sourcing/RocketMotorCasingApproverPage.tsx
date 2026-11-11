import { useMemo, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Stack,
  Typography,
  Chip,
  Card,
  CircularProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";

import { useThemeStore } from "../../../../app/store/themeStore";
import { getRocketMotorCasingApproverTheme } from "../../../../app/theme/custom_themes/approver/sourcing/rocketMotorCasingApprover_theme";
import getApproverSourcingFilterStyles from "./approverSourcingFilterStyles";
import DateField from "../../../components/common/DateField";
import {
  formatDisplayDateTime,
  formatToIsoDateInput,
  formatToUiDate,
} from "../../../../utils/dateUtils";
import dayjs from "dayjs";
import {
  canApproverViewBatchDetails,
  isApproverActionableStatus,
} from "../../../../app/theme/approver";
import { icons } from "../../../../app/theme/icons";
import useRocketMotorCasingApproverHook, {
  type RocketMotorCasingApproverAppliedFilters,
} from "../../../../hooks/approver/sourcing/useRocketMotorCasingApproverHook";
import { formatMotorStageLabel } from "../../../../data/models/approver/RocketMotorCasingApproverModel";
import ApproverList from "../components/ApproverList";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import FilterPanelHeader from "@ui/components/common/FilterPanelHeader";
import FilterToggleButton from "../../../components/common/FilterToggleButton";
import { STRINGS } from "../../../../app/config/strings";
import RefreshIconButton from "@/ui/components/common/RefreshIconButton";
import { getFromToOrderMessages } from "../../../../data/validation/dateRangeValidation";
import { RefreshRounded } from "@mui/icons-material";
import { useApproverListRefreshStore } from "@/app/store/approverListRefreshStore";
import RocketCasingDetailDialog from "./components/RocketCasingDetailDialog";

const BL = STRINGS.SOURCING.BATCH_LIST;

const CASING_TYPES = ["COMPOSITE", "METALLIC"] as const;
const INSULATION_TYPES = ["ROCASIN", "EPDM"] as const;

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  visibility: VisibilityRoundedIcon,
} = icons.approver.sourcing.rocketMotorCasing;

const formatListDate = (value?: string) => {
  if (!value) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY") : value;
};

const RocketMotorApproverPage = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getRocketMotorCasingApproverTheme(mode), [mode]);
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
    motorStageOptions,
    motorStagesLoading,
    statusFilter,
    setStatusFilter,
    statusTabs,
    statusDropdownValues,
    filterAllLabel,
  } = useRocketMotorCasingApproverHook();

  const bumpListVersion = useApproverListRefreshStore((state) => state.bumpVersion);

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftMotorStage, setDraftMotorStage] = useState(filterAllLabel);
  const [draftCasingType, setDraftCasingType] = useState(filterAllLabel);
  const [draftInsulationType, setDraftInsulationType] = useState(filterAllLabel);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [draftStatus, setDraftStatus] = useState(filterAllLabel);

  const syncDraftFromApplied = () => {
    setDraftMotorStage(appliedFilters.motorStage || filterAllLabel);
    setDraftCasingType(appliedFilters.casingType || filterAllLabel);
    setDraftInsulationType(appliedFilters.insulationType || filterAllLabel);
    setDraftFrom(appliedFilters.fromDate);
    setDraftTo(appliedFilters.toDate);
    setDraftStatus(statusFilter);
  };

  const filterToggleSx = useMemo(
    () => ({
      filterBtn: (active: boolean) => ({
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.5,
        py: 0.75,
        borderRadius: 2,
        border: `1.5px solid ${active ? theme.palette.primaryLight : theme.palette.border}`,
        bgcolor: active ? alpha(theme.palette.primaryLight, 0.08) : "transparent",
        color: active ? theme.palette.primaryLight : theme.palette.textSub,
        cursor: "pointer",
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

  const draftDateRangeErrors = getFromToOrderMessages(draftFrom, draftTo, "date");

  const handleApplyPanelFilters = () => {
    if (draftDateRangeErrors) return;

    const next: RocketMotorCasingApproverAppliedFilters & { status: string } = {
      motorStage: draftMotorStage === filterAllLabel ? "" : draftMotorStage,
      casingType: draftCasingType === filterAllLabel ? "" : draftCasingType,
      insulationType: draftInsulationType === filterAllLabel ? "" : draftInsulationType,
      fromDate: draftFrom,
      toDate: draftTo,
      status: draftStatus,
    };
    applyPanelFilters(next);
    setFilterOpen(false);
  };

  const handleClearAllFilters = () => {
    clearListFilters();
    setDraftMotorStage(filterAllLabel);
    setDraftCasingType(filterAllLabel);
    setDraftInsulationType(filterAllLabel);
    setDraftFrom("");
    setDraftTo("");
    setDraftStatus(filterAllLabel);
  };

  const searchBarEnd = (
    <Stack direction="row" spacing={1} alignItems="center">
      <FilterToggleButton
        label={BL.FILTERS_TOGGLE}
        count={activeFilterCount}
        isOpen={filterOpen}
        onClick={() => {
          if (!filterOpen) syncDraftFromApplied();
          setFilterOpen((open) => !open);
        }}
        sx={filterToggleSx.filterBtn(filterOpen || activeFilterCount > 0)}
        iconSx={filterToggleSx.filterBtnIcon}
        textSx={filterToggleSx.filterBtnText}
        badgeSx={filterToggleSx.filterBadgePill}
        chevronSx={filterToggleSx.filterBtnChevron}
      />
      <RefreshIconButton
        onClick={() => {
          bumpListVersion();
        }}
        tooltip={STRINGS.SOURCING.BATCH_LIST.REFRESH_TOOLTIP}
        icon={<RefreshRounded fontSize="small" />}
      />
    </Stack>
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
        title={BL.FILTERS_TITLE_MOTOR}
        count={activeFilterCount}
        onClear={handleClearAllFilters}
        clearLabel={BL.FILTERS_CLEAR}
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
            label={BL.FILTERS_MOTOR_STAGE}
            value={draftMotorStage}
            onChange={(event) => setDraftMotorStage(event.target.value)}
            disabled={motorStagesLoading}
            fullWidth
            sx={filterStyles.field}
            SelectProps={filterStyles.selectProps}
          >
            <MenuItem value={filterAllLabel}>{BL.FILTERS_ALL_STAGES}</MenuItem>
            {!motorStagesLoading &&
              motorStageOptions.map((stage) => (
                <MenuItem key={stage.motorStage} value={stage.motorStage}>
                  Stage {stage.motorStage}
                </MenuItem>
              ))}
          </TextField>
          {motorStagesLoading ? (
            <CircularProgress size={18} sx={{ mt: 0.75, color: theme.palette.primaryLight }} />
          ) : null}
        </Stack>

        <TextField
          select
          size="small"
          label={BL.FILTERS_CASING_TYPE}
          value={draftCasingType}
          onChange={(event) => setDraftCasingType(event.target.value)}
          sx={filterStyles.fieldWide}
          SelectProps={filterStyles.selectProps}
        >
          <MenuItem value={filterAllLabel}>{BL.FILTERS_ALL_CASING_TYPES}</MenuItem>
          {CASING_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label={BL.FILTERS_INSULATION_TYPE}
          value={draftInsulationType}
          onChange={(event) => setDraftInsulationType(event.target.value)}
          sx={filterStyles.fieldWide}
          SelectProps={filterStyles.selectProps}
        >
          <MenuItem value={filterAllLabel}>{BL.FILTERS_ALL_INSULATION}</MenuItem>
          {INSULATION_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label={BL.FILTERS_STATUS}
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

        <DateField
          label={BL.FILTERS_FROM_DATE}
          value={formatToUiDate(draftFrom)}
          onChange={(value) => setDraftFrom(formatToIsoDateInput(value))}
          compact
          error={Boolean(draftDateRangeErrors?.from)}
          helperText={draftDateRangeErrors?.from}
          sx={filterStyles.fieldDate}
        />
        <DateField
          label={BL.FILTERS_TO_DATE}
          value={formatToUiDate(draftTo)}
          minDate={formatToUiDate(draftFrom)}
          onChange={(value) => setDraftTo(formatToIsoDateInput(value))}
          compact
          error={Boolean(draftDateRangeErrors?.to)}
          helperText={draftDateRangeErrors?.to}
          sx={filterStyles.fieldDate}
        />
      </Stack>

      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setFilterOpen(false)}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          {BL.FILTERS_CLOSE_PANEL}
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
          {BL.FILTERS_APPLY}
        </Button>
      </Stack>
    </Stack>
  ) : null;

  const tableColumns = [
    BL.COL_MOTOR_CASING_ID,
    BL.COL_PROJECT_ID,
    BL.COL_MOTOR_STAGE,
    BL.COL_MOTOR_ID,
    BL.COL_CASING_TYPE,
    BL.COL_INSULATION_TYPE,
    BL.COL_RECEIVING_DATE,
    BL.COL_CREATED_BY,
    BL.COL_CREATED_ON,
    BL.COL_STAGE_STATUS,
  ];

  return (
    <ApproverList
      department="sourcing"
      subDepartment="rocket-motor"
      statusField="status"
      statusMeta={statusMeta}
      statusTabsOverride={statusTabs}
      activeStatusOverride={statusFilter}
      onActiveStatusChange={setStatusFilter}
      listFilters={listFiltersRecord}
      searchBarEnd={searchBarEnd}
      filterExtension={filterExtension}
      searchKeys={[
        "motorCasingId",
        "projectId",
        "motorStage",
        "motorId",
        "casingType",
        "insulationType",
        "submittedBy",
      ]}
      searchPlaceholder={STRINGS.APPROVER.LIST.SEARCH_PLACEHOLDER([
        "motor casing ID",
        "project ID",
        "motor ID",
        "casing type",
      ])}
    >
      {(filtered) => (
        <>
          <Card sx={theme.table.containerCard} elevation={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {tableColumns.map((header) => (
                      <TableCell key={header} sx={theme.table.headerCell}>
                        {header}
                      </TableCell>
                    ))}
                    <TableCell sx={{ ...theme.table.headerCell, textAlign: "center" }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row: any, idx: number) => {
                    const canViewDetails = canApproverViewBatchDetails(row.status, {
                      allowWhenApproved: true,
                    });
                    return (
                      <TableRow
                        key={row.motorCasingId ?? row.id ?? row.formId ?? idx}
                        sx={theme.table.row(idx)}
                      >
                        <TableCell sx={theme.table.bodyCell}>
                          <Typography sx={theme.table.batchIdText}>
                            {row.motorCasingId ?? row.batchId}
                          </Typography>
                        </TableCell>
                        <TableCell sx={theme.table.bodyCell}>
                          <Typography sx={theme.table.subtleText}>
                            {row.projectId ?? "—"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={theme.table.bodyCell}>
                          <Chip
                            label={
                              row.motorStageLabel ??
                              formatMotorStageLabel(row.motorStage ?? row.motorType)
                            }
                            size="small"
                            sx={theme.chips.type}
                          />
                        </TableCell>
                        <TableCell sx={{ ...theme.table.bodyCell, ...theme.table.subtleText }}>
                          {row.motorId ?? row.motorNo ?? "—"}
                        </TableCell>
                        <TableCell sx={theme.table.bodyCell}>
                          <Chip label={row.casingType ?? "—"} size="small" sx={theme.chips.type} />
                        </TableCell>
                        <TableCell sx={theme.table.bodyCell}>
                          <Chip
                            label={row.insulationType ?? "—"}
                            size="small"
                            sx={theme.chips.type}
                          />
                        </TableCell>
                        <TableCell sx={{ ...theme.table.bodyCell, ...theme.table.dateText }}>
                          {formatListDate(row.receivingDate)}
                        </TableCell>
                        <TableCell sx={theme.table.bodyCell}>{row.submittedBy ?? "—"}</TableCell>
                        <TableCell sx={{ ...theme.table.bodyCell, ...theme.table.dateText }}>
                          {formatDisplayDateTime(row.createdOn)}
                        </TableCell>
                        <TableCell sx={theme.table.bodyCell}>
                          <Chip
                            label={row.status}
                            size="small"
                            sx={theme.chips.status(statusMeta[row.status])}
                          />
                        </TableCell>
                        <TableCell sx={{ ...theme.table.bodyCell, ...theme.table.actionCell }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={
                              <VisibilityRoundedIcon sx={{ fontSize: "13px !important" }} />
                            }
                            onClick={() => handleViewDetails(row)}
                            disabled={!canViewDetails}
                            sx={theme.table.actionButton(canViewDetails)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <RocketCasingDetailDialog
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

export default RocketMotorApproverPage;
