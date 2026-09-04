import { useCallback, useEffect, useMemo, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  FormHelperText,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import CertificateUploadSection from "./CertificateUploadSection";
import FilePreviewDialog from "../../../../components/common/FilePreviewDialog";
import StackRow from "../../../../components/common/StackRow";
import type { LotCertificate } from "../../../../../data/models/user/RawMaterialProcurementModel";
import {
  computeIsOutOfRange,
  isReferenceRangeNotApplicable,
  isSpecRowFailed,
  sanitizeNumericAnalysedResultInput,
} from "../../../../../data/models/user/RawMaterialProcurementModel";
import { useLotCertificateActions } from "../../../../../hooks/user/sourcing/useLotCertificateActions";
import {
  SpecificationBlock,
  SpecificationBlockUpdater,
  SpecificationRow,
} from "../../../../../hooks/user/sourcing/useRawMaterialSpecificationForm";
import ReceiptDateField from "./ReceiptDateField";
import MandatoryFormField, { mandatoryAsteriskSx, mandatoryFieldInputSx } from "./MandatoryFormField";
import {
  blockLotPath,
  blockMetaPath,
  blockCertTypePath,
} from "../../../../../data/validation/adapters/rawMaterialSourcing.validation";
import type { ValidationErrors } from "../../../../../data/validation/submissionIntent";
import useValidationDisplay, {
  type ValidationAttemptFlags,
} from "../../../../components/validation/useValidationDisplay";

const {
  delete: DeleteOutlineRoundedIcon,
  science: ScienceRoundedIcon,
  checkCircleOutline: CheckCircleOutlineRoundedIcon,
} = icons.user.sourcing.specificationFormBuilder;

type MaterialSpecificationBlockProps = {
  block: SpecificationBlock;
  index: number;
  createLotMode?: boolean;
  lockLotNo?: boolean;
  showDeleteLot?: boolean;
  onDeleteLot?: () => void;
  deleteLoading?: boolean;
  onUpdate: (index: number, updater: SpecificationBlockUpdater) => void;
  onRemove: (index: number) => void;
  errors: ValidationErrors;
  validationAttempt: ValidationAttemptFlags;
  getAnalysedResultError: (blockIndex: number, rowIndex: number, touched: boolean) => string | undefined;
  theme: any;
};

function useMaterialBlockState(
  block: SpecificationBlock,
  index: number,
  onUpdate: (index: number, updater: SpecificationBlockUpdater) => void,
  onCellEdit?: (rowIndex: number, field: keyof SpecificationRow) => void,
) {
  const handleCellChange = useCallback(
    (rowIndex: number, field: keyof SpecificationRow, value: string) => {
      onCellEdit?.(rowIndex, field);
      onUpdate(index, (current) => {
        const updatedRows = current.rows.map((row, currentIndex) => {
          if (currentIndex !== rowIndex) return row;
          const nextValue =
            field === "analysedResult" && !isReferenceRangeNotApplicable(row.referenceRange)
              ? sanitizeNumericAnalysedResultInput(value)
              : value;
          const next = { ...row, [field]: nextValue };
          if (field === "analysedResult") {
            next.status = null;
            next.isOutOfRange = computeIsOutOfRange(nextValue, row.referenceRange);
          }
          return next;
        });
        return { ...current, rows: updatedRows };
      });
    },
    [index, onCellEdit, onUpdate],
  );

  const handleLotNoChange = useCallback(
    (value: string) => {
      onUpdate(index, (current) => ({ ...current, lotNo: value }));
    },
    [index, onUpdate],
  );

  const handleBlockMeta = useCallback(
    (field: "supplyOrderNo" | "receiptDate" | "manufacturerName", value: string) => {
      onUpdate(index, (current) => ({ ...current, [field]: value }));
    },
    [index, onUpdate],
  );

  const handleCertChange = useCallback(
    (certIndex: number, field: keyof LotCertificate, value: string) => {
      onUpdate(index, (current) => {
        const certs = [...(current.certificates ?? [])];
        certs[certIndex] = { ...certs[certIndex], [field]: value };
        return { ...current, certificates: certs };
      });
    },
    [index, onUpdate],
  );

  const filledCount = useMemo(
    () => block.rows.filter((row) => row.analysedResult.trim() !== "").length,
    [block.rows],
  );
  const totalCount = block.rows.length;
  const allFilled = totalCount > 0 && filledCount === totalCount;

  return {
    filledCount,
    totalCount,
    allFilled,
    handleCellChange,
    handleLotNoChange,
    handleBlockMeta,
    handleCertChange,
  };
}

const MaterialSpecificationBlock = ({
  block,
  index,
  createLotMode = false,
  lockLotNo = false,
  showDeleteLot = false,
  onDeleteLot,
  deleteLoading = false,
  onUpdate,
  onRemove,
  errors,
  validationAttempt,
  getAnalysedResultError,
  theme,
}: MaterialSpecificationBlockProps) => {
  const formStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const specStyles = theme.sourcing.rawMaterial.specificationForm;
  const { visibleError } = useValidationDisplay(errors, validationAttempt);
  const [touchedAnalysedRows, setTouchedAnalysedRows] = useState(() => new Set<number>());

  useEffect(() => {
    setTouchedAnalysedRows(new Set());
  }, [block.lotNo, block.material]);

  const {
    allFilled,
    filledCount,
    handleCellChange,
    handleLotNoChange,
    handleBlockMeta,
    handleCertChange,
    totalCount,
  } = useMaterialBlockState(block, index, onUpdate, (rowIndex, field) => {
    if (field === "analysedResult") {
      setTouchedAnalysedRows((previous) => new Set(previous).add(rowIndex));
    }
  });

  const supplyOrderError = visibleError(blockMetaPath(index, "supplyOrderNo"));
  const receiptDateError = visibleError(blockMetaPath(index, "receiptDate"));
  const manufacturerError = visibleError(blockMetaPath(index, "manufacturerName"));
  const lotNoError = visibleError(blockLotPath(index, "lotNo"));
  const certificateError = visibleError(blockLotPath(index, "certificates"));

  const handleCertificatesChange = useCallback(
    (certificates: LotCertificate[]) => {
      onUpdate(index, (current) => ({ ...current, certificates }));
    },
    [index, onUpdate],
  );
  const {
    handleFilesSelected,
    handleRetry,
    handleRemove,
    handleOpen,
    filePreview,
    closeFilePreview,
    downloadFilePreview,
  } = useLotCertificateActions(block.certificates ?? [], handleCertificatesChange);

  return (
    <Box sx={{ ...theme.workflow.formElements.blockCard, ...specStyles.animatedBlockCard(index) }}>
      <Box sx={theme.workflow.formElements.blockHeader}>
        <StackRow gap={1.5}>
          <Box sx={specStyles.iconBadge}>
            <ScienceRoundedIcon sx={{ ...specStyles.whiteIcon, ...specStyles.blockScienceIcon }} />
          </Box>
          <Box>
            <Typography sx={specStyles.blockTitle}>{block.material}</Typography>
            <Typography sx={specStyles.blockMeta}>
              {block.rows.length}{" "}
              {block.rows.length === 1 ? formStrings.SPECIFICATION_LABEL : formStrings.SPECIFICATION_LABEL_PLURAL} ·{" "}
              {createLotMode ? formStrings.LOT_LABEL : formStrings.BLOCK_LABEL} #{index + 1}
            </Typography>
          </Box>
        </StackRow>

        <StackRow gap={1}>
          <Chip
            icon={
              allFilled ? (
                <CheckCircleOutlineRoundedIcon sx={{ ...specStyles.progressChipIcon, color: `${theme.palette.accent} !important` }} />
              ) : undefined
            }
            label={`${filledCount}/${totalCount} ${formStrings.RESULTS_FILLED_SUFFIX}`}
            size="small"
            sx={specStyles.progressChip(allFilled)}
          />
          {showDeleteLot && onDeleteLot ? (
            <Tooltip title={formStrings.DELETE_LOT_TOOLTIP} arrow placement="top">
              <span>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteOutlineRoundedIcon />}
                  onClick={onDeleteLot}
                  disabled={deleteLoading}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, flexShrink: 0 }}
                >
                  {formStrings.DELETE_LOT}
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title={formStrings.REMOVE_BLOCK_TOOLTIP}>
              <IconButton size="small" onClick={() => onRemove(index)} sx={specStyles.removeIconButton}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </StackRow>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ px: 2, py: 1.5 }}>
        <MandatoryFormField
          label={formStrings.SUPPLY_ORDER_LABEL}
          error={supplyOrderError}
          theme={theme}
          required={false}
        >
          <TextField
            size="small"
            fullWidth
            variant="outlined"
            value={block.supplyOrderNo ?? ""}
            onChange={(e) => handleBlockMeta("supplyOrderNo", e.target.value)}
            error={Boolean(supplyOrderError)}
            sx={mandatoryFieldInputSx(theme.workflow.formElements.metaRowTextField, Boolean(supplyOrderError), theme)}
          />
        </MandatoryFormField>
        <MandatoryFormField
          label={formStrings.RECEIPT_DATE_LABEL}
          error={receiptDateError}
          theme={theme}
          required={false}
        >
          <ReceiptDateField
            value={block.receiptDate ?? ""}
            onChange={(next) => handleBlockMeta("receiptDate", next)}
            theme={theme}
            error={Boolean(receiptDateError)}
          />
        </MandatoryFormField>
        <MandatoryFormField label={formStrings.MANUFACTURER_LABEL} error={manufacturerError} theme={theme}>
          <TextField
            size="small"
            fullWidth
            variant="outlined"
            value={block.manufacturerName ?? ""}
            onChange={(e) => handleBlockMeta("manufacturerName", e.target.value)}
            error={Boolean(manufacturerError)}
            sx={mandatoryFieldInputSx(
              theme.workflow.formElements.metaRowTextField,
              Boolean(manufacturerError),
              theme
            )}
          />
        </MandatoryFormField>
      </Stack>

      <Box sx={specStyles.specsTableWrap}>
        <TableContainer
          sx={{
            ...specStyles.specsTableContainer,
            border: `1px solid ${alpha(theme.palette?.border || "#ccc", 0.45)}`,
          }}
        >
          <Table size="small" sx={specStyles.specsTable}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.material }}>
                  {formStrings.TABLE_HEADERS.MATERIAL}
                </TableCell>
                <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.lotBatch }}>
                  {createLotMode ? formStrings.TABLE_HEADERS.LOT_ID : formStrings.TABLE_HEADERS.LOT_BATCH_NO}
                  <Box component="span" sx={mandatoryAsteriskSx(theme)}>
                    {" "}
                    *
                  </Box>
                </TableCell>
                <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.specification }}>
                  {formStrings.TABLE_HEADERS.SPECIFICATION}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.refRange }}
                >
                  {formStrings.TABLE_HEADERS.REF_RANGE}
                </TableCell>
                <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.analysedResult }}>
                  {formStrings.TABLE_HEADERS.ANALYZED_RESULT}
                  <Box component="span" sx={mandatoryAsteriskSx(theme)}>
                    {" "}
                    *
                  </Box>
                </TableCell>
                <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.remarks }}>
                  {formStrings.TABLE_HEADERS.REMARKS}
                </TableCell>
              </TableRow>
            </TableHead>
          <TableBody>
            {block.rows.map((row, rowIndex) => {
              const rowFailed = isSpecRowFailed(row);
                const analyzedError = getAnalysedResultError(
                  index,
                  rowIndex,
                  touchedAnalysedRows.has(rowIndex),
                );
              return (
              <TableRow key={rowIndex} sx={specStyles.dataRow(rowIndex, rowFailed)}>
                <TableCell sx={{ ...theme.workflow.formElements.tableCell, ...specStyles.specCell }}>
                  {rowIndex === 0 && (
                    <Chip label={block.material} size="small" sx={theme.workflow.formElements.primaryGradientChip} />
                  )}
                </TableCell>

                <TableCell sx={{ ...theme.workflow.formElements.tableCell, ...specStyles.inputCell, verticalAlign: "top" }}>
                  {rowIndex === 0 && (
                    <Box>
                      <TextField
                        size="small"
                        fullWidth
                        value={block.lotNo}
                        onChange={(event) => handleLotNoChange(event.target.value)}
                        placeholder={formStrings.LOT_PLACEHOLDER}
                        disabled={lockLotNo}
                        error={Boolean(lotNoError)}
                        sx={{
                          ...mandatoryFieldInputSx(
                            { ...theme.workflow.formElements.cellField, ...specStyles.lotField },
                            Boolean(lotNoError),
                            theme
                          ),
                          ...(lockLotNo
                            ? {
                                "& .MuiOutlinedInput-root.Mui-disabled": {
                                  background: alpha(theme.palette.textSub, 0.06),
                                  "& fieldset": { borderColor: alpha(theme.palette.border, 0.8) },
                                },
                                "& .MuiInputBase-input.Mui-disabled": {
                                  WebkitTextFillColor: theme.palette.text,
                                  color: theme.palette.text,
                                  fontWeight: 600,
                                },
                              }
                            : {}),
                        }}
                      />
                      {lotNoError ? (
                        <FormHelperText error sx={{ mx: 0, mt: 0.5, fontSize: "0.68rem" }}>
                          {lotNoError}
                        </FormHelperText>
                      ) : lockLotNo ? (
                        <FormHelperText sx={{ mx: 0, mt: 0.5, fontSize: "0.68rem", color: theme.palette.textSub }}>
                          {formStrings.LOT_ID_LOCKED_HINT}
                        </FormHelperText>
                      ) : null}
                    </Box>
                  )}
                </TableCell>

                <TableCell sx={{ ...theme.workflow.formElements.tableCell, ...specStyles.specCell }}>
                  <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                    <Typography sx={specStyles.specText}>{row.specification}</Typography>
                    {rowFailed && (
                        <Chip label={formStrings.SPEC_STATUS_OUT_OF_RANGE} size="small" sx={specStyles.failedSpecChip} />
                    )}
                  </Stack>
                </TableCell>

                <TableCell sx={{ ...theme.workflow.formElements.tableCell, ...specStyles.refRangeCell }}>
                  <Chip label={row.refRange} size="small" sx={specStyles.refRangeChip} />
                </TableCell>

                <TableCell sx={{ ...theme.workflow.formElements.tableCell, ...specStyles.inputCell }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={row.analysedResult || ""}
                    onChange={(event) => handleCellChange(rowIndex, "analysedResult", event.target.value)}
                    placeholder={formStrings.ANALYZED_RESULT_PLACEHOLDER}
                    inputMode={
                      isReferenceRangeNotApplicable(row.referenceRange) ? "text" : "decimal"
                    }
                    error={Boolean(analyzedError)}
                    helperText={analyzedError}
                    FormHelperTextProps={{ sx: { mx: 0, fontSize: "0.65rem" } }}
                    sx={{
                      ...theme.workflow.formElements.cellField,
                      ...specStyles.analyzedField,
                      ...(rowFailed || analyzedError ? specStyles.failedAnalyzedField : {}),
                    }}
                  />
                </TableCell>

                <TableCell sx={{ ...theme.workflow.formElements.tableCell, ...specStyles.inputCell }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={row.acemQcResult || ""}
                    onChange={(event) => handleCellChange(rowIndex, "acemQcResult", event.target.value)}
                    placeholder={formStrings.REMARKS_PLACEHOLDER}
                    sx={{
                      ...theme.workflow.formElements.cellField,
                      ...specStyles.remarksField,
                    }}
                  />
                </TableCell>
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      </Box>

      <CertificateUploadSection
        certificates={block.certificates ?? []}
        formStrings={formStrings}
        theme={theme}
        onFilesSelected={handleFilesSelected}
        onCertChange={handleCertChange}
        onRemove={handleRemove}
        onRetry={handleRetry}
        onOpen={handleOpen}
        error={certificateError}
        certificateTypeError={(ci) => visibleError(blockCertTypePath(index, ci))}
      />

      <FilePreviewDialog
        preview={filePreview}
        onClose={closeFilePreview}
        onDownload={downloadFilePreview}
        themeColor={theme.palette.primary}
        themeColorLight={theme.palette.primaryLight}
      />
    </Box>
  );
};

export default MaterialSpecificationBlock;
