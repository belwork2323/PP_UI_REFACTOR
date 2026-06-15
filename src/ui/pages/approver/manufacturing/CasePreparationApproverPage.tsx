// src/ui/pages/approver/manufacturing/CasePreparation/CasePreparationApproverPage.jsx
//
// Approver page for Case Preparation.
// Detail dialog mirrors CasePreparationForm exactly:
//
// Table 1 — General Activities
//   Row 1  : Inspect Insulator Surface          → OK/Not OK  (r1.m1, r1.m2)
//   Row 2  : Abrading                           → OK/Not OK  (r2)
//   Row 3  : Inspect Surface for Proper Abrading→ OK/Not OK  (r3)
//   Row 4  : Bellow and Spacers (rowSpan=3, no radio at parent level)
//     4a   : Date of Bellow & Spacers prep      → text       (r4a)
//     4b   : Dimension of Bellow                → text       (r4b)
//     4c   : Bellow Bonding date                → text       (r4c)
//   Row 5  : Surface Cleaning (Mopping)         → OK/Not OK  (r5)
//   Row 6  : Preheating                         → text       (r6.m1 / r6.m2)
//
// Table 2 — Linear Coating Operation
//   Row 1  : Inspection                         → OK/Not OK  (r1)
//   Row 2  : Insulation Temperature             → text       (r2)
//   Row 3  : Linear Premix Qualification (rowSpan=3)
//     3a   : Premix Batch No.                   → text       (r3a)
//     3b   : Measured Moisture                  → text       (r3b)
//     3c   : Qualified Peel Strength            → text       (r3c)
//   Row 4  : Linear Coating Operation (rowSpan=2)
//     4a   : Duration                           → text       (r4a)
//     4b   : Quantity                           → text       (r4b)
//   Row 5  : Visual Inspection                  → OK/Not OK  (r5)

import React, { useState } from "react";
import {
  Box, Stack, Typography, Chip, alpha, Card, Button,
  CircularProgress, Dialog, DialogContent, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { ReportPreviewDialog } from "../components/ReportPdf";
import ApproverList from "../components/ApproverList";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import { icons } from "../../../../app/theme/icons";
import { APPROVER_PRIORITY_META, APPROVER_STATUS_META, isApproverActionableStatus } from "../../../../app/theme/approver";
import useApproverFormAction from "../../../../hooks/approver/useApproverFormAction";
import { fetchCasePreparationFormDetailsApi } from "../../../../data/api/users/manufacturing/casePreparationFormApi";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  visibility: VisibilityRoundedIcon,
  close: CloseRoundedIcon,
  cleaningServices: CleaningServicesRoundedIcon,
  formatPaint: FormatPaintRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.manufacturing.casePreparation;

// ─── Palette ──────────────────────────────────────────────────────────────────
const BRAND = {
  primary:      "#1B4F72",
  primaryLight: "#2E86C1",
  accent:       "#148F77",
  accentLight:  "#1ABC9C",
  warn:         "#D4AC0D",
  danger:       "#C0392B",
  surface:      "#F4F6F8",
  border:       "#D5D8DC",
  text:         "#1C2833",
  textSub:      "#5D6D7E",
  cp:           "#1565C0",
  cpLight:      "#1976D2",
  ok:           "#1B5E20",
  okBg:         "rgba(27,94,32,0.08)",
  okBorder:     "rgba(27,94,32,0.25)",
  notOk:        "#B71C1C",
  notOkBg:      "rgba(183,28,28,0.08)",
  notOkBorder:  "rgba(183,28,28,0.25)",
};

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

// ─── Status / Priority meta ───────────────────────────────────────────────────
export const CP_STATUS_META = APPROVER_STATUS_META;

const PRIORITY_META = APPROVER_PRIORITY_META;

// ─── Shared styled atoms ──────────────────────────────────────────────────────
// List table header cell
const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
  color: "#fff", fontWeight: 700, fontSize: "0.68rem",
  letterSpacing: "0.07em", textTransform: "uppercase",
  padding: "10px 14px", whiteSpace: "nowrap", borderBottom: "none",
  "&:first-of-type": { borderRadius: "6px 0 0 0" },
  "&:last-of-type":  { borderRadius: "0 6px 0 0" },
});

// List table body cell
const TD = styled(TableCell)({
  padding: "10px 14px", fontSize: "0.82rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.55)}`,
  color: BRAND.text, verticalAlign: "middle",
});

// Dialog table header cell — cp gradient
const DTH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.cp}, ${BRAND.cpLight})`,
  color: "#fff", fontWeight: 700, fontSize: "0.65rem",
  letterSpacing: "0.07em", textTransform: "uppercase",
  padding: "10px 14px", whiteSpace: "nowrap", borderBottom: "none",
  verticalAlign: "middle",
});

// Dialog table body cell
const DTD = styled(TableCell)({
  padding: "10px 14px", fontSize: "0.78rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
  color: BRAND.text, verticalAlign: "middle",
});

// ─── Row helpers ──────────────────────────────────────────────────────────────
const rowBg = (i) => i % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.6);
const hov   = { "&:hover": { background: alpha(BRAND.cp, 0.025) } };
const lastTd = { "&:last-child td": { borderBottom: "none" } };

// ─── OK / Not OK read-only chip ───────────────────────────────────────────────
const OkChip = ({ value }) => {
  if (!value) return <Typography sx={{ fontSize: "0.72rem", color: alpha(BRAND.textSub, 0.45) }}>—</Typography>;
  const isOk = value === "ok";
  return (
    <Chip label={isOk ? "OK" : "Not OK"} size="small" sx={{
      height: 22, fontSize: "0.66rem", fontWeight: 800,
      background: isOk ? BRAND.okBg    : BRAND.notOkBg,
      color:      isOk ? BRAND.ok       : BRAND.notOk,
      border: `1.5px solid ${isOk ? BRAND.okBorder : BRAND.notOkBorder}`,
    }} />
  );
};

// ─── Text value display ───────────────────────────────────────────────────────
const Val = ({ children, accent = false }) => (
  <Typography sx={{ fontSize: "0.78rem", fontWeight: accent ? 700 : 500, color: accent ? BRAND.accent : BRAND.text }}>
    {children || "—"}
  </Typography>
);

// ─── Step badge ───────────────────────────────────────────────────────────────
const StepBadge = ({ n }) => (
  <Box sx={{
    width: 22, height: 22, borderRadius: "6px", flexShrink: 0, mt: 0.15,
    background: `linear-gradient(135deg, ${BRAND.cp}, ${BRAND.cpLight})`,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: `0 1px 4px ${alpha(BRAND.cp, 0.3)}`,
  }}>
    <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800, lineHeight: 1 }}>{n}</Typography>
  </Box>
);

// ─── Sub-label badge (a / b / c) ─────────────────────────────────────────────
const SubBadge = ({ label }) => (
  <Box sx={{
    width: 17, height: 17, borderRadius: "4px", flexShrink: 0,
    background: alpha(BRAND.cp, 0.12),
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <Typography sx={{ color: BRAND.cp, fontSize: "0.55rem", fontWeight: 800, lineHeight: 1 }}>{label}</Typography>
  </Box>
);

// ─── Motor ID chip in dialog table header ─────────────────────────────────────
const MotorIdHeader = ({ label, id }) => (
  <Stack gap={0.4}>
    <Typography sx={{ fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {label}
    </Typography>
    <Chip label={id || "—"} size="small" sx={{
      height: 22, fontSize: "0.7rem", fontWeight: 800,
      background: "rgba(255,255,255,0.18)", color: "#fff",
      border: "1px solid rgba(255,255,255,0.35)",
    }} />
  </Stack>
);

// ─── Section divider ──────────────────────────────────────────────────────────
const SectionDivider = ({ icon: Icon, label }) => (
  <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
    <Box sx={{
      width: 26, height: 26, borderRadius: "8px", flexShrink: 0,
      background: `linear-gradient(135deg, ${BRAND.cp}, ${BRAND.cpLight})`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon sx={{ color: "#fff", fontSize: 14 }} />
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: BRAND.cp, letterSpacing: "0.04em" }}>
      {label}
    </Typography>
    <Box sx={{ flex: 1, height: "1px", background: alpha(BRAND.cp, 0.18) }} />
  </Stack>
);

// ─── Dynamic Section Renderer ─────────────────────────────────────────────────
const SectionCell = ({ value }) => {
  if (!value && value !== 0) return <span style={{ color: alpha(BRAND.textSub, 0.4), fontSize: "0.72rem", fontStyle: "italic" }}>—</span>;
  const v = String(value).toLowerCase();
  if (v === "ok") return <Chip label="OK" size="small" sx={{ height: 20, fontSize: "0.62rem", fontWeight: 700, background: alpha(BRAND.accent, 0.12), color: BRAND.accent, border: `1px solid ${alpha(BRAND.accent, 0.3)}` }} />;
  if (v === "notok" || v === "not ok") return <Chip label="Not OK" size="small" sx={{ height: 20, fontSize: "0.62rem", fontWeight: 700, background: alpha(BRAND.danger, 0.1), color: BRAND.danger, border: `1px solid ${alpha(BRAND.danger, 0.2)}` }} />;
  return <Typography sx={{ fontWeight: 600, fontSize: "0.78rem", color: BRAND.text }}>{value}</Typography>;
};

const formatSectionName = (id) =>
  id
    .replace(/__/g, "_")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_/g, " ")
    .trim();

const getMotorValue = (motor, sectionId, entryIndex, key) => {
  const section = motor?.sections?.find((s) => s.sectionId === sectionId);
  const entry = section?.sectionData?.[entryIndex];
  return entry?.[key] ?? "";
};

const SectionsTable = ({ title, icon: Icon, motors, sectionIds }) => {
  if (!motors?.length) return null;

  const motorCount = motors.length;
  const motorLabels = motors.map((m, i) => m.motorId || `Motor ${i + 1}`);

  const visibleSections = sectionIds
    .map((id) => {
      const entries = motors[0].sections.find((s) => s.sectionId === id)?.sectionData ?? [];
      const hasData = entries.length > 0 && !entries.every((e) => Object.keys(e).length === 1 && e.srNo != null);
      return hasData ? { id, entries } : null;
    })
    .filter(Boolean);

  if (visibleSections.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography sx={{ fontSize: "0.78rem", color: alpha(BRAND.textSub, 0.5), fontStyle: "italic" }}>No data available</Typography>
      </Box>
    );
  }

  const rows = [];
  let globalIdx = 0;

  visibleSections.forEach(({ id, entries }) => {
    const name = formatSectionName(id);
    const dataEntries = entries.filter((e) => e.type !== "header");
    const headerEntries = entries.filter((e) => e.type === "header");

    headerEntries.forEach((h, hi) => {
      rows.push(
        <TableRow key={`${id}-hdr-${hi}`} sx={{ background: alpha(BRAND.cp, 0.04) }}>
          <DTD colSpan={motorCount + 1} sx={{ py: 0.4, px: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.68rem", color: BRAND.cp, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {h.operation || h.parameter || ""}
            </Typography>
          </DTD>
        </TableRow>
      );
    });

    const isConfig = dataEntries.length === 1 && !dataEntries[0].parameter && !dataEntries[0].operation;
    if (isConfig) {
      const entry = dataEntries[0];
      const keys = Object.keys(entry).filter((k) => k !== "srNo" && k !== "type" && k !== "fieldType");
      keys.forEach((k, ki) => {
        const label = k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
        rows.push(
          <TableRow key={`${id}-kv-${ki}`} sx={{ background: rowBg(globalIdx++), ...hov }}>
            {ki === 0 && <DTD rowSpan={keys.length} sx={{ verticalAlign: "top", pt: 1.2, fontWeight: 700, fontSize: "0.76rem", color: BRAND.text, borderRight: `1px solid ${alpha(BRAND.border, 0.5)}`, minWidth: 180 }}>{name}</DTD>}
            <DTD><Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub }}>{label}</Typography></DTD>
            {motors.map((m, mi) => (
              <DTD key={mi}><SectionCell value={getMotorValue(m, id, 0, k)} /></DTD>
            ))}
          </TableRow>
        );
      });
      return;
    }

    dataEntries.forEach((entry, ei) => {
      const label = entry.operation || entry.parameter || "";
      rows.push(
        <TableRow key={`${id}-row-${ei}`} sx={{ background: rowBg(globalIdx++), ...hov }}>
          {ei === 0 && <DTD rowSpan={dataEntries.length} sx={{ verticalAlign: "top", pt: 1.2, fontWeight: 700, fontSize: "0.76rem", color: BRAND.text, borderRight: `1px solid ${alpha(BRAND.border, 0.5)}`, minWidth: 180 }}>{name}</DTD>}
          <DTD><Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub }}>{label}</Typography></DTD>
          {motors.map((m, mi) => (
            <DTD key={mi}><SectionCell value={getMotorValue(m, id, ei, entry.value != null ? "value" : "result")} /></DTD>
          ))}
        </TableRow>
      );
    });
  });

  return (
    <TableContainer sx={{ borderRadius: "8px", border: `1px solid ${BRAND.border}`, boxShadow: `0 1px 8px ${alpha(BRAND.cp, 0.06)}`, overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 700 }}>
        <TableHead>
          <TableRow>
            <DTH sx={{ minWidth: 180 }}>{title}</DTH>
            <DTH sx={{ minWidth: 180 }}>Parameter</DTH>
            {motorLabels.map((label, i) => (
              <DTH key={i} sx={{ minWidth: 150 }}><MotorIdHeader label="Motor" id={label} /></DTH>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
    </TableContainer>
  );
};

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const CPDetailDialog = ({ open, onClose, item, onApprove, onReject, detailsLoading, detailData }) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  const detail = detailData ?? item;
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", m: 2 } }}
      >
        {/* ── Header ── */}
        <Box sx={{
          p: "14px 20px",
          background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <CleaningServicesRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                Case Preparation Submission
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.7), fontSize: "0.72rem" }}>
                {item.batchId}
                {detailsLoading ? " · loading…" : item.motorId ? ` · ${item.motorId}` : ""}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center">
            <Chip label={item.priority} size="small" sx={{
              height: 20, fontSize: "0.62rem", fontWeight: 700,
              background: PRIORITY_META[item.priority]?.bg,
              color:      PRIORITY_META[item.priority]?.color,
              border: `1px solid ${PRIORITY_META[item.priority]?.border}`,
            }} />
            {detailsLoading && <CircularProgress size={16} sx={{ color: alpha("#fff", 0.7) }} />}
            <Button size="small" variant="contained"
              startIcon={<PictureAsPdfRoundedIcon sx={{ fontSize: "14px !important" }} />}
              onClick={() => setPdfOpen(true)}
              sx={{
                borderRadius: 2, fontWeight: 700, fontSize: "0.72rem", textTransform: "none",
                px: 1.6, py: "5px", whiteSpace: "nowrap",
                background: alpha("#fff", 0.18), color: "#fff",
                border: `1px solid ${alpha("#fff", 0.3)}`, backdropFilter: "blur(8px)",
                "&:hover": { background: alpha("#fff", 0.28), boxShadow: "none" }, boxShadow: "none",
              }}
            >
              View as PDF
            </Button>
            <IconButton onClick={onClose} size="small"
              sx={{ color: alpha("#fff", 0.8), "&:hover": { background: alpha("#fff", 0.1) } }}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {/* ── Motor ID strip ── */}
        <Box sx={{ px: 2.5, py: 1, background: alpha(BRAND.cp, 0.04), borderBottom: `1px solid ${BRAND.border}`, flexShrink: 0 }}>
          <Stack direction="row" gap={3} alignItems="center" flexWrap="wrap">
            <Stack direction="row" gap={0.7} alignItems="center">
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: BRAND.textSub }}>Motor Case IDs:</Typography>
              {[detail.motorCaseIds?.m1, detail.motorCaseIds?.m2].map((id, i) => (
                <Chip key={i} label={id || "—"} size="small" sx={{
                  height: 20, fontSize: "0.65rem", fontWeight: 700,
                  background: alpha(BRAND.cp, 0.08), color: BRAND.cp,
                  border: `1px solid ${alpha(BRAND.cp, 0.22)}`,
                }} />
              ))}
            </Stack>
            <Stack direction="row" gap={0.7} alignItems="center">
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: BRAND.textSub }}>Motor Nos:</Typography>
              {[detail.motorNos?.m1, detail.motorNos?.m2].map((id, i) => (
                <Chip key={i} label={id || "—"} size="small" sx={{
                  height: 20, fontSize: "0.65rem", fontWeight: 700,
                  background: alpha(BRAND.cpLight, 0.1), color: BRAND.cpLight,
                  border: `1px solid ${alpha(BRAND.cpLight, 0.22)}`,
                }} />
              ))}
            </Stack>
          </Stack>
        </Box>

        {/* ── Content ── */}
        <DialogContent sx={{ p: 2.5, overflowY: "auto", background: BRAND.surface }}>

          {/* Table 1 */}
          <Box sx={{ mb: 3 }}>
            <SectionDivider icon={CleaningServicesRoundedIcon} label="General Activities" />
            <SectionsTable
              title="Activity"
              icon={CleaningServicesRoundedIcon}
              motors={detail.motors}
              sectionIds={["abradingConfiguration","abradingDetails","heBellowDimension","neBellowDimension","spacerDetails","pastingDetails","tceCleaning","preHeatingConfiguration","preHeatingMonitoring"]}
            />
          </Box>

          {/* Table 2 */}
          <Box>
            <SectionDivider icon={FormatPaintRoundedIcon} label="Linear Coating Operation" />
            <SectionsTable
              title="Operation"
              icon={FormatPaintRoundedIcon}
              motors={detail.motors}
              sectionIds={["linerCoatingOperation__config","linerPreparationDetails","premixIngredients","finalMixIngredients","qualificationDetails__config","qualificationParameters","linerApplicationLog","dispatchToCasting"]}
            />
          </Box>

        </DialogContent>

        {/* ── Footer ── */}
        <Box sx={{
          p: "12px 20px", background: "#fff", borderTop: `1px solid ${BRAND.border}`,
          display: "flex", justifyContent: "flex-end", gap: 1.5, flexShrink: 0,
        }}>
          <Button variant="outlined" onClick={onClose} sx={{
            borderRadius: 2, fontWeight: 700, fontSize: "0.78rem", textTransform: "none",
            borderColor: BRAND.border, color: BRAND.textSub,
          }}>Close</Button>
          <Button variant="contained" startIcon={<CancelRoundedIcon />} onClick={() => onReject(item)}
            sx={{ borderRadius: 2, fontWeight: 700, fontSize: "0.78rem", textTransform: "none", background: BRAND.danger, boxShadow: "none", "&:hover": { background: "#922B21", boxShadow: "none" } }}>
            Reject
          </Button>
          <Button variant="contained" startIcon={<CheckCircleRoundedIcon />} onClick={() => onApprove(item)}
            sx={{ borderRadius: 2, fontWeight: 700, fontSize: "0.78rem", textTransform: "none", background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accentLight})`, boxShadow: `0 3px 10px ${alpha(BRAND.accent, 0.35)}`, "&:hover": { background: BRAND.accent, boxShadow: "none" } }}>
            Approve
          </Button>
        </Box>
      </Dialog>

      <ReportPreviewDialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        formId={item.formId}
        department="manufacturing"
        subDepartment="case-preparation"
        dialogTitle={`Case Preparation Report — ${item.batchId}`}
      />
    </>
  );
};

// ─── Chip helpers for list table ──────────────────────────────────────────────
const StatusChip = ({ status }) => (
  <Chip label={status} size="small" sx={{
    height: 20, fontSize: "0.62rem", fontWeight: 700,
    background: CP_STATUS_META[status]?.bg, color: CP_STATUS_META[status]?.color,
    border: `1px solid ${CP_STATUS_META[status]?.border}`,
  }} />
);

const PriorityChip = ({ priority }) => (
  <Chip label={priority} size="small" sx={{
    height: 20, fontSize: "0.62rem", fontWeight: 700,
    background: PRIORITY_META[priority]?.bg, color: PRIORITY_META[priority]?.color,
    border: `1px solid ${PRIORITY_META[priority]?.border}`,
  }} />
);

const TypeChip = ({ type }) => (
  <Chip label={`Type ${type}`} size="small" sx={{
    height: 20, fontSize: "0.62rem", fontWeight: 700,
    background: alpha(BRAND.primaryLight, 0.1), color: BRAND.primaryLight,
    border: `1px solid ${alpha(BRAND.primaryLight, 0.2)}`,
  }} />
);

// Motor case ID pair displayed in list row
const CaseIdBadges = ({ motorCaseIds }) => (
  <Stack direction="row" gap={0.5} flexWrap="wrap">
    {[motorCaseIds?.m1, motorCaseIds?.m2].filter(Boolean).map((id) => (
      <Chip key={id} label={id} size="small" sx={{
        height: 18, fontSize: "0.6rem", fontWeight: 700,
        background: alpha(BRAND.cp, 0.08), color: BRAND.cp,
        border: `1px solid ${alpha(BRAND.cp, 0.2)}`,
      }} />
    ))}
  </Stack>
);

// ─── Main export ──────────────────────────────────────────────────────────────
const CasePreparationApproverPage = () => {
  const [items, setItems]       = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null);
  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "manufacturing",
    setItems,
    setSelected,
    subDepartment: "case-preparation",
  });

  const handleViewDetails = async (row) => {
    setSelected(row);
    setDetailData(null);
    setDetailsLoading(true);
    try {
      const response = await fetchCasePreparationFormDetailsApi({ formId: row.formId } as any);
      const prep = response?.data?.casePreparationDetails;
      if (prep) {
        setDetailData(prep);
      }
    } catch {
      setDetailData(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <ApproverList
      department="manufacturing"
      subDepartment="case-preparation"
      items={items}
      statusField="status"
      statusMeta={CP_STATUS_META}
      searchKeys={["batchId", "motorId", "submittedBy"]}
      filterFields={[
        { field: "priority",  label: "Priority", options: ["Critical", "High", "Medium", "Low"] },
        { field: "motorType", label: "Type",      options: ["A", "B", "C"] },
      ]}
    >
      {(filtered) => (
        <>
          <Card elevation={0} sx={{
            borderRadius: 3, border: `1px solid ${BRAND.border}`,
            boxShadow: `0 2px 12px ${alpha(BRAND.primary, 0.06)}`, overflow: "hidden",
          }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TH>Batch ID</TH>
                    <TH>Motor ID</TH>
                    <TH>Type</TH>
                    <TH>Motor Case IDs</TH>
                    <TH>Submitted By</TH>
                    <TH>Date</TH>
                    <TH>Priority</TH>
                    <TH>Status</TH>
                    <TH sx={{ textAlign: "center" }}>Action</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row: any, idx) => (
                    <TableRow key={row.id} sx={{
                      background: idx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.5),
                      "&:hover": { background: alpha(BRAND.primaryLight, 0.04) },
                      "&:last-child td": { borderBottom: "none" },
                      animation: `${slideUp} 0.3s ease ${idx * 0.04}s both`,
                    }}>
                      <TD>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: BRAND.primary }}>
                          {row.batchId}
                        </Typography>
                      </TD>
                      <TD sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>{row.motorId}</TD>
                      <TD><TypeChip type={row.motorType} /></TD>
                      <TD><CaseIdBadges motorCaseIds={row.motorCaseIds} /></TD>
                      <TD sx={{ fontSize: "0.78rem" }}>{row.submittedBy}</TD>
                      <TD sx={{ color: BRAND.textSub, fontSize: "0.76rem", whiteSpace: "nowrap" }}>
                        {new Date(row.createdOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </TD>
                      <TD><PriorityChip priority={row.priority} /></TD>
                      <TD><StatusChip status={row.status} /></TD>
                      <TD sx={{ textAlign: "center" }}>
                        <Button size="small" variant="outlined"
                          startIcon={<VisibilityRoundedIcon sx={{ fontSize: "13px !important" }} />}
                          onClick={() => handleViewDetails(row)}
                          disabled={!isApproverActionableStatus(row.status)}
                          sx={{
                            borderRadius: 2, fontWeight: 700, fontSize: "0.72rem", textTransform: "none",
                            px: 1.5, py: 0.6,
                            borderColor: isApproverActionableStatus(row.status) ? BRAND.primaryLight : BRAND.border,
                            color:       isApproverActionableStatus(row.status) ? BRAND.primaryLight : alpha(BRAND.textSub, 0.4),
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

          <CPDetailDialog
            open={!!selected}
            onClose={() => { setSelected(null); setDetailData(null); }}
            item={selected}
            onApprove={requestApprove}
            onReject={requestReject}
            detailsLoading={detailsLoading}
            detailData={detailData}
          />

          <ApproverActionDialog {...dialogProps} />
        </>
      )}
    </ApproverList>
  );
};

export default CasePreparationApproverPage;