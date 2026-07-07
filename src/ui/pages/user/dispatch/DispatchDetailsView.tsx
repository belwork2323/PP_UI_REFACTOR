// src/ui/pages/approver/dispatch/DispatchDetailsView.jsx

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
import { styled } from "@mui/material/styles";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
  okBg: "rgba(27,94,32,0.08)",
  ok: "#1B5E20",
  notOkBg: "rgba(183,28,28,0.08)",
  notOk: "#B71C1C",
};

// ─── Shared STF-inspired Styled Components ────────────────────────────────────
const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.68rem",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  padding: "10px 14px",
  borderBottom: "none",
});

const TD = styled(TableCell)({
  padding: "10px 14px",
  fontSize: "0.78rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.55)}`,
  color: BRAND.text,
  verticalAlign: "middle",
});

const SectionHeaderBox = styled(Box)({
  px: 2,
  py: 1.2,
  background: alpha(BRAND.primary, 0.04),
  borderBottom: `1px solid ${alpha(BRAND.border, 0.8)}`,
  display: "flex",
  alignItems: "center",
  gap: 1,
});

const rowBg = (i) => (i % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.6));

// ─── String Formatting Helpers ────────────────────────────────────────────────
const sectionName = (id: string) =>
  id
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

const fieldLabel = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim();

// ─── Dynamic Value Evaluation / Badge Parser ───────────────────────────────
const ComplianceChip = ({ value }) => {
  if (value === null || value === undefined || value === "") {
    return <Typography sx={{ fontSize: "0.74rem", color: alpha(BRAND.textSub, 0.4), fontStyle: "italic" }}>—</Typography>;
  }
  
  if (typeof value === "boolean") {
    value = value ? "YES" : "NO";
  }

  const norm = String(value).toLowerCase().trim();
  const isOk = ["yes", "ok", "accorded", "true", "passed", "satisfactory", "clear"].includes(norm);
  const isNotOk = ["no", "not ok", "rejected", "false", "failed", "deviation"].includes(norm);

  if (isOk) {
    return (
      <Chip label={String(value).toUpperCase()} size="small" sx={{
        height: 19, fontSize: "0.62rem", fontWeight: 700,
        background: BRAND.okBg, color: BRAND.ok, border: `1px solid ${alpha(BRAND.ok, 0.25)}`
      }} />
    );
  }
  if (isNotOk) {
    return (
      <Chip label={String(value).toUpperCase()} size="small" sx={{
        height: 19, fontSize: "0.62rem", fontWeight: 700,
        background: BRAND.notOkBg, color: BRAND.notOk, border: `1px solid ${alpha(BRAND.notOk, 0.25)}`
      }} />
    );
  }
  return <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: BRAND.text }}>{String(value)}</Typography>;
};

// ─── STF-style Dynamic Grid Table ─────────────────────────────────────────────
const DynamicGridTable = ({ rows }: { rows: Record<string, any>[] }) => {
  if (!rows?.length) return null;
  const cols = Object.keys(rows[0]).filter((k) => !k.startsWith("_"));
  
  return (
    <TableContainer sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 2, boxShadow: `0 1px 6px ${alpha(BRAND.primary, 0.03)}`, overflowX: "auto", mb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {cols.map((col) => (
              <TH key={col}>{fieldLabel(col)}</TH>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={ri} sx={{ background: rowBg(ri), "&:hover": { background: alpha(BRAND.primary, 0.02) } }}>
              {cols.map((col) => (
                <TD key={col}>
                  <ComplianceChip value={row[col]} />
                </TD>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ─── Dynamic Section Block Processor ──────────────────────────────────────────
const DispatchBlockRenderer = ({ sectionId, dataBlock }: { sectionId: string; dataBlock: any }) => {
  if (!dataBlock || typeof dataBlock !== "object") return null;

  // If it's a primitive or an array at the root block level, wrap it appropriately
  const normalizedObj = Array.isArray(dataBlock) ? dataBlock[0] || {} : dataBlock;
  
  const allKeys = Object.keys(normalizedObj).filter((k) => !k.startsWith("_"));
  
  // Isolate plain parameters from complex arrays or internal object nodes
  const simpleKeys = allKeys.filter((k) => !Array.isArray(normalizedObj[k]) && (typeof normalizedObj[k] !== "object" || normalizedObj[k] === null));
  const complexKeys = allKeys.filter((k) => Array.isArray(normalizedObj[k]) || (typeof normalizedObj[k] === "object" && normalizedObj[k] !== null));

  if (simpleKeys.length === 0 && complexKeys.length === 0) return null;

  return (
    <Card elevation={0} sx={{ mb: 3.5, border: `1px solid ${BRAND.border}`, borderRadius: 2.5, overflow: "hidden", boxShadow: `0 2px 8px ${alpha(BRAND.primary, 0.03)}` }}>
      <SectionHeaderBox>
        <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: BRAND.primary, letterSpacing: "0.03em", textTransform: "uppercase" }}>
          {sectionName(sectionId)}
        </Typography>
      </SectionHeaderBox>

      <Box sx={{ p: 2, pb: 1 }}>
        {/* Simple Object Parameters Table */}
        {simpleKeys.length > 0 && (
          <TableContainer sx={{ border: `1px solid ${alpha(BRAND.border, 0.7)}`, borderRadius: 1.5, mb: complexKeys.length > 0 ? 2 : 0 }}>
            <Table size="small">
              <TableBody>
                {simpleKeys.map((key, idx) => (
                  <TableRow key={key} sx={{ background: rowBg(idx), "&:hover": { background: alpha(BRAND.primary, 0.01) } }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: "0.74rem", color: BRAND.textSub, px: 2, py: 1, width: 280, borderBottom: `1px solid ${alpha(BRAND.border, 0.4)}` }}>
                      {fieldLabel(key)}
                    </TableCell>
                    <TableCell sx={{ px: 2, py: 1, borderBottom: `1px solid ${alpha(BRAND.border, 0.4)}` }}>
                      <ComplianceChip value={normalizedObj[key]} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Nested Grids or Sub-Objects (recursive evaluation mapping) */}
        {complexKeys.map((key) => {
          const subData = normalizedObj[key];
          if (!subData) return null;

          if (Array.isArray(subData)) {
            if (!subData.length) return null;
            return (
              <Box key={key} sx={{ mt: 2, mb: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.7rem", color: BRAND.primary, mb: 1, letterSpacing: "0.02em", textTransform: "uppercase" }}>
                  {fieldLabel(key)} Grid Logs
                </Typography>
                <DynamicGridTable rows={subData} />
              </Box>
            );
          }

          // Handle sub-objects inline gracefully (like ndtClearance, safetyClearance etc.)
          return (
            <Box key={key} sx={{ mt: 2 }}>
              <DispatchBlockRenderer sectionId={`${sectionId} _ ${key}`} dataBlock={subData} />
            </Box>
          );
        })}
      </Box>
    </Card>
  );
};

// ─── Main View Execution Module ────────────────────────────────────────────────
type Props = {
  row: any;
  data: any;
  loading: boolean;
  onBack: () => void;
};

const DispatchDetailsView = ({ row, data, loading, onBack }: Props) => {
  // Safe dynamic cascade routing to grab raw fields no matter where the payload maps them
  const motor = data?.motors?.[0] || data?.casePreparationDetails || data || {};
  const details = motor?.dispatchDetails || data?.dispatchDetails || data?.details || data;

  const batchIdentifier = row?.batchId || data?.batchId || "—";
  const motorIdentifier = motor?.motorId || row?.motorId || "—";
  const operationalStatus = row?.dispatchStatus || row?.status || data?.status || "Submitted";

  // Isolate top-level object keys to cycle through dynamically (ignoring primitives like metadata identifiers)
  const structuralSections = details && typeof details === "object"
    ? Object.keys(details).filter((k) => !k.startsWith("_") && details[k] !== null)
    : [];

  return (
    <Box sx={{ py: 2, px: 1 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackRoundedIcon />}
        onClick={onBack}
        sx={{
          mb: 2.5, borderRadius: 2, fontWeight: 700, fontSize: "0.75rem", textTransform: "none",
          borderColor: BRAND.border, color: BRAND.textSub, 
          "&:hover": { background: alpha(BRAND.border, 0.3), color: BRAND.text }
        }}
      >
        Back to List
      </Button>

      <Card elevation={0} sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 3, overflow: "hidden", boxShadow: `0 4px 16px ${alpha(BRAND.primary, 0.05)}` }}>
        {/* Identity Masthead Banner */}
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BRAND.border}`, background: BRAND.surface }}>
          <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
            <Box
              sx={{
                width: 42, height: 42, borderRadius: 2,
                background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 2px 8px ${alpha(BRAND.primary, 0.3)}`
              }}
            >
              <LocalShippingRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: BRAND.text }}>
                Batch: {batchIdentifier}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub }}>
                Motor Unit ID: {motorIdentifier}
              </Typography>
            </Box>
            <Box sx={{ ml: "auto" }}>
              <Chip 
                label={operationalStatus} 
                size="small" 
                sx={{ 
                  height: 22, fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
                  background: alpha(BRAND.primary, 0.08), color: BRAND.primary, border: `1px solid ${alpha(BRAND.primary, 0.2)}`
                }} 
              />
            </Box>
          </Stack>
        </Box>

        {/* Content Flow Window */}
        <Box sx={{ p: 3, background: "#fff" }}>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" py={8} gap={1.5}>
              <CircularProgress size={30} sx={{ color: BRAND.primary }} />
              <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub, fontStyle: "italic" }}>
                Parsing dynamic dispatch manifest...
              </Typography>
            </Stack>
          ) : structuralSections.length > 0 ? (
            // Automatically parses flat keys, objects, or array matrices dynamically
            structuralSections.map((key) => (
              <DispatchBlockRenderer key={key} sectionId={key} dataBlock={details[key]} />
            ))
          ) : (
            <Typography sx={{ p: 4, textAlign: "center", color: BRAND.textSub, fontSize: "0.82rem", fontStyle: "italic" }}>
              No structural testing metrics logged for this dispatch configuration.
            </Typography>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default DispatchDetailsView;