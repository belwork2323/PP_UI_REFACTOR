import {
  Box,
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { icons } from "../../../../../app/theme/icons";

import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import StackRow from "../../../../components/common/StackRow";
import UserWorkflowActionBar from "../../../../components/custom/UserWorkflowActionBar";
import MaterialSpecificationBlock from "./MaterialSpecificationBlock";
import MaterialFormGroupCard from "./MaterialFormGroupCard";
import useRawMaterialSpecificationForm, {
  SpecificationBlock,
} from "../../../../../hooks/user/sourcing/useRawMaterialSpecificationForm";
import type { MandatoryValidationMessages } from "../../../../../data/models/user/rawMaterialProcurementValidation";

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
  onSaveDraft?: (blocks: SpecificationBlock[]) => Promise<boolean | void> | boolean | void;
  onSubmit?: (blocks: SpecificationBlock[]) => Promise<boolean | void> | boolean | void;
  onBlocksChange?: (blocks: SpecificationBlock[]) => void;
  actionLoading?: boolean;
  showDeleteLot?: boolean;
  onDeleteLot?: () => void;
  deleteLoading?: boolean;
  pdfMeta?: unknown;
};

const SpecificationFormBuilder = (props: SpecificationFormBuilderProps) => {
  const { lockLotNo = false, showDeleteLot = false, onDeleteLot, deleteLoading = false, ...formProps } = props;
  const {
    actionHelperText,
    addingMaterial,
    allMaterialsAdded,
    blocks,
    canSubmit,
    canSaveDraft,
    showFieldErrors,
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
    selectedMaterial,
    setSelectedMaterial,
    specStyles,
    submitConfirm,
    theme,
    totalRows,
  } = useRawMaterialSpecificationForm(formProps);

  const materialsForDropdown = selectableMaterials;
  /** Bulk material picker only for create-lot flow; fill/edit open a single existing lot. */
  const showMaterialSelector = createLotMode && !allMaterialsAdded;

  const validationMessages: MandatoryValidationMessages = {
    supplyOrderNo: formStrings.FIELD_REQUIRED_SUPPLY_ORDER,
    receiptDate: formStrings.FIELD_REQUIRED_RECEIPT_DATE,
    manufacturerName: formStrings.FIELD_REQUIRED_MANUFACTURER,
    lotNo: formStrings.FIELD_REQUIRED_LOT_ID,
  };

  return (
    <Box>
      {isEditMode && (
        <Box sx={specStyles.editModeBanner}>
          <WarningAmberRoundedIcon sx={{ ...specStyles.editModeIcon, color: theme.palette.danger }} />
          <Typography sx={specStyles.editModeBannerText}>{formStrings.EDIT_MODE_BANNER}</Typography>
        </Box>
      )}

      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={1.5}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box sx={specStyles.headerIconBadge}>
            <ScienceRoundedIcon sx={{ ...specStyles.whiteIcon, ...specStyles.headerScienceIcon }} />
          </Box>
          <Box>
            <Typography sx={specStyles.headerTitle}>{headerTitle}</Typography>
            <Typography sx={specStyles.headerSubtitle}>{headerSubtitle}</Typography>
          </Box>
        </Stack>
      </Stack>

      {hasBlocks && (
        <Stack direction="row" gap={1.5} mb={2.5} flexWrap="wrap">
          {createLotMode ? (
            <>
              <Chip
                label={`${materialCount} ${
                  materialCount > 1 ? formStrings.MATERIAL_SUFFIX_PLURAL : formStrings.MATERIAL_SUFFIX
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
                blocks.length > 1 ? formStrings.BLOCK_SUFFIX_PLURAL : formStrings.BLOCK_SUFFIX
              }`}
              size="small"
              sx={specStyles.summaryPrimaryChip}
            />
          )}
          <Chip
            label={`${filledRows} / ${totalRows} ${formStrings.RESULTS_FILLED_SUFFIX}`}
            size="small"
            sx={specStyles.resultSummaryChip(filledRows === totalRows && totalRows > 0)}
          />
        </Stack>
      )}

      {showMaterialSelector && (
        <Box sx={specStyles.materialSelectorBox}>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems="flex-end">
            <Box flex={1}>
              <Typography sx={theme.workflow.formElements.fieldLabel}>{formStrings.SELECT_MATERIAL_LABEL}</Typography>
              <TextField
                fullWidth
                select
                size="small"
                value={selectedMaterial}
                onChange={(event) => setSelectedMaterial(event.target.value)}
                sx={theme.workflow.formElements.textField}
                SelectProps={{
                  displayEmpty: true,
                  IconComponent: ExpandMoreRoundedIcon,
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        mt: 0.5,
                        boxShadow: `0 8px 24px ${mode === "dark" ? "rgba(0,0,0,0.45)" : "rgba(27,79,114,0.12)"}`,
                      },
                    },
                  },
                }}
                disabled={loadingMaterials || (createLotMode && materialsForDropdown.length === 0)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScienceRoundedIcon
                        sx={{
                          fontSize: 16,
                          color: selectedMaterial ? theme.palette.primaryLight : theme.palette.border,
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="" disabled>
                  <Typography color="text.disabled" fontSize="0.85rem">
                    {loadingMaterials ? formStrings.LOADING_MATERIALS : formStrings.SELECT_MATERIAL_PLACEHOLDER}
                  </Typography>
                </MenuItem>
                {materialsForDropdown.map((material) => (
                  <MenuItem
                    key={material.materialCode}
                    value={material.materialCode}
                    sx={{ ...specStyles.materialOption, color: theme.palette.text }}
                  >
                    {material.materialCode} - {material.materialName}
                    <Typography component="span" sx={specStyles.materialOptionMeta}>
                      ({material.specCount} {formStrings.SPEC_COUNT_SUFFIX})
                    </Typography>
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={
                !selectedMaterial ||
                addingMaterial ||
                isMaterialLoading(selectedMaterial) ||
                (createLotMode && materialsForDropdown.length === 0)
              }
              startIcon={<AddRoundedIcon />}
              sx={specStyles.addButton}
            >
              {addingMaterial || isMaterialLoading(selectedMaterial)
                ? formStrings.ADDING_TO_FORM
                : formStrings.ADD_TO_FORM}
            </Button>
          </Stack>
        </Box>
      )}

      {createLotMode && allMaterialsAdded && (
        <Typography sx={{ fontSize: "0.8rem", color: theme.palette.textSub, mb: 2 }}>
          {formStrings.ALL_MATERIALS_ADDED}
        </Typography>
      )}

      <Stack spacing={2.5}>
        {!hasBlocks && (
          <Box sx={theme.workflow.formElements.emptyStateBox}>
            <ScienceRoundedIcon sx={specStyles.emptyStateIcon} />
            <Typography sx={specStyles.emptyStateTitle}>{formStrings.EMPTY_ADDED_TITLE}</Typography>
            <Typography sx={specStyles.emptyStateSubtitle}>{formStrings.EMPTY_ADDED_SUBTITLE}</Typography>
          </Box>
        )}

        {createLotMode
          ? materialGroups.map((group, materialIndex) => (
              <MaterialFormGroupCard
                key={`${group.material}-${materialIndex}`}
                group={group}
                materialIndex={materialIndex}
                onUpdateMaterial={handleUpdateMaterial}
                onUpdateLot={handleUpdateLot}
                onAddLot={handleAddLot}
                onRemoveMaterial={handleRemoveMaterial}
                onRemoveLot={handleRemoveLot}
                showFieldErrors={showFieldErrors}
                validationMessages={validationMessages}
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
                showFieldErrors={showFieldErrors}
                validationMessages={validationMessages}
                theme={theme}
              />
            ))}
      </Stack>

      {hasBlocks && (
        <StackRow gap={1} sx={{ ...theme.workflow.formElements.infoFooterNote, ...specStyles.footerInfoContainer }}>
          <InfoOutlinedIcon sx={specStyles.footerInfoIcon} />
          <Typography sx={specStyles.footerInfoText}>{formStrings.READY_SUBTITLE}</Typography>
        </StackRow>
      )}

      <UserWorkflowActionBar
        isEdit={isEditMode}
        canSubmit={canSubmit}
        canSaveDraft={canSaveDraft}
        readinessText={formStrings.READY_TITLE}
        pendingText={!canSubmit ? formStrings.MANDATORY_FIELDS_PENDING : formStrings.READY_TITLE}
        helperText={actionHelperText}
        onSaveDraft={openDraftConfirm}
        onSubmitClick={openSubmitConfirm}
        theme={theme}
        saveLabel={formStrings.SAVE_DRAFT}
        submitLabel={formStrings.SUBMIT_APPROVAL}
        resubmitLabel={formStrings.RESUBMIT_APPROVAL}
        saveTooltip={!canSaveDraft ? formStrings.MANDATORY_FIELDS_PENDING : formStrings.SAVE_CONTINUE}
        disableActions={disableActionBar || deleteLoading}
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
        title={isEditMode ? formStrings.CONFIRM_RESUBMIT_TITLE : formStrings.CONFIRM_SUBMIT_TITLE}
        message={
          isEditMode ? formStrings.CONFIRM_RESUBMIT_MESSAGE : formStrings.CONFIRM_SUBMIT_MESSAGE
        }
        confirmLabel={isEditMode ? formStrings.CONFIRM_RESUBMIT_ACTION : formStrings.CONFIRM_SUBMIT_ACTION}
        cancelLabel={formStrings.CONFIRM_CANCEL_ACTION}
        onConfirm={handleConfirmSubmit}
        onCancel={closeSubmitConfirm}
      />
    </Box>
  );
};

export default SpecificationFormBuilder;
