// src/ui/pages/approver/quality_control/RawMaterialRevalidationApproverPage.jsx

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
  science: ScienceRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
  verified: VerifiedRoundedIcon,
} = icons.approver.qualityControl.rawMaterialRevalidation;

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
  qc:           "#1565C0",
  qcLight:      "#1976D2",
};

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

// ─── Status / Priority meta ───────────────────────────────────────────────────
export const QC_STATUS_META = APPROVER_STATUS_META;

const PRIORITY_META = APPROVER_PRIORITY_META;

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_RMR_SUBMISSIONS = [
  {
    id: 1,
    batchId:     "RMR-2025-041",
    submittedBy: "arjun.sharma",
    createdOn:   "2025-03-10T09:30:00",
    status:      "Pending",
    priority:    "High",
    blocks: [
      {
        ingredient: "HTPB",
        lotNo: "LOT-HTPB-2025-07",
        rows: [
          { parameter: "OH value (mgKOH/g)",      result: "46.2",  validity: "Valid till Dec 2025" },
          { parameter: "Moisture %",               result: "0.08",  validity: "Valid till Dec 2025" },
          { parameter: "Acid value",               result: "0.22",  validity: "Valid till Dec 2025" },
          { parameter: "Viscosity at 30°C (cP)",   result: "4250",  validity: "Valid till Dec 2025" },
        ],
      },
      {
        ingredient: "DOA",
        lotNo: "LOT-DOA-2025-03",
        rows: [
          { parameter: "Saponification value (mgKOH/g)", result: "294.1", validity: "Valid till Nov 2025" },
          { parameter: "Acid value",                     result: "0.14",  validity: "Valid till Nov 2025" },
          { parameter: "Moisture %",                     result: "0.05",  validity: "Valid till Nov 2025" },
          { parameter: "Refractive Index at 30°C",       result: "1.447", validity: "Valid till Nov 2025" },
        ],
      },
    ],
  },
  {
    id: 2,
    batchId:     "RMR-2025-039",
    submittedBy: "priya.nair",
    createdOn:   "2025-03-08T14:10:00",
    status:      "Approved",
    priority:    "Medium",
    blocks: [
      {
        ingredient: "AP",
        lotNo: "LOT-AP-2025-11",
        rows: [
          { parameter: "Purity %",               result: "99.4",  validity: "Valid till Mar 2026" },
          { parameter: "Moisture %",             result: "0.03",  validity: "Valid till Mar 2026" },
          { parameter: "Particle Size D50 (µm)", result: "90",    validity: "Valid till Mar 2026" },
          { parameter: "pH",                     result: "6.8",   validity: "Valid till Mar 2026" },
        ],
      },
    ],
  },
  {
    id: 3,
    batchId:     "RMR-2025-037",
    submittedBy: "kiran.reddy",
    createdOn:   "2025-03-05T11:00:00",
    status:      "Rejected",
    priority:    "Critical",
    blocks: [
      {
        ingredient: "Aluminium",
        lotNo: "LOT-AL-2025-02",
        rows: [
          { parameter: "Purity %",               result: "97.1",  validity: "Expired" },
          { parameter: "Moisture %",             result: "0.12",  validity: "Expired" },
          { parameter: "Particle Size D50 (µm)", result: "32",    validity: "Expired" },
          { parameter: "Bulk Density (g/cc)",    result: "0.98",  validity: "Expired" },
        ],
      },
    ],
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

const rowBg = (i) => (i % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.6));
const hov   = { "&:hover": { background: alpha(BRAND.qc, 0.025) } };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const StatusChip   = ({ status })   => (
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

// ─── Detail table — one block ─────────────────────────────────────────────────
const BlockDetailTable = ({ block, index }) => (
  <Box mb={index > 0 ? 2.5 : 0}>
    {/* Block sub-header */}
    <Stack direction="row" alignItems="center" gap={1.2} mb={1}>
      <Box sx={{
        width: 22, height: 22, borderRadius: "6px",
        background: `linear-gradient(135deg, ${BRAND.qc}, ${BRAND.qcLight})`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800 }}>
          {index + 1}
        </Typography>
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text }}>
        {block.ingredient}
      </Typography>
      {block.lotNo && (
        <Chip label={`Lot: ${block.lotNo}`} size="small" sx={{
          height: 20, fontSize: "0.62rem", fontWeight: 700,
          background: alpha(BRAND.qc, 0.1), color: BRAND.qc,
          border: `1px solid ${alpha(BRAND.qc, 0.2)}`,
        }} />
      )}
    </Stack>

    <TableContainer sx={{
      borderRadius: "8px", border: `1px solid ${BRAND.border}`,
      boxShadow: `0 1px 8px ${alpha(BRAND.qc, 0.06)}`, overflowX: "auto",
    }}>
      <Table size="small" sx={{ minWidth: 580 }}>
        <TableHead>
          <TableRow>
            <DTH sx={{ minWidth: 220 }}>Parameter</DTH>
            <DTH sx={{ minWidth: 160 }}>Result</DTH>
            <DTH sx={{ minWidth: 180 }}>Validity</DTH>
          </TableRow>
        </TableHead>
        <TableBody>
          {block.rows.map((row, ri) => (
            <TableRow
              key={ri}
              sx={{
                background: rowBg(ri), ...hov,
                ...(ri === block.rows.length - 1 ? { "& td": { borderBottom: "none" } } : {}),
              }}
            >
              <DTD sx={{ fontWeight: 600 }}>{row.parameter}</DTD>
              <DTD>{row.result  || "—"}</DTD>
              <DTD>
                <Chip
                  label={row.validity || "—"}
                  size="small"
                  sx={{
                    height: 20, fontSize: "0.62rem", fontWeight: 600,
                    background: row.validity?.toLowerCase().includes("expired")
                      ? alpha(BRAND.danger, 0.1) : alpha(BRAND.accent, 0.1),
                    color: row.validity?.toLowerCase().includes("expired")
                      ? BRAND.danger : BRAND.accent,
                    border: `1px solid ${row.validity?.toLowerCase().includes("expired")
                      ? alpha(BRAND.danger, 0.25) : alpha(BRAND.accent, 0.25)}`,
                  }}
                />
              </DTD>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const RMRDetailDialog = ({ open, onClose, item, onApprove, onReject }) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  const totalBlocks = item.blocks?.length ?? 0;
  const totalRows   = item.blocks?.flatMap((b) => b.rows).length ?? 0;

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
            <VerifiedRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                Raw Material Revalidation Record
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.7), fontSize: "0.72rem" }}>
                {item.batchId} · {totalBlocks} ingredient{totalBlocks !== 1 ? "s" : ""} · {totalRows} parameters
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

        {/* Submission meta strip */}
        <Box sx={{
          px: 2.8, py: 1.2,
          background: "#fff",
          borderBottom: `1px solid ${BRAND.border}`,
          flexShrink: 0,
        }}>
          <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
            {[
              { label: "Batch ID",     value: item.batchId },
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
          <SectionDivider icon={ScienceRoundedIcon} label="Ingredient Test Results" />
          <Stack spacing={2.5}>
            {(item.blocks ?? []).map((block, i) => (
              <BlockDetailTable key={i} block={block} index={i} />
            ))}
          </Stack>
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
        subDepartment="raw-material-revalidation"
        dialogTitle={`RMR Report — ${item.batchId}`}
      />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const RawMaterialRevalidationApproverPage = () => {
  const [items,    setItems]    = useState(MOCK_RMR_SUBMISSIONS);
  const [selected, setSelected] = useState(null);

  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "qualityControl",
    setItems,
    setSelected,
    subDepartment: "raw-material-revalidation",
  });

  return (
    <ApproverList
      department="qualityControl"
      subDepartment="raw-material-revalidation"
      items={items}
      statusField="status"
      statusMeta={QC_STATUS_META}
      searchKeys={["batchId", "submittedBy"]}
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
                    <TH>Submitted By</TH>
                    <TH>Ingredients</TH>
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

                      <TD sx={{ fontSize: "0.78rem" }}>{row.submittedBy}</TD>

                      {/* Ingredient chips */}
                      <TD>
                        <Stack direction="row" gap={0.5} flexWrap="wrap">
                          {(row.blocks ?? []).map((b, i) => (
                            <Chip
                              key={i}
                              label={b.ingredient}
                              size="small"
                              sx={{
                                height: 20, fontSize: "0.62rem", fontWeight: 700,
                                background: alpha(BRAND.qcLight, 0.12),
                                color: BRAND.qc,
                                border: `1px solid ${alpha(BRAND.qc, 0.2)}`,
                              }}
                            />
                          ))}
                        </Stack>
                      </TD>

                      <TD sx={{ color: BRAND.textSub, fontSize: "0.76rem" }}>
                        {new Date(row.createdOn).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </TD>

                      <TD><PriorityChip priority={row.priority} /></TD>
                      <TD><StatusChip  status={row.status}   /></TD>

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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <RMRDetailDialog
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

export default RawMaterialRevalidationApproverPage;