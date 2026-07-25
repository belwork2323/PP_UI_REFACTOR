import { alpha, Button, CircularProgress, MenuItem, Stack, TextField } from "@mui/material";
import FilterPanelHeader from "@ui/components/common/FilterPanelHeader";
import { STRINGS } from "../../../../../app/config/strings";
import { MANUFACTURING_BATCH_TYPE_OPTIONS } from "../../../../../data/models/user/SubdepartmentBatchModel";
import type { getOperationsTheme } from "../../../../../app/theme/custom_themes/shared/operations_theme";

const FILTER_ALL = STRINGS.USER_BATCH_LIST.FILTER_ALL;
const S = STRINGS.MANUFACTURING;

type OperationsTheme = ReturnType<typeof getOperationsTheme>;

type ProjectFilterOption = {
  projectId: string;
  projectName: string;
};

type ManufacturingBatchListFilterPanelProps = {
  theme: OperationsTheme;
  activeFilterCount: number;
  draftBatchId: string;
  draftBatchType: string;
  draftMotorId: string;
  draftMotorStage: string;
  draftProjectId: string;
  draftStatus: string;
  statusDropdownValues: readonly string[];
  statusConfig: Record<string, { label?: string }>;
  motorStageOptions: Array<{ motorStage: string }>;
  motorStagesLoading: boolean;
  projectOptions: ProjectFilterOption[];
  projectsLoading: boolean;
  filterPanelHeaderSx: Record<string, unknown>;
  onDraftBatchIdChange: (value: string) => void;
  onDraftBatchTypeChange: (value: string) => void;
  onDraftMotorIdChange: (value: string) => void;
  onDraftMotorStageChange: (value: string) => void;
  onDraftProjectIdChange: (value: string) => void;
  onDraftStatusChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
};

const ManufacturingBatchListFilterPanel = ({
  theme,
  activeFilterCount,
  draftBatchId,
  draftBatchType,
  draftMotorId,
  draftMotorStage,
  draftProjectId,
  draftStatus,
  statusDropdownValues,
  statusConfig,
  motorStageOptions,
  motorStagesLoading,
  projectOptions,
  projectsLoading,
  filterPanelHeaderSx,
  onDraftBatchIdChange,
  onDraftBatchTypeChange,
  onDraftMotorIdChange,
  onDraftMotorStageChange,
  onDraftProjectIdChange,
  onDraftStatusChange,
  onApply,
  onClear,
  onClose,
}: ManufacturingBatchListFilterPanelProps) => (
  <Stack
    spacing={1.5}
    sx={{
      mt: 1.5,
      pt: 2,
      borderTop: `1px solid ${alpha(theme.palette.border, 0.55)}`,
    }}
  >
    <FilterPanelHeader
      title={S.BATCH_LIST.FILTERS_TITLE}
      count={activeFilterCount}
      onClear={onClear}
      clearLabel={S.BATCH_LIST.FILTERS_CLEAR}
      containerSx={filterPanelHeaderSx.containerSx}
      iconSx={filterPanelHeaderSx.iconSx}
      labelSx={filterPanelHeaderSx.labelSx}
      badgeSx={filterPanelHeaderSx.badgeSx}
      clearChipSx={filterPanelHeaderSx.clearChipSx}
    />

    <Stack direction={{ xs: "column", lg: "row" }} spacing={1.25} flexWrap="wrap" useFlexGap>
      <TextField
        size="small"
        label={S.BATCH_LIST.COL_BATCH_ID}
        value={draftBatchId}
        onChange={(e) => onDraftBatchIdChange(e.target.value)}
        placeholder="e.g. BATCH-2026-001"
        sx={{
          ...theme.batchList.filterPanelField,
          minWidth: { xs: "100%", sm: 160 },
          flex: { lg: 1 },
        }}
      />

      <TextField
        select
        size="small"
        label={S.BATCH_LIST.COL_BATCH_TYPE}
        value={draftBatchType}
        onChange={(e) => onDraftBatchTypeChange(e.target.value)}
        sx={{ ...theme.batchList.filterPanelField, minWidth: { xs: "100%", sm: 160 } }}
        SelectProps={{
          MenuProps: {
            PaperProps: {
              sx: { "& .MuiMenuItem-root": theme.batchList.filterPanelMenuItem },
            },
          },
        }}
      >
        <MenuItem value={FILTER_ALL}>{S.BATCH_LIST.FILTERS_ALL_BATCH_TYPES}</MenuItem>
        {MANUFACTURING_BATCH_TYPE_OPTIONS.map((type) => (
          <MenuItem key={type} value={type}>
            {type === "MAIN" ? "Main scale" : "Sub scale"}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        size="small"
        label={S.BATCH_LIST.COL_MOTOR_ID}
        value={draftMotorId}
        onChange={(e) => onDraftMotorIdChange(e.target.value)}
        placeholder="e.g. MTR-445"
        sx={{ ...theme.batchList.filterPanelField, minWidth: { xs: "100%", sm: 160 } }}
      />

      <Stack
        direction="row"
        spacing={1}
        alignItems="flex-start"
        sx={{ minWidth: { xs: "100%", sm: 160 }, flex: { lg: "0 0 auto" } }}
      >
        <TextField
          select
          size="small"
          label={S.BATCH_LIST.COL_STAGE}
          value={draftMotorStage}
          onChange={(e) => onDraftMotorStageChange(e.target.value)}
          disabled={motorStagesLoading}
          fullWidth
          sx={theme.batchList.filterPanelField}
          SelectProps={{
            MenuProps: {
              PaperProps: {
                sx: { "& .MuiMenuItem-root": theme.batchList.filterPanelMenuItem },
              },
            },
          }}
        >
          <MenuItem value={FILTER_ALL}>{S.BATCH_LIST.FILTERS_ALL_STAGES}</MenuItem>
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

      <Stack
        direction="row"
        spacing={1}
        alignItems="flex-start"
        sx={{ minWidth: { xs: "100%", sm: 200 }, flex: { lg: "0 0 auto" }, position: "relative" }}
      >
        <TextField
          select
          size="small"
          label={S.BATCH_LIST.FILTERS_PROJECT}
          value={draftProjectId}
          onChange={(e) => onDraftProjectIdChange(e.target.value)}
          disabled={projectsLoading}
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={theme.batchList.filterPanelField}
          SelectProps={{
            displayEmpty: true,
            MenuProps: {
              PaperProps: {
                sx: { "& .MuiMenuItem-root": theme.batchList.filterPanelMenuItem },
              },
            },
          }}
        >
          <MenuItem value={FILTER_ALL}>{S.BATCH_LIST.FILTERS_ALL_PROJECTS}</MenuItem>
          {!projectsLoading &&
            projectOptions.map((project) => (
              <MenuItem key={project.projectId} value={project.projectId}>
                {project.projectName} ({project.projectId})
              </MenuItem>
            ))}
        </TextField>
        {projectsLoading ? (
          <CircularProgress size={18} sx={{ mt: 0.75, color: theme.palette.primaryLight }} />
        ) : null}
      </Stack>

      <TextField
        select
        size="small"
        label={S.BATCH_LIST.FILTERS_OPERATION_STATUS}
        value={draftStatus}
        onChange={(e) => onDraftStatusChange(e.target.value)}
        sx={{ ...theme.batchList.filterPanelField, minWidth: { xs: "100%", sm: 180 } }}
        SelectProps={{
          MenuProps: {
            PaperProps: {
              sx: { "& .MuiMenuItem-root": theme.batchList.filterPanelMenuItem },
            },
          },
        }}
      >
        {statusDropdownValues.map((status) => (
          <MenuItem key={status} value={status}>
            {status === FILTER_ALL ? FILTER_ALL : (statusConfig[status]?.label ?? status)}
          </MenuItem>
        ))}
      </TextField>
    </Stack>

    <Stack direction="row" justifyContent="flex-end" spacing={1}>
      <Button
        variant="outlined"
        size="small"
        onClick={onClose}
        sx={{ textTransform: "none", fontWeight: 700 }}
      >
        {S.BATCH_LIST.FILTERS_CLOSE_PANEL}
      </Button>
      <Button
        variant="contained"
        size="small"
        onClick={onApply}
        sx={{ ...theme.batchList.action.primary, textTransform: "none" }}
      >
        {S.BATCH_LIST.FILTERS_APPLY}
      </Button>
    </Stack>
  </Stack>
);

export default ManufacturingBatchListFilterPanel;
