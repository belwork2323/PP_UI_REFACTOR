// src/ui/pages/approver/quality_control/STFApproverPage.jsx

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
import {
  APPROVER_PRIORITY_META,
  APPROVER_STATUS_META,
  isApproverActionableStatus,
} from "../../../../app/theme/approver";
import useApproverFormAction from "../../../../hooks/approver/useApproverFormAction";
import { fetchSTFFormDetailsApi } from "../../../../data/api/users/quality_control/stfApi";
import { FORM_SECTIONS_KEY } from "../../../../data/models/user/StaticTestFacilityFormModel";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  visibility: VisibilityRoundedIcon,
  close: CloseRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
  rocketLaunch: RocketLaunchRoundedIcon,
} = icons.approver.qualityControl.staticTestFacility;

// ─── Palette (PostCure blue) ──────────────────────────────────────────────────
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

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const STFDetailDialog = ({ open, onClose, item, detailData, detailsLoading, onApprove, onReject }) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  const sections = detailData?.sections ?? [];

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
            <RocketLaunchRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                Static Test Facility — Form Details
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
                value: new Date(item.createdOn).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
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
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: BRAND.text }}>{value || "—"}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Content */}
        <DialogContent sx={{ p: 2.8, overflowY: "auto", background: BRAND.surface }}>
          {detailsLoading ? (
            <Stack alignItems="center" py={4}>
              <CircularProgress size={28} />
            </Stack>
          ) : sections.length > 0 ? (
            sections.map((section: any) => <SectionRenderer key={section.sectionId} section={section} />)
          ) : (
            <Typography sx={{ fontSize: "0.82rem", color: BRAND.textSub }}>
              No saved STF form details available for preview.
            </Typography>
          )}
        </DialogContent>

        {/* Footer */}
        {isApproverActionableStatus(item.status) ? (
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
            <Button variant="outlined" color="error" startIcon={<CancelRoundedIcon />} onClick={() => onReject(item)}>
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
        ) : null}
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

// ─── Helpers for section rendering ────────────────────────────────────────────
const sectionName = (id: string) =>
  id
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

const fieldLabel = (key: string) => key.replace(/_/g, " ");

const DynamicTable = ({ rows }: { rows: Record<string, any>[] }) => {
  if (!rows?.length) return null;
  const cols = Object.keys(rows[0]).filter((k) => !k.startsWith("_"));
  return (
    <TableContainer
      sx={{ mt: 1, mb: 1.5, border: `1px solid ${alpha(BRAND.qc, 0.2)}`, borderRadius: 1.5, overflowX: "auto" }}
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background: alpha(BRAND.qc, 0.08) }}>
            {cols.map((col) => (
              <TableCell
                key={col}
                sx={{ fontWeight: 700, fontSize: "0.62rem", color: BRAND.qc, px: 1.5, py: 0.8, whiteSpace: "nowrap" }}
              >
                {fieldLabel(col)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={ri} sx={{ background: ri % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.5) }}>
              {cols.map((col) => (
                <TableCell key={col} sx={{ fontSize: "0.72rem", px: 1.5, py: 0.8 }}>
                  {String(row[col] ?? "—")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const SectionRenderer = ({ section }: { section: { sectionId: string; sectionData: Record<string, any>[] } }) => {
  const entries = section.sectionData ?? [];

  if (!entries.length) return null;

  const value = entries[0];
  const allKeys = Object.keys(value).filter((k) => !k.startsWith("_"));
  const simpleKeys = allKeys.filter(
    (k) => !Array.isArray(value[k]) && (typeof value[k] !== "object" || value[k] === null),
  );
  const tableKeys = allKeys.filter((k) => Array.isArray(value[k]));

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
          {sectionName(section.sectionId)}
        </Typography>
      </Box>

      {simpleKeys.length > 0 && (
        <TableContainer sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 1, mb: 1 }}>
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
                    {String(value[key] ?? "—")}
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
        return (
          <Box key={key} sx={{ mb: 1 }}>
            <Typography sx={{ fontWeight: 600, fontSize: "0.68rem", color: BRAND.textSub, mb: 0.5 }}>
              {fieldLabel(key)}
            </Typography>
            <DynamicTable rows={data} />
          </Box>
        );
      })}
    </Box>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const STFApproverPage = () => {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "qualityControl",
    setItems,
    setSelected,
    subDepartment: "static-test-facility",
  });

  const handleViewDetails = async (row: any) => {
    setSelected(row);
    setDetailData(null);
    setDetailsLoading(true);

    try {
      const response = await fetchSTFFormDetailsApi({ formId: row.formId, subDepartmentId: 0 } as any);
      const data = response?.data;
      let sections = data?.sections;
      if (!Array.isArray(sections) || !sections.length) {
        const motors = data?.motors;
        if (Array.isArray(motors) && motors.length > 0) {
          sections = motors[0]?.staticTestingDetails?.[FORM_SECTIONS_KEY];
        }
      }
      if (Array.isArray(sections) && sections.length) setDetailData({ sections });
    } catch {
      setDetailData(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <ApproverSubdepartmentBatchListSection
      department="qualityControl"
      subDepartment="static-test-facility"
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
      <STFDetailDialog
        open={!!selected}
        onClose={() => {
          setSelected(null);
          setDetailData(null);
        }}
        item={selected}
        detailData={detailData}
        detailsLoading={detailsLoading}
        onApprove={requestApprove}
        onReject={requestReject}
      />
      <ApproverActionDialog {...dialogProps} />
    </ApproverSubdepartmentBatchListSection>
  );
};

export default STFApproverPage;
