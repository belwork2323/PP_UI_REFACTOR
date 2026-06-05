// src/ui/pages/approver/quality_control/QCDivisionApproverPage.jsx

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
  factCheck: FactCheckRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.qualityControl.qcDivision;

// ─── Palette (matches PostCure blue) ─────────────────────────────────────────
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

// ─── Operation stages meta ────────────────────────────────────────────────────
const STAGES = [
  { key: "rawMaterial",   label: "Raw Material",        params: ["Particle Size", "Moisture"] },
  { key: "mixing",        label: "Mixing",               params: ["Pre-mix Homogeneity", "Pre-mix Moisture", "Final-mix Viscosity"] },
  { key: "linearPrep",   label: "Linear Preparation",   params: ["Moisture"] },
  { key: "casting",      label: "Casting",               params: ["Flow Rate", "Viscosity after every 30 min"] },
  { key: "decoring",     label: "De-coring",             params: ["De-coring Load"] },
  { key: "trimming",     label: "Trimming",              params: ["Dimension"] },
  { key: "lfFilling",    label: "LF Filling",            params: ["Mechanical Properties"] },
  { key: "inhibitorResin", label: "Inhibitor Resin",     params: ["Mechanical Properties"] },
];

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_QCD_SUBMISSIONS = [
  {
    id: 1,
    batchId:     "QCD-2025-088",
    motorId:     "MFG-SRM-2025-201",
    submittedBy: "deepak.iyer",
    createdOn:   "2025-03-11T08:45:00",
    status:      "Pending",
    priority:    "High",
    checks: {
      rm_particleSize:      "85 µm",
      rm_moisture:          "0.06 %",
      mx_pre_homogeneity:   "Uniform",
      mx_pre_moisture:      "0.04 %",
      mx_fin_viscosity:     "3800 P",
      lp_moisture:          "0.03 %",
      cast_flowRate:        "12 kg/min",
      cast_viscosity:       "4100 P",
      dc_load:              "420 kg",
      tr_dimension:         "48 × 12 mm",
      lf_mechProps:         "Within spec",
      ir_mechProps:         "Within spec",
    },
  },
  {
    id: 2,
    batchId:     "QCD-2025-085",
    motorId:     "MFG-SRM-2025-198",
    submittedBy: "lakshmi.venkat",
    createdOn:   "2025-03-09T13:20:00",
    status:      "Approved",
    priority:    "Medium",
    checks: {
      rm_particleSize:      "90 µm",
      rm_moisture:          "0.05 %",
      mx_pre_homogeneity:   "Uniform",
      mx_pre_moisture:      "0.03 %",
      mx_fin_viscosity:     "3950 P",
      lp_moisture:          "0.04 %",
      cast_flowRate:        "11 kg/min",
      cast_viscosity:       "4050 P",
      dc_load:              "415 kg",
      tr_dimension:         "48 × 12 mm",
      lf_mechProps:         "Within spec",
      ir_mechProps:         "Within spec",
    },
  },
  {
    id: 3,
    batchId:     "QCD-2025-081",
    motorId:     "MFG-SRM-2025-193",
    submittedBy: "rajesh.kumar",
    createdOn:   "2025-03-06T10:00:00",
    status:      "Rejected",
    priority:    "Critical",
    checks: {
      rm_particleSize:      "102 µm",
      rm_moisture:          "0.14 %",
      mx_pre_homogeneity:   "Non-uniform",
      mx_pre_moisture:      "0.09 %",
      mx_fin_viscosity:     "5200 P",
      lp_moisture:          "0.11 %",
      cast_flowRate:        "8 kg/min",
      cast_viscosity:       "5500 P",
      dc_load:              "390 kg",
      tr_dimension:         "51 × 14 mm",
      lf_mechProps:         "Out of spec",
      ir_mechProps:         "Out of spec",
    },
  },
];

// ─── Stage → check keys mapping ───────────────────────────────────────────────
const STAGE_ROWS = [
  { step: 1, label: "Raw Material",       params: [
    { key: "rm_particleSize", param: "Particle Size" },
    { key: "rm_moisture",     param: "Moisture" },
  ]},
  { step: 2, label: "Mixing",             params: [
    { key: "mx_pre_homogeneity", param: "Pre-mix — Homogeneity" },
    { key: "mx_pre_moisture",    param: "Pre-mix — Moisture" },
    { key: "mx_fin_viscosity",   param: "Final-mix — Viscosity" },
  ]},
  { step: 3, label: "Linear Preparation", params: [
    { key: "lp_moisture", param: "Moisture" },
  ]},
  { step: 4, label: "Casting",            params: [
    { key: "cast_flowRate",  param: "Flow Rate" },
    { key: "cast_viscosity", param: "Viscosity after every 30 min" },
  ]},
  { step: 5, label: "De-coring",          params: [
    { key: "dc_load", param: "De-coring Load" },
  ]},
  { step: 6, label: "Trimming",           params: [
    { key: "tr_dimension", param: "Dimension" },
  ]},
  { step: 7, label: "LF Filling",         params: [
    { key: "lf_mechProps", param: "Mechanical Properties" },
  ]},
  { step: 8, label: "Inhibitor Resin",    params: [
    { key: "ir_mechProps", param: "Mechanical Properties" },
  ]},
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
  padding: "10px 14px", fontSize: "0.78rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
  color: BRAND.text, verticalAlign: "middle",
});

const rowBg   = (i) => (i % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.6));
const hov     = { "&:hover": { background: alpha(BRAND.qc, 0.025) } };
const spanBdr = { borderRight: `1px solid ${alpha(BRAND.border, 0.55)}` };

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

const StepBadge = ({ n }) => (
  <Box sx={{
    width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
    background: `linear-gradient(135deg, ${BRAND.qc}, ${BRAND.qcLight})`,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: `0 1px 4px ${alpha(BRAND.qc, 0.3)}`,
  }}>
    <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800, lineHeight: 1 }}>{n}</Typography>
  </Box>
);

// ─── In-Process detail table ──────────────────────────────────────────────────
const InProcessDetailTable = ({ checks }) => {
  let globalRowIdx = 0;

  return (
    <TableContainer sx={{
      borderRadius: "8px", border: `1px solid ${BRAND.border}`,
      boxShadow: `0 1px 8px ${alpha(BRAND.qc, 0.06)}`, overflowX: "auto",
    }}>
      <Table size="small" sx={{ minWidth: 580 }}>
        <TableHead>
          <TableRow>
            <DTH sx={{ minWidth: 185 }}>Operation</DTH>
            <DTH sx={{ minWidth: 210 }}>Parameter</DTH>
            <DTH sx={{ minWidth: 180 }}>Actual Value</DTH>
          </TableRow>
        </TableHead>
        <TableBody>
          {STAGE_ROWS.map((stage) =>
            stage.params.map((p, pi) => {
              const bg = rowBg(globalRowIdx++);
              const isLast =
                stage === STAGE_ROWS[STAGE_ROWS.length - 1] &&
                pi === stage.params.length - 1;
              const value = checks?.[p.key] || "—";

              return (
                <TableRow
                  key={`${stage.step}-${pi}`}
                  sx={{
                    background: bg, ...hov,
                    ...(isLast ? { "& td": { borderBottom: "none" } } : {}),
                  }}
                >
                  {/* Operation cell — only first param of each stage */}
                  {pi === 0 && (
                    <DTD
                      rowSpan={stage.params.length}
                      sx={{ verticalAlign: "top", pt: "12px", ...spanBdr }}
                    >
                      <Stack direction="row" alignItems="flex-start" gap={1}>
                        <StepBadge n={stage.step} />
                        <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text, lineHeight: 1.4 }}>
                          {stage.label}
                        </Typography>
                      </Stack>
                    </DTD>
                  )}

                  {/* Parameter */}
                  <DTD>
                    <Typography sx={{ fontSize: "0.76rem", color: BRAND.textSub, fontStyle: "italic" }}>
                      {p.param}
                    </Typography>
                  </DTD>

                  {/* Value */}
                  <DTD>
                    <Chip
                      label={value}
                      size="small"
                      sx={{
                        height: 20, fontSize: "0.7rem", fontWeight: 600,
                        background: value === "—"
                          ? alpha(BRAND.border, 0.4)
                          : value.toLowerCase().includes("out of spec") || value.toLowerCase().includes("non-uniform")
                            ? alpha(BRAND.danger, 0.1)
                            : alpha(BRAND.qc, 0.08),
                        color: value === "—"
                          ? BRAND.textSub
                          : value.toLowerCase().includes("out of spec") || value.toLowerCase().includes("non-uniform")
                            ? BRAND.danger
                            : BRAND.qc,
                        border: `1px solid ${
                          value === "—"
                            ? alpha(BRAND.border, 0.6)
                            : value.toLowerCase().includes("out of spec") || value.toLowerCase().includes("non-uniform")
                              ? alpha(BRAND.danger, 0.25)
                              : alpha(BRAND.qc, 0.2)
                        }`,
                      }}
                    />
                  </DTD>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const QCDivisionDetailDialog = ({ open, onClose, item, onApprove, onReject }) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const totalFields = STAGE_ROWS.flatMap((s) => s.params).length;
  const filledFields = STAGE_ROWS
    .flatMap((s) => s.params)
    .filter((p) => item.checks?.[p.key] && item.checks[p.key] !== "—").length;

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
            <FactCheckRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                QC Division — In Process Checks
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.7), fontSize: "0.72rem" }}>
                {item.batchId} · {item.motorId} · {filledFields}/{totalFields} fields recorded
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
          <SectionDivider icon={FactCheckRoundedIcon} label="In Process Check Results" />
          <InProcessDetailTable checks={item.checks} />
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
        subDepartment="qc-division"
        dialogTitle={`QCD Report — ${item.batchId}`}
      />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const QCDivisionApproverPage = () => {
  const [items,    setItems]    = useState(MOCK_QCD_SUBMISSIONS);
  const [selected, setSelected] = useState(null);
  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "qualityControl",
    setItems,
    setSelected,
    subDepartment: "qc-division",
  });

  return (
    <ApproverList
      department="qualityControl"
      subDepartment="qc-division"
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
                    <TH>Stages Recorded</TH>
                    <TH>Date</TH>
                    <TH>Priority</TH>
                    <TH>Status</TH>
                    <TH sx={{ textAlign: "center" }}>Action</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row, idx) => {
                    const totalFields = STAGE_ROWS.flatMap((s) => s.params).length;
                    const filledFields = STAGE_ROWS
                      .flatMap((s) => s.params)
                      .filter((p) => row.checks?.[p.key] && row.checks[p.key] !== "—").length;

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

                        {/* Stages recorded progress */}
                        <TD>
                          <Stack direction="row" alignItems="center" gap={1}>
                            <Box sx={{
                              flex: 1, maxWidth: 80, height: 5, borderRadius: 3,
                              background: alpha(BRAND.border, 0.8), overflow: "hidden",
                            }}>
                              <Box sx={{
                                height: "100%", borderRadius: 3,
                                width: `${(filledFields / totalFields) * 100}%`,
                                background: filledFields === totalFields
                                  ? `linear-gradient(90deg, ${BRAND.accent}, ${BRAND.accentLight})`
                                  : `linear-gradient(90deg, ${BRAND.qc}, ${BRAND.qcLight})`,
                                transition: "width 0.3s ease",
                              }} />
                            </Box>
                            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub, whiteSpace: "nowrap" }}>
                              {filledFields} / {totalFields}
                            </Typography>
                          </Stack>
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

          <QCDivisionDetailDialog
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

export default QCDivisionApproverPage;