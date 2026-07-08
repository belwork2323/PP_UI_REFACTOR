// src/ui/pages/approver/dispatch/DispatchApproverPage.jsx

import React, { useState } from "react";
import {
  Box, Stack, Typography, Chip, alpha, Card, Button, Dialog,
  DialogContent, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Divider,CircularProgress
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { ReportPreviewDialog }  from "../components/ReportPdf";
import ApproverSubdepartmentBatchListSection from "../components/ApproverSubdepartmentBatchListSection";
import ApproverActionDialog from "../../../components/custom/ApproverActionDialog";
import { icons } from "../../../../app/theme/icons";
import { APPROVER_PRIORITY_META, APPROVER_STATUS_META, isApproverActionableStatus } from "../../../../app/theme/approver";
import useApproverFormAction from "../../../../hooks/approver/useApproverFormAction";
import { fetchDispatchFormDetailsApi } from "../../../../data/api/users/dispatch/dispatchAPI";
const {
  approved: CheckCircleRoundedIcon,
  rejected: CancelRoundedIcon,
  visibility: VisibilityRoundedIcon,
  close: CloseRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
  localShipping: LocalShippingRoundedIcon,
  inventory: InventoryRoundedIcon,
  description: DescriptionRoundedIcon,
  place: PlaceRoundedIcon,
  directionsCar: DirectionsCarRoundedIcon,
} = icons.approver.dispatch.page;

// ─── Palette (standard blue — same as all other approver pages) ───────────────
const BRAND = {
  primary:      "#1B4F72",
  primaryLight: "#2E86C1",
  accent:       "#148F77",
  accentLight:  "#1ABC9C",
  danger:       "#C0392B",
  warn:         "#D4AC0D",
  surface:      "#F4F6F8",
  border:       "#D5D8DC",
  text:         "#1C2833",
  textSub:      "#5D6D7E",
  qc:           "#1565C0",
  qcLight:      "#1976D2",
};

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

// ─── Status / Priority meta ───────────────────────────────────────────────────
export const DISPATCH_STATUS_META = APPROVER_STATUS_META;

const PRIORITY_META = APPROVER_PRIORITY_META;


// ─── Styled ───────────────────────────────────────────────────────────────────
const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.qc}, ${BRAND.qcLight})`,
  color: "#fff", fontWeight: 700, fontSize: "0.68rem",
  letterSpacing: "0.07em", textTransform: "uppercase",
  padding: "10px 14px", whiteSpace: "nowrap", borderBottom: "none",
});

const TD = styled(TableCell)({
  padding: "10px 14px", fontSize: "0.82rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.7)}`,
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
  borderBottom: `1px solid ${alpha(BRAND.border, 0.6)}`,
  color: BRAND.text, verticalAlign: "middle",
});

const rowBg = (i) => (i % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.7));
const hov   = { "&:hover": { background: alpha(BRAND.qc, 0.025) } };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const StatusChip = ({ status }) => (
  <Chip label={status} size="small" sx={{
    height: 20, fontSize: "0.62rem", fontWeight: 700,
    background: DISPATCH_STATUS_META[status]?.bg,
    color:      DISPATCH_STATUS_META[status]?.color,
    border:    `1px solid ${DISPATCH_STATUS_META[status]?.border}`,
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
    boxShadow: `0 1px 8px ${alpha(BRAND.qc, 0.06)}`,
    overflow: "hidden", mb: 2.5, background: "#fff",
  }}>
    {children}
  </Box>
);

// ─── Dispatch detail table ────────────────────────────────────────────────────
const DispatchDetailTable = ({ item }) => (
  <SubCard>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <DTH sx={{ minWidth: 200 }}>Field</DTH>
            <DTH sx={{ minWidth: 280 }}>Value</DTH>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            { label: "Destination",    value: item.destination,    icon: PlaceRoundedIcon },
            { label: "Consignee",      value: item.consignee,      icon: InventoryRoundedIcon },
            { label: "Transport Mode", value: item.transportMode,  icon: DirectionsCarRoundedIcon },
            { label: "Vehicle No.",    value: item.vehicleNo,      icon: null },
            { label: "Driver Name",    value: item.driverName,     icon: null },
            { label: "No. of Crates",  value: `${item.crateCount} crate${item.crateCount !== 1 ? "s" : ""}`, icon: null },
            { label: "Total Weight",   value: item.totalWeight,    icon: null },
          ].map(({ label, value }, ri) => (
            <TableRow key={label} sx={{ background: rowBg(ri), ...hov }}>
              <DTD sx={{ fontWeight: 700, color: BRAND.textSub }}>{label}</DTD>
              <DTD>
                <Chip
                  label={value || "—"}
                  size="small"
                  sx={{
                    height: 20, fontSize: "0.72rem", fontWeight: 600,
                    background: alpha(BRAND.qc, 0.08),
                    color: BRAND.qc,
                    border: `1px solid ${alpha(BRAND.qc, 0.2)}`,
                    maxWidth: 360,
                    "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                  }}
                />
              </DTD>
            </TableRow>
          ))}
          {/* Remarks — full row */}
          <TableRow sx={{ background: rowBg(7), ...hov, "& td": { borderBottom: "none" } }}>
            <DTD sx={{ fontWeight: 700, color: BRAND.textSub }}>Remarks</DTD>
            <DTD>
              <Typography sx={{ fontSize: "0.78rem", color: BRAND.text, fontStyle: item.remarks ? "normal" : "italic" }}>
                {item.remarks || "NIL"}
              </Typography>
            </DTD>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  </SubCard>
);

// ─── Documents table ──────────────────────────────────────────────────────────
const DocumentsTable = ({ docs }) => (
  <SubCard>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <DTH sx={{ minWidth: 220 }}>Document</DTH>
            <DTH sx={{ minWidth: 200 }}>Reference No.</DTH>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            { label: "Test Certificate",     value: docs?.testCert        },
            { label: "QC Clearance",         value: docs?.qualClearance   },
            { label: "Transport Permit",     value: docs?.transportPermit },
          ].map(({ label, value }, ri) => (
            <TableRow
              key={label}
              sx={{
                background: rowBg(ri), ...hov,
                ...(ri === 2 ? { "& td": { borderBottom: "none" } } : {}),
              }}
            >
              <DTD sx={{ fontWeight: 600 }}>{label}</DTD>
              <DTD>
                <Chip
                  label={value || "—"}
                  size="small"
                  sx={{
                    height: 20, fontSize: "0.7rem", fontWeight: 700,
                    background: value ? alpha(BRAND.accent, 0.1) : alpha(BRAND.border, 0.4),
                    color:      value ? BRAND.accent : BRAND.textSub,
                    border:    `1px solid ${value ? alpha(BRAND.accent, 0.25) : alpha(BRAND.border, 0.6)}`,
                  }}
                />
              </DTD>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </SubCard>
);
const KeyValueTable = ({ data }) => {
  if (!data) return null;

  return (
    <SubCard>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <DTH width="40%">Field</DTH>
              <DTH>Value</DTH>
            </TableRow>
          </TableHead>

          <TableBody>
            {Object.entries(data).map(([key, value], index) => (
              <TableRow key={key}>
                <DTD sx={{ fontWeight: 700 }}>
                  {key.replace(/([A-Z])/g, " $1")}
                </DTD>

                <DTD>
                  {typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value ?? "-")}
                </DTD>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SubCard>
  );
};

const DynamicArrayTable = ({ rows }) => {
  if (!rows?.length) return null;

  const columns = Object.keys(rows[0]);

  return (
    <SubCard>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <DTH key={column}>
                  {column.replace(/([A-Z])/g, " $1")}
                </DTH>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <DTD key={column}>
                    {typeof row[column] === "object"
                      ? JSON.stringify(row[column])
                      : String(row[column] ?? "-")}
                  </DTD>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SubCard>
  );
};
// ─── Detail dialog ────────────────────────────────────────────────────────────
const DispatchDetailDialog = ({ open, onClose, item, onApprove, onReject, detailsLoading, detailData,}) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;
  const detail = detailData ?? item;

  const motor = detail?.motors?.[0];

  const dispatch =
    motor?.details?.dispatchDetails ||
    motor?.dispatchDetails;

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

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
            <LocalShippingRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                Dispatch Request
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.7), fontSize: "0.72rem" }}>
                {detail?.batchId} · {(detail?.motors?.length || 0)} Motor(s)
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" gap={1} alignItems="center">
            <StatusChip status={detail?.status} />
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
              {
                label: "Form ID",
                value: detail?.formId,
              },
              {
                label: "Batch ID",
                value: detail?.batchId,
              },
              {
                label: "Created By",
                value: detail?.createdBy?.fullName,
              },
              {
                label: "Status",
                value: detail?.status,
              },
              {
                label: "Date",
                value: detail?.createdAt
                  ? new Date(detail.createdAt).toLocaleDateString("en-IN")
                  : "-",
              },
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

          {/* Motor ID chips */}
          <Stack direction="row" gap={0.75} flexWrap="wrap" mt={1}>
            {detail?.motors?.map((motor) => (
              <Chip
                key={motor.motorId}
                label={motor.motorId}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  background: alpha(BRAND.qc, 0.08),
                  color: BRAND.qc,
                  border: `1px solid ${alpha(BRAND.qc, 0.2)}`,
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Content */}
        <DialogContent
            sx={{
              p: 2.8,
              overflowY: "auto",
              background: BRAND.surface,
            }}
          >
            {detailsLoading ? (
              <Typography>Loading...</Typography>
            ) : (
              <>
                <SectionDivider
                  icon={LocalShippingRoundedIcon}
                  label="Basic Dispatch Details"
                />

                <KeyValueTable
                  data={{
                    projectName: dispatch?.projectName,
                    stage: dispatch?.stage,
                    castingDate: dispatch?.castingDate,
                    dispatchDate: dispatch?.dispatchDate,
                    dispatchLocation: dispatch?.dispatchLocation,
                  }}
                />

                <SectionDivider
                  icon={DescriptionRoundedIcon}
                  label="NDT Clearance"
                />

                <KeyValueTable
                  data={dispatch?.ndtClearance}
                />

                <SectionDivider
                  icon={DescriptionRoundedIcon}
                  label="Final Acceptance Committee Clearance"
                />

                <KeyValueTable
                  data={dispatch?.finalAcceptanceCommitteeClearance}
                />

                <SectionDivider
                  icon={DescriptionRoundedIcon}
                  label="Safety Clearance"
                />

                <KeyValueTable
                  data={dispatch?.safetyClearance}
                />

                <SectionDivider
                  icon={DescriptionRoundedIcon}
                  label="Dispatch Team"
                />

                <KeyValueTable
                  data={dispatch?.dispatchTeam}
                />

                <SectionDivider
                  icon={DescriptionRoundedIcon}
                  label="Waiver Details"
                />

                <KeyValueTable
                  data={dispatch?.waiverDetails}
                />

                <SectionDivider
                  icon={InventoryRoundedIcon}
                  label="Propellant Properties"
                />

                <DynamicArrayTable
                  rows={dispatch?.propellantProperties}
                />

                <SectionDivider
                  icon={InventoryRoundedIcon}
                  label="Rocket Motor Inspection"
                />

                <DynamicArrayTable
                  rows={dispatch?.rocketMotorInspection}
                />

                <SectionDivider
                  icon={DirectionsCarRoundedIcon}
                  label="Vehicle Details"
                />

                <DynamicArrayTable
                  rows={dispatch?.vehicleDetails}
                />

                <SectionDivider
                  icon={InventoryRoundedIcon}
                  label="Rocket Motor Packing Details"
                />

                <DynamicArrayTable
                  rows={dispatch?.rocketMotorPackingDetails}
                />

                <SectionDivider
                  icon={DescriptionRoundedIcon}
                  label="Dispatch Photos"
                />

                <KeyValueTable
                  data={{
                    photos:
                      dispatch?.uploadDispatchPhotos?.join(", "),
                  }}
                />
              </>
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
        department="dispatch"
        subDepartment="dispatch"
        dialogTitle={`Dispatch Report — ${detail?.batchId || item?.batchId}`}
      />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const DispatchApproverPage = () => {
  const [items,    setItems]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "dispatch",
    setItems,
    setSelected,
    subDepartment: "dispatch",
  });
  const handleViewDetails = async (row) => {
  setSelected(row);
  setDetailData(null);
  setDetailsLoading(true);

  try {
    const response = await fetchDispatchFormDetailsApi({
      formId: row.formId,
    });

    if (response?.data) {
      setDetailData(response.data);
    }
  } catch (error) {
    console.error(error);
    setDetailData(null);
  } finally {
    setDetailsLoading(false);
  }
};
  return (
    <ApproverSubdepartmentBatchListSection
      department="dispatch"
      subDepartment="dispatch"
      items={items}
      statusMeta={DISPATCH_STATUS_META}
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
      <DispatchDetailDialog
        open={!!selected}
        onClose={() => {
          setSelected(null);
          setDetailData(null);
        }}
        item={selected}
        onApprove={requestApprove}
        onReject={requestReject}
        detailsLoading={detailsLoading}
        detailData={detailData}
      />
      <ApproverActionDialog {...dialogProps} />
    </ApproverSubdepartmentBatchListSection>
  );
};

export default DispatchApproverPage;