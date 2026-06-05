// src/ui/pages/approver/quality_control/STFApproverPage.jsx

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
  rocketLaunch: RocketLaunchRoundedIcon,
  functions: FunctionsRoundedIcon,
} = icons.approver.qualityControl.staticTestFacility;

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

// ─── Row definitions (mirrors STFForm ROWS + H) ───────────────────────────────
const STF_ROWS = [
  { letter: "A", key: "a_emptyMotor",    label: "Weight of empty motor"                     },
  { letter: "B", key: "b_rubberDust",    label: "Weight of rubber dust after abrading"       },
  { letter: "C", key: "c_linearCoating", label: "Weight of linear coating material"          },
  { letter: "D", key: "d_looseFlapFill", label: "Weight of loose flap filling material"      },
  { letter: "E", key: "e_extraRubber",   label: "Weight of extra rubber trimmed"             },
  { letter: "F", key: "f_inhibition",    label: "Weight of inhibition material applied"      },
  { letter: "G", key: "g_finalWeight",   label: "Final weight of motor after all operations" },
];

// ─── Formula helper (mirrors STFForm calcH) ───────────────────────────────────
const calcH = (d) => {
  const n  = (v) => parseFloat(v) || 0;
  const res = n(d.g_finalWeight) - (n(d.a_emptyMotor) - n(d.b_rubberDust) + n(d.c_linearCoating) + n(d.d_looseFlapFill) - n(d.e_extraRubber) + n(d.f_inhibition));
  const anyFilled = Object.values(d).some((v) => v && String(v).trim() !== "");
  return anyFilled ? res.toFixed(4).replace(/\.?0+$/, "") : "";
};

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_STF_SUBMISSIONS = [
  {
    id: 1,
    batchId:     "STF-2025-031",
    motorId:     "MFG-SRM-2025-214",
    motorNo:     "STF-M214",
    submittedBy: "vijay.prasad",
    createdOn:   "2025-03-13T08:15:00",
    status:      "Pending",
    priority:    "High",
    a_emptyMotor:    "182.4",
    b_rubberDust:    "0.32",
    c_linearCoating: "4.18",
    d_looseFlapFill: "1.25",
    e_extraRubber:   "0.14",
    f_inhibition:    "0.88",
    g_finalWeight:   "607.90",
  },
  {
    id: 2,
    batchId:     "STF-2025-028",
    motorId:     "MFG-SRM-2025-209",
    motorNo:     "STF-M209",
    submittedBy: "kavitha.raman",
    createdOn:   "2025-03-11T10:30:00",
    status:      "Approved",
    priority:    "Medium",
    a_emptyMotor:    "180.1",
    b_rubberDust:    "0.28",
    c_linearCoating: "4.05",
    d_looseFlapFill: "1.20",
    e_extraRubber:   "0.10",
    f_inhibition:    "0.82",
    g_finalWeight:   "603.50",
  },
  {
    id: 3,
    batchId:     "STF-2025-024",
    motorId:     "MFG-SRM-2025-202",
    motorNo:     "STF-M202",
    submittedBy: "harish.babu",
    createdOn:   "2025-03-08T14:45:00",
    status:      "Rejected",
    priority:    "Critical",
    a_emptyMotor:    "185.0",
    b_rubberDust:    "0.45",
    c_linearCoating: "4.50",
    d_looseFlapFill: "1.40",
    e_extraRubber:   "0.20",
    f_inhibition:    "1.10",
    g_finalWeight:   "590.20",
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
  padding: "10px 14px", fontSize: "0.78rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
  color: BRAND.text, verticalAlign: "middle",
});

// Tinted computed-row cell — matches STFForm's FormulaTD
const FormulaDTD = styled(TableCell)({
  padding: "12px 14px",
  borderBottom: "none",
  verticalAlign: "middle",
  background: `linear-gradient(135deg, ${alpha(BRAND.accent, 0.07)}, ${alpha(BRAND.accent, 0.03)})`,
});

const rowBg = (i) => (i % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.6));
const hov   = { "&:hover": { background: alpha(BRAND.qc, 0.025) } };

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

// ─── Letter badge ─────────────────────────────────────────────────────────────
const LetterBadge = ({ letter, accent = false }) => (
  <Box sx={{
    width: 24, height: 24, borderRadius: "7px", flexShrink: 0,
    background: accent
      ? "linear-gradient(135deg, #148F77, #1aaf8f)"
      : `linear-gradient(135deg, ${BRAND.qc}, ${BRAND.qcLight})`,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: `0 1px 5px ${alpha(accent ? BRAND.accent : BRAND.qc, 0.35)}`,
  }}>
    <Typography sx={{ color: "#fff", fontSize: "0.65rem", fontWeight: 800, lineHeight: 1 }}>
      {letter}
    </Typography>
  </Box>
);

// ─── STF Weight Log detail table ──────────────────────────────────────────────
const STFDetailTable = ({ item }) => {
  const hVal = calcH(item);

  return (
    <Box sx={{
      borderRadius: "10px", border: `1px solid ${BRAND.border}`,
      boxShadow: `0 1px 8px ${alpha(BRAND.qc, 0.06)}`, overflow: "hidden",
    }}>
      <TableContainer>
        <Table size="small" sx={{ minWidth: 500 }}>
          <TableHead>
            <TableRow>
              <DTH sx={{ minWidth: 280 }}>Details</DTH>
              <DTH sx={{ minWidth: 160 }}>Motor No. · {item.motorNo || "—"}</DTH>
            </TableRow>
          </TableHead>
          <TableBody>

            {/* A–G rows */}
            {STF_ROWS.map(({ letter, key, label }, ri) => (
              <TableRow key={letter} sx={{ background: rowBg(ri), ...hov }}>
                <DTD>
                  <Stack direction="row" alignItems="center" gap={1.2}>
                    <LetterBadge letter={letter} />
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: BRAND.text }}>
                      {label}
                    </Typography>
                  </Stack>
                </DTD>
                <DTD>
                  <Chip
                    label={item[key] ? `${item[key]} kg` : "—"}
                    size="small"
                    sx={{
                      height: 20, fontSize: "0.7rem", fontWeight: 700,
                      background: item[key] ? alpha(BRAND.qc, 0.08) : alpha(BRAND.border, 0.4),
                      color:      item[key] ? BRAND.qc : BRAND.textSub,
                      border:    `1px solid ${item[key] ? alpha(BRAND.qc, 0.2) : alpha(BRAND.border, 0.6)}`,
                    }}
                  />
                </DTD>
              </TableRow>
            ))}

            {/* H row — computed, tinted accent */}
            <TableRow sx={{ "&:hover": { background: alpha(BRAND.accent, 0.025) } }}>
              <FormulaDTD>
                <Stack direction="row" alignItems="flex-start" gap={1.2}>
                  <LetterBadge letter="H" accent />
                  <Box>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: BRAND.accent, lineHeight: 1.4 }}>
                      Weight of Propellent (Kg)
                    </Typography>
                    <Stack direction="row" alignItems="center" gap={0.5} mt={0.3}>
                      <FunctionsRoundedIcon sx={{ fontSize: 12, color: alpha(BRAND.accent, 0.65) }} />
                      <Typography sx={{
                        fontSize: "0.67rem", color: alpha(BRAND.accent, 0.8),
                        fontStyle: "italic", fontFamily: "monospace",
                      }}>
                        H = G − ( A − B + C + D − E + F )
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </FormulaDTD>
              <FormulaDTD>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Chip
                    label={hVal ? `${hVal} kg` : "—"}
                    size="small"
                    sx={{
                      height: 22, fontSize: "0.72rem", fontWeight: 800,
                      background: hVal ? alpha(BRAND.accent, 0.12) : alpha(BRAND.border, 0.4),
                      color:      hVal ? BRAND.accent : BRAND.textSub,
                      border:    `1px solid ${hVal ? alpha(BRAND.accent, 0.3) : alpha(BRAND.border, 0.6)}`,
                    }}
                  />
                  {hVal && (
                    <Chip
                      label="Auto"
                      size="small"
                      sx={{
                        height: 18, fontSize: "0.6rem", fontWeight: 800,
                        background: alpha(BRAND.accent, 0.1),
                        color: BRAND.accent,
                        border: `1px solid ${alpha(BRAND.accent, 0.25)}`,
                      }}
                    />
                  )}
                </Stack>
              </FormulaDTD>
            </TableRow>

          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const STFDetailDialog = ({ open, onClose, item, onApprove, onReject }) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const filledCount = STF_ROWS.filter((r) => item[r.key] && String(item[r.key]).trim() !== "").length;
  const hVal        = calcH(item);

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
            <RocketLaunchRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                Static Test Facility — Weight Log
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.7), fontSize: "0.72rem" }}>
                {item.batchId} · {item.motorId} · {filledCount}/{STF_ROWS.length} fields filled
                {hVal ? ` · H = ${hVal} kg` : ""}
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
              { label: "Batch ID",     value: item.batchId     },
              { label: "Motor ID",     value: item.motorId     },
              { label: "Motor No.",    value: item.motorNo     },
              { label: "Submitted By", value: item.submittedBy },
              { label: "Date",         value: new Date(item.createdOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
              { label: "Priority",     value: item.priority    },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: BRAND.textSub, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {label}
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: BRAND.text }}>
                  {value || "—"}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Content */}
        <DialogContent sx={{ p: 2.8, overflowY: "auto", background: BRAND.surface }}>
          <SectionDivider icon={RocketLaunchRoundedIcon} label="Weight Log" />
          <STFDetailTable item={item} />
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
        subDepartment="static-test-facility"
        dialogTitle={`STF Report — ${item.batchId}`}
      />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const STFApproverPage = () => {
  const [items,    setItems]    = useState(MOCK_STF_SUBMISSIONS);
  const [selected, setSelected] = useState(null);
  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "qualityControl",
    setItems,
    setSelected,
    subDepartment: "static-test-facility",
  });

  return (
    <ApproverList
      department="qualityControl"
      subDepartment="static-test-facility"
      items={items}
      statusField="status"
      statusMeta={QC_STATUS_META}
      searchKeys={["batchId", "motorId", "motorNo", "submittedBy"]}
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
                    <TH>Motor No.</TH>
                    <TH>Submitted By</TH>
                    <TH>Fields Filled</TH>
                    <TH>Propellent Wt. (H)</TH>
                    <TH>Date</TH>
                    <TH>Priority</TH>
                    <TH>Status</TH>
                    <TH sx={{ textAlign: "center" }}>Action</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row, idx) => {
                    const filledCount = STF_ROWS.filter((r) => row[r.key] && String(row[r.key]).trim() !== "").length;
                    const hVal        = calcH(row);

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

                        <TD>
                          <Chip
                            label={row.motorNo || "—"}
                            size="small"
                            sx={{
                              height: 20, fontSize: "0.62rem", fontWeight: 700,
                              background: alpha(BRAND.qc, 0.1), color: BRAND.qc,
                              border: `1px solid ${alpha(BRAND.qc, 0.2)}`,
                            }}
                          />
                        </TD>

                        <TD sx={{ fontSize: "0.78rem" }}>{row.submittedBy}</TD>

                        {/* Fields filled progress bar */}
                        <TD>
                          <Stack direction="row" alignItems="center" gap={1}>
                            <Box sx={{
                              flex: 1, maxWidth: 70, height: 5, borderRadius: 3,
                              background: alpha(BRAND.border, 0.8), overflow: "hidden",
                            }}>
                              <Box sx={{
                                height: "100%", borderRadius: 3,
                                width: `${(filledCount / STF_ROWS.length) * 100}%`,
                                background: filledCount === STF_ROWS.length
                                  ? `linear-gradient(90deg, ${BRAND.accent}, ${BRAND.accentLight})`
                                  : `linear-gradient(90deg, ${BRAND.qc}, ${BRAND.qcLight})`,
                                transition: "width 0.3s ease",
                              }} />
                            </Box>
                            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: BRAND.textSub, whiteSpace: "nowrap" }}>
                              {filledCount} / {STF_ROWS.length}
                            </Typography>
                          </Stack>
                        </TD>

                        {/* Propellent weight (H) */}
                        <TD>
                          <Chip
                            label={hVal ? `${hVal} kg` : "—"}
                            size="small"
                            sx={{
                              height: 20, fontSize: "0.68rem", fontWeight: 700,
                              background: hVal ? alpha(BRAND.accent, 0.1) : alpha(BRAND.border, 0.4),
                              color:      hVal ? BRAND.accent : BRAND.textSub,
                              border:    `1px solid ${hVal ? alpha(BRAND.accent, 0.25) : alpha(BRAND.border, 0.6)}`,
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

          <STFDetailDialog
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

export default STFApproverPage;