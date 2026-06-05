// src/ui/pages/approver/manufacturing/Mixing/MixingApproverPage.jsx

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
  blender: BlenderRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.manufacturing.mixing;

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
  mx: "#1565C0",
  mxLight: "#1976D2",
  ok: "#1B5E20",
  okBg: "rgba(27,94,32,0.08)",
  okBorder: "rgba(27,94,32,0.25)",
  notOk: "#B71C1C",
  notOkBg: "rgba(183,28,28,0.08)",
  notOkBorder: "rgba(183,28,28,0.25)",
};

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

// ─── Styled components ────────────────────────────────────────────────────────
const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.mx}, ${BRAND.mxLight})`,
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
  background: `linear-gradient(135deg, ${BRAND.mx}, ${BRAND.mxLight})`,
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
const hov = { "&:hover": { background: alpha(BRAND.mx, 0.025) } };

// ─── Reusable components ──────────────────────────────────────────────────────
const StatusChip = ({ status }) => (
  <Chip
    label={status}
    size="small"
    sx={{
      height: 20,
      fontSize: "0.62rem",
      fontWeight: 700,
      background: MIX_STATUS_META[status]?.bg,
      color: MIX_STATUS_META[status]?.color,
      border: `1px solid ${MIX_STATUS_META[status]?.border}`,
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
        background: `linear-gradient(135deg, ${BRAND.mx}, ${BRAND.mxLight})`,
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
        color: BRAND.mx,
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </Typography>
    <Box sx={{ flex: 1, height: "1px", background: alpha(BRAND.mx, 0.18) }} />
  </Stack>
);

// ─── Detail Tables ────────────────────────────────────────────────────────────
const PreMixingTable = ({ pre }) => (
  <TableContainer
    sx={{
      borderRadius: "8px",
      border: `1px solid ${BRAND.border}`,
      boxShadow: `0 1px 8px ${alpha(BRAND.mx, 0.06)}`,
      overflowX: "auto",
    }}
  >
    <Table size="small" sx={{ minWidth: 720 }}>
      <TableHead>
        <TableRow>
          <DTH sx={{ minWidth: 280 }}>Operation</DTH>
          <DTH sx={{ minWidth: 110 }}>RPM</DTH>
          <DTH sx={{ minWidth: 100 }}>Time (min)</DTH>
          <DTH sx={{ minWidth: 100 }}>Temp (°C)</DTH>
          <DTH sx={{ minWidth: 110 }}>Vacuum (torr)</DTH>
        </TableRow>
      </TableHead>
      <TableBody>
        {pre?.fixed?.map((row, i) => (
          <TableRow key={i} sx={{ background: rowBg(i), ...hov }}>
            <DTD>{`${i + 1}. ${row.op}`}</DTD>
            <DTD>{row.rpm || "—"}</DTD>
            <DTD>{row.time || "—"}</DTD>
            <DTD>{row.temp || "—"}</DTD>
            <DTD>{row.vacuum || "—"}</DTD>
          </TableRow>
        ))}
        {pre?.dynamic?.map((row, i) => (
          <TableRow key={row.id} sx={{ background: rowBg((pre.fixed?.length || 0) + i), ...hov }}>
            <DTD>Additional: {row.op}</DTD>
            <DTD>{row.rpm || "—"}</DTD>
            <DTD>{row.time || "—"}</DTD>
            <DTD>{row.temp || "—"}</DTD>
            <DTD>{row.vacuum || "—"}</DTD>
          </TableRow>
        ))}
        <TableRow sx={{ background: rowBg((pre?.fixed?.length || 0) + (pre?.dynamic?.length || 0)), ...hov }}>
          <DTD>Sampling for Homogeneity & Moisture analysis</DTD>
          <DTD colSpan={4}>—</DTD>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
);

const FinalMixingTable = ({ final }) => (
  <TableContainer
    sx={{
      borderRadius: "8px",
      border: `1px solid ${BRAND.border}`,
      boxShadow: `0 1px 8px ${alpha(BRAND.mx, 0.06)}`,
      overflowX: "auto",
    }}
  >
    <Table size="small" sx={{ minWidth: 720 }}>
      <TableHead>
        <TableRow>
          <DTH sx={{ minWidth: 280 }}>Operation</DTH>
          <DTH sx={{ minWidth: 110 }}>RPM</DTH>
          <DTH sx={{ minWidth: 100 }}>Time (min)</DTH>
          <DTH sx={{ minWidth: 100 }}>Temp (°C)</DTH>
          <DTH sx={{ minWidth: 110 }}>Vacuum (torr)</DTH>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow sx={{ background: rowBg(0), ...hov }}>
          <DTD>1. Addition of TDI and Mixing</DTD>
          <DTD>{final?.tdi?.rpm || "—"}</DTD>
          <DTD>{final?.tdi?.time || "—"}</DTD>
          <DTD>{final?.tdi?.temp || "—"}</DTD>
          <DTD>{final?.tdi?.vacuum || "—"}</DTD>
        </TableRow>
        <TableRow sx={{ background: rowBg(1), ...hov }}>
          <DTD>2. Sample for Viscosity</DTD>
          <DTD colSpan={4}>Taken</DTD>
        </TableRow>
      </TableBody>
    </Table>
  </TableContainer>
);

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const MixingDetailDialog = ({ open, onClose, item, onApprove, onReject }) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

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
            background: `linear-gradient(135deg, ${BRAND.mx}, ${BRAND.mxLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Stack direction="row" alignItems="center" gap={1.5}>
            <BlenderRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                Mixing Operation Record
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

        {/* Content */}
        <DialogContent sx={{ p: 2.8, overflowY: "auto", background: BRAND.surface }}>
          <Stack spacing={4}>
            <Box>
              <SectionDivider icon={BlenderRoundedIcon} label="Pre-Mixing" />
              <PreMixingTable pre={item.pre} />
            </Box>

            <Box>
              <SectionDivider icon={BlenderRoundedIcon} label="Final Mixing" />
              <FinalMixingTable final={item.final} />
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
        subDepartment="mixing"
        dialogTitle={`Mixing Report — ${item.batchId}`}
      />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const MixingApproverPage = () => {
  const [items, setItems] = useState(MOCK_MIX_SUBMISSIONS);
  const [selected, setSelected] = useState(null);
  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "manufacturing",
    setItems,
    setSelected,
    subDepartment: "mixing",
  });

  return (
    <ApproverList
      department="manufacturing"
      subDepartment="mixing"
      items={items}
      statusField="status"
      statusMeta={MIX_STATUS_META}
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
                        <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: BRAND.mx }}>
                          {row.batchId}
                        </Typography>
                      </TD>
                      <TD sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>{row.motorId}</TD>
                      <TD>
                        <Chip
                          label={`Type ${row.motorType}`}
                          size="small"
                          sx={{
                            background: alpha(BRAND.mxLight, 0.1),
                            color: BRAND.mxLight,
                            border: `1px solid ${alpha(BRAND.mxLight, 0.2)}`,
                          }}
                        />
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
                            borderColor: isApproverActionableStatus(row.status) ? BRAND.mx : BRAND.border,
                            color: isApproverActionableStatus(row.status) ? BRAND.mx : alpha(BRAND.textSub, 0.4),
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

          <MixingDetailDialog
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

export default MixingApproverPage;