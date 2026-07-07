import React from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { icons } from "../../../../../app/theme/icons";

const { straighten: StraightenRoundedIcon } = icons.approver.manufacturing.trimming;

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  tr: "#1565C0",
  trLight: "#1976D2",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
  accent: "#148F77",
  warn: "#D4AC0D",
};

const sectionName = (id: string) =>
  id
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

const fieldLabel = (key: string) => key.replace(/_/g, " ");

const isArrayField = (key: string) => 
  key.endsWith("_TABLE") || key === "TRIMMING_DETAILS" || key === "DIMENSION_TABLE";

// Renders deep dynamic tabular sheets (e.g., TRIMMING_DETAILS or DIMENSION_TABLE arrays)
const DynamicTable = ({ rows, sectionId }: { rows: Record<string, any>[]; sectionId: string }) => {
  if (!rows?.length) return null;
  const cols = Object.keys(rows[0]).filter((k) => !k.startsWith("_"));
  
  return (
    <TableContainer sx={{ mt: 1, mb: 1.5, border: `1px solid ${alpha(BRAND.tr, 0.2)}`, borderRadius: 1.5, overflowX: "auto", background: "#fff" }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background: alpha(BRAND.tr, 0.06) }}>
            {cols.map((col) => (
              <TableCell key={col} sx={{ fontWeight: 700, fontSize: "0.65rem", color: BRAND.primary, px: 1.5, py: 1, whiteSpace: "nowrap" }}>
                {fieldLabel(col)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => {
            // Contextual highlight color if rendering Before vs After metrology rows
            const isAfterTrimming = String(row["MEASUREMENT_TYPE"] || "").includes("After");
            const rowBg = isAfterTrimming ? alpha(BRAND.accent, 0.02) : ri % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.5);

            return (
              <TableRow key={ri} sx={{ background: rowBg }}>
                {cols.map((col) => {
                  const val = row[col];
                  return (
                    <TableCell key={col} sx={{ fontSize: "0.74rem", px: 1.5, py: 1 }}>
                      {col === "MEASUREMENT_TYPE" ? (
                        <Chip 
                          label={String(val)} 
                          size="small" 
                          sx={{ 
                            height: 18, 
                            fontSize: "0.62rem", 
                            fontWeight: 700,
                            background: isAfterTrimming ? alpha(BRAND.accent, 0.1) : alpha(BRAND.warn, 0.1),
                            color: isAfterTrimming ? BRAND.accent : BRAND.warn
                          }} 
                        />
                      ) : (
                        String(val ?? "—")
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Renders the section components matching your backend payload
const SectionRenderer = ({ section }: { section: { sectionId: string; sectionData: Record<string, any>[] } }) => {
  const entries = section.sectionData ?? [];
  if (!entries.length) return null;

  // Split primitive key-value metrics from dynamic array tables
  const simpleKeys = Object.keys(entries[0]).filter((k) => !k.startsWith("_") && !isArrayField(k));
  const tableKeys = Object.keys(entries[0]).filter((k) => isArrayField(k));

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ px: 1.5, py: 1, mb: 1.5, background: alpha(BRAND.tr, 0.05), borderRadius: 1, borderLeft: `3px solid ${BRAND.tr}` }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: BRAND.tr }}>
          {sectionName(section.sectionId)}
        </Typography>
      </Box>

      {/* Flat metrics (Form configuration details) */}
      {simpleKeys.length > 0 && (
        <TableContainer sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 1, mb: 1.5, background: "#fff" }}>
          <Table size="small">
            <TableBody>
              {simpleKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.7rem", color: BRAND.textSub, px: 1.5, py: 0.7, width: 220 }}>
                    {fieldLabel(key)}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600, color: BRAND.text, px: 1.5, py: 0.7 }}>
                    {String(entries[0][key] ?? "—")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dynamic Table grids (Trimming Configurations & Dimension Maps) */}
      {tableKeys.map((key) => {
        const data = entries[0][key];
        if (!Array.isArray(data) || !data.length) return null;
        return (
          <Box key={key} sx={{ mb: 1.5 }}>
            <Typography sx={{ fontWeight: 600, fontSize: "0.68rem", color: BRAND.textSub, mb: 0.5, px: 0.5 }}>
              {fieldLabel(key)}
            </Typography>
            <DynamicTable rows={data} sectionId={section.sectionId} />
          </Box>
        );
      })}
    </Box>
  );
};

type TrimmingDetailsViewProps = {
  row: any;
  data: any;
  loading: boolean;
  onBack: () => void;
};

const TrimmingDetailsView = ({ row, data, loading, onBack }: TrimmingDetailsViewProps) => {
  // Unwrap standard envelope parameters
  const dataPayload = data?.data || data || {};
  const motorsList = dataPayload.motors || [];
  
  // Isolate the matching motor sheet dataset for this specific row entry
  const activeMotor = motorsList.find((m: any) => m.motorId === row.motorId) || motorsList[0] || {};
  const sections = activeMotor.sections || [];

  return (
    <Box sx={{ py: 3, px: 2 }}>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={onBack}
        sx={{ mb: 2, color: BRAND.tr, fontWeight: 600, fontSize: "0.82rem", textTransform: "none" }}
      >
        Back to List
      </Button>

      <Card elevation={0} sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 2.5, overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BRAND.border}`, background: BRAND.surface }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: "10px",
                background: `linear-gradient(135deg, ${BRAND.tr}, ${BRAND.trLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <StraightenRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: BRAND.text }}>
                {dataPayload.batchId || row.batchId}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub }}>
                Motor Ref ID: {row.motorId} · Stage {activeMotor.motorStage || row.motorStage || "—"}
              </Typography>
            </Box>
            <Box sx={{ ml: "auto" }}>
              <Chip 
                label={dataPayload.status || row.status || "WAITING_FOR_APPROVAL"} 
                color="primary"
                size="small" 
                sx={{ height: 24, fontWeight: 700, fontSize: "0.65rem" }} 
              />
            </Box>
          </Stack>
        </Box>

        <Box sx={{ p: 3, background: alpha(BRAND.surface, 0.3) }}>
          {loading ? (
            <Stack alignItems="center" py={6}>
              <CircularProgress size={28} />
              <Typography variant="caption" sx={{ mt: 1.5, color: BRAND.textSub }}>Extracting logged dimensions...</Typography>
            </Stack>
          ) : sections.length > 0 ? (
            sections.map((section: any) => (
              <SectionRenderer key={section.sectionId} section={section} />
            ))
          ) : (
            <Typography sx={{ fontSize: "0.82rem", color: BRAND.textSub, textAlign: "center", py: 4 }}>
              No saved trimming form details available for preview.
            </Typography>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default TrimmingDetailsView;