import { useCallback, useEffect, useMemo, type ChangeEvent } from "react";
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
import { useAlertStore } from "../../../../../app/store/alertStore";
import { fileUtils } from "../../../../../utils/FileUtils";
import { rmCertDebug, rmCertDebugFile, summarizeLotCerts } from "../../../../../utils/rawMaterialCertUploadDebug";
import CertificateUploadSection from "./CertificateUploadSection";
import type { LotCertificate, MaterialLotBlock, SpecRow } from "../../../../../data/models/user/RawMaterialProcurementModel";
import {
  computeIsOutOfRange,
  isSpecRowFailed,
} from "../../../../../data/models/user/RawMaterialProcurementModel";
import MandatoryFormField, { mandatoryAsteriskSx, mandatoryFieldInputSx } from "./MandatoryFormField";
import {
  getLotFieldErrors,
  isAnalyzedResultMissing,
  type MandatoryValidationMessages,
} from "../../../../../data/models/user/rawMaterialProcurementValidation";

const {
  delete: DeleteOutlineRoundedIcon,
  checkCircleOutline: CheckCircleOutlineRoundedIcon,
} = icons.user.sourcing.specificationFormBuilder;

type MaterialLotSectionProps = {
  lot: MaterialLotBlock;
  lotIndex: number;
  lotCount: number;
  onUpdate: (lot: MaterialLotBlock) => void;
  onRemove: () => void;
  showFieldErrors?: boolean;
  validationMessages: MandatoryValidationMessages;
  theme: any;
};

const MaterialLotSection = ({
  lot,
  lotIndex,
  lotCount,
  onUpdate,
  onRemove,
  showFieldErrors = false,
  validationMessages,
  theme,
}: MaterialLotSectionProps) => {
  const formStrings = STRINGS.SOURCING.SPECIFICATION_FORM;
  const specStyles = theme.sourcing.rawMaterial.specificationForm;
  const lotErrors = getLotFieldErrors(lot, validationMessages, showFieldErrors);
  const showAlert = useAlertStore((state) => state.showAlert);

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
      const updatedRows = lot.rows.map((row, currentIndex) => {
        if (currentIndex !== rowIndex) return row;
        const next = { ...row, [field]: value };
        if (field === "analysedResult") {
          next.status = null;
          next.isOutOfRange = computeIsOutOfRange(value, row.referenceRange);
        }
        return next;
      });
      onUpdate({ ...lot, rows: updatedRows });
    },
    [lot, onUpdate]
  );

  const handleLotNoChange = useCallback(
    (value: string) => {
      onUpdate({ ...lot, lotNo: value });
    },
    [lot, onUpdate]
  );

  const handleCertChange = useCallback(
    (certIndex: number, field: keyof LotCertificate, value: string) => {
      const certs = [...(lot.certificates ?? [])];
      certs[certIndex] = { ...certs[certIndex], [field]: value };
      onUpdate({ ...lot, certificates: certs });
    },
    [lot, onUpdate]
  );

  const removeCertificate = useCallback(
    (certIndex: number) => {
      const certs = [...(lot.certificates ?? [])];
      const removed = certs[certIndex];
      if (removed?.fileUrl?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(removed.fileUrl);
        } catch {
          /* ignore */
        }
      }
      onUpdate({ ...lot, certificates: certs.filter((_, i) => i !== certIndex) });
    },
    [lot, onUpdate]
  );

  const handleCertificateFiles = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      // Copy before clearing — FileList is live; clearing value empties it (breaks on some browsers).
      const incoming = input.files ? Array.from(input.files) : [];

      rmCertDebug("1.fileInput.onChange", {
        lotIndex,
        lotNo: lot.lotNo,
        pickedCount: incoming.length,
        files: incoming.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type || "(empty mime)",
        })),
        priorCertCount: (lot.certificates ?? []).length,
      });

      if (!incoming.length) {
        rmCertDebug("1.fileInput.empty", { reason: "zero files after copy" });
        return;
      }

      const next = [...(lot.certificates ?? [])];
      let added = 0;

      try {
        for (const file of incoming) {
          rmCertDebugFile("2.file.picked", file, { lotIndex, lotNo: lot.lotNo });
          const { valid, error } = fileUtils.validateCertificateFile(file);
          if (!valid) {
            rmCertDebug("2.file.rejected", { name: file.name, error });
            showAlert(`${file.name}: ${error ?? formStrings.CERT_INVALID_FILE}`, "warning");
            continue;
          }
          const blobUrl = URL.createObjectURL(file);
          rmCertDebug("2.file.accepted", {
            name: file.name,
            blobUrlPrefix: blobUrl.slice(0, 40),
          });
          next.push({ fileName: file.name, fileUrl: blobUrl, certificateType: "", file });
          added += 1;
        }

        if (added > 0) {
          const updatedLot = { ...lot, certificates: next };
          rmCertDebug("3.lot.onUpdate.call", {
            lotIndex,
            added,
            lot: summarizeLotCerts(updatedLot),
          });
          onUpdate(updatedLot);
        } else {
          rmCertDebug("3.lot.onUpdate.skipped", { reason: "no valid files added" });
        }
      } catch (err) {
        rmCertDebug("1.fileInput.error", { message: err instanceof Error ? err.message : String(err) });
        showAlert(formStrings.CERT_INVALID_FILE, "error");
      } finally {
        queueMicrotask(() => {
          input.value = "";
        });
      }
    },
    [formStrings.CERT_INVALID_FILE, lot, lotIndex, onUpdate, showAlert]
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
        <MandatoryFormField label={formStrings.TABLE_HEADERS.LOT_ID} error={lotErrors.lotNo} theme={theme}>
          <TextField
            size="small"
            fullWidth
            value={lot.lotNo}
            onChange={(event) => handleLotNoChange(event.target.value)}
            placeholder={formStrings.LOT_PLACEHOLDER}
            error={Boolean(lotErrors.lotNo)}
            sx={mandatoryFieldInputSx(theme.workflow.formElements.textField, Boolean(lotErrors.lotNo), theme)}
          />
        </MandatoryFormField>
      </Box>

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
            {lot.rows.map((row, rowIndex) => {
              const rowFailed = isSpecRowFailed(row);
              const analyzedMissing = isAnalyzedResultMissing(row, showFieldErrors);
              return (
                <TableRow key={rowIndex} sx={specStyles.dataRow(rowIndex, rowFailed)}>
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
        certificates={lot.certificates ?? []}
        formStrings={formStrings}
        theme={theme}
        onFilesSelected={handleCertificateFiles}
        onCertChange={handleCertChange}
        onRemove={removeCertificate}
      />
    </Box>
  );
};

export default MaterialLotSection;
