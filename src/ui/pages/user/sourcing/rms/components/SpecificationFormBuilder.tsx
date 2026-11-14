import {
  Box,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import AppButton from "@ui/components/common/Button";
import { useEffect } from "react";
import { icons } from "@app/theme/icons";

import AppDropdown from "@ui/components/common/AppDropdown";
import ConfirmAlertDialog from "@ui/components/common/ConfirmAlertDialog";
import UserWorkflowActionBar from "@ui/components/custom/UserWorkflowActionBar";
import UserWorkflowFormDetailsHeader from "@ui/components/custom/UserWorkflowFormDetailsHeader";
import WorkflowEmptyState from "@ui/components/custom/WorkflowEmptyState";
import WorkflowEntitySelectorRow from "@ui/components/custom/WorkflowEntitySelectorRow";
import WorkflowInfoCallout from "@ui/components/custom/WorkflowInfoCallout";
import MaterialSpecificationBlock from "@ui/pages/user/sourcing/rms/components/MaterialSpecificationBlock";
import MaterialFormGroupCard from "@ui/pages/user/sourcing/rms/components/MaterialFormGroupCard";
import useRawMaterialSpecificationForm, {
  SpecificationBlock,
} from "@hooks/user/sourcing/rms/useRawMaterialSpecificationForm";
import { focusRmsField } from "@data/validation/adapters/sourcing/rms/rawMaterialSourcing.validation";

const {
  add: AddRoundedIcon,
  science: ScienceRoundedIcon,
  info: InfoOutlinedIcon,
  expandMore: ExpandMoreRoundedIcon,
  warning: WarningAmberRoundedIcon,
} = icons.user.sourcing.specificationFormBuilder;

type SpecificationFormBuilderProps = {
  initialBlocks?: SpecificationBlock[];
  isEditMode?: boolean;
  /** When true (Create Lot flow), header copy and lot-oriented labels match the create procurement API */
  createLotMode?: boolean;
  /** When true (fill/edit existing lot), lot ID cannot be changed */
  lockLotNo?: boolean;
  onSaveDraft?: (
    blocks: SpecificationBlock[],
  ) => Promise<boolean | void> | boolean | void;
  onSubmit?: (
    blocks: SpecificationBlock[],
  ) => Promise<boolean | void> | boolean | void;
  onBlocksChange?: (blocks: SpecificationBlock[]) => void;
  actionLoading?: boolean;
  showDeleteLot?: boolean;
  onDeleteLot?: () => void;
  deleteLoading?: boolean;
  pdfMeta?: unknown;
};

const SpecificationFormBuilder = (props: SpecificationFormBuilderProps) => {
  const {
    lockLotNo = false,
    showDeleteLot = false,
    onDeleteLot,
    deleteLoading = false,
    ...formProps
  } = props;
  const {
    actionHelperText,
    addingMaterial,
    allMaterialsAdded,
    blocks,
    canSubmit,
    canSaveDraft,
    validationErrors,
    validationAttempt,
    validationFocusRequest,
    closeDraftConfirm,
    closeSubmitConfirm,
    createLotMode,
    disableActionBar,
    draftConfirm,
    filledRows,
    formStrings,
    handleAdd,
    handleAddLot,
    handleConfirmDraft,
    handleConfirmSubmit,
    handleRemoveBlock,
    handleRemoveLot,
    handleRemoveMaterial,
    handleUpdateBlock,
    getAnalysedResultError,
    handleUpdateLot,
    handleUpdateMaterial,
    hasBlocks,
    headerSubtitle,
    headerTitle,
    isEditMode,
    isMaterialLoading,
    loadingMaterials,
    lotCount,
    materialCount,
    materialGroups,
    mode,
    openDraftConfirm,
    openSubmitConfirm,
    selectableMaterials,
    canAddSelection,
    selectedMaterial,
    setSelectedMaterial,
    specStyles,
    submitConfirm,
    theme,
    totalRows,
    approvedPreparationLots,
  } = useRawMaterialSpecificationForm(formProps);

  useEffect(() => {
    if (!validationFocusRequest?.target?.fieldPath) return;
    const path = validationFocusRequest.target.fieldPath;
    const timer = window.setTimeout(() => {
      focusRmsField(path);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [validationFocusRequest?.id, validationFocusRequest?.target?.fieldPath]);

  const materialsForDropdown = selectableMaterials;
  const addSelectionKey = selectedMaterial;
  /** Bulk material picker only for create-lot flow; fill/edit open a single existing lot. */
  const showMaterialSelector = createLotMode && !allMaterialsAdded;

  return (
    <Box>
      {isEditMode && (
        <Box sx={specStyles.editModeBanner}>
          <WarningAmberRoundedIcon
            sx={{ ...specStyles.editModeIcon, color: theme.palette.danger }}
          />
          <Typography sx={specStyles.editModeBannerText}>
            {formStrings.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      )}

      <Box sx={{ mb: 2.5 }}>
        <UserWorkflowFormDetailsHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          icon={ScienceRoundedIcon}
          theme={theme}
        />
      </Box>

      {hasBlocks && (
        <Stack direction="row" gap={1.5} mb={2.5} flexWrap="wrap">
          {createLotMode ? (
            <>
              <Chip
                label={`${materialCount} ${
                  materialCount > 1
                    ? formStrings.MATERIAL_SUFFIX_PLURAL
                    : formStrings.MATERIAL_SUFFIX
                }`}
                size="small"
                sx={specStyles.summaryPrimaryChip}
              />
              <Chip
                label={`${lotCount} ${lotCount > 1 ? formStrings.LOT_SUFFIX_PLURAL : formStrings.LOT_SUFFIX}`}
                size="small"
                sx={specStyles.summaryPrimaryChip}
              />
            </>
          ) : (
            <Chip
              label={`${blocks.length} ${
                blocks.length > 1
                  ? formStrings.BLOCK_SUFFIX_PLURAL
                  : formStrings.BLOCK_SUFFIX
              }`}
              size="small"
              sx={specStyles.summaryPrimaryChip}
            />
          )}
          <Chip
            label={`${filledRows} / ${totalRows} ${formStrings.RESULTS_FILLED_SUFFIX}`}
            size="small"
            sx={specStyles.resultSummaryChip(
              filledRows === totalRows && totalRows > 0,
            )}
          />
        </Stack>
      )}

      {showMaterialSelector && (
        <WorkflowEntitySelectorRow
          label={formStrings.SELECT_MATERIAL_LABEL}
          labelSx={{ ...theme.workflow.formElements.fieldLabel, mb: 0.75 }}
          containerSx={specStyles.materialSelectorBox}
          action={
            <AppButton
              fullWidth={false}
              size="small"
              variant="contained"
              onClick={handleAdd}
              disabled={
                !canAddSelection ||
                (createLotMode && materialsForDropdown.length === 0)
              }
              startIcon={<AddRoundedIcon />}
              sx={specStyles.addButton}
            >
              {addingMaterial || isMaterialLoading(addSelectionKey)
                ? formStrings.ADDING_TO_FORM
                : formStrings.ADD_TO_FORM}
            </AppButton>
          }
        >
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            <AppDropdown
              value={selectedMaterial}
              onChange={setSelectedMaterial}
              placeholder={
                loadingMaterials
                  ? formStrings.LOADING_MATERIALS
                  : formStrings.SELECT_MATERIAL_PLACEHOLDER
              }
              sx={[
                theme.workflow.formElements.textField,
                specStyles.materialDropdownField,
              ]}
              inputSx={
                mode === "dark"
                  ? {
                      minHeight: 36,
                      height: 36,
                      bgcolor: "rgba(255,255,255,0.1)",
                      // Inset ring — survives MUI light-theme notchedOutline (near-black).
                      boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.7)",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255,255,255,0.7) !important",
                        borderWidth: "1.5px !important",
                      },
                      "&:hover": {
                        boxShadow: "inset 0 0 0 1.5px #64b5f6",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#64b5f6 !important",
                      },
                      "&.Mui-focused": {
                        boxShadow: "inset 0 0 0 1.5px #64b5f6",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#64b5f6 !important",
                        borderWidth: "1.5px !important",
                      },
                      "&.Mui-disabled": {
                        opacity: 1,
                        bgcolor: "rgba(255,255,255,0.06)",
                        boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.4)",
                      },
                      "&.Mui-disabled .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255,255,255,0.4) !important",
                      },
                    }
                  : {
                      minHeight: 36,
                      height: 36,
                    }
              }
              SelectProps={{ IconComponent: ExpandMoreRoundedIcon }}
              MenuProps={{
                disableScrollLock: true,
                PaperProps: {
                  sx: specStyles.materialMenuPaper(mode === "dark"),
                },
              }}
              disabled={
                loadingMaterials ||
                (createLotMode && materialsForDropdown.length === 0)
              }
              startAdornment={
                <InputAdornment position="start">
                  <ScienceRoundedIcon
                    sx={specStyles.materialSelectIcon(Boolean(selectedMaterial))}
                  />
                </InputAdornment>
              }
            >
              {materialsForDropdown.map((material) => (
                <MenuItem
                  key={material.materialCode}
                  value={material.materialCode}
                  sx={specStyles.materialOption}
                >
                  {material.materialCode} - {material.materialName}
                  <Typography
                    component="span"
                    sx={specStyles.materialOptionMeta}
                  >
                    ({material.specCount} {formStrings.SPEC_COUNT_SUFFIX})
                  </Typography>
                </MenuItem>
              ))}
            </AppDropdown>
          </Box>
        </WorkflowEntitySelectorRow>
      )}

      {createLotMode && allMaterialsAdded && (
        <Typography
          sx={{ fontSize: "0.8rem", color: theme.palette.textSub, mb: 2 }}
        >
          {formStrings.ALL_MATERIALS_ADDED}
        </Typography>
      )}

      <Stack spacing={2.5}>
        {!hasBlocks && (
          <WorkflowEmptyState
            icon={ScienceRoundedIcon}
            title={formStrings.EMPTY_ADDED_TITLE}
            subtitle={formStrings.EMPTY_ADDED_SUBTITLE}
            sx={theme.workflow.formElements.emptyStateBox}
            iconSx={specStyles.emptyStateIcon}
            titleSx={specStyles.emptyStateTitle}
            subtitleSx={specStyles.emptyStateSubtitle}
          />
        )}

        {createLotMode
          ? materialGroups.map((group, materialIndex) => (
              <MaterialFormGroupCard
                key={`${group.material}-${materialIndex}`}
                group={group}
                materialGroups={materialGroups}
                materialIndex={materialIndex}
                onUpdateMaterial={handleUpdateMaterial}
                onUpdateLot={handleUpdateLot}
                onAddLot={handleAddLot}
                onRemoveMaterial={handleRemoveMaterial}
                onRemoveLot={handleRemoveLot}
                errors={validationErrors}
                validationAttempt={validationAttempt}
                getAnalysedResultError={getAnalysedResultError}
                approvedPreparationLots={approvedPreparationLots}
                theme={theme}
              />
            ))
          : blocks.map((block, idx) => (
              <MaterialSpecificationBlock
                key={`${block.material}-${idx}`}
                block={block}
                index={idx}
                createLotMode={createLotMode}
                lockLotNo={lockLotNo}
                showDeleteLot={showDeleteLot}
                onDeleteLot={onDeleteLot}
                deleteLoading={deleteLoading}
                onUpdate={handleUpdateBlock}
                onRemove={handleRemoveBlock}
                errors={validationErrors}
                validationAttempt={validationAttempt}
                getAnalysedResultError={getAnalysedResultError}
                approvedPreparationLots={approvedPreparationLots}
                theme={theme}
              />
            ))}
      </Stack>

      {hasBlocks && (
        <WorkflowInfoCallout
          icon={InfoOutlinedIcon}
          text={formStrings.READY_SUBTITLE}
          sx={{
            ...theme.workflow.formElements.infoFooterNote,
            ...specStyles.footerInfoContainer,
          }}
          iconSx={specStyles.footerInfoIcon}
          textSx={specStyles.footerInfoText}
        />
      )}

      <UserWorkflowActionBar
        isEdit={isEditMode}
        canSubmit={canSubmit}
        canSaveDraft={canSaveDraft}
        readinessText={formStrings.READY_TITLE}
        pendingText={
          !canSubmit
            ? formStrings.MANDATORY_FIELDS_PENDING
            : formStrings.READY_TITLE
        }
        helperText={actionHelperText}
        onSaveDraft={openDraftConfirm}
        onSubmitClick={openSubmitConfirm}
        theme={theme}
        saveLabel={formStrings.SAVE_DRAFT}
        submitLabel={formStrings.SUBMIT_APPROVAL}
        resubmitLabel={formStrings.RESUBMIT_APPROVAL}
        saveTooltip={
          !canSaveDraft
            ? formStrings.MANDATORY_FIELDS_PENDING
            : formStrings.SAVE_CONTINUE
        }
        disableActions={disableActionBar || deleteLoading}
        allowInvalidSubmitAttempt
      />

      <ConfirmAlertDialog
        open={draftConfirm}
        severity="info"
        title={formStrings.CONFIRM_DRAFT_TITLE}
        message={formStrings.CONFIRM_DRAFT_MESSAGE}
        confirmLabel={formStrings.CONFIRM_DRAFT_ACTION}
        cancelLabel={formStrings.CONFIRM_DRAFT_CANCEL_ACTION}
        onConfirm={handleConfirmDraft}
        onCancel={closeDraftConfirm}
      />

      <ConfirmAlertDialog
        open={submitConfirm}
        severity="warning"
        title={
          isEditMode
            ? formStrings.CONFIRM_RESUBMIT_TITLE
            : formStrings.CONFIRM_SUBMIT_TITLE
        }
        message={
          isEditMode
            ? formStrings.CONFIRM_RESUBMIT_MESSAGE
            : formStrings.CONFIRM_SUBMIT_MESSAGE
        }
        confirmLabel={
          isEditMode
            ? formStrings.CONFIRM_RESUBMIT_ACTION
            : formStrings.CONFIRM_SUBMIT_ACTION
        }
        cancelLabel={formStrings.CONFIRM_CANCEL_ACTION}
        onConfirm={handleConfirmSubmit}
        onCancel={closeSubmitConfirm}
      />
    </Box>
  );
};

export default SpecificationFormBuilder;
