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
import StackRow from "@ui/components/common/StackRow";
import UserWorkflowActionBar from "@ui/components/custom/UserWorkflowActionBar";
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

      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        mb={2.5}
        flexWrap="wrap"
        gap={1.5}
      >
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={specStyles.headerIconBadge}>
            <ScienceRoundedIcon
              sx={{ ...specStyles.whiteIcon, ...specStyles.headerScienceIcon }}
            />
          </Box>
          <Box>
            <Typography sx={specStyles.headerTitle}>{headerTitle}</Typography>
            <Typography sx={specStyles.headerSubtitle}>
              {headerSubtitle}
            </Typography>
          </Box>
        </Stack>
      </Stack>

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
        <Box sx={specStyles.materialSelectorBox}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            gap={2}
            alignItems="flex-end"
          >
            <Box flex={1}>
              <Typography sx={theme.workflow.formElements.fieldLabel}>
                {formStrings.SELECT_MATERIAL_LABEL}
              </Typography>
              <AppDropdown
                value={selectedMaterial}
                onChange={setSelectedMaterial}
                placeholder={
                  loadingMaterials
                    ? formStrings.LOADING_MATERIALS
                    : formStrings.SELECT_MATERIAL_PLACEHOLDER
                }
                sx={theme.workflow.formElements.textField}
                SelectProps={{ IconComponent: ExpandMoreRoundedIcon }}
                MenuProps={{
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
                      sx={specStyles.materialSelectIcon(
                        Boolean(selectedMaterial),
                      )}
                    />
                  </InputAdornment>
                }
              >
                {materialsForDropdown.map((material) => (
                  <MenuItem
                    key={material.materialCode}
                    value={material.materialCode}
                    sx={{
                      ...specStyles.materialOption,
                      color: theme.palette.text,
                    }}
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

            <AppButton
              fullWidth={false}
              size="medium"
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
          </Stack>
        </Box>
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
          <Box sx={theme.workflow.formElements.emptyStateBox}>
            <ScienceRoundedIcon sx={specStyles.emptyStateIcon} />
            <Typography sx={specStyles.emptyStateTitle}>
              {formStrings.EMPTY_ADDED_TITLE}
            </Typography>
            <Typography sx={specStyles.emptyStateSubtitle}>
              {formStrings.EMPTY_ADDED_SUBTITLE}
            </Typography>
          </Box>
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
        <StackRow
          gap={1}
          sx={{
            ...theme.workflow.formElements.infoFooterNote,
            ...specStyles.footerInfoContainer,
          }}
        >
          <InfoOutlinedIcon sx={specStyles.footerInfoIcon} />
          <Typography sx={specStyles.footerInfoText}>
            {formStrings.READY_SUBTITLE}
          </Typography>
        </StackRow>
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
