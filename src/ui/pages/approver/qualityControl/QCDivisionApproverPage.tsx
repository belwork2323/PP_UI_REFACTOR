// src/ui/pages/approver/quality_control/QCDivisionApproverPage.jsx

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
  CircularProgress,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { ReportPreviewDialog } from "../components/ReportPdf";
import ApproverSubdepartmentBatchListSection from "../components/ApproverSubdepartmentBatchListSection";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import { icons } from "../../../../app/theme/icons";
import { APPROVER_PRIORITY_META, APPROVER_STATUS_META } from "../../../../app/theme/approver";
import { useAuthStore } from "../../../../app/store/authStore";
import useApproverFormAction from "../../../../hooks/approver/useApproverFormAction";
import qcDivisionController from "../../../../controllers/user/quality_control/qcDivisionController";

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
  qc: "#1565C0",
  qcLight: "#1976D2",
};

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

// ─── Status / Priority meta ───────────────────────────────────────────────────
export const QC_STATUS_META = APPROVER_STATUS_META;

const PRIORITY_META = APPROVER_PRIORITY_META;

// ─── Styled ───────────────────────────────────────────────────────────────────
const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.qc}, ${BRAND.qcLight})`,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.68rem",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  padding: "10px 14px",
  whiteSpace: "nowrap",
  borderBottom: "none",
});

const TD = styled(TableCell)({
  padding: "10px 14px",
  fontSize: "0.82rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.55)}`,
  color: BRAND.text,
  verticalAlign: "middle",
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const StatusChip = ({ status }) => (
  <Chip
    label={status}
    size="small"
    sx={{
      height: 20,
      fontSize: "0.62rem",
      fontWeight: 700,
      background: QC_STATUS_META[status]?.bg,
      color: QC_STATUS_META[status]?.color,
      border: `1px solid ${QC_STATUS_META[status]?.border}`,
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

// ─── Section renderer ────────────────────────────────────────────────────────
const sectionLabel = (id) => {
  const map = {
    raw_material: "Raw Material",
    mixing: "Mixing",
    linear_prep: "Linear Preparation",
    casting: "Casting",
    decoring: "De-coring",
    trimming: "Trimming",
    lf_filling: "LF Filling",
    inhibitor_resin: "Inhibitor Resin",
  };
  return map[id] ?? id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const divisionLabel = (division) => {
  const map = {
    RAW_MATERIAL_REVALIDATION: "Raw Material Revalidation",
    RAW_MATERIAL_PROCESSING: "Raw Material Processing",
    MIXING: "Mixing",
    HARDWARE: "Hardware",
    CASTING: "Casting",
    CURING: "Curing",
    DE_CORING: "De-coring",
    TRIMMING: "Trimming",
    POST_CURE: "Post Cure",
    NDT: "NDT",
    PROPELLANT_PROPERTIES: "Propellant Properties",
    WEIGHTMENT: "Weightment",
    STATIC_TEST_FACILITY: "Static Test Facility",
  };
  return map[division] ?? division.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const subTypeLabel = (subType) => {
  if (!subType) return null;
  const map = {
    SOLID_PROCESSING: "Solid Processing",
    LIQUID_PROCESSING: "Liquid Processing",
    PREHEATING: "Preheating",
    PREMIX: "Premix",
    FINAL_MIX: "Final Mix",
    LOOSE_FLAP_FILLING: "Loose Flap Filling",
    INHIBITION: "Inhibition",
  };
  return map[subType] ?? subType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const fieldLabel = (key) => {
  const map = {
    rm_particleSize: "Particle Size",
    rm_moisture: "Moisture",
    mx_pre_homogeneity: "Pre-mix Homogeneity",
    mx_pre_moisture: "Pre-mix Moisture",
    mx_fin_viscosity: "Final-mix Viscosity",
    lp_moisture: "Moisture",
    cast_flowRate: "Flow Rate",
    cast_viscosity: "Viscosity (30 min)",
    dc_load: "De-coring Load",
    tr_dimension: "Dimension",
    lf_mechProps: "Mechanical Properties",
    ir_mechProps: "Mechanical Properties",
  };
  return map[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatValue = (v) => {
  if (v == null) return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.length} rows]`;
  if (typeof v === "object") {
    const entries = Object.entries(v).filter(([k]) => !k.startsWith("_"));
    if (entries.length === 0) return "—";
    return entries.map(([k, val]) => `${k}: ${val ?? "—"}`).join(", ");
  }
  return "—";
};

const QCSectionRenderer = ({ section }) => {
  const entries = section.sectionData ?? [];
  if (!entries.length) return null;

  const value = entries[0];
  const allKeys = Object.keys(value).filter((k) => !k.startsWith("_"));
  const simpleKeys = allKeys.filter(
    (k) => !Array.isArray(value[k]) && (typeof value[k] !== "object" || value[k] === null),
  );
  const tableKeys = allKeys.filter((k) => Array.isArray(value[k]));

  if (!simpleKeys.length && !tableKeys.length) return null;

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box
        sx={{
          px: 1.5,
          py: 1,
          mb: 1,
          background: alpha(BRAND.qc, 0.06),
          borderRadius: 1,
          borderLeft: `3px solid ${BRAND.qc}`,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: BRAND.qc }}>
          {sectionLabel(section.sectionId)}
        </Typography>
      </Box>
      {simpleKeys.length > 0 && (
        <TableContainer sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 1, mb: tableKeys.length ? 1 : 0 }}>
          <Table size="small">
            <TableBody>
              {simpleKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      color: BRAND.textSub,
                      px: 1.5,
                      py: 0.6,
                      width: 220,
                      borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
                    }}
                  >
                    {fieldLabel(key)}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: BRAND.text,
                      px: 1.5,
                      py: 0.6,
                      borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
                    }}
                  >
                    {formatValue(value[key])}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tableKeys.map((key) => {
        const data = value[key];
        if (!Array.isArray(data) || !data.length) return null;
        const columns = Object.keys(data[0]).filter((k) => !k.startsWith("_"));
        return (
          <Box key={key} sx={{ mb: 1 }}>
            <TableContainer sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {columns.map((col) => (
                      <TableCell
                        key={col}
                        sx={{ fontWeight: 700, fontSize: "0.65rem", color: BRAND.textSub, px: 1, py: 0.5 }}
                      >
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, ri) => (
                    <TableRow key={ri}>
                      {columns.map((col) => (
                        <TableCell key={col} sx={{ fontSize: "0.72rem", px: 1, py: 0.5 }}>
                          {formatValue(row[col])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      })}
    </Box>
  );
};

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const QCDivisionDetailDialog = ({ open, onClose, item, onApprove, onReject, detailData, detailsLoading }) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  const divisionDetails = detailData?.divisionDetails ?? [];

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
            background: `linear-gradient(135deg, ${BRAND.qc}, ${BRAND.qcLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <FactCheckRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                QC Division — Form Details
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.7), fontSize: "0.72rem" }}>
                {item.batchId} · {item.motorId}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" gap={1} alignItems="center">
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
                background: alpha("#fff", 0.18),
                color: "#fff",
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
        <Box
          sx={{
            px: 2.8,
            py: 1.2,
            background: "#fff",
            borderBottom: `1px solid ${BRAND.border}`,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
            {[
              { label: "Batch ID", value: item.batchId },
              { label: "Motor ID", value: item.motorId },
              { label: "Submitted By", value: item.submittedBy },
              {
                label: "Date",
                value: item.createdOn
                  ? new Date(item.createdOn).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
              },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography
                  sx={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    color: BRAND.textSub,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {label}
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: BRAND.text }}>{value ?? "—"}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Content */}
        <DialogContent sx={{ p: 2.8, overflowY: "auto", background: BRAND.surface }}>
          {detailsLoading ? (
            <Stack alignItems="center" py={6}>
              <CircularProgress size={32} sx={{ color: BRAND.qc }} />
              <Typography sx={{ mt: 2, fontSize: "0.82rem", color: BRAND.textSub }}>Loading form details…</Typography>
            </Stack>
          ) : divisionDetails.length > 0 ? (
            divisionDetails.map((entry, idx) => {
              const entrySections = entry?.data?.sections ?? [];
              if (!entrySections.length) return null;
              const label = divisionLabel(entry.division) + (entry.subType ? ` - ${subTypeLabel(entry.subType)}` : "");
              return (
                <Box key={idx} sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1,
                      mb: 1.5,
                      background: alpha(BRAND.qc, 0.08),
                      borderRadius: 1,
                      borderLeft: `3px solid ${BRAND.qc}`,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: BRAND.qc }}>
                      {label}
                    </Typography>
                  </Box>
                  {entrySections.map((section) => (
                    <QCSectionRenderer key={section.sectionId} section={section} />
                  ))}
                </Box>
              );
            })
          ) : (
            <Typography sx={{ fontSize: "0.82rem", color: BRAND.textSub }}>
              No saved QC division form details available for preview.
            </Typography>
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
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
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
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const subDepartmentId =
    user?.allSubDepartments?.find((item) => item.slugs?.dept === "quality" && item.slugs?.subDept === "qc-division")
      ?.subDepartmentId ?? 0;
  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "qualityControl",
    setItems,
    setSelected,
    subDepartment: "qc-division",
  });

  const handleViewDetails = async (row) => {
    setSelected(row);
    setDetailData(null);
    setDetailsLoading(true);

    try {
      const response = await qcDivisionController.fetchFormDetails({
        formId: row.formId,
        subDepartmentId,
      });
      const data = response?.data ?? null;
      if (data) setDetailData(data);
    } catch {
      setDetailData(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <ApproverSubdepartmentBatchListSection
      department="qualityControl"
      subDepartment="qc-division"
      items={items}
      statusMeta={QC_STATUS_META}
      onViewDetails={handleViewDetails}
      tableTheme={{
        accentMain: BRAND.qc,
        accentLight: BRAND.qcLight,
        borderColor: BRAND.border,
        surfaceColor: BRAND.surface,
        textSubColor: BRAND.textSub,
        primaryColor: BRAND.primary,
      }}
    >
      <QCDivisionDetailDialog
        open={!!selected}
        onClose={() => {
          setSelected(null);
          setDetailData(null);
        }}
        item={selected}
        onApprove={requestApprove}
        onReject={requestReject}
        detailData={detailData}
        detailsLoading={detailsLoading}
      />
      <ApproverActionDialog {...dialogProps} />
    </ApproverSubdepartmentBatchListSection>
  );
};

export default QCDivisionApproverPage;
