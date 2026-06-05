// src/ui/pages/approver/manufacturing/RawMaterialPreparation/RawMaterialPreparationApproverPage.jsx
//
// Approver page for Raw Material Preparation.
// Detail dialog mirrors the exact form structure:
//   • Solid   → process cards (AP Blending, Blending cum Drying, Drying RVD,
//                               Drying Oven, Screening, PSD, Al Processing)
//   • Liquid  → Part A (HTPB Blending) + Part B (Weightment rows)
//   • Linear  → Premix (Part A) + Final Mix (Part B)

import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  alpha,
  Card,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { ReportPreviewDialog } from "../components/ReportPdf";
import ApproverList from "../components/ApproverList";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import { icons } from "../../../../app/theme/icons";
import { APPROVER_PRIORITY_META, APPROVER_STATUS_META, isApproverActionableStatus } from "../../../../app/theme/approver";
import useApproverFormAction from "../../../../hooks/approver/useApproverFormAction";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  visibility: VisibilityRoundedIcon,
  close: CloseRoundedIcon,
  build: BuildRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
  grain: GrainRoundedIcon,
  opacity: OpacityRoundedIcon,
  blurLinear: BlurLinearRoundedIcon,
} = icons.approver.manufacturing.rawMaterialPreparation;

// ─── Palette ──────────────────────────────────────────────────────────────────
const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  accent: "#148F77",
  accentLight: "#1ABC9C",
  warn: "#D4AC0D",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
};

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

// ─── Status / Priority meta ───────────────────────────────────────────────────
export const RMP_STATUS_META = APPROVER_STATUS_META;

const PRIORITY_META = APPROVER_PRIORITY_META;

// ─── Styled cells ─────────────────────────────────────────────────────────────
const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.68rem",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  padding: "10px 14px",
  whiteSpace: "nowrap",
  borderBottom: "none",
  "&:first-of-type": { borderRadius: "6px 0 0 0" },
  "&:last-of-type": { borderRadius: "0 6px 0 0" },
});

const TD = styled(TableCell)({
  padding: "10px 14px",
  fontSize: "0.82rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.55)}`,
  color: BRAND.text,
  verticalAlign: "middle",
});

// Inner dialog table cells
const DTH = styled(TableCell)({
  background: alpha(BRAND.primary, 0.05),
  color: BRAND.textSub,
  fontWeight: 700,
  fontSize: "0.63rem",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  padding: "7px 10px",
  borderBottom: `1px solid ${BRAND.border}`,
  whiteSpace: "nowrap",
});

const DTD = styled(TableCell)({
  padding: "7px 10px",
  fontSize: "0.78rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
  color: BRAND.text,
  verticalAlign: "middle",
});

// ─── Chip helpers ─────────────────────────────────────────────────────────────
const StatusChip = ({ status }) => (
  <Chip
    label={status}
    size="small"
    sx={{
      height: 20,
      fontSize: "0.62rem",
      fontWeight: 700,
      background: RMP_STATUS_META[status]?.bg,
      color: RMP_STATUS_META[status]?.color,
      border: `1px solid ${RMP_STATUS_META[status]?.border}`,
    }}
  />
);
const PriorityChip = ({ priority }) => (
  <Chip
    label={priority}
    size="small"
    sx={{
      height: 20,
      fontSize: "0.62rem",
      fontWeight: 700,
      background: PRIORITY_META[priority]?.bg,
      color: PRIORITY_META[priority]?.color,
      border: `1px solid ${PRIORITY_META[priority]?.border}`,
    }}
  />
);
const TypeChip = ({ type }) => (
  <Chip
    label={`Type ${type}`}
    size="small"
    sx={{
      height: 20,
      fontSize: "0.62rem",
      fontWeight: 700,
      background: alpha(BRAND.primaryLight, 0.1),
      color: BRAND.primaryLight,
      border: `1px solid ${alpha(BRAND.primaryLight, 0.2)}`,
    }}
  />
);
const BatchTypeChip = ({ type }) => (
  <Chip
    label={type}
    size="small"
    sx={{
      height: 20,
      fontSize: "0.62rem",
      fontWeight: 700,
      background: alpha(BRAND.primaryLight, 0.1),
      color: BRAND.primaryLight,
      border: `1px solid ${alpha(BRAND.primaryLight, 0.2)}`,
    }}
  />
);

// ─── Section divider ──────────────────────────────────────────────────────────
const SectionDivider = ({ icon: Icon, label, color }) => (
  <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: "8px",
        flexShrink: 0,
        background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.7)})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon sx={{ color: "#fff", fontSize: 14 }} />
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color, letterSpacing: "0.04em" }}>{label}</Typography>
    <Box sx={{ flex: 1, height: "1px", background: alpha(color, 0.2) }} />
  </Stack>
);

// ─── Process block renderer (Solid) ──────────────────────────────────────────
const AP_ROW_LABELS = {
  row_tumbling: "Tumbling of Blender @ RPM",
  row_jacket: "Jacket Water Temperature",
  row_storage: "Storage & Marking",
};
const RVD_ROW_LABELS = {
  materialQuantity: "Material Quantity",
  drying: "Drying",
  vacuumApplication: "Vacuum Application",
  vacuumBreak: "Vacuum Break",
  sampleCollection: "Sample Collection",
  storingMarking: "Storing & Marking",
};
const OVEN_ROW_LABELS = {
  materialLoading: "Material Loading into Oven",
  dryingWaterJacketed: "Drying – Water Jacketed Oven",
  dryingAirOven: "Drying – Air Oven",
  sampleCollection: "Sample Collection & Analysis",
};
const PSD_SPEC_LABELS = {
  range1: "Particle Size Range 1 %",
  range2: "Range 2 %",
  range3: "Range 3 %",
  avgDiameter: "Avg Diameter",
};
const AL_ROW_LABELS = {
  screenMesh: "Screen Mesh Opening / Size",
  foreignParticle: "Foreign Particle Observed",
  collectedQty: "Collected Quantity (Kg)",
};

const rowBg = (i) => (i % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.6));
const lastRow = { "&:last-child td": { borderBottom: "none" } };

const ProcessBlock = ({ proc }) => {
  const label = PROCESS_LABELS[proc.processKey] ?? proc.processKey;
  const d = proc.data;

  const renderRows = () => {
    if (proc.processKey === "ap_blending") {
      return Object.entries(d as Record<string, unknown>).map(([rowId, r], i) => (
        <TableRow key={rowId} sx={{ background: rowBg(i), "&:hover": {}, ...lastRow }}>
          <DTD sx={{ fontWeight: 600 }}>{AP_ROW_LABELS[rowId] ?? rowId}</DTD>
          <DTD>{getTextValue(r, "parameter") ?? "—"}</DTD>
          <DTD>{getTextValue(r, "time") ? `${getTextValue(r, "time")} min` : "—"}</DTD>
          <DTD sx={{ color: BRAND.textSub }}>{getTextValue(r, "remarks") ?? "—"}</DTD>
        </TableRow>
      ));
    }
    if (proc.processKey === "blending_cum_drying") {
      const r = d.hotWaterCirculation ?? {};
      return (
        <TableRow sx={lastRow}>
          <DTD sx={{ fontWeight: 600 }}>Hot Water Circulation Temp</DTD>
          <DTD>{getTextValue(r, "temp") ? `${getTextValue(r, "temp")} °C` : "—"}</DTD>
          <DTD>{getTextValue(r, "time") ? `${getTextValue(r, "time")} min` : "—"}</DTD>
          <DTD sx={{ color: BRAND.textSub }}>{getTextValue(r, "remarks") ?? "—"}</DTD>
        </TableRow>
      );
    }
    if (proc.processKey === "drying_rvd") {
      return Object.entries(d as Record<string, unknown>).map(([rowId, r], i) => {
        const val =
          rowId === "drying"
            ? `${getTextValue(r, "temp") ?? "—"} °C / ${getTextValue(r, "duration") ?? "—"} hrs`
            : rowId === "materialQuantity"
              ? `${getTextValue(r, "weight") ?? "—"} Kg`
              : rowId === "vacuumApplication"
                ? `${getTextValue(r, "vacuumLevel") ?? "—"} mmHg`
                : (getTextValue(r, "value") ?? "—");
        return (
          <TableRow key={rowId} sx={{ background: rowBg(i), ...lastRow }}>
            <DTD sx={{ fontWeight: 600 }}>{RVD_ROW_LABELS[rowId] ?? rowId}</DTD>
            <DTD colSpan={2} sx={{ fontWeight: 700, color: BRAND.accent }}>
              {val}
            </DTD>
            <DTD sx={{ color: BRAND.textSub }}>{getTextValue(r, "remarks") ?? "—"}</DTD>
          </TableRow>
        );
      });
    }
    if (proc.processKey === "drying_oven") {
      return Object.entries(d as Record<string, unknown>).map(([rowId, r], i) => {
        const val =
          rowId === "dryingWaterJacketed"
            ? `${getTextValue(r, "insideTemp") ?? "—"} °C`
            : rowId === "dryingAirOven"
              ? `${getTextValue(r, "temp") ?? "—"} °C`
              : (getTextValue(r, "parameter") ?? "—");
        return (
          <TableRow key={rowId} sx={{ background: rowBg(i), ...lastRow }}>
            <DTD sx={{ fontWeight: 600 }}>{OVEN_ROW_LABELS[rowId] ?? rowId}</DTD>
            <DTD sx={{ fontWeight: 700, color: BRAND.accent }}>{val}</DTD>
            <DTD>{getTextValue(r, "time") ? `${getTextValue(r, "time")} min` : "—"}</DTD>
            <DTD sx={{ color: BRAND.textSub }}>{getTextValue(r, "remarks") ?? "—"}</DTD>
          </TableRow>
        );
      });
    }
    if (proc.processKey === "psd") {
      const h = d.header ?? {};
      return (
        <>
          {[
            ["Motor ID", h.motorId],
            ["Date", h.date],
            ["Grinding Batch ID", h.grindingBatchId],
          ].map(([lbl, val], i) => (
            <TableRow key={lbl} sx={{ background: rowBg(i) }}>
              <DTD sx={{ fontWeight: 600 }}>{lbl}</DTD>
              <DTD colSpan={3}>{val || "—"}</DTD>
            </TableRow>
          ))}
          {Object.entries((d.specs ?? {}) as Record<string, unknown>).map(([rowId, s], i) => (
            <TableRow key={rowId} sx={{ background: rowBg(i + 3), ...lastRow }}>
              <DTD sx={{ fontWeight: 600 }}>{PSD_SPEC_LABELS[rowId] ?? rowId}</DTD>
              <DTD colSpan={3} sx={{ fontWeight: 700, color: BRAND.accent }}>
                {getTextValue(s, "specification") ?? "—"}
              </DTD>
            </TableRow>
          ))}
        </>
      );
    }
    if (proc.processKey === "al_processing") {
      return Object.entries(d as Record<string, unknown>).map(([rowId, r], i) => {
        const val =
          rowId === "foreignParticle"
            ? getTextValue(r, "observed") || "—"
            : rowId === "collectedQty"
              ? `${getTextValue(r, "parameter") ?? "—"} Kg`
              : (getTextValue(r, "parameter") ?? "—");
        return (
          <TableRow key={rowId} sx={{ background: rowBg(i), ...lastRow }}>
            <DTD sx={{ fontWeight: 600 }}>{AL_ROW_LABELS[rowId] ?? rowId}</DTD>
            <DTD sx={{ fontWeight: 700, color: BRAND.accent }}>{val}</DTD>
            <DTD>{getTextValue(r, "time") ? `${getTextValue(r, "time")} min` : "—"}</DTD>
            <DTD sx={{ color: BRAND.textSub }}>{getTextValue(r, "remarks") ?? "—"}</DTD>
          </TableRow>
        );
      });
    }
    return null;
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" gap={1} mb={0.75}>
        <Chip
          label={label}
          size="small"
          sx={{
            height: 22,
            fontSize: "0.68rem",
            fontWeight: 800,
            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
            color: "#fff",
          }}
        />
        <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub }}>
          Instance <strong style={{ color: BRAND.text }}>#{proc.instanceId}</strong>
        </Typography>
      </Stack>
      <TableContainer
        sx={{
          borderRadius: "6px",
          border: `1px solid ${BRAND.border}`,
          boxShadow: `0 1px 6px ${alpha(BRAND.primary, 0.05)}`,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <DTH>Operation / Parameter</DTH>
              <DTH>Value</DTH>
              <DTH>Time</DTH>
              <DTH>Remarks</DTH>
            </TableRow>
          </TableHead>
          <TableBody>{renderRows()}</TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// ─── Liquid section ───────────────────────────────────────────────────────────
const MATERIAL_COLORS = {
  HTPB: "#1565C0",
  DOA: "#2E7D32",
  Adduct: "#6A1B9A",
  TDI: "#BF360C",
};

const LiquidSection = ({ liquidData }) => {
  const a = liquidData.partA ?? {};
  const rows = liquidData.partBRows ?? [];

  return (
    <Box>
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub, mb: 0.75 }}>
        Part A — HTPB Blending
      </Typography>
      <TableContainer
        sx={{
          borderRadius: "6px",
          border: `1px solid ${BRAND.border}`,
          mb: 2,
          boxShadow: `0 1px 6px ${alpha(BRAND.primary, 0.05)}`,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <DTH>Parameter</DTH>
              <DTH>Value</DTH>
            </TableRow>
          </TableHead>
          <TableBody>
            {[
              ["Jacket Temperature", a.jacketTemp ? `${a.jacketTemp} °C` : "—"],
              ["RPM", a.rpm ? `${a.rpm} rpm` : "—"],
              ["Agitate Time", a.time ? `${a.time} min` : "—"],
            ].map(([lbl, val], i) => (
              <TableRow key={lbl} sx={{ background: rowBg(i), ...lastRow }}>
                <DTD sx={{ fontWeight: 600 }}>{lbl}</DTD>
                <DTD sx={{ fontWeight: 700, color: BRAND.accent }}>{val}</DTD>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {rows.length > 0 && (
        <>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub, mb: 0.75 }}>
            Part B — Weightment
          </Typography>
          <TableContainer
            sx={{
              borderRadius: "6px",
              border: `1px solid ${BRAND.border}`,
              boxShadow: `0 1px 6px ${alpha(BRAND.primary, 0.05)}`,
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <DTH>Material</DTH>
                  <DTH>%</DTH>
                  <DTH>Weight (Kg)</DTH>
                  <DTH>Lot No.</DTH>
                  <DTH>Date & Time</DTH>
                  <DTH>Remarks</DTH>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, i) => {
                  const mc = MATERIAL_COLORS[r.material] ?? BRAND.primary;
                  return (
                    <TableRow key={r.id} sx={{ background: rowBg(i), ...lastRow }}>
                      <DTD>
                        <Chip
                          label={r.material}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            background: alpha(mc, 0.1),
                            color: mc,
                            border: `1px solid ${alpha(mc, 0.25)}`,
                          }}
                        />
                      </DTD>
                      <DTD>{r.percentage ? `${r.percentage}%` : "—"}</DTD>
                      <DTD sx={{ fontWeight: 700, color: BRAND.accent }}>{r.weightKg ? `${r.weightKg} Kg` : "—"}</DTD>
                      <DTD sx={{ color: BRAND.textSub }}>{r.lotNo || "—"}</DTD>
                      <DTD sx={{ color: BRAND.textSub, whiteSpace: "nowrap" }}>
                        {r.dateTime
                          ? new Date(r.dateTime).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </DTD>
                      <DTD sx={{ color: BRAND.textSub }}>{r.remarks || "—"}</DTD>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

// ─── Linear section ───────────────────────────────────────────────────────────
const LinearSection = ({ linearData }) => {
  const p = linearData.premix ?? {};
  const f = linearData.finalMix ?? {};

  const MiniTable = ({ rows }) => (
    <TableContainer
      sx={{
        borderRadius: "6px",
        border: `1px solid ${BRAND.border}`,
        mb: 2,
        boxShadow: `0 1px 6px ${alpha(BRAND.primary, 0.05)}`,
      }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <DTH>Parameter</DTH>
            <DTH>Time (min)</DTH>
            <DTH>Remarks / Lab Ref</DTH>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(([label, time, remarks], i) => (
            <TableRow key={label} sx={{ background: rowBg(i), ...lastRow }}>
              <DTD sx={{ fontWeight: 600 }}>{label}</DTD>
              <DTD sx={{ fontWeight: 700, color: BRAND.accent }}>{time || "—"}</DTD>
              <DTD sx={{ color: BRAND.textSub }}>{remarks || "—"}</DTD>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub, mb: 0.75 }}>
        Part A — Premix
      </Typography>
      <MiniTable
        rows={[
          ["Temperature", p.timeA, p.remarksA],
          ["Vacuum & Moisture", p.timeB, p.remarksB],
          ["RPM and Time", p.timeC, p.remarksC],
        ]}
      />
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub, mb: 0.75 }}>
        Part B — Final Mix (TDI Addition)
      </Typography>
      <MiniTable
        rows={[
          ["TDI Addition Time", f.timeA, f.remarksA],
          ["Vacuum", f.timeB, f.remarksB],
        ]}
      />
    </Box>
  );
};

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const RMPDetailDialog = ({ open, onClose, item, onApprove, onReject }) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const types = item.types ?? {};

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "92vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            m: 2,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: "14px 20px",
            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <BuildRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                Raw Material Preparation Submission
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.7), fontSize: "0.72rem" }}>
                {item.batchId} · {item.motorId}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center">
            <PriorityChip priority={item.priority} />
            <Button
              size="small"
              variant="contained"
              startIcon={<PictureAsPdfRoundedIcon sx={{ fontSize: "14px !important" }} />}
              onClick={() => setPdfOpen(true)}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                fontSize: "0.72rem",
                textTransform: "none",
                px: 1.6,
                py: "5px",
                whiteSpace: "nowrap",
                background: alpha("#fff", 0.18),
                color: "#fff",
                border: `1px solid ${alpha("#fff", 0.3)}`,
                backdropFilter: "blur(8px)",
                "&:hover": { background: alpha("#fff", 0.28), boxShadow: "none" },
                boxShadow: "none",
              }}
            >
              View as PDF
            </Button>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ color: alpha("#fff", 0.8), "&:hover": { background: alpha("#fff", 0.1) } }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {/* Type badges strip */}
        <Box
          sx={{
            px: 2.5,
            py: 1,
            background: alpha(BRAND.primary, 0.04),
            borderBottom: `1px solid ${BRAND.border}`,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" gap={1} alignItems="center">
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: BRAND.textSub, mr: 0.5 }}>
              Types included:
            </Typography>
            {types.solid && (
              <Chip
                icon={<GrainRoundedIcon sx={{ fontSize: "12px !important" }} />}
                label="Solid"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  background: alpha("#1565C0", 0.1),
                  color: "#1565C0",
                  border: `1px solid ${alpha("#1565C0", 0.25)}`,
                }}
              />
            )}
            {types.liquid && (
              <Chip
                icon={<OpacityRoundedIcon sx={{ fontSize: "12px !important" }} />}
                label="Liquid"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  background: alpha("#1565C0", 0.1),
                  color: "#1565C0",
                  border: `1px solid ${alpha("#1565C0", 0.25)}`,
                }}
              />
            )}
            {types.linear && (
              <Chip
                icon={<BlurLinearRoundedIcon sx={{ fontSize: "12px !important" }} />}
                label="Linear"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  background: alpha("#1565C0", 0.1),
                  color: "#1565C0",
                  border: `1px solid ${alpha("#1565C0", 0.25)}`,
                }}
              />
            )}
          </Stack>
        </Box>

        {/* Content */}
        <DialogContent sx={{ p: 2.5, overflowY: "auto", background: BRAND.surface }}>
          {types.solid && (item.solidProcesses ?? []).length > 0 && (
            <Box sx={{ mb: 3 }}>
              <SectionDivider icon={GrainRoundedIcon} label="Solid Preparation" color="#1565C0" />
              {item.solidProcesses.map((proc) => (
                <ProcessBlock key={`${proc.processKey}-${proc.instanceId}`} proc={proc} />
              ))}
            </Box>
          )}
          {types.liquid && item.liquidData && (
            <Box sx={{ mb: 3 }}>
              <SectionDivider icon={OpacityRoundedIcon} label="Liquid Preparation" color="#1565C0" />
              <LiquidSection liquidData={item.liquidData} />
            </Box>
          )}
          {types.linear && item.linearData && (
            <Box>
              <SectionDivider icon={BlurLinearRoundedIcon} label="Linear Preparation" color="#1565C0" />
              <LinearSection linearData={item.linearData} />
            </Box>
          )}
        </DialogContent>

        {/* Footer */}
        <Box
          sx={{
            p: "12px 20px",
            background: "#fff",
            borderTop: `1px solid ${BRAND.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              fontSize: "0.78rem",
              textTransform: "none",
              borderColor: BRAND.border,
              color: BRAND.textSub,
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<CancelRoundedIcon />}
            onClick={() => onReject(item)}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              fontSize: "0.78rem",
              textTransform: "none",
              background: BRAND.danger,
              boxShadow: "none",
              "&:hover": { background: "#922B21", boxShadow: "none" },
            }}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircleRoundedIcon />}
            onClick={() => onApprove(item)}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              fontSize: "0.78rem",
              textTransform: "none",
              background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accentLight})`,
              boxShadow: `0 3px 10px ${alpha(BRAND.accent, 0.35)}`,
              "&:hover": { background: BRAND.accent, boxShadow: "none" },
            }}
          >
            Approve
          </Button>
        </Box>
      </Dialog>

      <ReportPreviewDialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        formId={item.formId}
        department="manufacturing"
        subDepartment="raw-material-prep"
        dialogTitle={`RMP Report — ${item.batchId}`}
      />
    </>
  );
};

// ─── List table — prep-type badges ───────────────────────────────────────────
const PrepTypeBadges = ({ types, solidProcesses }) => {
  const chips = [];
  if (types?.solid)
    chips.push({ label: "Solid", Icon: GrainRoundedIcon, detail: `${(solidProcesses ?? []).length} proc.` });
  if (types?.liquid) chips.push({ label: "Liquid", Icon: OpacityRoundedIcon });
  if (types?.linear) chips.push({ label: "Linear", Icon: BlurLinearRoundedIcon });
  return (
    <Stack direction="row" gap={0.5} flexWrap="wrap">
      {chips.map(({ label, Icon, detail }) => (
        <Chip
          key={label}
          icon={<Icon sx={{ fontSize: "11px !important", color: `#1565C0 !important` }} />}
          label={detail ? `${label} (${detail})` : label}
          size="small"
          sx={{
            height: 18,
            fontSize: "0.6rem",
            fontWeight: 700,
            background: alpha("#1565C0", 0.1),
            color: "#1565C0",
            border: `1px solid ${alpha("#1565C0", 0.22)}`,
          }}
        />
      ))}
    </Stack>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const RawMaterialPreparationApproverPage = () => {
  const [items, setItems] = useState(MOCK_RMP_SUBMISSIONS);
  const [selected, setSelected] = useState(null);
  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "manufacturing",
    setItems,
    setSelected,
    subDepartment: "raw-material-prep",
  });

  return (
    <ApproverList
      department="manufacturing"
      subDepartment="raw-material-prep"
      items={items}
      statusField="status"
      statusMeta={RMP_STATUS_META}
      searchKeys={["batchId", "motorId", "submittedBy"]}
      filterFields={[
        { field: "priority", label: "Priority", options: ["Critical", "High", "Medium", "Low"] },
        { field: "motorType", label: "Type", options: ["A", "B", "C"] },
      ]}
    >
      {(filtered) => (
        <>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${BRAND.border}`,
              boxShadow: `0 2px 12px ${alpha(BRAND.primary, 0.06)}`,
              overflow: "hidden",
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TH>Batch ID</TH>
                    <TH>Batch Type</TH>
                    <TH>Motor ID</TH>
                    <TH>Motor Type</TH>
                    <TH>Submitted By</TH>
                    <TH>Date</TH>
                    <TH>Priority</TH>
                    <TH>Status</TH>
                    <TH sx={{ textAlign: "center" }}>Action</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row, idx) => (
                    <TableRow
                      key={row.id}
                      sx={{
                        background: idx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.5),
                        "&:hover": { background: alpha(BRAND.primaryLight, 0.04) },
                        "&:last-child td": { borderBottom: "none" },
                        animation: `${slideUp} 0.3s ease ${idx * 0.04}s both`,
                      }}
                    >
                      <TD>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: BRAND.primary }}>
                          {row.batchId}
                        </Typography>
                      </TD>
                      <TD>
                        <BatchTypeChip type={row.batchType} />
                      </TD>
                      <TD sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>{row.motorId}</TD>
                      <TD>
                        <TypeChip type={row.motorType} />
                      </TD>
                      {/* <TD>
                        <PrepTypeBadges types={row.types} solidProcesses={row.solidProcesses} />
                      </TD> */}
                      <TD sx={{ fontSize: "0.78rem" }}>{row.submittedBy}</TD>
                      <TD sx={{ color: BRAND.textSub, fontSize: "0.76rem", whiteSpace: "nowrap" }}>
                        {new Date(row.createdOn).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TD>
                      <TD>
                        <PriorityChip priority={row.priority} />
                      </TD>
                      <TD>
                        <StatusChip status={row.status} />
                      </TD>
                      <TD sx={{ textAlign: "center" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityRoundedIcon sx={{ fontSize: "13px !important" }} />}
                          onClick={() => setSelected(row)}
                          disabled={!isApproverActionableStatus(row.status)}
                          sx={{
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            textTransform: "none",
                            px: 1.5,
                            py: 0.6,
                            borderColor: isApproverActionableStatus(row.status) ? BRAND.primaryLight : BRAND.border,
                            color: isApproverActionableStatus(row.status) ? BRAND.primaryLight : alpha(BRAND.textSub, 0.4),
                            "&:hover": { background: alpha(BRAND.primaryLight, 0.06) },
                            "&:disabled": { borderColor: BRAND.border },
                          }}
                        >
                          View Details
                        </Button>
                      </TD>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <RMPDetailDialog
            open={!!selected}
            onClose={() => setSelected(null)}
            item={selected}
            onApprove={requestApprove}
            onReject={requestReject}
          />

          <ApproverActionDialog {...dialogProps} />
        </>
      )}
    </ApproverList>
  );
};

export default RawMaterialPreparationApproverPage;
