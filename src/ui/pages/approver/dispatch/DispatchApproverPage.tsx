// src/ui/pages/approver/dispatch/DispatchApproverPage.jsx

import React, { useState } from "react";
import {
  Box, Stack, Typography, Chip, alpha, Card, Button, Dialog,
  DialogContent, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Divider,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { ReportPreviewDialog }  from "../components/ReportPdf";
import ApproverList            from "../components/ApproverList";
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

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_DISPATCH_SUBMISSIONS = [
  {
    id: 1,
    dispatchId:    "DSP-2025-047",
    motorIds:      ["MFG-SRM-2025-210", "MFG-SRM-2025-211"],
    destination:   "ISRO, Sriharikota",
    consignee:     "LPSC Vehicle Integration Division",
    transportMode: "Road — Secured Heavy Vehicle",
    vehicleNo:     "KA-19-B-4421",
    driverName:    "Ramesh Nair",
    crateCount:    2,
    totalWeight:   "1 214.6 kg",
    documents: {
      testCert:        "TC-2025-0210",
      qualClearance:   "QC-CLR-2025-0210",
      transportPermit: "TP-KA-2025-0871",
    },
    remarks:       "Handle with care — live propellant motor",
    submittedBy:   "suresh.babu",
    createdOn:     "2025-03-13T07:30:00",
    status:        "Pending",
    priority:      "Critical",
  },
  {
    id: 2,
    dispatchId:    "DSP-2025-044",
    motorIds:      ["MFG-SRM-2025-205"],
    destination:   "DRDL, Hyderabad",
    consignee:     "Advanced Systems Laboratory",
    transportMode: "Road — Armoured Escort",
    vehicleNo:     "TS-09-F-7734",
    driverName:    "Mohammed Saleem",
    crateCount:    1,
    totalWeight:   "608.3 kg",
    documents: {
      testCert:        "TC-2025-0205",
      qualClearance:   "QC-CLR-2025-0205",
      transportPermit: "TP-TS-2025-0622",
    },
    remarks:       "Cleared all QC stages",
    submittedBy:   "kavitha.raman",
    createdOn:     "2025-03-11T09:00:00",
    status:        "Approved",
    priority:      "High",
  },
  {
    id: 3,
    dispatchId:    "DSP-2025-039",
    motorIds:      ["MFG-SRM-2025-199", "MFG-SRM-2025-200", "MFG-SRM-2025-201"],
    destination:   "BDL, Vishakhapatnam",
    consignee:     "Naval Systems Division",
    transportMode: "Road — Secured Heavy Vehicle",
    vehicleNo:     "AP-31-C-2290",
    driverName:    "Venkat Rao",
    crateCount:    3,
    totalWeight:   "1 826.0 kg",
    documents: {
      testCert:        "TC-2025-0199",
      qualClearance:   "QC-CLR-2025-0199",
      transportPermit: "TP-AP-2025-0541",
    },
    remarks:       "Re-check NDT reports before dispatch",
    submittedBy:   "harish.babu",
    createdOn:     "2025-03-08T13:00:00",
    status:        "Rejected",
    priority:      "Medium",
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

// ─── Detail dialog ────────────────────────────────────────────────────────────
const DispatchDetailDialog = ({ open, onClose, item, onApprove, onReject }) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

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
                {item.dispatchId} · {item.motorIds?.length} motor{item.motorIds?.length !== 1 ? "s" : ""} · {item.destination}
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
              { label: "Dispatch ID",  value: item.dispatchId  },
              { label: "Submitted By", value: item.submittedBy },
              { label: "Date",         value: new Date(item.createdOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
              { label: "Crates",       value: `${item.crateCount} crate${item.crateCount !== 1 ? "s" : ""}` },
              { label: "Total Weight", value: item.totalWeight  },
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

          {/* Motor ID chips */}
          <Stack direction="row" gap={0.75} flexWrap="wrap" mt={1}>
            {item.motorIds?.map((mid) => (
              <Chip
                key={mid} label={mid} size="small"
                sx={{
                  height: 20, fontSize: "0.65rem", fontWeight: 700,
                  background: alpha(BRAND.qc, 0.08), color: BRAND.qc,
                  border: `1px solid ${alpha(BRAND.qc, 0.2)}`,
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Content */}
        <DialogContent sx={{ p: 2.8, overflowY: "auto", background: BRAND.surface }}>
          <SectionDivider icon={LocalShippingRoundedIcon} label="Dispatch Details" />
          <DispatchDetailTable item={item} />

          <SectionDivider icon={DescriptionRoundedIcon} label="Accompanying Documents" />
          <DocumentsTable docs={item.documents} />
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
        dialogTitle={`Dispatch Report — ${item.dispatchId}`}
      />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const DispatchApproverPage = () => {
  const [items,    setItems]    = useState(MOCK_DISPATCH_SUBMISSIONS);
  const [selected, setSelected] = useState(null);
  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "dispatch",
    setItems,
    setSelected,
    subDepartment: "dispatch",
  });

  return (
    <ApproverList
      department="dispatch"
      subDepartment="dispatch"
      items={items}
      statusField="status"
      statusMeta={DISPATCH_STATUS_META}
      searchKeys={["dispatchId", "destination", "consignee", "submittedBy", "vehicleNo"]}
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
              boxShadow: `0 2px 12px ${alpha(BRAND.qc, 0.07)}`,
              overflow: "hidden",
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TH>Dispatch ID</TH>
                    <TH>Motors</TH>
                    <TH>Destination</TH>
                    <TH>Submitted By</TH>
                    <TH>Crates</TH>
                    <TH>Total Weight</TH>
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
                        background: idx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.6),
                        "&:hover": { background: alpha(BRAND.qc, 0.03) },
                        "&:last-child td": { borderBottom: "none" },
                        animation: `${slideUp} 0.3s ease ${idx * 0.04}s both`,
                      }}
                    >
                      {/* Dispatch ID */}
                      <TD>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: BRAND.qc }}>
                          {row.dispatchId}
                        </Typography>
                      </TD>

                      {/* Motor IDs — chips */}
                      <TD>
                        <Stack direction="row" gap={0.5} flexWrap="wrap" maxWidth={220}>
                          {row.motorIds?.slice(0, 2).map((mid) => (
                            <Chip
                              key={mid} label={mid} size="small"
                              sx={{
                                height: 18, fontSize: "0.6rem", fontWeight: 700,
                                background: alpha(BRAND.qc, 0.08), color: BRAND.qc,
                                border: `1px solid ${alpha(BRAND.qc, 0.18)}`,
                              }}
                            />
                          ))}
                          {(row.motorIds?.length ?? 0) > 2 && (
                            <Chip
                              label={`+${row.motorIds.length - 2}`} size="small"
                              sx={{
                                height: 18, fontSize: "0.6rem", fontWeight: 700,
                                background: alpha(BRAND.qc, 0.05), color: BRAND.textSub,
                                border: `1px solid ${alpha(BRAND.border, 0.8)}`,
                              }}
                            />
                          )}
                        </Stack>
                      </TD>

                      {/* Destination */}
                      <TD>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: BRAND.text }}>
                          {row.destination}
                        </Typography>
                        <Typography sx={{ fontSize: "0.68rem", color: BRAND.textSub, mt: 0.2 }}>
                          {row.consignee}
                        </Typography>
                      </TD>

                      <TD sx={{ fontSize: "0.78rem" }}>{row.submittedBy}</TD>

                      {/* Crate count badge */}
                      <TD>
                        <Chip
                          label={`${row.crateCount} crate${row.crateCount !== 1 ? "s" : ""}`}
                          size="small"
                          sx={{
                            height: 20, fontSize: "0.62rem", fontWeight: 700,
                            background: alpha(BRAND.qc, 0.08), color: BRAND.qc,
                            border: `1px solid ${alpha(BRAND.qc, 0.2)}`,
                          }}
                        />
                      </TD>

                      <TD sx={{ fontSize: "0.76rem", color: BRAND.textSub, whiteSpace: "nowrap" }}>
                        {row.totalWeight}
                      </TD>

                      <TD sx={{ color: BRAND.textSub, fontSize: "0.76rem", whiteSpace: "nowrap" }}>
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
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <DispatchDetailDialog
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

export default DispatchApproverPage;