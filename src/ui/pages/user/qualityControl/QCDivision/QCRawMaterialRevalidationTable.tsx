import { useCallback, useMemo, type ReactNode } from "react";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { SchemaFormValues } from "../../../../../schema-engine";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import {
  uniformTableBodyCellSx,
  uniformTableHeaderCellSx,
} from "../../../../../app/theme/custom_themes/shared/data_table_theme";
import DateField from "../../../../components/common/DateField";
import QCDivisionFileField from "./QCDivisionFileField";
import {
  qcReadOnlyBodyCellSx,
  qcReadOnlyTableContainerSx,
  qcReadOnlyTableHeaderCellSx,
} from "./components/QCDivisionReadOnlyValue";
import type { FileRef } from "../../../../../data/models/common/FileUploadModel";
import {
  getRevalidationRows,
  renumberRevalidationRows,
  setRevalidationRows,
  type QcRevalidationRow,
} from "../../../../../hooks/user/qualityControl/qcRawMaterialRevalidationTable";

type QCRawMaterialRevalidationTableProps = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues | ((prev: SchemaFormValues) => SchemaFormValues)) => void;
  batchId?: string;
  readOnly?: boolean;
};

const COMPACT_TABLE_COLUMNS = [
  { id: "PARAMETER", label: "Parameter" },
  { id: "SPECIFICATION", label: "Specs" },
  { id: "RESULT", label: "Analysed Result" },
  { id: "ACEM_QC_RESULT", label: "ACEM QC Result" },
  { id: "VALIDITY", label: "Validity" },
  { id: "REMARKS", label: "Remarks" },
] as const;

const FIELD_HEIGHT = 36;

const uniformInputSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    background: "#fff",
    height: FIELD_HEIGHT,
    minHeight: FIELD_HEIGHT,
  },
  "& .MuiInputBase-input": {
    fontSize: "0.72rem",
    py: 0,
    height: "100%",
    boxSizing: "border-box",
  },
};

const cellSx = uniformTableBodyCellSx(
  { border: QC_DIVISION_BRAND.border, text: QC_DIVISION_BRAND.text },
  {
    bodyFontSize: "0.72rem",
    bodyPaddingY: 0.55,
    bodyPaddingX: 0.75,
  },
);

const displayValue = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || "—";
};

const ReadOnlyValue = ({
  value,
  muted = false,
}: {
  value: unknown;
  muted?: boolean;
}) => (
  <Typography
    sx={{
      fontSize: "0.72rem",
      fontWeight: muted ? 500 : 600,
      color: muted ? QC_DIVISION_BRAND.textSub : QC_DIVISION_BRAND.text,
      lineHeight: 1.35,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    }}
  >
    {displayValue(value)}
  </Typography>
);

type RevalidationGroup = {
  groupId: string;
  srNo?: number | string;
  ingredient: string;
  lotBatchNumber: string;
  rowIndices: number[];
};

const QCRawMaterialRevalidationTable = ({
  values,
  onChange,
  readOnly = false,
}: QCRawMaterialRevalidationTableProps) => {
  const BRAND = QC_DIVISION_BRAND;
  const baseCellSx = readOnly ? qcReadOnlyBodyCellSx : cellSx;
  const rows = useMemo(
    () => getRevalidationRows(values).filter((row) => row._rowRole !== "picker"),
    [values],
  );

  const groups = useMemo(() => {
    const ordered: RevalidationGroup[] = [];
    const byId = new Map<string, RevalidationGroup>();

    rows.forEach((row, index) => {
      const groupId = String(row._groupId ?? `row-${index}`);
      let group = byId.get(groupId);
      if (!group) {
        group = {
          groupId,
          srNo: row.SR_NO,
          ingredient: String(row.INGREDIENT ?? "").trim(),
          lotBatchNumber: String(row.LOT_BATCH_NUMBER ?? "").trim(),
          rowIndices: [],
        };
        byId.set(groupId, group);
        ordered.push(group);
      }
      group.rowIndices.push(index);
      if (row.SR_NO != null && row.SR_NO !== "") {
        group.srNo = row.SR_NO;
      }
      const ingredient = String(row.INGREDIENT ?? "").trim();
      if (ingredient) group.ingredient = ingredient;
      const lot = String(row.LOT_BATCH_NUMBER ?? "").trim();
      if (lot) group.lotBatchNumber = lot;
    });

    return ordered;
  }, [rows]);

  const commitRows = useCallback(
    (nextRows: QcRevalidationRow[]) => {
      onChange((prev) => setRevalidationRows(prev, renumberRevalidationRows(nextRows)));
    },
    [onChange],
  );

  const updateRow = useCallback(
    (index: number, patch: Partial<QcRevalidationRow>) => {
      commitRows(rows.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
    },
    [commitRows, rows],
  );

  const renderText = (
    value: string,
    onValueChange: (next: string) => void,
    placeholder: string,
    disabled?: boolean,
  ) => (
    <TextField
      size="small"
      fullWidth
      value={value}
      disabled={disabled || readOnly}
      placeholder={placeholder}
      onChange={(event) => onValueChange(event.target.value)}
      sx={{ ...uniformInputSx, minWidth: 90 }}
    />
  );

  const headerCellSx = readOnly
    ? qcReadOnlyTableHeaderCellSx
    : uniformTableHeaderCellSx(BRAND.primary, BRAND.primaryLight, {
        headerFontSize: "0.7rem",
        headerLetterSpacing: "0.05em",
        headerPaddingY: 0.55,
        headerPaddingX: 0.75,
      });

  const MetaField = ({
    label,
    children,
    minWidth = 140,
  }: {
    label: string;
    children: ReactNode;
    minWidth?: number | { xs?: number; sm?: number };
  }) => (
    <Box sx={{ minWidth, flex: { xs: "1 1 100%", sm: "1 1 0" } }}>
      <Typography
        sx={{
          fontSize: "0.62rem",
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: BRAND.textSub,
          mb: 0.4,
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  );

  return (
    <Stack spacing={1.75}>
      {!groups.length ? (
        <Box
          sx={{
            border: `1px dashed ${alpha(BRAND.border, 0.9)}`,
            borderRadius: 2,
            background: "#fff",
            px: 2,
            py: 2.5,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub, fontWeight: 600 }}>
            {readOnly
              ? "No raw material revalidation data is available for this batch."
              : "Loading batch materials… If this persists, confirm the identification sheet has materials with lot numbers assigned."}
          </Typography>
        </Box>
      ) : null}
      {groups.map((group, groupIndex) => {
        const groupCertificate: FileRef[] =
          (rows.find(
            (entry) =>
              String(entry._groupId ?? "") === group.groupId &&
              Array.isArray(entry.QC_CERTIFICATE) &&
              entry.QC_CERTIFICATE.length > 0,
          )?.QC_CERTIFICATE as FileRef[] | undefined) ?? [];

        return (
          <Box
            key={group.groupId}
            sx={{
              border: `1px solid ${BRAND.border}`,
              borderRadius: 2,
              background: readOnly ? BRAND.surface : "#fff",
              overflow: "hidden",
              boxShadow: readOnly ? "none" : `0 2px 10px ${alpha(BRAND.primary, 0.05)}`,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              flexWrap="wrap"
              gap={{ xs: 1, sm: 2 }}
              sx={{
                px: 1.25,
                py: 1,
                background: "#fff",
                borderBottom: `1px solid ${alpha(BRAND.border, 0.65)}`,
              }}
            >
              <MetaField label="Sr No" minWidth={56}>
                <ReadOnlyValue value={group.srNo ?? groupIndex + 1} />
              </MetaField>
              <MetaField label="Ingredient" minWidth={{ xs: "100%", sm: 160 }}>
                <ReadOnlyValue value={group.ingredient} />
              </MetaField>
              <MetaField label="Lot Number" minWidth={{ xs: "100%", sm: 220 }}>
                <ReadOnlyValue value={group.lotBatchNumber} />
              </MetaField>
            </Stack>

            <TableContainer
              sx={
                readOnly
                  ? { ...qcReadOnlyTableContainerSx, border: "none", borderRadius: 0 }
                  : { background: "#fff", overflowX: "auto" }
              }
            >
              <Table size="small" sx={{ background: readOnly ? "transparent" : "#fff" }}>
                <TableHead>
                  <TableRow>
                    {COMPACT_TABLE_COLUMNS.map((column) => (
                      <TableCell key={column.id} sx={headerCellSx}>
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.rowIndices.map((rowIndex) => {
                    const row = rows[rowIndex];
                    const isExpanded = row._rowRole === "expanded";

                    return (
                      <TableRow
                        key={`${group.groupId}-${rowIndex}`}
                        sx={{
                          background: "#fff",
                          ...(!readOnly
                            ? {
                                "&:hover > td": {
                                  background: alpha(BRAND.primaryLight, 0.03),
                                },
                              }
                            : {}),
                        }}
                      >
                        <TableCell sx={{ ...baseCellSx, background: readOnly ? "transparent" : "#fff", minWidth: 140 }}>
                          <ReadOnlyValue value={row.PARAMETER} muted />
                        </TableCell>
                        <TableCell sx={{ ...baseCellSx, background: "#fff", minWidth: 90 }}>
                          <ReadOnlyValue value={row.SPECIFICATION} muted />
                        </TableCell>
                        <TableCell sx={{ ...baseCellSx, background: "#fff", minWidth: 110 }}>
                          {isExpanded ? (
                            readOnly ? (
                              <ReadOnlyValue value={row.RESULT} />
                            ) : (
                              renderText(
                                String(row.RESULT ?? ""),
                                (next) => updateRow(rowIndex, { RESULT: next }),
                                "Analysed Result",
                              )
                            )
                          ) : null}
                        </TableCell>
                        <TableCell sx={{ ...baseCellSx, background: "#fff", minWidth: 110 }}>
                          {isExpanded ? (
                            readOnly ? (
                              <ReadOnlyValue value={row.ACEM_QC_RESULT} />
                            ) : (
                              renderText(
                                String(row.ACEM_QC_RESULT ?? ""),
                                (next) => updateRow(rowIndex, { ACEM_QC_RESULT: next }),
                                "ACEM QC Result",
                              )
                            )
                          ) : null}
                        </TableCell>
                        <TableCell sx={{ ...baseCellSx, background: "#fff", minWidth: 130 }}>
                          {isExpanded ? (
                            readOnly ? (
                              <ReadOnlyValue value={row.VALIDITY} />
                            ) : (
                              <DateField
                                value={String(row.VALIDITY ?? "")}
                                onChange={(next) => updateRow(rowIndex, { VALIDITY: next })}
                                placeholder="Validity"
                                compact
                                inputSx={uniformInputSx}
                              />
                            )
                          ) : null}
                        </TableCell>
                        <TableCell sx={{ ...baseCellSx, background: "#fff", minWidth: 120 }}>
                          {isExpanded ? (
                            readOnly ? (
                              <ReadOnlyValue value={row.REMARKS} muted />
                            ) : (
                              renderText(
                                String(row.REMARKS ?? ""),
                                (next) => updateRow(rowIndex, { REMARKS: next }),
                                "Remarks",
                              )
                            )
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow
                    sx={{
                      background: "#fff",
                      "& > td": {
                        background: "#fff",
                        borderTop: `1px solid ${alpha(BRAND.border, 0.55)}`,
                      },
                    }}
                  >
                    <TableCell
                      colSpan={COMPACT_TABLE_COLUMNS.length}
                      sx={{ ...baseCellSx, py: readOnly ? 0.75 : 0.9, background: "#fff" }}
                    >
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                        gap={1}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: readOnly ? BRAND.textSub : BRAND.text,
                          }}
                        >
                          {readOnly ? "QC Certificate" : "Upload QC Certificate"}
                        </Typography>
                        <Box sx={{ minWidth: { sm: 260 }, maxWidth: 420, width: "100%" }}>
                          <QCDivisionFileField
                            files={groupCertificate}
                            onChange={
                              readOnly
                                ? () => undefined
                                : (next) =>
                                    commitRows(
                                      rows.map((entry) =>
                                        String(entry._groupId ?? "") === group.groupId
                                          ? { ...entry, QC_CERTIFICATE: next }
                                          : entry,
                                      ),
                                    )
                            }
                            readOnly={readOnly}
                            compact
                            multiple
                            acceptMode="imageVideoPdf"
                            emptyLabel="Upload"
                          />
                        </Box>
                      </Stack>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      })}
    </Stack>
  );
};

export default QCRawMaterialRevalidationTable;
