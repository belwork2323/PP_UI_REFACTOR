import { useMemo } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ReceiptDateField from "./ReceiptDateField";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import StackRow from "../../../../components/common/StackRow";
import type { MaterialFormGroup } from "../../../../../data/models/user/RawMaterialProcurementModel";
import MaterialLotSection from "./MaterialLotSection";
import MandatoryFormField, { mandatoryFieldInputSx } from "./MandatoryFormField";
import {
  getMaterialMetaErrors,
  type MandatoryValidationMessages,
} from "../../../../../data/models/user/rawMaterialProcurementValidation";

const {
  delete: DeleteOutlineRoundedIcon,
  science: ScienceRoundedIcon,
  add: AddRoundedIcon,
  checkCircleOutline: CheckCircleOutlineRoundedIcon,
} = icons.user.sourcing.specificationFormBuilder;

type MaterialFormGroupCardProps = {
  group: MaterialFormGroup;
  materialIndex: number;
  onUpdateMaterial: (
    materialIndex: number,
    partial: Partial<Pick<MaterialFormGroup, "supplyOrderNo" | "receiptDate" | "manufacturerName">>
  ) => void;
  onUpdateLot: (materialIndex: number, lotIndex: number, lot: MaterialFormGroup["lots"][number]) => void;
  onAddLot: (materialIndex: number) => void;
  onRemoveMaterial: (materialIndex: number) => void;
  onRemoveLot: (materialIndex: number, lotIndex: number) => void;
  showFieldErrors?: boolean;
  validationMessages: MandatoryValidationMessages;
  theme: any;
};

const MaterialFormGroupCard = ({
  group,
  materialIndex,
  onUpdateMaterial,
  onUpdateLot,
  onAddLot,
  onRemoveMaterial,
  onRemoveLot,
  showFieldErrors = false,
  validationMessages,
  theme,
}: MaterialFormGroupCardProps) => {
  const formStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const specStyles = theme.sourcing.rawMaterial.specificationForm;
  const metaErrors = getMaterialMetaErrors(group, validationMessages, showFieldErrors);

  const { filledCount, totalCount, allFilled } = useMemo(() => {
    const allRows = group.lots.flatMap((lot) => lot.rows);
    const filled = allRows.filter((row) => row.analysedResult.trim() !== "").length;
    const total = allRows.length;
    return {
      filledCount: filled,
      totalCount: total,
      allFilled: total > 0 && filled === total,
    };
  }, [group.lots]);

  const specCount = group.lots[0]?.rows.length ?? 0;

  return (
    <Box sx={{ ...theme.workflow.formElements.blockCard, ...specStyles.animatedBlockCard(materialIndex) }}>
      <Box sx={theme.workflow.formElements.blockHeader}>
        <StackRow gap={1.5}>
          <Box sx={specStyles.iconBadge}>
            <ScienceRoundedIcon sx={{ ...specStyles.whiteIcon, ...specStyles.blockScienceIcon }} />
          </Box>
          <Box>
            <Typography sx={specStyles.blockTitle}>{group.material}</Typography>
            <Typography sx={specStyles.blockMeta}>
              {specCount}{" "}
              {specCount === 1 ? formStrings.SPECIFICATION_LABEL : formStrings.SPECIFICATION_LABEL_PLURAL} ·{" "}
              {group.lots.length}{" "}
              {group.lots.length === 1 ? formStrings.LOT_SUFFIX : formStrings.LOT_SUFFIX_PLURAL}
            </Typography>
          </Box>
        </StackRow>

        <StackRow gap={1}>
          <Chip
            icon={
              allFilled ? (
                <CheckCircleOutlineRoundedIcon
                  sx={{ ...specStyles.progressChipIcon, color: `${theme.palette.accent} !important` }}
                />
              ) : undefined
            }
            label={`${filledCount}/${totalCount} ${formStrings.RESULTS_FILLED_SUFFIX}`}
            size="small"
            sx={specStyles.progressChip(allFilled)}
          />
          <Tooltip title={formStrings.REMOVE_MATERIAL_TOOLTIP}>
            <IconButton size="small" onClick={() => onRemoveMaterial(materialIndex)} sx={specStyles.removeIconButton}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </StackRow>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ px: 2, py: 1.5 }}>
        <MandatoryFormField label={formStrings.SUPPLY_ORDER_LABEL} error={metaErrors.supplyOrderNo} theme={theme}>
          <TextField
            size="small"
            fullWidth
            variant="outlined"
            value={group.supplyOrderNo}
            onChange={(e) => onUpdateMaterial(materialIndex, { supplyOrderNo: e.target.value })}
            error={Boolean(metaErrors.supplyOrderNo)}
            sx={mandatoryFieldInputSx(theme.workflow.formElements.metaRowTextField, Boolean(metaErrors.supplyOrderNo), theme)}
          />
        </MandatoryFormField>
        <MandatoryFormField label={formStrings.RECEIPT_DATE_LABEL} error={metaErrors.receiptDate} theme={theme}>
          <ReceiptDateField
            value={group.receiptDate}
            onChange={(next) => onUpdateMaterial(materialIndex, { receiptDate: next })}
            theme={theme}
            error={Boolean(metaErrors.receiptDate)}
          />
        </MandatoryFormField>
        <MandatoryFormField label={formStrings.MANUFACTURER_LABEL} error={metaErrors.manufacturerName} theme={theme}>
          <TextField
            size="small"
            fullWidth
            variant="outlined"
            value={group.manufacturerName}
            onChange={(e) => onUpdateMaterial(materialIndex, { manufacturerName: e.target.value })}
            error={Boolean(metaErrors.manufacturerName)}
            sx={mandatoryFieldInputSx(
              theme.workflow.formElements.metaRowTextField,
              Boolean(metaErrors.manufacturerName),
              theme
            )}
          />
        </MandatoryFormField>
      </Stack>

      <Box sx={{ px: 2, pb: 1 }}>
        {group.lots.map((lot, lotIndex) => (
          <MaterialLotSection
            key={`${group.material}-lot-${lotIndex}`}
            lot={lot}
            lotIndex={lotIndex}
            lotCount={group.lots.length}
            onUpdate={(updated) => onUpdateLot(materialIndex, lotIndex, updated)}
            onRemove={() => onRemoveLot(materialIndex, lotIndex)}
            showFieldErrors={showFieldErrors}
            validationMessages={validationMessages}
            theme={theme}
          />
        ))}

        <Button
          variant="outlined"
          size="small"
          startIcon={<AddRoundedIcon />}
          onClick={() => onAddLot(materialIndex)}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            borderColor: theme.palette.primaryLight,
            color: theme.palette.primaryLight,
            "&:hover": { background: alpha(theme.palette.primaryLight, 0.06) },
          }}
        >
          {formStrings.ADD_LOT}
        </Button>
      </Box>
    </Box>
  );
};

export default MaterialFormGroupCard;
