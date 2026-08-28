import React, { useMemo, useState } from "react";
import { Box, Button, CircularProgress, IconButton, Stack, Tooltip, alpha } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { icons } from "../../../../../app/theme/icons";
import { useThemeStore } from "../../../../../app/store/themeStore";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { OPERATION_STATUS } from "../../../../../hooks/operationStatus";
import { STRINGS } from "../../../../../app/config/strings";
import { resolveBemMotorStatusTabs } from "../../../../../hooks/user/qualityControl/stfFlowConfig";
import { createEmptyStfMotorSession, normalizeStfMotorSession } from "../../../../../data/models/user/StaticTestFacilityFormModel";
import StfMotorPanel from "./StfMotorPanel";
import ConfirmAlertDialog from "@/ui/components/common/ConfirmAlertDialog";
import SubmitForApprovalButton from "../../../../components/common/SubmitForApprovalButton";
import UserWorkflowStatusAction from "../../../../components/custom/UserWorkflowStatusAction";
import UserWorkflowFormDetailsHeader from "../../../../components/custom/UserWorkflowFormDetailsHeader";
import BemMotorListTable from "./BemMotorListTable";
import StaticTestFacilityDetailsView from "./StaticTestFacilityDetailsView";
import WorkflowCreateButton from "@/ui/components/common/WorkflowCreateButton";
import UserWorkflowFormHeader from "@/ui/components/custom/UserWorkflowFormHeader";
import { resolveWorkflowFormHeaderStatus } from "@/ui/components/custom/workflowFormHeaderStatus";
import AppTextField from "@/ui/components/common/AppTextField";

const strings = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;
const S = STRINGS.QUALITY_CONTROL;
const { rocketLaunch: RocketLaunchRoundedIcon } = icons.user.qualityControl.staticTestFacility.form;

const defaultCanViewDetails = (status: string) =>
  status === OPERATION_STATUS.WAITING_FOR_APPROVAL || status === OPERATION_STATUS.APPROVED;

const OtherBemList = ({ hookState, handleBemBack, rowsPerPageOptions }: any) => {
  const mode = useThemeStore((state) => state.mode);
  const theme = useMemo(() => getQualityControlTheme(mode), [mode]);
  const [draftConfirmOpen, setDraftConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

  const {
    view,
    subDepartmentId,
    batch,
    formData,
    handleCreateNewBem,
    handleBackFromForm,
    onFormValuesChange,
    handleStfTestNoChange,
    handleDraftBemNoChange,
    actionLoading = false,
    isEditMode = false,
    handleSaveDraft,
    handleSubmit,
    bemMotors = [],
    totalRecords = 0,
    page = 0,
    rowsPerPage = 10,
    search = "",
    statusFilter = STRINGS.USER_BATCH_LIST.FILTER_ALL,
    setStatusFilter,
    statusCounts = {},
    statusTabs: statusTabsFromHook,
    setPage,
    setRowsPerPage,
    setSearch,
    loading = false,
    isRefreshing = false,
    handleFillForm,
    handleEditForm,
    handleViewDetails,
    canViewDetails = defaultCanViewDetails,
    draftBemNo = "",
    detailsRow,
    detailsData,
    detailsLoading,
    handleBackFromDetails,
    backConfirmOpen,
    setBackConfirmOpen,
    handleDiscardAndBack,
    hasSavedDraft = false,
    activeBemMotor,
    isStfTestNoLocked,
  } = hookState;

  const bemMotorSession = useMemo(() => {
    const found = formData?.motors?.[0];
    if (found) return normalizeStfMotorSession(found);
    return createEmptyStfMotorSession(draftBemNo || "", "BEM");
  }, [draftBemNo, formData?.motors]);

  const bemMotorId = bemMotorSession.motorId || "BEM_FORM";

  const rejectionReason =
    formData?.rejectionReason ?? hookState.activeMotorSession?.rejectionReason ?? null;

  const displayRows = Array.isArray(bemMotors) ? bemMotors : [];

  const bemMotorNo = String(draftBemNo || formData?.bemNo || bemMotorSession.motorId || "").trim();
  const stfTestNoValue = String(bemMotorSession.stfTestNo || formData?.stfTestNo || "").trim();
  const canSubmitActions = bemMotorNo.length > 0 && stfTestNoValue.length > 0;
  const stfTestNoLocked = [activeBemMotor?.motorId, bemMotorNo, draftBemNo, bemMotorId]
    .map((id) => String(id ?? "").trim())
    .filter(Boolean)
    .some((id) => Boolean(isStfTestNoLocked?.(id)));

  const statusTabs = useMemo(
    () =>
      Array.isArray(statusTabsFromHook) && statusTabsFromHook.length > 0
        ? statusTabsFromHook
        : resolveBemMotorStatusTabs(statusCounts),
    [statusCounts, statusTabsFromHook],
  );

  if (view === "details" && detailsRow) {
    return (
      <StaticTestFacilityDetailsView
        row={detailsRow}
        data={detailsData}
        loading={detailsLoading}
        onBack={handleBackFromDetails}
      />
    );
  }

  if (view === "form") {
    const currentBemNo = bemMotorNo;
    const currentStfTestNo = stfTestNoValue;
    const isExistingRecord = Boolean(activeBemMotor?.motorId) || hasSavedDraft;
    const isCreateMode = !isEditMode && !isExistingRecord;

    const headerTitle = isCreateMode
      ? strings.FORM_HEADER_CREATE_OTHER_BEM_TITLE
      : [
          currentBemNo ? `BEM No: ${currentBemNo}` : null,
          currentStfTestNo ? `${strings.STF_TEST_NO_LABEL}: ${currentStfTestNo}` : null,
        ]
          .filter(Boolean)
          .join("   ·   ") || strings.OTHER_BEM_DETAILS_TITLE;

    const headerSubtitle = isCreateMode
      ? strings.FORM_HEADER_CREATE_OTHER_BEM_SUBTITLE
      : undefined;

    const headerStatus = resolveWorkflowFormHeaderStatus({
      status: isEditMode
        ? "REJECTED"
        : isExistingRecord
          ? (activeBemMotor?.status ?? formData?.status ?? "IN_PROGRESS")
          : "TO_BE_INITIATED",
      rejectionReason,
    });

    return (
      <Box sx={{ mt: 1 }}>
        <UserWorkflowFormHeader
          theme={theme}
          mode={isCreateMode ? "create" : "update"}
          onBack={handleBackFromForm || handleBemBack}
          backLabel={STRINGS.MANUFACTURING.FORM_HEADER.BACK_TO_LIST}
          rejectionTitle={STRINGS.MANUFACTURING.FORM_HEADER.REJECTION_REASON}
          data={{
            title: headerTitle,
            subtitle: headerSubtitle,
            statusLabel: headerStatus.statusLabel,
            statusVariant: headerStatus.statusVariant,
            rejectionReason: headerStatus.rejectionReason,
          }}
        />
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
          message={isEditMode ? strings.RESUBMIT_CONFIRM_MESSAGE : strings.SUBMIT_CONFIRM_MESSAGE}
          confirmLabel={isEditMode ? strings.RESUBMIT_CONFIRM_LABEL : strings.SUBMIT_CONFIRM_LABEL}
          cancelLabel={strings.CONFIRM_GO_BACK_LABEL}
          onCancel={() => setSubmitConfirmOpen(false)}
          onConfirm={async () => {
            setSubmitConfirmOpen(false);
            await handleSubmit();
          }}
        />

        <ConfirmAlertDialog
          open={backConfirmOpen}
          severity="warning"
          title={strings.UNSAVED_BACK_TITLE}
          message={strings.UNSAVED_BACK_MESSAGE}
          confirmLabel={strings.UNSAVED_BACK_DISCARD}
          cancelLabel={strings.UNSAVED_BACK_CONFIRM}
          onConfirm={handleDiscardAndBack}
          onCancel={() => setBackConfirmOpen(false)}
        />
        <Box sx={{ mt: 2.5, display: "flex", flexDirection: "column", gap: 2.5 }}>
          <UserWorkflowFormDetailsHeader
            title={strings.OTHER_BEM_DETAILS_TITLE}
            subtitle={strings.OTHER_BEM_DETAILS_SUBTITLE}
            icon={RocketLaunchRoundedIcon}
            theme={theme}
          />
          <Stack direction="row" justifyContent="flex-end" gap={1}>
            <Button
              variant="outlined"
              disabled={(!isExistingRecord && !canSubmitActions) || actionLoading}
              onClick={() => setDraftConfirmOpen(true)}
              startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {strings.SAVE_DRAFT_LABEL}
            </Button>
            <SubmitForApprovalButton
              disabled={(!isExistingRecord && !canSubmitActions) || actionLoading}
              onClick={() => setSubmitConfirmOpen(true)}
              label={isEditMode ? strings.RESUBMIT_LABEL : strings.SUBMIT_LABEL}
            />
          </Stack>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2.5,
              alignItems: "stretch",
              width: "100%",
            }}
          >
            <Box sx={{ flex: 1 }}>
              <AppTextField
                label={strings.OTHER_BEM_MOTOR_NO_LABEL}
                value={draftBemNo || formData?.bemNo || bemMotorSession.motorId || ""}
                placeholder={strings.OTHER_BEM_MOTOR_NO_PLACEHOLDER}
                disabled={isExistingRecord}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  handleDraftBemNoChange?.(e.target.value);
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <AppTextField
                label={strings.STF_TEST_NO_LABEL}
                value={stfTestNoValue}
                placeholder={strings.STF_TEST_NO_PLACEHOLDER}
                disabled={stfTestNoLocked || actionLoading}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (stfTestNoLocked) return;
                  handleStfTestNoChange?.(bemMotorId, e.target.value);
                }}
              />
            </Box>
          </Box>
          <StfMotorPanel
            value={bemMotorSession.stfData}
            onChange={(next) => onFormValuesChange?.(bemMotorId, next)}
            disabled={actionLoading}
            theme={theme}
            subDeptSlug="static-test-facility"
            subDepartmentId={subDepartmentId}
            batchId={batch?.batchId}
            motorId={bemMotorNo || bemMotorId}
          />
        </Box>
      </Box>
    );
  }

  return (
    <BemMotorListTable
      rows={displayRows}
      totalRecords={totalRecords}
      page={page}
      rowsPerPage={rowsPerPage}
      search={search}
      activeStatus={statusFilter}
      statusTabs={statusTabs}
      statusCounts={statusCounts}
      loading={loading || isRefreshing}
      onPageChange={setPage}
      onRowsPerPageChange={setRowsPerPage}
      onSearchChange={setSearch}
      onStatusChange={setStatusFilter}
      statusToolbarEnd={
        <WorkflowCreateButton
          label="Add Other BEM Motor"
          themeTokens={theme}
          onClick={handleCreateNewBem}
        />
      }
      renderAction={(row: any) => {
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
