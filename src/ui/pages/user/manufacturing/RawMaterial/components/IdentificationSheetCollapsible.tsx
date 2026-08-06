import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { STRINGS } from "../../../../../../app/config/strings";
import getManufacturingTheme from "../../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import { batchManagementController } from "../../../../../../controllers/admin/BatchManagement/batchManagementController";
import type { IdentificationSheet } from "../../../../../../data/models/admin/BatchManagement/BatchManagementModel";
import { formatToIsoDateInput } from "../../../../../../utils/dateUtils";

const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;
const BD = STRINGS.BATCH_MANAGEMENT.DETAILS;

type ManufacturingTheme = ReturnType<typeof getManufacturingTheme>;

type IdentificationSheetCollapsibleProps = {
  batchId: string;
  identificationSheet?: IdentificationSheet | null;
  theme: ManufacturingTheme;
  open: boolean;
  onToggle: () => void;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const iso = formatToIsoDateInput(String(value).trim()) || String(value).trim();
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const displayValue = (value: unknown): string => {
  if (value == null || value === "") return "—";
  return String(value);
};

const IdentificationSheetCollapsible = ({
  batchId,
  identificationSheet,
  theme,
  open,
  onToggle,
}: IdentificationSheetCollapsibleProps) => {
  const dt = theme.manufacturing.rawMaterialPrep.details;
  const [resolvedSheet, setResolvedSheet] = useState<IdentificationSheet | null>(
    identificationSheet ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (identificationSheet) {
      setResolvedSheet(identificationSheet);
      setLoadFailed(false);
    }
  }, [identificationSheet]);

  useEffect(() => {
    if (!open) return;

    if (identificationSheet) {
      setResolvedSheet(identificationSheet);
      setLoadFailed(false);
      return;
    }

    if (!batchId.trim()) {
      setResolvedSheet(null);
      setLoadFailed(true);
      return;
    }

    let cancelled = false;

    const loadSheet = async () => {
      setLoading(true);
      setLoadFailed(false);

      const batch = await batchManagementController.getBatchById(batchId.trim());

      if (cancelled) return;

      setLoading(false);

      if (!batch?.identificationSheet) {
        setResolvedSheet(null);
        setLoadFailed(true);
        return;
      }

      setResolvedSheet(batch.identificationSheet);
      setLoadFailed(false);
    };

    void loadSheet();

    return () => {
      cancelled = true;
    };
  }, [open, batchId, identificationSheet]);

  const materials = resolvedSheet?.materials ?? [];

  const metaFields = useMemo(
    () =>
      resolvedSheet
        ? [
            { label: BD.SHEET_DATE, value: formatDate(resolvedSheet.date) },
            { label: BD.BATCH_SIZE, value: displayValue(resolvedSheet.batchSize) },
            { label: BD.BONDING_SHEET_NO, value: displayValue(resolvedSheet.bondingSheetNo) },
            {
              label: BD.MIXER_TYPE,
              value: displayValue(resolvedSheet.mixerType ?? resolvedSheet.mixerDetails),
            },
            { label: BD.BUILDING_NO, value: displayValue(resolvedSheet.BldgNo) },
            { label: BD.NUMBER_OF_PREMIX, value: displayValue(resolvedSheet.numberOfPremix) },
            { label: BD.PRC_APPROVAL_DATE, value: formatDate(resolvedSheet.prcApprovalDate) },
            { label: BD.REMARKS, value: displayValue(resolvedSheet.remarks) },
          ]
        : [],
    [resolvedSheet],
  );

  return (
    <Box sx={{ mt: 1 }}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<VisibilityRoundedIcon fontSize="small" />}
        endIcon={open ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
        onClick={onToggle}
        sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.78rem" }}
      >
        {open ? RM.WEIGHTMENT_HIDE_IDENTIFICATION_SHEET : RM.WEIGHTMENT_VIEW_IDENTIFICATION_SHEET}
      </Button>

      <Collapse in={open} timeout={200} unmountOnExit>
        <Box
          sx={{
            mt: 1.25,
            p: 1.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.border}`,
            background: theme.palette.pageBg,
          }}
        >
          <Typography sx={{ ...dt.sectionTitle, mb: 1.25 }}>
            <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
            {RM.WEIGHTMENT_IDENTIFICATION_SECTION}
          </Typography>

          {loading ? (
            <Box sx={{ ...dt.loadingBox, minHeight: 120 }}>
              <CircularProgress size={28} sx={{ color: theme.palette.primaryLight }} />
              <Typography sx={dt.emptyText}>{RM.WEIGHTMENT_IDENTIFICATION_LOADING}</Typography>
            </Box>
          ) : loadFailed || !resolvedSheet ? (
            <Typography sx={dt.emptyText}>
              {loadFailed
                ? RM.WEIGHTMENT_IDENTIFICATION_LOAD_FAILED
                : RM.WEIGHTMENT_IDENTIFICATION_EMPTY}
            </Typography>
          ) : (
            <>
              <Box sx={{ ...dt.metaGrid, mb: 2 }}>
                {metaFields.map((field) => (
                  <Box key={field.label} sx={dt.metaItem}>
                    <Typography sx={dt.metaLabel}>{field.label}</Typography>
                    <Typography sx={dt.metaValue}>{field.value}</Typography>
                  </Box>
                ))}
              </Box>

              {materials.length === 0 ? (
                <Typography sx={dt.emptyText}>{BD.NO_MATERIALS}</Typography>
              ) : (
                <TableContainer sx={dt.tableContainer}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {BD.MATERIAL_COLS.map((col, idx) => (
                          <TableCell key={col} sx={dt.tableHeaderCell(idx === 0)}>
                            {col}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {materials.map((material, idx) => (
                        <TableRow
                          key={`${material.materialCode}-${material.lotId}-${idx}`}
                          sx={dt.tableRow(idx)}
                        >
                          <TableCell sx={dt.tableCell}>{material.srNo || idx + 1}</TableCell>
                          <TableCell sx={dt.tableCell}>
                            {displayValue(material.materialCode)}
                          </TableCell>
                          <TableCell sx={dt.tableCell}>
                            {displayValue(material.materialName)}
                          </TableCell>
                          <TableCell sx={dt.tableCell}>
                            {displayValue(material.gradeName || material.gradeCode)}
                          </TableCell>
                          <TableCell sx={dt.tableCell}>{displayValue(material.lotId)}</TableCell>
                          <TableCell sx={dt.tableCell}>
                            {displayValue(material.make || material.manufacturerName)}
                          </TableCell>
                          <TableCell sx={dt.tableCell}>
                            {displayValue(material.requiredComposition)}
                          </TableCell>
                          <TableCell sx={dt.tableCell}>
                            {displayValue(material.quantityPerPremix)}
                          </TableCell>
                          <TableCell sx={dt.tableCell}>
                            {formatDate(material.revalidationFromDate ?? material.revalidationDate)}
                          </TableCell>
                          <TableCell sx={dt.tableCell}>
                            {formatDate(material.revalidationToDate ?? material.revalidationDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default IdentificationSheetCollapsible;
