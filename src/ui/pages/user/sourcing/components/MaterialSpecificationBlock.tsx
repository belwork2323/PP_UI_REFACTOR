import { useCallback, useMemo, type ChangeEvent } from "react";
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
import { useAlertStore } from "../../../../../app/store/alertStore";
import { fileUtils } from "../../../../../utils/FileUtils";
import CertificateUploadSection from "./CertificateUploadSection";
import StackRow from "../../../../components/common/StackRow";
import type { LotCertificate } from "../../../../../data/models/user/RawMaterialProcurementModel";
import {
  computeIsOutOfRange,
  isSpecRowFailed,
} from "../../../../../data/models/user/RawMaterialProcurementModel";
import {
  SpecificationBlock,
  SpecificationRow,
} from "../../../../../hooks/user/sourcing/useRawMaterialSpecificationForm";
import ReceiptDateField from "./ReceiptDateField";
import MandatoryFormField, { mandatoryAsteriskSx, mandatoryFieldInputSx } from "./MandatoryFormField";
import {
  getLotFieldErrors,
  getMaterialMetaErrors,
  isAnalyzedResultMissing,
  type MandatoryValidationMessages,
} from "../../../../../data/models/user/rawMaterialProcurementValidation";

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
  onUpdate: (index: number, updatedBlock: SpecificationBlock) => void;
  onRemove: (index: number) => void;
  showFieldErrors?: boolean;
  validationMessages: MandatoryValidationMessages;
  theme: any;
};

function useMaterialBlockState(
  block: SpecificationBlock,
  index: number,
  onUpdate: (index: number, updatedBlock: SpecificationBlock) => void
) {
  const handleCellChange = useCallback(
    (rowIndex: number, field: keyof SpecificationRow, value: string) => {
      const updatedRows = block.rows.map((row, currentIndex) => {
        if (currentIndex !== rowIndex) return row;
        const next = { ...row, [field]: value };
        if (field === "analysedResult") {
          next.status = null;
          next.isOutOfRange = computeIsOutOfRange(value, row.referenceRange);
        }
        return next;
      });
      onUpdate(index, { ...block, rows: updatedRows });
    },
    [block, index, onUpdate]
  );

  const handleLotNoChange = useCallback(
    (value: string) => {
      onUpdate(index, { ...block, lotNo: value });
    },
    [block, index, onUpdate]
  );

  const handleBlockMeta = useCallback(
    (field: "supplyOrderNo" | "receiptDate" | "manufacturerName", value: string) => {
      onUpdate(index, { ...block, [field]: value });
    },
    [block, index, onUpdate]
  );

  const handleCertChange = useCallback(
    (certIndex: number, field: keyof LotCertificate, value: string) => {
      const certs = [...(block.certificates ?? [])];
      certs[certIndex] = { ...certs[certIndex], [field]: value };
      onUpdate(index, { ...block, certificates: certs });
    },
    [block, index, onUpdate]
  );

  const removeCertificate = useCallback(
    (certIndex: number) => {
      const certs = [...(block.certificates ?? [])];
      const removed = certs[certIndex];
      if (removed?.fileUrl?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(removed.fileUrl);
        } catch {
          /* ignore */
        }
      }
      onUpdate(index, { ...block, certificates: certs.filter((_, i) => i !== certIndex) });
    },
    [block, index, onUpdate]
  );

  const filledCount = useMemo(
    () => block.rows.filter((row) => row.analysedResult.trim() !== "").length,
    [block.rows]
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
    removeCertificate,
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
  showFieldErrors = false,
  validationMessages,
  theme,
}: MaterialSpecificationBlockProps) => {
  const formStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const specStyles = theme.sourcing.rawMaterial.specificationForm;
  const metaErrors = getMaterialMetaErrors(block, validationMessages, showFieldErrors);
  const lotErrors = getLotFieldErrors(block, validationMessages, showFieldErrors);
  const {
    allFilled,
    filledCount,
    handleCellChange,
    handleLotNoChange,
    handleBlockMeta,
    handleCertChange,
    removeCertificate,
    totalCount,
  } = useMaterialBlockState(block, index, onUpdate);

  const showAlert = useAlertStore((state) => state.showAlert);

  const handleCertificateFiles = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const incoming = input.files ? Array.from(input.files) : [];
      if (!incoming.length) return;

      const next = [...(block.certificates ?? [])];
      let added = 0;

      try {
        for (const file of incoming) {
          const { valid, error } = fileUtils.validateCertificateFile(file);
          if (!valid) {
            showAlert(`${file.name}: ${error ?? formStrings.CERT_INVALID_FILE}`, "warning");
            continue;
          }
          const blobUrl = URL.createObjectURL(file);
          next.push({ fileName: file.name, fileUrl: blobUrl, certificateType: "", file });
          added += 1;
        }

        if (added > 0) {
          onUpdate(index, { ...block, certificates: next });
        }
      } finally {
        queueMicrotask(() => {
          input.value = "";
        });
      }
    },
    [block, formStrings.CERT_INVALID_FILE, index, onUpdate, showAlert]
  );

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
        <MandatoryFormField label={formStrings.SUPPLY_ORDER_LABEL} error={metaErrors.supplyOrderNo} theme={theme}>
          <TextField
            size="small"
            fullWidth
            variant="outlined"
            value={block.supplyOrderNo ?? ""}
            onChange={(e) => handleBlockMeta("supplyOrderNo", e.target.value)}
            error={Boolean(metaErrors.supplyOrderNo)}
            sx={mandatoryFieldInputSx(theme.workflow.formElements.metaRowTextField, Boolean(metaErrors.supplyOrderNo), theme)}
          />
        </MandatoryFormField>
        <MandatoryFormField label={formStrings.RECEIPT_DATE_LABEL} error={metaErrors.receiptDate} theme={theme}>
          <ReceiptDateField
            value={block.receiptDate ?? ""}
            onChange={(next) => handleBlockMeta("receiptDate", next)}
            theme={theme}
            error={Boolean(metaErrors.receiptDate)}
          />
        </MandatoryFormField>
        <MandatoryFormField label={formStrings.MANUFACTURER_LABEL} error={metaErrors.manufacturerName} theme={theme}>
          <TextField
            size="small"
            fullWidth
            variant="outlined"
            value={block.manufacturerName ?? ""}
            onChange={(e) => handleBlockMeta("manufacturerName", e.target.value)}
            error={Boolean(metaErrors.manufacturerName)}
            sx={mandatoryFieldInputSx(
              theme.workflow.formElements.metaRowTextField,
              Boolean(metaErrors.manufacturerName),
              theme
            )}
          />
        </MandatoryFormField>
      </Stack>

      <TableContainer
        sx={{
          mx: 2,
          mb: 1.5,
          borderRadius: 1.5,
          border: `1px solid ${alpha(theme.palette?.border || "#ccc", 0.45)}`,
          overflow: "hidden",
        }}
      >
        <Table size="small" sx={{ tableLayout: "fixed" }}>
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
              <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.tableHeader.refRange }}>
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
              const analyzedMissing = isAnalyzedResultMissing(row, showFieldErrors);
              return (
              <TableRow key={rowIndex} sx={specStyles.dataRow(rowIndex, rowFailed)}>
                <TableCell sx={theme.workflow.formElements.tableCell}>
                  {rowIndex === 0 && (
                    <Chip label={block.material} size="small" sx={theme.workflow.formElements.primaryGradientChip} />
                  )}
                </TableCell>

                <TableCell sx={{ ...theme.workflow.formElements.tableCell, verticalAlign: "top" }}>
                  {rowIndex === 0 && (
                    <Box>
                      <TextField
                        size="small"
                        fullWidth
                        value={block.lotNo}
                        onChange={(event) => handleLotNoChange(event.target.value)}
                        placeholder={formStrings.LOT_PLACEHOLDER}
                        disabled={lockLotNo}
                        error={Boolean(lotErrors.lotNo)}
                        sx={{
                          ...mandatoryFieldInputSx(
                            { ...theme.workflow.formElements.cellField, ...specStyles.lotField },
                            Boolean(lotErrors.lotNo),
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
                      {lotErrors.lotNo ? (
                        <FormHelperText error sx={{ mx: 0, mt: 0.5, fontSize: "0.68rem" }}>
                          {lotErrors.lotNo}
                        </FormHelperText>
                      ) : lockLotNo ? (
                        <FormHelperText sx={{ mx: 0, mt: 0.5, fontSize: "0.68rem", color: theme.palette.textSub }}>
                          {formStrings.LOT_ID_LOCKED_HINT}
                        </FormHelperText>
                      ) : null}
                    </Box>
                  )}
                </TableCell>

                <TableCell sx={theme.workflow.formElements.tableCell}>
                  <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                    <Typography sx={specStyles.specText}>{row.specification}</Typography>
                    {rowFailed && (
                        <Chip label={formStrings.SPEC_STATUS_OUT_OF_RANGE} size="small" sx={specStyles.failedSpecChip} />
                    )}
                  </Stack>
                </TableCell>

                <TableCell sx={theme.workflow.formElements.tableCell}>
                  <Chip label={row.refRange} size="small" sx={specStyles.refRangeChip} />
                </TableCell>

                <TableCell sx={theme.workflow.formElements.tableCell}>
                  <TextField
                    size="small"
                    fullWidth
                    value={row.analysedResult || ""}
                    onChange={(event) => handleCellChange(rowIndex, "analysedResult", event.target.value)}
                    placeholder={formStrings.ANALYZED_RESULT_PLACEHOLDER}
                    type="number"
                    inputProps={{ step: "any" }}
                    error={analyzedMissing}
                    helperText={analyzedMissing ? formStrings.FIELD_REQUIRED_ANALYZED_RESULT : undefined}
                    FormHelperTextProps={{ sx: { mx: 0, fontSize: "0.65rem" } }}
                    sx={{
                      ...theme.workflow.formElements.cellField,
                      ...specStyles.analyzedField,
                      ...(rowFailed || analyzedMissing ? specStyles.failedAnalyzedField : {}),
                    }}
                  />
                </TableCell>

                <TableCell sx={theme.workflow.formElements.tableCell}>
                  <TextField
                    size="small"
                    fullWidth
                    multiline
                    minRows={1}
                    maxRows={3}
                    value={row.remarks || ""}
                    onChange={(event) => handleCellChange(rowIndex, "remarks", event.target.value)}
                    placeholder={formStrings.REMARKS_PLACEHOLDER}
                    sx={{ ...theme.workflow.formElements.multilineField, ...specStyles.remarksField }}
                  />
                </TableCell>
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <CertificateUploadSection
        certificates={block.certificates ?? []}
        formStrings={formStrings}
        theme={theme}
        onFilesSelected={handleCertificateFiles}
        onCertChange={handleCertChange}
        onRemove={removeCertificate}
      />
    </Box>
  );
};

export default MaterialSpecificationBlock;
