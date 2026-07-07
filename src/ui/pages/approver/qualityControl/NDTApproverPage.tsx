// src/ui/pages/approver/quality_control/NDTApproverPage.jsx

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
import ndtController from "../../../../controllers/user/quality_control/ndtController";
import type { NDTFormState } from "../../../../data/models/user/NDTFormModel";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  visibility: VisibilityRoundedIcon,
  close: CloseRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
  radar: RadarRoundedIcon,
} = icons.approver.qualityControl.ndt;

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

// ─── Defect keys ──────────────────────────────────────────────────────────────
const DEFECT_ROWS = [
  { key: "cracks", label: "Cracks" },
  { key: "voids", label: "Voids" },
  { key: "debonds", label: "De-bonds" },
  { key: "delamination", label: "Delamination" },
  { key: "porosity", label: "Porosity" },
  { key: "other", label: "Any other observation" },
];

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

const DTH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.qc}, ${BRAND.qcLight})`,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.65rem",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  padding: "10px 14px",
  whiteSpace: "nowrap",
  borderBottom: "none",
  verticalAlign: "middle",
});

const DTD = styled(TableCell)({
  padding: "9px 13px",
  fontSize: "0.78rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
  color: BRAND.text,
  verticalAlign: "middle",
});

const rowBg = (i) => (i % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.6));
const hov = { "&:hover": { background: alpha(BRAND.qc, 0.025) } };

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

const SectionDivider = ({ icon: Icon, label }) => (
  <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: "8px",
        flexShrink: 0,
        background: `linear-gradient(135deg, ${BRAND.qc}, ${BRAND.qcLight})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon sx={{ color: "#fff", fontSize: 14 }} />
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: BRAND.qc, letterSpacing: "0.04em" }}>
      {label}
    </Typography>
    <Box sx={{ flex: 1, height: "1px", background: alpha(BRAND.qc, 0.18) }} />
  </Stack>
);

const SubCard = ({ children }) => (
  <Box
    sx={{
      borderRadius: "10px",
      border: `1px solid ${BRAND.border}`,
      boxShadow: `0 1px 8px ${alpha(BRAND.qc, 0.06)}`,
      overflow: "hidden",
      mb: 2.5,
    }}
  >
    {children}
  </Box>
);

// ─── Detail sub-components ────────────────────────────────────────────────────

const SetupSummaryCard = ({ form }: { form: NDTFormState }) => (
  <SubCard>
    <Box sx={{ p: 2 }}>
      <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: BRAND.qc, mb: 1.5 }}>
        Setup Summary
      </Typography>
      <Stack direction="row" gap={4} flexWrap="wrap">
        <Box>
          <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: BRAND.textSub, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.3 }}>
            Equipment
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: BRAND.text }}>
            {form.equipment || "—"}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: BRAND.textSub, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.3 }}>
            Beam Energies
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: BRAND.text }}>
            {form.beamEnergies?.length ? form.beamEnergies.join(", ") : "—"}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: BRAND.textSub, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.3 }}>
            Radiography Plan
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: BRAND.text }}>
            {form.radiographyPlan || "—"}
          </Typography>
        </Box>
      </Stack>
      {form.radiographyPlanRows?.length > 0 && (
        <TableContainer sx={{ mt: 1.5 }}>
          <Table size="small" sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <DTH>Sr No</DTH>
                <DTH>Sections</DTH>
                <DTH>Orientations</DTH>
                <DTH>SFD</DTH>
                <DTH>Normal Exposures</DTH>
                <DTH>Tangential Exposures</DTH>
                <DTH>Detector Type</DTH>
              </TableRow>
            </TableHead>
            <TableBody>
              {form.radiographyPlanRows.map((row, ri) => (
                <TableRow key={ri} sx={{ background: rowBg(ri), ...hov, "&:last-child td": { borderBottom: "none" } }}>
                  <DTD sx={{ fontWeight: 700, color: BRAND.textSub }}>{row.srNo}</DTD>
                  <DTD>{row.sections}</DTD>
                  <DTD>{row.orientations}</DTD>
                  <DTD>{row.sfd}</DTD>
                  <DTD>{row.normalExposures}</DTD>
                  <DTD>{row.tangentialExposures}</DTD>
                  <DTD>{row.detectorType}</DTD>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  </SubCard>
);

const ExposureTable = ({ rows }: { rows: any[] }) => (
  <SubCard>
    <TableContainer>
      <Table size="small" sx={{ minWidth: 420 }}>
        <TableHead>
          <TableRow>
            <DTH sx={{ minWidth: 80 }}>Sr No</DTH>
            <DTH sx={{ minWidth: 140 }}>Section Number</DTH>
            <DTH sx={{ minWidth: 120 }}>Orientation</DTH>
            <DTH sx={{ minWidth: 120 }}>Exposure Count</DTH>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={ri} sx={{ background: rowBg(ri), ...hov, "&:last-child td": { borderBottom: "none" } }}>
              <DTD sx={{ fontWeight: 700, color: BRAND.textSub }}>{ri + 1}</DTD>
              <DTD>{row.sectionNumber || "—"}</DTD>
              <DTD>{row.orientation || "—"}</DTD>
              <DTD>{row.exposureCount || "—"}</DTD>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </SubCard>
);

const ObservationTable = ({ rows }: { rows: any[] }) => (
  <SubCard>
    <TableContainer>
      <Table size="small" sx={{ minWidth: 500 }}>
        <TableHead>
          <TableRow>
            <DTH sx={{ minWidth: 80 }}>Sr No</DTH>
            <DTH sx={{ minWidth: 120 }}>Section</DTH>
            <DTH sx={{ minWidth: 120 }}>Orientation</DTH>
            <DTH sx={{ minWidth: 200 }}>Observations</DTH>
            <DTH sx={{ minWidth: 120 }}>Images</DTH>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={ri} sx={{ background: rowBg(ri), ...hov, "&:last-child td": { borderBottom: "none" } }}>
              <DTD sx={{ fontWeight: 700, color: BRAND.textSub }}>{ri + 1}</DTD>
              <DTD>{row.section || "—"}</DTD>
              <DTD>{row.orientation || "—"}</DTD>
              <DTD>{row.observations || "—"}</DTD>
              <DTD>
                {(row.files?.length ?? 0) > 0
                  ? `${row.files.length} image${row.files.length !== 1 ? "s" : ""}`
                  : "—"}
              </DTD>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </SubCard>
);

const VisualInspectionTable = ({ rows }: { rows: any[] }) => (
  <SubCard>
    <TableContainer>
      <Table size="small" sx={{ minWidth: 480 }}>
        <TableHead>
          <TableRow>
            <DTH sx={{ minWidth: 80 }}>Sr No</DTH>
            <DTH sx={{ minWidth: 180 }}>Observation</DTH>
            <DTH sx={{ minWidth: 100 }}>Section</DTH>
            <DTH sx={{ minWidth: 100 }}>Orientation</DTH>
            <DTH sx={{ minWidth: 120 }}>Images</DTH>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={ri} sx={{ background: rowBg(ri), ...hov, "&:last-child td": { borderBottom: "none" } }}>
              <DTD sx={{ fontWeight: 700, color: BRAND.textSub }}>{ri + 1}</DTD>
              <DTD sx={{ fontWeight: 600 }}>{row.observation || "—"}</DTD>
              <DTD>{row.section || "—"}</DTD>
              <DTD>{row.orientation || "—"}</DTD>
              <DTD>
                {(row.files?.length ?? 0) > 0
                  ? `${row.files.length} image${row.files.length !== 1 ? "s" : ""}`
                  : "—"}
              </DTD>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </SubCard>
);

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const NDTDetailDialog = ({ open, onClose, item, detailData, detailsLoading, onApprove, onReject }: {
  open: boolean;
  onClose: () => void;
  item: any;
  detailData: NDTFormState | null;
  detailsLoading: boolean;
  onApprove: (item: any) => void;
  onReject: (item: any) => void;
}) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  const motors = detailData?.motors ?? [];

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
                {item.batchId} · {motors.length} motor{motors.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" gap={1} alignItems="center">
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
              { label: "Form ID",      value: item.formId },
              { label: "Submitted By", value: item.submittedBy },
              { label: "Date",         value: new Date(item.createdOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
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
          {detailsLoading ? (
            <Stack alignItems="center" py={4}>
              <CircularProgress size={28} />
            </Stack>
          ) : detailData ? (
            <>
              <SectionDivider icon={RadarRoundedIcon} label="Setup Summary" />
              <SetupSummaryCard form={detailData} />

              {motors.map((motor, mi) => (
                <Box key={motor.motorId || mi} sx={{ mb: 3 }}>
                  <Typography sx={{
                    fontWeight: 800, fontSize: "0.85rem", color: BRAND.qc,
                    mb: 1.5, mt: 2,
                    display: "flex", alignItems: "center", gap: 1,
                  }}>
                    <Box sx={{
                      width: 22, height: 22, borderRadius: "6px",
                      background: `linear-gradient(135deg, ${BRAND.qc}, ${BRAND.qcLight})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.65rem", color: "#fff", fontWeight: 700,
                    }}>
                      {mi + 1}
                    </Box>
                    Motor — {motor.motorId}
                  </Typography>

                  {motor.additionalExposureRows?.length > 0 && (
                    <>
                      <SectionDivider icon={RadarRoundedIcon} label="Additional Exposure Details" />
                      <ExposureTable rows={motor.additionalExposureRows} />
                    </>
                  )}

                  {motor.radiographyObservationRows?.length > 0 && (
                    <>
                      <SectionDivider icon={RadarRoundedIcon} label="Radiography Observations" />
                      <ObservationTable rows={motor.radiographyObservationRows} />
                    </>
                  )}

                  {motor.visualInspectionRows?.length > 0 && (
                    <>
                      <SectionDivider icon={RadarRoundedIcon} label="Visual Inspection" />
                      <VisualInspectionTable rows={motor.visualInspectionRows} />
                    </>
                  )}

                  {motor.visualInspectionMedia?.length > 0 && (
                    <SubCard>
                      <Box sx={{ p: 2 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: BRAND.text, mb: 1 }}>
                          Visual Inspection Media (Videos)
                        </Typography>
                        <Stack direction="row" gap={1} flexWrap="wrap">
                          {motor.visualInspectionMedia.map((file, fi) => (
                            <Chip key={fi} label={String(file)} size="small" sx={{
                              fontSize: "0.68rem", fontWeight: 600,
                              background: alpha(BRAND.qc, 0.08), color: BRAND.qc,
                            }} />
                          ))}
                        </Stack>
                      </Box>
                    </SubCard>
                  )}

                  {motor.additionalRemarks && (
                    <SubCard>
                      <Box sx={{ p: 2 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: BRAND.text, mb: 0.5 }}>
                          Additional Remarks
                        </Typography>
                        <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>
                          {motor.additionalRemarks}
                        </Typography>
                      </Box>
                    </SubCard>
                  )}

                  {motor.signedReport && (
                    <SubCard>
                      <Box sx={{ p: 2 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: BRAND.text, mb: 0.5 }}>
                          Signed NDT Report
                        </Typography>
                        <Typography sx={{ fontSize: "0.78rem", color: BRAND.qc }}>
                          {String(motor.signedReport)}
                        </Typography>
                      </Box>
                    </SubCard>
                  )}
                </Box>
              ))}

              {motors.length === 0 && (
                <Typography sx={{ textAlign: "center", py: 4, color: BRAND.textSub, fontSize: "0.85rem" }}>
                  No saved NDT form details available for preview.
                </Typography>
              )}
            </>
          ) : (
            <Typography sx={{ textAlign: "center", py: 4, color: BRAND.textSub, fontSize: "0.85rem" }}>
              No saved NDT form details available for preview.
            </Typography>
          )}
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
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailData, setDetailData] = useState<NDTFormState | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "qualityControl",
    setItems,
    setSelected,
    subDepartment: "ndt",
  });

  const handleViewDetails = async (row: any) => {
    setSelected(row);
    setDetailData(null);
    setDetailsLoading(true);

    try {
      const response = await ndtController.fetchFormDetails({ formId: row.formId, subDepartmentId: 0 } as any);
      const prep = response?.data?.data ?? null;
      if (prep) setDetailData(prep);
    } catch {
      setDetailData(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <ApproverSubdepartmentBatchListSection
      department="qualityControl"
      subDepartment="ndt"
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
      <NDTDetailDialog
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

export default NDTApproverPage;
