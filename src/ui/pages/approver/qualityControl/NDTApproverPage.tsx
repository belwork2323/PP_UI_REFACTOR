// src/ui/pages/approver/quality_control/NDTApproverPage.jsx

import React, { useState } from "react";
import {
  Box, Stack, Typography, Chip, alpha, Card, Button, Dialog,
  DialogContent, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { ReportPreviewDialog }    from "../components/ReportPdf";
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
  pdf: PictureAsPdfRoundedIcon,
  radar: RadarRoundedIcon,
  speed: SpeedRoundedIcon,
  layers: LayersRoundedIcon,
  localFireDepartment: LocalFireDepartmentRoundedIcon,
} = icons.approver.qualityControl.ndt;

// ─── Palette (PostCure blue) ──────────────────────────────────────────────────
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
  qc:           "#1565C0",
  qcLight:      "#1976D2",
};

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

// ─── Status / Priority meta ───────────────────────────────────────────────────
export const QC_STATUS_META = APPROVER_STATUS_META;

const PRIORITY_META = APPROVER_PRIORITY_META;

// ─── Defect keys ──────────────────────────────────────────────────────────────
const DEFECT_ROWS = [
  { key: "cracks",       label: "Cracks"                   },
  { key: "voids",        label: "Voids"                    },
  { key: "debonds",      label: "De-bonds"                 },
  { key: "delamination", label: "Delamination"             },
  { key: "porosity",     label: "Porosity"                 },
  { key: "other",        label: "Any other observation"    },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_NDT_SUBMISSIONS = [
  {
    id: 1,
    batchId:     "NDT-2025-063",
    motorId:     "MFG-SRM-2025-210",
    submittedBy: "anand.krishna",
    createdOn:   "2025-03-12T09:00:00",
    status:      "Pending",
    priority:    "High",
    defects: {
      cracks:       { observation: "No cracks observed" },
      voids:        { observation: "Minor void at NE face, 2 mm dia" },
      debonds:      { observation: "NIL" },
      delamination: { observation: "NIL" },
      porosity:     { observation: "Acceptable porosity level" },
      other:        { observation: "NIL" },
    },
    mechRows:   [{ uts: "82.4", elongation: "38.2", eModulus: "12.1" }, { uts: "81.9", elongation: "37.8", eModulus: "11.9" }],
    mechMean:   { uts: "82.15", elongation: "38.0", eModulus: "12.0" },
    mechStdDev: { uts: "0.35",  elongation: "0.28", eModulus: "0.14" },
    ifaceRows:   [{ peelStrength: "4.2", tbs: "18.5", sbs: "22.1" }],
    ifaceAvg:    { peelStrength: "4.2",  tbs: "18.5", sbs: "22.1"  },
    ifaceStdDev: { peelStrength: "—",    tbs: "—",    sbs: "—"     },
    burnRows:   [{ burnRate: "8.4", density: "1.78" }, { burnRate: "8.6", density: "1.79" }],
    burnAvg:    { burnRate: "8.5", density: "1.785" },
  },
  {
    id: 2,
    batchId:     "NDT-2025-059",
    motorId:     "MFG-SRM-2025-205",
    submittedBy: "meena.suresh",
    createdOn:   "2025-03-10T11:30:00",
    status:      "Approved",
    priority:    "Medium",
    defects: {
      cracks:       { observation: "NIL" },
      voids:        { observation: "NIL" },
      debonds:      { observation: "NIL" },
      delamination: { observation: "NIL" },
      porosity:     { observation: "NIL" },
      other:        { observation: "NIL" },
    },
    mechRows:   [{ uts: "83.1", elongation: "39.0", eModulus: "12.3" }],
    mechMean:   { uts: "83.1",  elongation: "39.0", eModulus: "12.3" },
    mechStdDev: { uts: "—",     elongation: "—",    eModulus: "—"    },
    ifaceRows:   [{ peelStrength: "4.5", tbs: "19.0", sbs: "22.8" }],
    ifaceAvg:    { peelStrength: "4.5",  tbs: "19.0", sbs: "22.8"  },
    ifaceStdDev: { peelStrength: "—",    tbs: "—",    sbs: "—"     },
    burnRows:   [{ burnRate: "8.3", density: "1.77" }],
    burnAvg:    { burnRate: "8.3", density: "1.77" },
  },
  {
    id: 3,
    batchId:     "NDT-2025-054",
    motorId:     "MFG-SRM-2025-199",
    submittedBy: "sunil.das",
    createdOn:   "2025-03-07T14:00:00",
    status:      "Rejected",
    priority:    "Critical",
    defects: {
      cracks:       { observation: "Multiple cracks at HE face" },
      voids:        { observation: "Large void, 8 mm dia at NE core" },
      debonds:      { observation: "De-bond at liner interface" },
      delamination: { observation: "Delamination at aft dome" },
      porosity:     { observation: "High porosity — out of spec" },
      other:        { observation: "Surface irregularity noted" },
    },
    mechRows:   [{ uts: "71.2", elongation: "28.5", eModulus: "9.8" }],
    mechMean:   { uts: "71.2",  elongation: "28.5", eModulus: "9.8" },
    mechStdDev: { uts: "—",     elongation: "—",    eModulus: "—"   },
    ifaceRows:   [{ peelStrength: "2.8", tbs: "13.2", sbs: "16.4" }],
    ifaceAvg:    { peelStrength: "2.8",  tbs: "13.2", sbs: "16.4"  },
    ifaceStdDev: { peelStrength: "—",    tbs: "—",    sbs: "—"     },
    burnRows:   [{ burnRate: "9.8", density: "1.82" }],
    burnAvg:    { burnRate: "9.8", density: "1.82" },
  },
];

// ─── Styled ───────────────────────────────────────────────────────────────────
const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.qc}, ${BRAND.qcLight})`,
  color: "#fff", fontWeight: 700, fontSize: "0.68rem",
  letterSpacing: "0.07em", textTransform: "uppercase",
  padding: "10px 14px", whiteSpace: "nowrap", borderBottom: "none",
});

const TD = styled(TableCell)({
  padding: "10px 14px", fontSize: "0.82rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.55)}`,
  color: BRAND.text, verticalAlign: "middle",
});

const DTH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.qc}, ${BRAND.qcLight})`,
  color: "#fff", fontWeight: 700, fontSize: "0.65rem",
  letterSpacing: "0.07em", textTransform: "uppercase",
  padding: "10px 14px", whiteSpace: "nowrap", borderBottom: "none",
  verticalAlign: "middle",
});

const DTD = styled(TableCell)({
  padding: "9px 13px", fontSize: "0.78rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
  color: BRAND.text, verticalAlign: "middle",
});

const StaticDTD = styled(DTD)({
  background: `linear-gradient(135deg, ${alpha(BRAND.qc, 0.07)}, ${alpha(BRAND.qcLight, 0.04)})`,
  fontWeight: 800,
  color: BRAND.qc,
});

const rowBg = (i) => (i % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.6));
const hov   = { "&:hover": { background: alpha(BRAND.qc, 0.025) } };

type MechanicalStats = {
  uts?: string;
  elongation?: string;
  eModulus?: string;
};

type InterfaceStats = {
  peelStrength?: string;
  tbs?: string;
  sbs?: string;
};

type BurnStats = {
  burnRate?: string;
  density?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const StatusChip = ({ status }) => (
  <Chip label={status} size="small" sx={{
    height: 20, fontSize: "0.62rem", fontWeight: 700,
    background: QC_STATUS_META[status]?.bg,
    color:      QC_STATUS_META[status]?.color,
    border:    `1px solid ${QC_STATUS_META[status]?.border}`,
  }} />
);

const PriorityChip = ({ priority }) => (
  <Chip label={priority} size="small" sx={{
    height: 20, fontSize: "0.62rem", fontWeight: 700,
    background: PRIORITY_META[priority]?.bg,
    color:      PRIORITY_META[priority]?.color,
    border:    `1px solid ${PRIORITY_META[priority]?.border}`,
  }} />
);

const SectionDivider = ({ icon: Icon, label }) => (
  <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
    <Box sx={{
      width: 26, height: 26, borderRadius: "8px", flexShrink: 0,
      background: `linear-gradient(135deg, ${BRAND.qc}, ${BRAND.qcLight})`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon sx={{ color: "#fff", fontSize: 14 }} />
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: BRAND.qc, letterSpacing: "0.04em" }}>
      {label}
    </Typography>
    <Box sx={{ flex: 1, height: "1px", background: alpha(BRAND.qc, 0.18) }} />
  </Stack>
);

const SubCard = ({ children }) => (
  <Box sx={{
    borderRadius: "10px", border: `1px solid ${BRAND.border}`,
    boxShadow: `0 1px 8px ${alpha(BRAND.qc, 0.06)}`, overflow: "hidden", mb: 2.5,
  }}>
    {children}
  </Box>
);

const ValueChip = ({ value }) => {
  const isNeg = value && (
    value.toLowerCase().includes("crack") ||
    value.toLowerCase().includes("void") ||
    value.toLowerCase().includes("debond") ||
    value.toLowerCase().includes("delamination") ||
    value.toLowerCase().includes("out of spec") ||
    value.toLowerCase().includes("high porosity")
  );
  const isNil = !value || value === "—" || value.toUpperCase() === "NIL";

  return (
    <Chip
      label={value || "—"}
      size="small"
      sx={{
        height: 20, fontSize: "0.68rem", fontWeight: 600,
        background: isNeg ? alpha(BRAND.danger, 0.1)
          : isNil ? alpha(BRAND.border, 0.4)
          : alpha(BRAND.qc, 0.08),
        color: isNeg ? BRAND.danger
          : isNil ? BRAND.textSub
          : BRAND.qc,
        border: `1px solid ${isNeg ? alpha(BRAND.danger, 0.25)
          : isNil ? alpha(BRAND.border, 0.6)
          : alpha(BRAND.qc, 0.2)}`,
        maxWidth: 280, overflow: "hidden",
        "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      }}
    />
  );
};

// ─── Detail sub-tables ────────────────────────────────────────────────────────

const DefectsTable = ({ defects }) => (
  <SubCard>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <DTH sx={{ minWidth: 200 }}>Type of Defects</DTH>
            <DTH sx={{ minWidth: 300 }}>Observation</DTH>
          </TableRow>
        </TableHead>
        <TableBody>
          {DEFECT_ROWS.map(({ key, label }, ri) => (
            <TableRow
              key={key}
              sx={{
                background: rowBg(ri), ...hov,
                ...(ri === DEFECT_ROWS.length - 1 ? { "& td": { borderBottom: "none" } } : {}),
              }}
            >
              <DTD sx={{ fontWeight: 600 }}>{label}</DTD>
              <DTD><ValueChip value={defects?.[key]?.observation} /></DTD>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </SubCard>
);

const MechTable = ({
  mechRows = [],
  mechMean = {},
  mechStdDev = {},
}: {
  mechRows?: MechanicalStats[];
  mechMean?: MechanicalStats;
  mechStdDev?: MechanicalStats;
}) => (
  <SubCard>
    <TableContainer>
      <Table size="small" sx={{ minWidth: 560 }}>
        <TableHead>
          <TableRow>
            <DTH sx={{ minWidth: 80 }}>Sample</DTH>
            <DTH sx={{ minWidth: 160 }}>UTS (kgf/cm²)</DTH>
            <DTH sx={{ minWidth: 180 }}>Elongation @ Fmax (%)</DTH>
            <DTH sx={{ minWidth: 180 }}>E-Modulus (kgf/cm²)</DTH>
          </TableRow>
        </TableHead>
        <TableBody>
          {mechRows.map((row, ri) => (
            <TableRow key={ri} sx={{ background: rowBg(ri), ...hov }}>
              <DTD sx={{ fontWeight: 700, color: BRAND.textSub }}>{ri + 1}</DTD>
              <DTD>{row.uts || "—"}</DTD>
              <DTD>{row.elongation || "—"}</DTD>
              <DTD>{row.eModulus || "—"}</DTD>
            </TableRow>
          ))}
          <TableRow sx={{ background: alpha(BRAND.qc, 0.04), ...hov }}>
            <StaticDTD>Mean</StaticDTD>
            <DTD>{mechMean.uts || "—"}</DTD>
            <DTD>{mechMean.elongation || "—"}</DTD>
            <DTD>{mechMean.eModulus || "—"}</DTD>
          </TableRow>
          <TableRow sx={{ background: alpha(BRAND.qc, 0.07), ...hov, "& td": { borderBottom: "none" } }}>
            <StaticDTD>Std Dev</StaticDTD>
            <DTD>{mechStdDev.uts || "—"}</DTD>
            <DTD>{mechStdDev.elongation || "—"}</DTD>
            <DTD>{mechStdDev.eModulus || "—"}</DTD>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  </SubCard>
);

const IfaceTable = ({
  ifaceRows = [],
  ifaceAvg = {},
  ifaceStdDev = {},
}: {
  ifaceRows?: InterfaceStats[];
  ifaceAvg?: InterfaceStats;
  ifaceStdDev?: InterfaceStats;
}) => (
  <SubCard>
    <TableContainer>
      <Table size="small" sx={{ minWidth: 520 }}>
        <TableHead>
          <TableRow>
            <DTH sx={{ minWidth: 80 }}>Sample</DTH>
            <DTH sx={{ minWidth: 160 }}>Peel Strength</DTH>
            <DTH sx={{ minWidth: 130 }}>TBS</DTH>
            <DTH sx={{ minWidth: 160 }}>SBS (kgf/cm²)</DTH>
          </TableRow>
        </TableHead>
        <TableBody>
          {ifaceRows.map((row, ri) => (
            <TableRow key={ri} sx={{ background: rowBg(ri), ...hov }}>
              <DTD sx={{ fontWeight: 700, color: BRAND.textSub }}>{ri + 1}</DTD>
              <DTD>{row.peelStrength || "—"}</DTD>
              <DTD>{row.tbs || "—"}</DTD>
              <DTD>{row.sbs || "—"}</DTD>
            </TableRow>
          ))}
          <TableRow sx={{ background: alpha(BRAND.qc, 0.04), ...hov }}>
            <StaticDTD>Avg</StaticDTD>
            <DTD>{ifaceAvg.peelStrength || "—"}</DTD>
            <DTD>{ifaceAvg.tbs || "—"}</DTD>
            <DTD>{ifaceAvg.sbs || "—"}</DTD>
          </TableRow>
          <TableRow sx={{ background: alpha(BRAND.qc, 0.07), ...hov, "& td": { borderBottom: "none" } }}>
            <StaticDTD>Std Dev</StaticDTD>
            <DTD>{ifaceStdDev.peelStrength || "—"}</DTD>
            <DTD>{ifaceStdDev.tbs || "—"}</DTD>
            <DTD>{ifaceStdDev.sbs || "—"}</DTD>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  </SubCard>
);

// Table 4 — Burn Rate & Density
const BurnTable = ({
  burnRows = [],
  burnAvg = {},
}: {
  burnRows?: BurnStats[];
  burnAvg?: BurnStats;
}) => (
  <SubCard>
    <TableContainer>
      <Table size="small" sx={{ minWidth: 400 }}>
        <TableHead>
          <TableRow>
            <DTH sx={{ minWidth: 80  }}>Sample</DTH>
            <DTH sx={{ minWidth: 160 }}>Burn Rate (mm/s)</DTH>
            <DTH sx={{ minWidth: 140 }}>Density</DTH>
          </TableRow>
        </TableHead>
        <TableBody>
          {burnRows.map((row, ri) => (
            <TableRow key={ri} sx={{ background: rowBg(ri), ...hov }}>
              <DTD sx={{ fontWeight: 700, color: BRAND.textSub }}>{ri + 1}</DTD>
              <DTD>{row.burnRate || "—"}</DTD>
              <DTD>{row.density  || "—"}</DTD>
            </TableRow>
          ))}
          <TableRow sx={{ background: alpha(BRAND.qc, 0.04), ...hov, "& td": { borderBottom: "none" } }}>
            <StaticDTD>Avg</StaticDTD>
            <DTD>{burnAvg.burnRate || "—"}</DTD>
            <DTD>{burnAvg.density  || "—"}</DTD>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  </SubCard>
);

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const NDTDetailDialog = ({ open, onClose, item, onApprove, onReject }) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const defectCount = DEFECT_ROWS.filter(
    (d) => item.defects?.[d.key]?.observation &&
           item.defects[d.key].observation.toUpperCase() !== "NIL"
  ).length;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3, maxHeight: "92vh",
            overflow: "hidden", display: "flex",
            flexDirection: "column", m: 2,
          },
        }}
      >
        {/* Header */}
        <Box sx={{
          p: "14px 20px",
          background: `linear-gradient(135deg, ${BRAND.qc}, ${BRAND.qcLight})`,
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0,
        }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <RadarRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                NDT Report
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.7), fontSize: "0.72rem" }}>
                {item.batchId} · {item.motorId} · {defectCount} defect{defectCount !== 1 ? "s" : ""} noted
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" gap={1} alignItems="center">
            <PriorityChip priority={item.priority} />
            <Button
              size="small" variant="contained"
              startIcon={<PictureAsPdfRoundedIcon sx={{ fontSize: "14px !important" }} />}
              onClick={() => setPdfOpen(true)}
              sx={{
                borderRadius: 2, fontWeight: 700, fontSize: "0.72rem",
                textTransform: "none", px: 1.6, py: "5px",
                background: alpha("#fff", 0.18), color: "#fff",
                border: `1px solid ${alpha("#fff", 0.3)}`,
                backdropFilter: "blur(8px)",
                "&:hover": { background: alpha("#fff", 0.28) },
              }}
            >
              View as PDF
            </Button>
            <IconButton onClick={onClose} size="small" sx={{ color: alpha("#fff", 0.8) }}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {/* Meta strip */}
        <Box sx={{
          px: 2.8, py: 1.2, background: "#fff",
          borderBottom: `1px solid ${BRAND.border}`, flexShrink: 0,
        }}>
          <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
            {[
              { label: "Batch ID",     value: item.batchId },
              { label: "Motor ID",     value: item.motorId },
              { label: "Submitted By", value: item.submittedBy },
              { label: "Date",         value: new Date(item.createdOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
              { label: "Priority",     value: item.priority },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: BRAND.textSub, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {label}
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: BRAND.text }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Content */}
        <DialogContent sx={{ p: 2.8, overflowY: "auto", background: BRAND.surface }}>

          <SectionDivider icon={RadarRoundedIcon} label="NDT — Defect Observations" />
          <DefectsTable defects={item.defects} />

          <SectionDivider icon={SpeedRoundedIcon} label="Mechanical Properties" />
          <MechTable
            mechRows={item.mechRows}
            mechMean={item.mechMean}
            mechStdDev={item.mechStdDev}
          />

          <SectionDivider icon={LayersRoundedIcon} label="Interface Properties" />
          <IfaceTable
            ifaceRows={item.ifaceRows}
            ifaceAvg={item.ifaceAvg}
            ifaceStdDev={item.ifaceStdDev}
          />

          <SectionDivider icon={LocalFireDepartmentRoundedIcon} label="Burn Rate & Density" />
          <BurnTable burnRows={item.burnRows} burnAvg={item.burnAvg} />

        </DialogContent>

        {/* Footer */}
        <Box sx={{
          p: "12px 20px", background: "#fff",
          borderTop: `1px solid ${BRAND.border}`,
          display: "flex", justifyContent: "flex-end",
          gap: 1.5, flexShrink: 0,
        }}>
          <Button variant="outlined" onClick={onClose}>Close</Button>
          <Button
            variant="contained"
            startIcon={<CancelRoundedIcon />}
            onClick={() => onReject(item)}
            sx={{ background: BRAND.danger, "&:hover": { background: "#922B21" } }}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircleRoundedIcon />}
            onClick={() => onApprove(item)}
            sx={{
              background: `linear-gradient(135deg, ${BRAND.qc}, ${BRAND.qcLight})`,
              "&:hover": { background: BRAND.qc },
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
        department="qualityControl"
        subDepartment="ndt"
        dialogTitle={`NDT Report — ${item.batchId}`}
      />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const NDTApproverPage = () => {
  const [items,    setItems]    = useState(MOCK_NDT_SUBMISSIONS);
  const [selected, setSelected] = useState(null);
  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "qualityControl",
    setItems,
    setSelected,
    subDepartment: "ndt",
  });

  return (
    <ApproverList
      department="qualityControl"
      subDepartment="ndt"
      items={items}
      statusField="status"
      statusMeta={QC_STATUS_META}
      searchKeys={["batchId", "motorId", "submittedBy"]}
      filterFields={[
        { field: "priority", label: "Priority", options: ["Critical", "High", "Medium", "Low"] },
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
                    <TH>Motor ID</TH>
                    <TH>Submitted By</TH>
                    <TH>Defects Noted</TH>
                    <TH>Mech Samples</TH>
                    <TH>Date</TH>
                    <TH>Priority</TH>
                    <TH>Status</TH>
                    <TH sx={{ textAlign: "center" }}>Action</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row, idx) => {
                    const defectCount = DEFECT_ROWS.filter(
                      (d) => row.defects?.[d.key]?.observation &&
                             row.defects[d.key].observation.toUpperCase() !== "NIL"
                    ).length;

                    return (
                      <TableRow
                        key={row.id}
                        sx={{
                          background: idx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.5),
                          "&:hover": { background: alpha(BRAND.qc, 0.03) },
                          "&:last-child td": { borderBottom: "none" },
                          animation: `${slideUp} 0.3s ease ${idx * 0.04}s both`,
                        }}
                      >
                        <TD>
                          <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: BRAND.qc }}>
                            {row.batchId}
                          </Typography>
                        </TD>

                        <TD sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>{row.motorId}</TD>

                        <TD sx={{ fontSize: "0.78rem" }}>{row.submittedBy}</TD>

                        {/* Defects noted chip */}
                        <TD>
                          <Chip
                            label={defectCount === 0 ? "None" : `${defectCount} defect${defectCount !== 1 ? "s" : ""}`}
                            size="small"
                            sx={{
                              height: 20, fontSize: "0.62rem", fontWeight: 700,
                              background: defectCount === 0
                                ? alpha(BRAND.accent, 0.1)
                                : alpha(BRAND.danger, 0.1),
                              color: defectCount === 0 ? BRAND.accent : BRAND.danger,
                              border: `1px solid ${defectCount === 0
                                ? alpha(BRAND.accent, 0.25)
                                : alpha(BRAND.danger, 0.25)}`,
                            }}
                          />
                        </TD>

                        {/* Mech samples count */}
                        <TD>
                          <Chip
                            label={`${row.mechRows?.length ?? 0} sample${(row.mechRows?.length ?? 0) !== 1 ? "s" : ""}`}
                            size="small"
                            sx={{
                              height: 20, fontSize: "0.62rem", fontWeight: 700,
                              background: alpha(BRAND.qc, 0.08),
                              color: BRAND.qc,
                              border: `1px solid ${alpha(BRAND.qc, 0.2)}`,
                            }}
                          />
                        </TD>

                        <TD sx={{ color: BRAND.textSub, fontSize: "0.76rem" }}>
                          {new Date(row.createdOn).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </TD>

                        <TD><PriorityChip priority={row.priority} /></TD>
                        <TD><StatusChip   status={row.status}    /></TD>

                        <TD sx={{ textAlign: "center" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityRoundedIcon sx={{ fontSize: "13px !important" }} />}
                            onClick={() => setSelected(row)}
                            disabled={!isApproverActionableStatus(row.status)}
                            sx={{
                              borderRadius: 2, fontWeight: 700, fontSize: "0.72rem",
                              textTransform: "none", px: 1.5,
                              borderColor: isApproverActionableStatus(row.status) ? BRAND.qc : BRAND.border,
                              color:       isApproverActionableStatus(row.status) ? BRAND.qc : alpha(BRAND.textSub, 0.4),
                              "&:hover": isApproverActionableStatus(row.status)
                                ? { background: alpha(BRAND.qc, 0.06), borderColor: BRAND.qc }
                                : {},
                            }}
                          >
                            View Details
                          </Button>
                        </TD>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <NDTDetailDialog
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

export default NDTApproverPage;