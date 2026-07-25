import React, { useMemo, useState } from "react";
import { Box, Button, CircularProgress, IconButton, Stack, Tooltip, alpha } from "@mui/material";
import AppButton from "@/ui/components/common/Button";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { getOperationStatusConfig, OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import { STRINGS } from "../../../../../app/config/strings";
import STFSchemaPanel from "./STFSchemaPanel";
import CasePrepTextField from "../../manufacturing/CasePreparation/CasePrepTextField";
import ConfirmAlertDialog from "@/ui/components/common/ConfirmAlertDialog";
import UserWorkflowStatusAction from "../../../../components/custom/UserWorkflowStatusAction";
import BemMotorListTable from "./BemMotorListTable";

const strings = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;
const S = STRINGS.QUALITY_CONTROL;

const {
  pending: HourglassEmptyRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  pendingAction: PendingActionsRoundedIcon,
  play: PlayCircleOutlineRoundedIcon,
} = icons.user.qualityControl.staticTestFacility.list;

export const STF_STATUS_CONFIG = getOperationStatusConfig({
  initiated: HourglassEmptyRoundedIcon,
  inProgress: PlayCircleOutlineRoundedIcon,
  waitingForApproval: PendingActionsRoundedIcon,
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
});

const defaultCanViewDetails = (status) =>
  status === OPERATION_STATUS.WAITING_FOR_APPROVAL || status === OPERATION_STATUS.APPROVED;

const OtherBemList = ({ hookState, handleBemBack, rowsPerPageOptions }: any) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const {
    view,
    schemaLoading,
    schemaError,
    subDepartmentId,
    batch,
    formData,
    handleCreateNewBem,
    handleBackFromForm,
    onFormValuesChange,
    canAct = true,
    actionLoading = false,
    isEditMode = false,
    handleSaveDraft,
    handleSubmit,
    bemMotors = [],
    totalRecords = 0,
    page = 0,
    rowsPerPage = 10,
    search = "",
    setPage,
    setRowsPerPage,
    setSearch,
    loading = false,
    isRefreshing = false,
    handleFillForm,
    handleEditForm,
    handleViewDetails,
    canViewDetails = defaultCanViewDetails,
  } = hookState;

  const activeSchema =
    (formData?.stfSchema?.data ? (formData?.stfSchema ?? formData) : null) ?? null;

  const bemMotorId = formData?.bemMotors?.[0]?.motorId ?? "BEM_FORM";
  const activeFormValues =
    formData?.schemaFormValues ?? hookState.activeMotorSession?.schemaFormValues ?? {};
  const savedSections =
    formData?.motors?.[0]?.savedSections ?? hookState.activeMotorSession?.savedSections ?? [];

  // Form / Schema View Mode
  if (view === "form" || schemaLoading) {
    return (
      <Box sx={{ mt: 1 }}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <AppButton
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={handleBemBack ?? handleBackFromForm ?? hookState.handleBack}
          >
            Back to List
          </AppButton>
        </Box>

        {schemaLoading ? (
          <Box
            sx={{
              p: 6,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: theme.palette.surface ?? "#fff",
              borderRadius: 2,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : activeSchema ? (
          <>
            <Box
              sx={{
                mb: 3,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" }, // Stack vertically on small screens, row on desktop
                gap: 2.5, // Even spacing between text fields
                alignItems: "stretch",
                width: "100%",
              }}
            >
              <Box sx={{ flex: 1 }}>
                <CasePrepTextField
                  label="Other BEM Motor No."
                  value={activeFormValues?.bemNo ?? ""}
                  placeholder="Enter Other BEM motor No."
                  theme={theme}
                  onChange={(val: string) => {
                    onFormValuesChange?.("bemNo", {
                      ...activeFormValues,
                      bemNo: val,
                    });
                  }}
                />
              </Box>
            </Box>
            <STFSchemaPanel
              schema={activeSchema}
              formValues={activeFormValues}
              savedSections={savedSections}
              subDepartmentId={subDepartmentId}
              batchId={batch?.batchId}
              onChange={(values: any) => {
                if (typeof onFormValuesChange === "function") {
                  onFormValuesChange(bemMotorId, values);
                }
              }}
              loading={schemaLoading}
              error={schemaError}
            />
            {/* Action Bar */}
            <Box
              sx={{
                mt: 2,
                p: "12px 16px",
                borderRadius: 2,
                background: "#fff",
                border: "1.5px solid #D5D8DC",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ sm: "center" }}
                justifyContent="space-between"
                gap={1.5}
              >
                <Box>
                  <Box
                    component="span"
                    sx={{ fontSize: "0.76rem", fontWeight: 700, color: "#1C2833" }}
                  >
                    {canAct ? strings.READY_TO_SUBMIT : strings.NOT_READY_TO_SUBMIT}
                  </Box>
                </Box>

                <Stack direction="row" gap={1}>
                  <Button
                    variant="outlined"
                    disabled={!canAct || actionLoading}
                    onClick={() => setDraftConfirmOpen(true)}
                    startIcon={
                      actionLoading ? <CircularProgress size={16} color="inherit" /> : null
                    }
                  >
                    {strings.SAVE_DRAFT_LABEL.toUpperCase()}
                  </Button>

                  <Button
                    variant="contained"
                    disabled={!canAct || actionLoading}
                    onClick={() => setSubmitConfirmOpen(true)}
                    startIcon={
                      actionLoading ? <CircularProgress size={16} color="inherit" /> : null
                    }
                  >
                    {isEditMode
                      ? strings.RESUBMIT_LABEL.toUpperCase()
                      : strings.SUBMIT_LABEL.toUpperCase()}
                  </Button>
                </Stack>
              </Stack>
            </Box>
            <ConfirmAlertDialog
              open={draftConfirmOpen}
              severity="info"
              title={strings.DRAFT_CONFIRM_TITLE}
              message={strings.DRAFT_CONFIRM_MESSAGE}
              confirmLabel={strings.DRAFT_CONFIRM_LABEL}
              cancelLabel={strings.CONFIRM_CANCEL_LABEL}
              onConfirm={async () => {
                setDraftConfirmOpen(false);
                await handleSaveDraft();
              }}
              onCancel={() => setDraftConfirmOpen(false)}
            />
            <ConfirmAlertDialog
              open={submitConfirmOpen}
              severity="warning"
              title={isEditMode ? strings.RESUBMIT_CONFIRM_TITLE : strings.SUBMIT_CONFIRM_TITLE}
              message={
                isEditMode ? strings.RESUBMIT_CONFIRM_MESSAGE : strings.SUBMIT_CONFIRM_MESSAGE
              }
              confirmLabel={
                isEditMode ? strings.RESUBMIT_CONFIRM_LABEL : strings.SUBMIT_CONFIRM_LABEL
              }
              cancelLabel={strings.CONFIRM_GO_BACK_LABEL}
              onCancel={() => setSubmitConfirmOpen(false)}
              onConfirm={async () => {
                setSubmitConfirmOpen(false);
                await handleSubmit();
              }}
            />
          </>
        ) : (
          <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
            No schema sections found for Other BEM.
          </Box>
        )}
      </Box>
    );
  }

  // Render Table List UI by Default using Motor Data
  const displayRows = Array.isArray(bemMotors) ? bemMotors : [];

  return (
    <BemMotorListTable
      rows={displayRows}
      totalRecords={totalRecords}
      page={page}
      rowsPerPage={rowsPerPage}
      search={search}
      loading={loading || isRefreshing}
      theme={theme}
      onPageChange={setPage}
      onRowsPerPageChange={setRowsPerPage}
      onSearchChange={setSearch}
      headerAction={
        <AppButton
          variant="contained"
          size="medium"
          startIcon={<AddIcon />}
          onClick={handleCreateNewBem}
          sx={{
            px: 2.5,
            py: 1,
            whiteSpace: "nowrap",
            fontWeight: 600,
          }}
        >
          Add Other BEM Motor
        </AppButton>
      }
      renderAction={(row) => {
        const status = String(row?.status ?? row?.operationStatus ?? "");
        const viewTooltip = S.BATCH_LIST.VIEW_DETAILS_TOOLTIP ?? "View Details";

        return (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75}>
            {canViewDetails(status) ? (
              <Tooltip title={viewTooltip} arrow placement="top">
                <IconButton
                  size="small"
                  onClick={() => handleViewDetails?.(row)}
                  sx={{
                    color: theme.palette.primaryLight ?? theme.palette.primary,
                    border: `1px solid ${alpha(theme.palette.primaryLight ?? theme.palette.primary, 0.35)}`,
                    borderRadius: 1.5,
                    "&:hover": {
                      background: alpha(theme.palette.primaryLight ?? theme.palette.primary, 0.08),
                    },
                  }}
                >
                  <VisibilityRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <UserWorkflowStatusAction
                status={status}
                row={row}
                statusMap={OPERATION_STATUS}
                onFillForm={handleFillForm}
                onEditForm={handleEditForm}
                theme={theme}
                fillLabel={S.BATCH_LIST.FILL_ACTION}
                continueLabel={S.BATCH_LIST.CONTINUE_ACTION}
                editTooltip={S.BATCH_LIST.EDIT_ACTION_TOOLTIP}
              />
            )}
          </Stack>
        );
      }}
    />
  );
};

export default OtherBemList;
