import { useCallback, useEffect, useMemo, useState } from "react";
import {
  alpha,
  Box,
  Chip,
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
import { rmCertDebug, summarizeLotCerts } from "../../../../../utils/rawMaterialCertUploadDebug";
import CertificateUploadSection from "./CertificateUploadSection";
import FilePreviewDialog from "../../../../components/common/FilePreviewDialog";
import type { LotCertificate, MaterialLotBlock, SpecRow } from "../../../../../data/models/user/RawMaterialProcurementModel";
import {
  computeIsOutOfRange,
  isReferenceRangeNotApplicable,
  isSpecRowFailed,
  sanitizeNumericAnalysedResultInput,
} from "../../../../../data/models/user/RawMaterialProcurementModel";
import { useLotCertificateActions } from "../../../../../hooks/user/sourcing/useLotCertificateActions";
import MandatoryFormField, { mandatoryAsteriskSx, mandatoryFieldInputSx } from "./MandatoryFormField";
import {
  blockLotPath,
  blockCertTypePath,
} from "../../../../../data/validation/adapters/rawMaterialSourcing.validation";
import type { ValidationErrors } from "../../../../../data/validation/submissionIntent";
import useValidationDisplay, {
  type ValidationAttemptFlags,
} from "../../../../components/validation/useValidationDisplay";
const {
  delete: DeleteOutlineRoundedIcon,
  checkCircleOutline: CheckCircleOutlineRoundedIcon,
} = icons.user.sourcing.specificationFormBuilder;

type MaterialLotSectionProps = {
  lot: MaterialLotBlock;
  lotIndex: number;
  blockIndex: number;
  lotCount: number;
  onUpdate: (updater: MaterialLotBlock | ((prev: MaterialLotBlock) => MaterialLotBlock)) => void;
  onRemove: () => void;
  errors: ValidationErrors;
  validationAttempt: ValidationAttemptFlags;
  getAnalysedResultError: (blockIndex: number, rowIndex: number, touched: boolean) => string | undefined;
  theme: any;
};

const MaterialLotSection = ({
  lot,
  lotIndex,
  blockIndex,
  lotCount,
  onUpdate,
  onRemove,
  errors,
  validationAttempt,
  getAnalysedResultError,
  theme,
}: MaterialLotSectionProps) => {
  const formStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const specStyles = theme.sourcing.rawMaterial.specificationForm;
  const { visibleError } = useValidationDisplay(errors, validationAttempt);
  const [touchedAnalysedRows, setTouchedAnalysedRows] = useState(() => new Set<number>());
  const lotNoError = visibleError(blockLotPath(blockIndex, "lotNo"));
  const certificateError = visibleError(blockLotPath(blockIndex, "certificates"));

  useEffect(() => {
    setTouchedAnalysedRows(new Set());
  }, [lot.lotNo]);

  const handleCertificatesChange = useCallback(
    (certificates: LotCertificate[]) => {
      onUpdate((current) => ({ ...current, certificates }));
    },
    [onUpdate],
  );
  const {
    handleFilesSelected,
    handleRetry,
    handleRemove,
    handleOpen,
    filePreview,
    closeFilePreview,
    downloadFilePreview,
  } = useLotCertificateActions(lot.certificates ?? [], handleCertificatesChange);

  useEffect(() => {
    rmCertDebug("0.lot.render", {
      lotIndex,
      lotNo: lot.lotNo,
      certCount: (lot.certificates ?? []).length,
      lot: summarizeLotCerts(lot),
    });
  }, [lot, lotIndex]);

  const filledCount = useMemo(
    () => lot.rows.filter((row) => row.analysedResult.trim() !== "").length,
    [lot.rows]
  );
  const totalCount = lot.rows.length;
  const allFilled = totalCount > 0 && filledCount === totalCount;

  const handleCellChange = useCallback(
    (rowIndex: number, field: keyof SpecRow, value: string) => {
      if (field === "analysedResult") {
        setTouchedAnalysedRows((previous) => new Set(previous).add(rowIndex));
      }
      onUpdate((current) => {
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
    [onUpdate],
  );

  const handleLotNoChange = useCallback(
    (value: string) => {
      onUpdate((current) => ({ ...current, lotNo: value }));
    },
    [onUpdate],
  );

  const handleCertChange = useCallback(
    (certIndex: number, field: keyof LotCertificate, value: string) => {
      onUpdate((current) => {
        const certs = [...(current.certificates ?? [])];
        certs[certIndex] = { ...certs[certIndex], [field]: value };
        return { ...current, certificates: certs };
      });
    },
    [onUpdate],
  );

  return (
    <Box
      sx={{
        borderRadius: 1.5,
        border: `1px solid ${alpha(theme.palette?.border || "#ccc", 0.55)}`,
        overflow: "hidden",
        mb: 2,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          background: alpha(theme.palette?.primary ?? "#1B4F72", 0.04),
          borderBottom: `1px solid ${alpha(theme.palette?.border || "#ccc", 0.45)}`,
        }}
      >
        <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: theme.palette.text }}>
          {formStrings.LOT_LABEL} #{lotIndex + 1}
        </Typography>
        <Stack direction="row" alignItems="center" gap={1}>
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
          {lotCount > 1 && (
            <Tooltip title={formStrings.REMOVE_LOT_TOOLTIP}>
              <IconButton size="small" onClick={onRemove} sx={specStyles.removeIconButton}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      <Box sx={{ px: 2, py: 1.5, maxWidth: 360 }}>
        <MandatoryFormField label={formStrings.TABLE_HEADERS.LOT_ID} error={lotNoError} theme={theme}>
          <TextField
            size="small"
            fullWidth
            value={lot.lotNo}
            onChange={(event) => handleLotNoChange(event.target.value)}
            placeholder={formStrings.LOT_PLACEHOLDER}
            error={Boolean(lotNoError)}
            sx={mandatoryFieldInputSx(theme.workflow.formElements.textField, Boolean(lotNoError), theme)}
          />
        </MandatoryFormField>
      </Box>

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
                <TableCell
                  sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.lotTableHeader.specification }}
                >
                  {formStrings.TABLE_HEADERS.SPECIFICATION}
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.lotTableHeader.refRange }}
                >
                  {formStrings.TABLE_HEADERS.REF_RANGE}
                </TableCell>
                <TableCell
                  sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.lotTableHeader.analysedResult }}
                >
                  {formStrings.TABLE_HEADERS.ANALYZED_RESULT}
                  <Box component="span" sx={mandatoryAsteriskSx(theme)}>
                    {" "}
                    *
                  </Box>
                </TableCell>
                <TableCell sx={{ ...theme.workflow.formElements.tableHeader, ...specStyles.lotTableHeader.remarks }}>
                  {formStrings.TABLE_HEADERS.REMARKS}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lot.rows.map((row, rowIndex) => {
                const rowFailed = isSpecRowFailed(row);
                const analyzedError = getAnalysedResultError(
                  blockIndex,
                  rowIndex,
                  touchedAnalysedRows.has(rowIndex),
                );
                return (
                  <TableRow key={rowIndex} sx={specStyles.dataRow(rowIndex, rowFailed)}>
                    <TableCell sx={{ ...theme.workflow.formElements.tableCell, ...specStyles.specCell }}>
                      <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                        <Typography sx={specStyles.specText}>{row.specification}</Typography>
                        {rowFailed && (
                          <Chip
                            label={formStrings.SPEC_STATUS_OUT_OF_RANGE}
                            size="small"
                            sx={specStyles.failedSpecChip}
                          />
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
        certificates={lot.certificates ?? []}
        formStrings={formStrings}
        theme={theme}
        onFilesSelected={handleFilesSelected}
        onCertChange={handleCertChange}
        onRemove={handleRemove}
        onRetry={handleRetry}
        onOpen={handleOpen}
        error={certificateError}
        certificateTypeError={(ci) => visibleError(blockCertTypePath(blockIndex, ci))}
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

export default MaterialLotSection;
