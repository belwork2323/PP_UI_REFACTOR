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

import ApproverSubdepartmentBatchListSection from "../components/ApproverSubdepartmentBatchListSection";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import { icons } from "../../../../app/theme/icons";
import { APPROVER_PRIORITY_META, APPROVER_STATUS_META, isApproverActionableStatus } from "../../../../app/theme/approver";
import useApproverFormAction from "../../../../hooks/approver/useApproverFormAction";
import { fetchTrimmingFormDetailsApi } from "../../../../data/api/users/manufacturing/trimmingFormApi";

const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  visibility: VisibilityRoundedIcon,
  close: CloseRoundedIcon,
  straighten: StraightenRoundedIcon,
} = icons.approver.manufacturing.trimming;

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
  tr: "#1565C0",
  trLight: "#1976D2",
};

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;
const PRIORITY_META = APPROVER_PRIORITY_META;
export const TR_STATUS_META = APPROVER_STATUS_META;

// ─── STYLED TABLE CELLS ──────────────────────────────────────────────────────
const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.tr}, ${BRAND.trLight})`,
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
  fontSize: "0.78rem",
  color: BRAND.text,
  borderBottom: `1px solid ${alpha(BRAND.border, 0.6)}`,
});

const SubTH = styled(TableCell)({
  background: alpha(BRAND.tr, 0.06),
  color: BRAND.primary,
  fontWeight: 700,
  fontSize: "0.68rem",
  padding: "8px 12px",
  borderBottom: `2px solid ${BRAND.border}`,
});

const SubTD = styled(TableCell)({
  padding: "8px 12px",
  fontSize: "0.76rem",
  color: BRAND.text,
  borderBottom: `1px solid ${alpha(BRAND.border, 0.4)}`,
});

// ─── CHIP COMPONENTS ─────────────────────────────────────────────────────────
const StatusChip = ({ status }: { status: string }) => {
  const meta = TR_STATUS_META[status] ?? TR_STATUS_META.Pending;
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        height: 24,
        fontWeight: 700,
        fontSize: "0.68rem",
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
      }}
    />
  );
};

const PriorityChip = ({ priority }: { priority: string }) => {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.Medium;
  return (
    <Chip
      label={priority}
      size="small"
      sx={{
        height: 22,
        fontWeight: 700,
        fontSize: "0.68rem",
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
      }}
    />
  );
};

// ─── PARAMETERS & DIMENSION SUB-TABLES ───────────────────────────────────────
const TrimmingMachineDetailsTable = ({ data }: { data: any[] }) => (
  <TableContainer sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 1.5, mb: 3, background: "#fff" }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <SubTH>Sr. No</SubTH>
          <SubTH>Machine Info</SubTH>
          <SubTH>Start Date</SubTH>
          <SubTH>Completion Date</SubTH>
          <SubTH>Arbor Size</SubTH>
          <SubTH>Cutter Size</SubTH>
          <SubTH>Truing Value</SubTH>
          <SubTH>Remarks</SubTH>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((row: any, i: number) => (
          <TableRow key={i}>
            <SubTD>{row.SR_NO || i + 1}</SubTD>
            <SubTD style={{ fontWeight: 600 }}>{row.MACHINE_DETAILS || "—"}</SubTD>
            <SubTD>{row.START_DATE || "—"}</SubTD>
            <SubTD>{row.COMPLETION_DATE || "—"}</SubTD>
            <SubTD>{row.ARBOR_SIZE || "—"}"</SubTD>
            <SubTD>{row.CUTTER_SIZE || "—"}"</SubTD>
            <SubTD>{row.MOTOR_AND_ARBOR_TRUING || "—"}</SubTD>
            <SubTD>{row.REMARKS || "—"}</SubTD>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const DimensionsComparisonTable = ({ data }: { data: any[] }) => (
  <TableContainer sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 1.5, background: "#fff" }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <SubTH>Sr. No</SubTH>
          <SubTH>Dimension Parameter</SubTH>
          <SubTH>Condition Window</SubTH>
          <SubTH>Specified</SubTH>
          <SubTH>R2T</SubTH>
          <SubTH>R2B</SubTH>
          <SubTH>R1L</SubTH>
          <SubTH>R1R</SubTH>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((row: any, i: number) => (
          <TableRow 
            key={i}
            sx={{ 
              background: row.MEASUREMENT_TYPE?.includes("After") ? alpha(BRAND.accent, 0.03) : "transparent"
            }}
          >
            <SubTD>{row.SR_NO || i + 1}</SubTD>
            <SubTD style={{ fontWeight: 600, color: BRAND.primary }}>{row.DIMENSION || "—"}</SubTD>
            <SubTD>
              <Chip 
                label={row.MEASUREMENT_TYPE || "—"} 
                size="small" 
                sx={{ 
                  height: 18, 
                  fontSize: "0.62rem", 
                  fontWeight: 600,
                  background: row.MEASUREMENT_TYPE?.includes("After") ? alpha(BRAND.accent, 0.1) : alpha(BRAND.warn, 0.1),
                  color: row.MEASUREMENT_TYPE?.includes("After") ? BRAND.accent : BRAND.warn
                }} 
              />
            </SubTD>
            <SubTD>{row.SPECIFIED || "—"}</SubTD>
            <SubTD>{row.R2T || "—"}</SubTD>
            <SubTD>{row.R2B || "—"}</SubTD>
            <SubTD>{row.R1L || "—"}</SubTD>
            <SubTD>{row.R1R || "—"}</SubTD>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// ─── DETAIL DIALOG ────────────────────────────────────────────────────────────
const TrimmingDetailDialog = ({
  open,
  onClose,
  item,
  detailData,
  detailsLoading,
  onApprove,
  onReject,
}: any) => {
  if (!item) return null;

  // Unwrap target data envelopes
  const dataPayload = detailData?.data || detailData || {};
  const motorsList = dataPayload.motors || [];
  const activeMotor = motorsList.find((m: any) => m.motorId === item.motorId) || motorsList[0] || {};
  
  // Extract custom section wrappers directly mapped out from API response payload
  const machineSection = activeMotor.sections?.find((s: any) => s.sectionId === "TRIMMING_DETAILS");
  const dimensionsSection = activeMotor.sections?.find((s: any) => s.sectionId === "DIMENSIONS_AFTER_TRIMMING");

  const trimmingDetailsArray = machineSection?.sectionData?.[0]?.TRIMMING_DETAILS || [];
  const dimensionsArray = dimensionsSection?.sectionData?.[0]?.DIMENSION_TABLE || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: 0, background: BRAND.surface }}>
        {/* Header Block */}
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BRAND.border}`, background: "#fff" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  background: `linear-gradient(135deg, ${BRAND.tr}, ${BRAND.trLight})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StraightenRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: BRAND.text }}>
                  {dataPayload.batchId || item.batchId}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub }}>
                  Stage {activeMotor.motorStage || item.motorStage || "—"} · Machine Reference ID: {item.motorId}
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={onClose} size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Content Body Area */}
        <Box sx={{ p: 3 }}>
          {detailsLoading ? (
            <Stack alignItems="center" py={6}>
              <CircularProgress size={28} />
              <Typography variant="caption" sx={{ mt: 1.5, color: BRAND.textSub }}>Extracting production sheets...</Typography>
            </Stack>
          ) : detailData ? (
            <Box>
              {/* Form Metadata Grid */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3, p: 2, border: `1px solid ${BRAND.border}`, borderRadius: 1.5, background: '#fff' }}>
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block">Form ID</Typography>
                  <Typography variant="body2" fontWeight={600}>{dataPayload.formId || "—"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block">Process Status</Typography>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    {dataPayload.status || "WAITING_FOR_APPROVAL"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block">Received Stamp</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {activeMotor.motorReceivedAt || "—"}
                  </Typography>
                </Box>
              </Box>

              {/* Trimming Run Parameters */}
              <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text, mb: 1.5 }}>
                1. Equipment Mechanical Run Configuration
              </Typography>
              {trimmingDetailsArray.length > 0 ? (
                <TrimmingMachineDetailsTable data={trimmingDetailsArray} />
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>No machine specs logged.</Typography>
              )}

              {/* Dimensional Metrology Matrix */}
              <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text, mb: 1.5, mt: 1 }}>
                2. Comparative Metrology Specifications (Before vs After Trimming)
              </Typography>
              {dimensionsArray.length > 0 ? (
                <DimensionsComparisonTable data={dimensionsArray} />
              ) : (
                <Typography variant="body2" color="textSecondary">No parameter tracking maps linked.</Typography>
              )}
            </Box>
          ) : (
            <Typography sx={{ fontSize: "0.82rem", color: BRAND.textSub, textAlign: 'center', py: 4 }}>
              Failed to load machine processing dimensions.
            </Typography>
          )}

          {/* Action Row */}
          {isApproverActionableStatus(item.status) && (
            <Stack direction="row" gap={1.5} justifyContent="flex-end" mt={4} pt={2} borderTop={`1px solid ${BRAND.border}`}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelRoundedIcon />}
                onClick={() => onReject(item)}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircleRoundedIcon />}
                onClick={() => onApprove(item)}
                sx={{ background: BRAND.tr, "&:hover": { background: BRAND.trLight }, textTransform: 'none', fontWeight: 600 }}
              >
                Approve
              </Button>
            </Stack>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// ─── MAIN CONTAINER PAGE ──────────────────────────────────────────────────────
const TrimmingApproverPage = () => {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "manufacturing",
    setItems,
    setSelected,
    subDepartment: "trimming",
  });

  const handleViewDetails = async (row: any) => {
    setSelected(row);
    setDetailData(null);
    setDetailsLoading(true);

    try {
      const response = await fetchTrimmingFormDetailsApi({ formId: row.formId});
      if (response) {
        setDetailData(response);
      }
    } catch (err) {
      console.error("Error fetching process dimensions:", err);
      setDetailData(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <ApproverSubdepartmentBatchListSection
      department="manufacturing"
      subDepartment="trimming"
      items={items}
      statusMeta={TR_STATUS_META}
      onViewDetails={handleViewDetails}
      tableTheme={{
        accentMain: BRAND.tr,
        accentLight: BRAND.trLight,
        borderColor: BRAND.border,
        surfaceColor: BRAND.surface,
        textSubColor: BRAND.textSub,
        primaryColor: BRAND.primary,
      }}
    >
      <TrimmingDetailDialog
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

export default TrimmingApproverPage;