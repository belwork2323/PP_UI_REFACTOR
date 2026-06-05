// src/ui/pages/approver/manufacturing/CastingCuring/CastingCuringApproverPage.jsx

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
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { ReportPreviewDialog } from "../components/ReportPdf";
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
  thermostat: ThermostatRoundedIcon,
  scale: ScaleRoundedIcon,
  timer: TimerRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.manufacturing.castingAndCuring;

// ─── Palette ──────────────────────────────────────────────────────────────────
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
  cc: "#1565C0",
  ccLight: "#1976D2",
  ok: "#1B5E20",
  okBg: "rgba(27,94,32,0.08)",
  okBorder: "rgba(27,94,32,0.25)",
  notOk: "#B71C1C",
  notOkBg: "rgba(183,28,28,0.08)",
  notOkBorder: "rgba(183,28,28,0.25)",
};

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

// ─── Status meta ──────────────────────────────────────────────────────────────
export const CC_STATUS_META = APPROVER_STATUS_META;

const PRIORITY_META = APPROVER_PRIORITY_META;

// ─── Mock data (aligned with CastingCuringForm data shape) ─────────────────────
const MOCK_CC_SUBMISSIONS = [
  {
    id: 1,
    batchId: "CC-2025-042",
    motorId: "MFG-SRM-2025-119",
    motorType: "A",
    status: "Pending",
    priority: "High",
    submittedBy: "arjun.menon",
    createdOn: "2025-03-10T08:45:00",

    bowl: {
      motorIds: { m1: "M-2101", m2: "M-2102" },
      rows: [
        { id: 1, bowlNo: "1", propellantQty: "18.4", viscosity: "4200", viscosityTemp: "28", arrivalTime: "09:15", slurry1: "9.2", slurry2: "9.1" },
        { id: 2, bowlNo: "2", propellantQty: "17.9", viscosity: "3950", viscosityTemp: "27.5", arrivalTime: "10:40", slurry1: "8.9", slurry2: "8.95" },
        { id: 3, bowlNo: "3", propellantQty: "18.1", viscosity: "4100", viscosityTemp: "28.2", arrivalTime: "12:05", slurry1: "9.05", slurry2: "9.0" },
      ],
    },
    curingDetails: {
      motorIds: { m1: "M-2101", m2: "M-2102" },
      r1: { m1: "5×10⁻²", m2: "4.8×10⁻²" },
      r2: { m1: "4.2×10⁻² / 1.8 kg/min", m2: "4.1×10⁻² / 1.75 kg/min" },
      r3: [
        { id: "t0", label: "T0", m1: "5×10⁻²", m2: "4.9×10⁻²" },
        { id: "t1", label: "T0 + 30", m1: "6×10⁻²", m2: "5.5×10⁻²" },
        { id: "t2", label: "T0 + 60", m1: "4.8×10⁻²", m2: "4.7×10⁻²" },
      ],
      r4: { param: "Total casting time", m1: "52 min", m2: "54 min" },
      r5a: { m1: "36.2", m2: "35.8" },
      r5b: { m1: "35.9", m2: "35.6" },
      r6: { param: "Propellant cast", m1: "36.15", m2: "35.85" },
    },
    curingDetails2: {
      motorIds: { m1: "M-2101", m2: "M-2102" },
      r1: { m1: "68", m2: "67" },
      r2: { m1: "65°C ±2 / 72 hrs", m2: "65°C ±2 / 72 hrs" },
      r3: { m1: "65°C / 48 hrs", m2: "65°C / 48 hrs" },
      r4: { m1: "72", m2: "71" },
    },
  },
  // ... you can add more mock entries
];

// ─── Styled components (same as CasePreparation) ──────────────────────────────
const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
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
  background: `linear-gradient(135deg, ${BRAND.cc}, ${BRAND.ccLight})`,
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
  padding: "10px 14px",
  fontSize: "0.78rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
  color: BRAND.text,
  verticalAlign: "middle",
});

const rowBg = (i) => (i % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.6));
const hov = { "&:hover": { background: alpha(BRAND.cc, 0.025) } };

// ─── Reusable small components ────────────────────────────────────────────────
const StatusChip = ({ status }) => (
  <Chip
    label={status}
    size="small"
    sx={{
      height: 20,
      fontSize: "0.62rem",
      fontWeight: 700,
      background: CC_STATUS_META[status]?.bg,
      color: CC_STATUS_META[status]?.color,
      border: `1px solid ${CC_STATUS_META[status]?.border}`,
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

const MotorIdHeader = ({ label, id }) => (
  <Stack gap={0.4}>
    <Typography
      sx={{
        fontSize: "0.58rem",
        fontWeight: 700,
        color: "rgba(255,255,255,0.7)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {label}
    </Typography>
    <Chip
      label={id || "—"}
      size="small"
      sx={{
        height: 22,
        fontSize: "0.7rem",
        fontWeight: 800,
        background: "rgba(255,255,255,0.18)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.35)",
      }}
    />
  </Stack>
);

const SectionDivider = ({ icon: Icon, label }) => (
  <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
    <Box
      sx={{
        width: 26,
        height: 26,
        borderRadius: "8px",
        flexShrink: 0,
        background: `linear-gradient(135deg, ${BRAND.cc}, ${BRAND.ccLight})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon sx={{ color: "#fff", fontSize: 14 }} />
    </Box>
    <Typography
      sx={{
        fontWeight: 800,
        fontSize: "0.78rem",
        color: BRAND.cc,
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </Typography>
    <Box sx={{ flex: 1, height: "1px", background: alpha(BRAND.cc, 0.18) }} />
  </Stack>
);

// ─── Detail Tables ────────────────────────────────────────────────────────────
const BowlDetailsTable = ({ bowl }) => (
  <TableContainer
    sx={{
      borderRadius: "8px",
      border: `1px solid ${BRAND.border}`,
      boxShadow: `0 1px 8px ${alpha(BRAND.cc, 0.06)}`,
      overflowX: "auto",
    }}
  >
    <Table size="small" sx={{ minWidth: 780 }}>
      <TableHead>
        <TableRow>
          <DTH sx={{ minWidth: 80 }}>Bowl No.</DTH>
          <DTH sx={{ minWidth: 140 }}>Propellant Qty (kg)</DTH>
          <DTH sx={{ minWidth: 180 }}>Viscosity (P @ °C)</DTH>
          <DTH sx={{ minWidth: 140 }}>Arrival Time</DTH>
          <DTH sx={{ minWidth: 120 }}>Slurry M1 (kg)</DTH>
          <DTH sx={{ minWidth: 120 }}>Slurry M2 (kg)</DTH>
        </TableRow>
      </TableHead>
      <TableBody>
        {bowl?.rows?.map((row, i) => (
          <TableRow key={row.id} sx={{ background: rowBg(i), ...hov }}>
            <DTD>
              <Typography sx={{ fontWeight: 800, color: BRAND.cc }}>{row.bowlNo}</Typography>
            </DTD>
            <DTD>{row.propellantQty || "—"}</DTD>
            <DTD>
              {row.viscosity || "—"} P @ {row.viscosityTemp || "—"}°C
            </DTD>
            <DTD>{row.arrivalTime || "—"}</DTD>
            <DTD>{row.slurry1 || "—"}</DTD>
            <DTD>{row.slurry2 || "—"}</DTD>
          </TableRow>
        )) || (
          <TableRow>
            <DTD colSpan={6} align="center">
              No bowl data
            </DTD>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

const CastingDetailsTable = ({ cd, motorIds }) => (
  <TableContainer
    sx={{
      borderRadius: "8px",
      border: `1px solid ${BRAND.border}`,
      boxShadow: `0 1px 8px ${alpha(BRAND.cc, 0.06)}`,
      overflowX: "auto",
    }}
  >
    <Table size="small" sx={{ minWidth: 720 }}>
      <TableHead>
        <TableRow>
          <DTH sx={{ minWidth: 260 }}>Activity</DTH>
          <DTH sx={{ minWidth: 180 }}>Parameter</DTH>
          <DTH sx={{ minWidth: 160 }}>
            <MotorIdHeader label="Motor No." id={motorIds?.m1} />
          </DTH>
          <DTH sx={{ minWidth: 160 }}>
            <MotorIdHeader label="Motor No." id={motorIds?.m2} />
          </DTH>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow sx={{ background: rowBg(0), ...hov }}>
          <DTD>1. Vacuum Build Up</DTD>
          <DTD>Vacuum Level</DTD>
          <DTD>{cd?.r1?.m1 || "—"}</DTD>
          <DTD>{cd?.r1?.m2 || "—"}</DTD>
        </TableRow>

        <TableRow sx={{ background: rowBg(1), ...hov }}>
          <DTD>2. Start Casting</DTD>
          <DTD>Vacuum and Flow Rate</DTD>
          <DTD>{cd?.r2?.m1 || "—"}</DTD>
          <DTD>{cd?.r2?.m2 || "—"}</DTD>
        </TableRow>

        {cd?.r3?.map((tRow, idx) => (
          <TableRow key={tRow.id} sx={{ background: rowBg((idx + 2) % 2), ...hov }}>
            <DTD>Vacuum check @ {tRow.label}</DTD>
            <DTD>torr</DTD>
            <DTD>{tRow.m1 || "—"}</DTD>
            <DTD>{tRow.m2 || "—"}</DTD>
          </TableRow>
        ))}

        <TableRow sx={{ background: rowBg(0), ...hov }}>
          <DTD>4. Casting Duration</DTD>
          <DTD>{cd?.r4?.param || "Parameter"}</DTD>
          <DTD>{cd?.r4?.m1 || "—"}</DTD>
          <DTD>{cd?.r4?.m2 || "—"}</DTD>
        </TableRow>

        <TableRow sx={{ background: rowBg(1), ...hov }}>
          <DTD rowSpan={2}>5. Load Cell Reading</DTD>
          <DTD>Weight – Initial</DTD>
          <DTD>{cd?.r5a?.m1 || "—"}</DTD>
          <DTD>{cd?.r5a?.m2 || "—"}</DTD>
        </TableRow>
        <TableRow sx={{ background: rowBg(0), ...hov }}>
          <DTD>Weight – Final</DTD>
          <DTD>{cd?.r5b?.m1 || "—"}</DTD>
          <DTD>{cd?.r5b?.m2 || "—"}</DTD>
        </TableRow>

        <TableRow sx={{ background: rowBg(1), ...hov }}>
          <DTD>6. Total Wt.</DTD>
          <DTD>{cd?.r6?.param || "Parameter"}</DTD>
          <DTD>{cd?.r6?.m1 || "—"}</DTD>
          <DTD>{cd?.r6?.m2 || "—"}</DTD>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
);

const CuringDetailsTable = ({ cd2, motorIds }) => (
  <TableContainer
    sx={{
      borderRadius: "8px",
      border: `1px solid ${BRAND.border}`,
      boxShadow: `0 1px 8px ${alpha(BRAND.cc, 0.06)}`,
      overflowX: "auto",
    }}
  >
    <Table size="small" sx={{ minWidth: 720 }}>
      <TableHead>
        <TableRow>
          <DTH sx={{ minWidth: 260 }}>Activity</DTH>
          <DTH sx={{ minWidth: 180 }}>Parameter</DTH>
          <DTH sx={{ minWidth: 160 }}>
            <MotorIdHeader label="Motor No." id={motorIds?.m1} />
          </DTH>
          <DTH sx={{ minWidth: 160 }}>
            <MotorIdHeader label="Motor No." id={motorIds?.m2} />
          </DTH>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow sx={{ background: rowBg(0), ...hov }}>
          <DTD>1. Achieving Desired Temperature</DTD>
          <DTD>Temp (°C)</DTD>
          <DTD>{cd2?.r1?.m1 || "—"}</DTD>
          <DTD>{cd2?.r1?.m2 || "—"}</DTD>
        </TableRow>

        <TableRow sx={{ background: rowBg(1), ...hov }}>
          <DTD>2. Curing Cycle Follow</DTD>
          <DTD>Temp and Duration</DTD>
          <DTD>{cd2?.r2?.m1 || "—"}</DTD>
          <DTD>{cd2?.r2?.m2 || "—"}</DTD>
        </TableRow>

        <TableRow sx={{ background: rowBg(0), ...hov }}>
          <DTD>3. Soaking</DTD>
          <DTD>Temp and Duration</DTD>
          <DTD>{cd2?.r3?.m1 || "—"}</DTD>
          <DTD>{cd2?.r3?.m2 || "—"}</DTD>
        </TableRow>

        <TableRow sx={{ background: rowBg(1), ...hov }}>
          <DTD>4. Hardness</DTD>
          <DTD>Shore A Hardness</DTD>
          <DTD>{cd2?.r4?.m1 || "—"}</DTD>
          <DTD>{cd2?.r4?.m2 || "—"}</DTD>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
);

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const CastingCuringDetailDialog = ({ open, onClose, item, onApprove, onReject }) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "94vh",
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
            background: `linear-gradient(135deg, ${BRAND.cc}, ${BRAND.ccLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <ThermostatRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                Casting & Curing Record
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.7), fontSize: "0.72rem" }}>
                {item.batchId} · {item.motorId}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" gap={1} alignItems="center">
            <Chip
              label={item.priority}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.62rem",
                fontWeight: 700,
                background: PRIORITY_META[item.priority]?.bg,
                color: PRIORITY_META[item.priority]?.color,
                border: `1px solid ${PRIORITY_META[item.priority]?.border}`,
              }}
            />
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

        {/* Motor IDs strip */}
        <Box
          sx={{
            px: 2.5,
            py: 1,
            background: alpha(BRAND.cc, 0.04),
            borderBottom: `1px solid ${BRAND.border}`,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" gap={4} alignItems="center" flexWrap="wrap">
            <Stack direction="row" gap={0.7} alignItems="center">
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: BRAND.textSub }}>
                Bowl Motor Nos:
              </Typography>
              <Chip label={item.bowl?.motorIds?.m1 || "—"} size="small" color="primary" />
              <Chip label={item.bowl?.motorIds?.m2 || "—"} size="small" color="primary" />
            </Stack>
            <Stack direction="row" gap={0.7} alignItems="center">
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: BRAND.textSub }}>
                Casting / Curing Motor Nos:
              </Typography>
              <Chip label={item.curingDetails?.motorIds?.m1 || "—"} size="small" color="primary" />
              <Chip label={item.curingDetails?.motorIds?.m2 || "—"} size="small" color="primary" />
            </Stack>
          </Stack>
        </Box>

        {/* Content */}
        <DialogContent sx={{ p: 2.8, overflowY: "auto", background: BRAND.surface }}>
          <Stack spacing={4}>
            <Box>
              <SectionDivider icon={ScaleRoundedIcon} label="Bowl Details" />
              <BowlDetailsTable bowl={item.bowl} />
            </Box>

            <Box>
              <SectionDivider icon={TimerRoundedIcon} label="Casting Details" />
              <CastingDetailsTable cd={item.curingDetails} motorIds={item.curingDetails?.motorIds} />
            </Box>

            <Box>
              <SectionDivider icon={ThermostatRoundedIcon} label="Curing Details" />
              <CuringDetailsTable cd2={item.curingDetails2} motorIds={item.curingDetails2?.motorIds} />
            </Box>
          </Stack>
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
              background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accentLight})`,
              "&:hover": { background: BRAND.accent },
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
        department="manufacturing"
        subDepartment="casting-and-curing"
        dialogTitle={`Casting & Curing Report — ${item.batchId}`}
      />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const CastingCuringApproverPage = () => {
  const [items, setItems] = useState(MOCK_CC_SUBMISSIONS);
  const [selected, setSelected] = useState(null);
  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "manufacturing",
    setItems,
    setSelected,
    subDepartment: "casting-and-curing",
  });

  return (
    <ApproverList
      department="manufacturing"
      subDepartment="casting-and-curing"
      items={items}
      statusField="status"
      statusMeta={CC_STATUS_META}
      searchKeys={["batchId", "motorId", "submittedBy"]}
      filterFields={[
        { field: "priority", label: "Priority", options: ["Critical", "High", "Medium", "Low"] },
        { field: "motorType", label: "Type", options: ["A", "B", "C"] },
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
                    <TH>Type</TH>
                    <TH>Bowl Motor Nos</TH>
                    <TH>Submitted By</TH>
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
                        "&:hover": { background: alpha(BRAND.primaryLight, 0.04) },
                        "&:last-child td": { borderBottom: "none" },
                        animation: `${slideUp} 0.3s ease ${idx * 0.04}s both`,
                      }}
                    >
                      <TD>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: BRAND.cc }}>
                          {row.batchId}
                        </Typography>
                      </TD>
                      <TD sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>{row.motorId}</TD>
                      <TD>
                        <Chip
                          label={`Type ${row.motorType}`}
                          size="small"
                          sx={{
                            background: alpha(BRAND.ccLight, 0.1),
                            color: BRAND.ccLight,
                            border: `1px solid ${alpha(BRAND.ccLight, 0.2)}`,
                          }}
                        />
                      </TD>
                      <TD>
                        <Stack direction="row" gap={0.5}>
                          <Chip label={row.bowl?.motorIds?.m1 || "—"} size="small" color="primary" />
                          <Chip label={row.bowl?.motorIds?.m2 || "—"} size="small" color="primary" />
                        </Stack>
                      </TD>
                      <TD sx={{ fontSize: "0.78rem" }}>{row.submittedBy}</TD>
                      <TD sx={{ color: BRAND.textSub, fontSize: "0.76rem" }}>
                        {new Date(row.createdOn).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TD>
                      <TD>
                        <PriorityChip priority={row.priority} />
                      </TD>
                      <TD>
                        <StatusChip status={row.status} />
                      </TD>
                      <TD sx={{ textAlign: "center" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityRoundedIcon sx={{ fontSize: "13px !important" }} />}
                          onClick={() => setSelected(row)}
                          disabled={!isApproverActionableStatus(row.status)}
                          sx={{
                            borderColor: isApproverActionableStatus(row.status) ? BRAND.cc : BRAND.border,
                            color: isApproverActionableStatus(row.status) ? BRAND.cc : alpha(BRAND.textSub, 0.4),
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

          <CastingCuringDetailDialog
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

export default CastingCuringApproverPage;