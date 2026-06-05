// src/ui/pages/approver/manufacturing/CasePreparation/CasePreparationApproverPage.jsx
//
// Approver page for Case Preparation.
// Detail dialog mirrors CasePreparationForm exactly:
//
// Table 1 — General Activities
//   Row 1  : Inspect Insulator Surface          → OK/Not OK  (r1.m1, r1.m2)
//   Row 2  : Abrading                           → OK/Not OK  (r2)
//   Row 3  : Inspect Surface for Proper Abrading→ OK/Not OK  (r3)
//   Row 4  : Bellow and Spacers (rowSpan=3, no radio at parent level)
//     4a   : Date of Bellow & Spacers prep      → text       (r4a)
//     4b   : Dimension of Bellow                → text       (r4b)
//     4c   : Bellow Bonding date                → text       (r4c)
//   Row 5  : Surface Cleaning (Mopping)         → OK/Not OK  (r5)
//   Row 6  : Preheating                         → text       (r6.m1 / r6.m2)
//
// Table 2 — Linear Coating Operation
//   Row 1  : Inspection                         → OK/Not OK  (r1)
//   Row 2  : Insulation Temperature             → text       (r2)
//   Row 3  : Linear Premix Qualification (rowSpan=3)
//     3a   : Premix Batch No.                   → text       (r3a)
//     3b   : Measured Moisture                  → text       (r3b)
//     3c   : Qualified Peel Strength            → text       (r3c)
//   Row 4  : Linear Coating Operation (rowSpan=2)
//     4a   : Duration                           → text       (r4a)
//     4b   : Quantity                           → text       (r4b)
//   Row 5  : Visual Inspection                  → OK/Not OK  (r5)

import React, { useState } from "react";
import {
  Box, Stack, Typography, Chip, alpha, Card, Button,
  Dialog, DialogContent, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
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
  cleaningServices: CleaningServicesRoundedIcon,
  formatPaint: FormatPaintRoundedIcon,
  pdf: PictureAsPdfRoundedIcon,
} = icons.approver.manufacturing.casePreparation;

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
  cp:           "#1565C0",
  cpLight:      "#1976D2",
  ok:           "#1B5E20",
  okBg:         "rgba(27,94,32,0.08)",
  okBorder:     "rgba(27,94,32,0.25)",
  notOk:        "#B71C1C",
  notOkBg:      "rgba(183,28,28,0.08)",
  notOkBorder:  "rgba(183,28,28,0.25)",
};

const slideUp = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

// ─── Status / Priority meta ───────────────────────────────────────────────────
export const CP_STATUS_META = APPROVER_STATUS_META;

const PRIORITY_META = APPROVER_PRIORITY_META;

// ─── Mock data — exactly matches createCasePreparationData() ─────────────────
const MOCK_CP_SUBMISSIONS = [
  {
    id: 1,
    batchId:     "CP-2024-001",
    motorId:     "MFG-ACEM-2024-011",
    motorType:   "A",
    status:      "Pending",
    priority:    "High",
    submittedBy: "ravi.shankar",
    createdOn:   "2024-01-18T09:00:00",

    motorCaseIds: { m1: "MC-001", m2: "MC-002" },
    motorNos:     { m1: "MN-001", m2: "MN-002" },

    ga: {
      r1:  { m1: "ok",    m2: "ok"    },
      r2:  { m1: "ok",    m2: "ok"    },
      r3:  { m1: "ok",    m2: "notok" },
      r4:  { m1: "",      m2: ""      },   // in data model but not rendered as a row
      r4a: { m1: "15/01/2024",  m2: "15/01/2024"  },
      r4b: { m1: "120×80 mm",   m2: "120×80 mm"   },
      r4c: { m1: "16/01/2024",  m2: "16/01/2024"  },
      r5:  { m1: "ok",    m2: "ok"    },
      r6:  { m1: "60°C / 30 min", m2: "60°C / 30 min" },
      r6b: { m1: "",      m2: ""      },   // in data model but not rendered
    },

    lco: {
      r1:  { m1: "ok",          m2: "ok"          },
      r2:  { m1: "28°C",        m2: "29°C"        },
      r3a: { m1: "BATCH-LP-01", m2: "BATCH-LP-01" },
      r3b: { m1: "0.07%",       m2: "0.08%"       },
      r3c: { m1: "4.8 N/mm",    m2: "4.6 N/mm"    },
      r3:  { m1: "",            m2: ""            },   // in data model but not rendered
      r4a: { m1: "45 min",      m2: "47 min"      },
      r4b: { m1: "240 g",       m2: "245 g"       },
      r5:  { m1: "ok",          m2: "ok"          },
    },
  },
  {
    id: 2,
    batchId:     "CP-2024-003",
    motorId:     "MFG-ACEM-2024-013",
    motorType:   "B",
    status:      "Pending",
    priority:    "Critical",
    submittedBy: "meena.iyer",
    createdOn:   "2024-02-10T08:00:00",

    motorCaseIds: { m1: "MC-005", m2: "MC-006" },
    motorNos:     { m1: "MN-005", m2: "MN-006" },

    ga: {
      r1:  { m1: "ok",    m2: "ok"    },
      r2:  { m1: "ok",    m2: "ok"    },
      r3:  { m1: "ok",    m2: "ok"    },
      r4:  { m1: "",      m2: ""      },
      r4a: { m1: "08/02/2024",  m2: "08/02/2024"  },
      r4b: { m1: "115×75 mm",   m2: "115×75 mm"   },
      r4c: { m1: "09/02/2024",  m2: "09/02/2024"  },
      r5:  { m1: "ok",    m2: "ok"    },
      r6:  { m1: "55°C / 25 min", m2: "55°C / 25 min" },
      r6b: { m1: "",      m2: ""      },
    },

    lco: {
      r1:  { m1: "ok",          m2: "ok"          },
      r2:  { m1: "27°C",        m2: "27°C"        },
      r3a: { m1: "BATCH-LP-03", m2: "BATCH-LP-03" },
      r3b: { m1: "0.06%",       m2: "0.06%"       },
      r3c: { m1: "5.0 N/mm",    m2: "4.9 N/mm"    },
      r3:  { m1: "",            m2: ""            },
      r4a: { m1: "50 min",      m2: "50 min"      },
      r4b: { m1: "260 g",       m2: "255 g"       },
      r5:  { m1: "ok",          m2: "ok"          },
    },
  },
  {
    id: 3,
    batchId:     "CP-2024-007",
    motorId:     "MFG-ACEM-2024-017",
    motorType:   "C",
    status:      "Approved",
    priority:    "Medium",
    submittedBy: "suresh.nair",
    createdOn:   "2024-03-20T10:30:00",

    motorCaseIds: { m1: "MC-010", m2: "MC-011" },
    motorNos:     { m1: "MN-010", m2: "MN-011" },

    ga: {
      r1:  { m1: "ok", m2: "ok" },
      r2:  { m1: "ok", m2: "ok" },
      r3:  { m1: "ok", m2: "ok" },
      r4:  { m1: "",   m2: ""   },
      r4a: { m1: "18/03/2024",  m2: "18/03/2024"  },
      r4b: { m1: "118×78 mm",   m2: "118×78 mm"   },
      r4c: { m1: "19/03/2024",  m2: "19/03/2024"  },
      r5:  { m1: "ok", m2: "ok" },
      r6:  { m1: "60°C / 30 min", m2: "60°C / 30 min" },
      r6b: { m1: "",   m2: ""   },
    },

    lco: {
      r1:  { m1: "ok",          m2: "ok"          },
      r2:  { m1: "28°C",        m2: "28°C"        },
      r3a: { m1: "BATCH-LP-07", m2: "BATCH-LP-07" },
      r3b: { m1: "0.07%",       m2: "0.07%"       },
      r3c: { m1: "4.7 N/mm",    m2: "4.8 N/mm"    },
      r3:  { m1: "",            m2: ""            },
      r4a: { m1: "45 min",      m2: "46 min"      },
      r4b: { m1: "248 g",       m2: "250 g"       },
      r5:  { m1: "ok",          m2: "ok"          },
    },
  },
  {
    id: 4,
    batchId:     "CP-2024-010",
    motorId:     "MFG-ACEM-2024-020",
    motorType:   "A",
    status:      "Rejected",
    priority:    "Low",
    submittedBy: "kiran.rao",
    createdOn:   "2024-04-05T11:00:00",

    motorCaseIds: { m1: "MC-014", m2: "MC-015" },
    motorNos:     { m1: "MN-014", m2: "MN-015" },

    ga: {
      r1:  { m1: "ok",    m2: "notok" },
      r2:  { m1: "notok", m2: "notok" },
      r3:  { m1: "notok", m2: "notok" },
      r4:  { m1: "",      m2: ""      },
      r4a: { m1: "02/04/2024",  m2: "02/04/2024"  },
      r4b: { m1: "122×82 mm",   m2: "122×82 mm"   },
      r4c: { m1: "03/04/2024",  m2: "03/04/2024"  },
      r5:  { m1: "ok",    m2: "ok"    },
      r6:  { m1: "58°C / 28 min", m2: "58°C / 28 min" },
      r6b: { m1: "",      m2: ""      },
    },

    lco: {
      r1:  { m1: "notok",       m2: "notok"       },
      r2:  { m1: "30°C",        m2: "31°C"        },
      r3a: { m1: "BATCH-LP-10", m2: "BATCH-LP-10" },
      r3b: { m1: "0.12%",       m2: "0.13%"       },
      r3c: { m1: "3.8 N/mm",    m2: "3.7 N/mm"    },
      r3:  { m1: "",            m2: ""            },
      r4a: { m1: "60 min",      m2: "62 min"      },
      r4b: { m1: "270 g",       m2: "275 g"       },
      r5:  { m1: "notok",       m2: "notok"       },
    },
  },
];

// ─── Shared styled atoms ──────────────────────────────────────────────────────
// List table header cell
const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
  color: "#fff", fontWeight: 700, fontSize: "0.68rem",
  letterSpacing: "0.07em", textTransform: "uppercase",
  padding: "10px 14px", whiteSpace: "nowrap", borderBottom: "none",
  "&:first-of-type": { borderRadius: "6px 0 0 0" },
  "&:last-of-type":  { borderRadius: "0 6px 0 0" },
});

// List table body cell
const TD = styled(TableCell)({
  padding: "10px 14px", fontSize: "0.82rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.55)}`,
  color: BRAND.text, verticalAlign: "middle",
});

// Dialog table header cell — cp gradient
const DTH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.cp}, ${BRAND.cpLight})`,
  color: "#fff", fontWeight: 700, fontSize: "0.65rem",
  letterSpacing: "0.07em", textTransform: "uppercase",
  padding: "10px 14px", whiteSpace: "nowrap", borderBottom: "none",
  verticalAlign: "middle",
});

// Dialog table body cell
const DTD = styled(TableCell)({
  padding: "10px 14px", fontSize: "0.78rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
  color: BRAND.text, verticalAlign: "middle",
});

// ─── Row helpers ──────────────────────────────────────────────────────────────
const rowBg = (i) => i % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.6);
const hov   = { "&:hover": { background: alpha(BRAND.cp, 0.025) } };
const lastTd = { "&:last-child td": { borderBottom: "none" } };

// ─── OK / Not OK read-only chip ───────────────────────────────────────────────
const OkChip = ({ value }) => {
  if (!value) return <Typography sx={{ fontSize: "0.72rem", color: alpha(BRAND.textSub, 0.45) }}>—</Typography>;
  const isOk = value === "ok";
  return (
    <Chip label={isOk ? "OK" : "Not OK"} size="small" sx={{
      height: 22, fontSize: "0.66rem", fontWeight: 800,
      background: isOk ? BRAND.okBg    : BRAND.notOkBg,
      color:      isOk ? BRAND.ok       : BRAND.notOk,
      border: `1.5px solid ${isOk ? BRAND.okBorder : BRAND.notOkBorder}`,
    }} />
  );
};

// ─── Text value display ───────────────────────────────────────────────────────
const Val = ({ children, accent = false }) => (
  <Typography sx={{ fontSize: "0.78rem", fontWeight: accent ? 700 : 500, color: accent ? BRAND.accent : BRAND.text }}>
    {children || "—"}
  </Typography>
);

// ─── Step badge ───────────────────────────────────────────────────────────────
const StepBadge = ({ n }) => (
  <Box sx={{
    width: 22, height: 22, borderRadius: "6px", flexShrink: 0, mt: 0.15,
    background: `linear-gradient(135deg, ${BRAND.cp}, ${BRAND.cpLight})`,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: `0 1px 4px ${alpha(BRAND.cp, 0.3)}`,
  }}>
    <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800, lineHeight: 1 }}>{n}</Typography>
  </Box>
);

// ─── Sub-label badge (a / b / c) ─────────────────────────────────────────────
const SubBadge = ({ label }) => (
  <Box sx={{
    width: 17, height: 17, borderRadius: "4px", flexShrink: 0,
    background: alpha(BRAND.cp, 0.12),
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <Typography sx={{ color: BRAND.cp, fontSize: "0.55rem", fontWeight: 800, lineHeight: 1 }}>{label}</Typography>
  </Box>
);

// ─── Motor ID chip in dialog table header ─────────────────────────────────────
const MotorIdHeader = ({ label, id }) => (
  <Stack gap={0.4}>
    <Typography sx={{ fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {label}
    </Typography>
    <Chip label={id || "—"} size="small" sx={{
      height: 22, fontSize: "0.7rem", fontWeight: 800,
      background: "rgba(255,255,255,0.18)", color: "#fff",
      border: "1px solid rgba(255,255,255,0.35)",
    }} />
  </Stack>
);

// ─── Section divider ──────────────────────────────────────────────────────────
const SectionDivider = ({ icon: Icon, label }) => (
  <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
    <Box sx={{
      width: 26, height: 26, borderRadius: "8px", flexShrink: 0,
      background: `linear-gradient(135deg, ${BRAND.cp}, ${BRAND.cpLight})`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon sx={{ color: "#fff", fontSize: 14 }} />
    </Box>
    <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: BRAND.cp, letterSpacing: "0.04em" }}>
      {label}
    </Typography>
    <Box sx={{ flex: 1, height: "1px", background: alpha(BRAND.cp, 0.18) }} />
  </Stack>
);

// ─── Table 1: General Activities ─────────────────────────────────────────────
const GeneralActivitiesTable = ({ motorCaseIds, ga }) => {
  const m1id = motorCaseIds?.m1 || "Motor 1";
  const m2id = motorCaseIds?.m2 || "Motor 2";

  const actSx  = { fontWeight: 700, fontSize: "0.78rem", color: BRAND.text,    lineHeight: 1.4 };
  const prmSx  = { fontWeight: 500, fontSize: "0.73rem", color: BRAND.textSub, lineHeight: 1.4, fontStyle: "italic" };

  return (
    <TableContainer sx={{ borderRadius: "8px", border: `1px solid ${BRAND.border}`, boxShadow: `0 1px 8px ${alpha(BRAND.cp, 0.06)}`, overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 700 }}>
        <TableHead>
          <TableRow>
            <DTH sx={{ minWidth: 240 }}>Activity</DTH>
            <DTH sx={{ minWidth: 210 }}>Parameter</DTH>
            <DTH sx={{ minWidth: 160 }}><MotorIdHeader label="Motor Case ID" id={m1id} /></DTH>
            <DTH sx={{ minWidth: 160 }}><MotorIdHeader label="Motor Case ID" id={m2id} /></DTH>
          </TableRow>
        </TableHead>
        <TableBody>

          {/* Row 1 — Inspect Insulator Surface */}
          <TableRow sx={{ background: rowBg(0), ...hov }}>
            <DTD>
              <Stack direction="row" alignItems="flex-start" gap={1.2}>
                <StepBadge n={1} />
                <Typography sx={actSx}>Inspect the Insulator Surface and Loose Flaps</Typography>
              </Stack>
            </DTD>
            <DTD><Typography sx={prmSx}>Free from oily patches, scratches, cut marks</Typography></DTD>
            <DTD><OkChip value={ga?.r1?.m1} /></DTD>
            <DTD><OkChip value={ga?.r1?.m2} /></DTD>
          </TableRow>

          {/* Row 2 — Abrading */}
          <TableRow sx={{ background: rowBg(1), ...hov }}>
            <DTD>
              <Stack direction="row" alignItems="flex-start" gap={1.2}>
                <StepBadge n={2} />
                <Typography sx={actSx}>Abrading</Typography>
              </Stack>
            </DTD>
            <DTD><Typography sx={prmSx}>Abraded dust quantity (g)</Typography></DTD>
            <DTD><OkChip value={ga?.r2?.m1} /></DTD>
            <DTD><OkChip value={ga?.r2?.m2} /></DTD>
          </TableRow>

          {/* Row 3 — Inspect Surface for Proper Abrading */}
          <TableRow sx={{ background: rowBg(0), ...hov }}>
            <DTD>
              <Stack direction="row" alignItems="flex-start" gap={1.2}>
                <StepBadge n={3} />
                <Typography sx={actSx}>Inspect the Surface for Proper Abrading</Typography>
              </Stack>
            </DTD>
            <DTD><Typography sx={prmSx}>Uniform abrading, metal surface not exposed</Typography></DTD>
            <DTD><OkChip value={ga?.r3?.m1} /></DTD>
            <DTD><OkChip value={ga?.r3?.m2} /></DTD>
          </TableRow>

          {/* Row 4 — Bellow and Spacers: Activity cell rowSpan=3 */}
          {/* 4a */}
          <TableRow sx={{ background: rowBg(1), ...hov }}>
            <DTD rowSpan={3} sx={{ verticalAlign: "top", pt: "13px", borderRight: `1px solid ${alpha(BRAND.border, 0.5)}` }}>
              <Stack direction="row" alignItems="flex-start" gap={1.2}>
                <StepBadge n={4} />
                <Typography sx={actSx}>Bellow and Spacers Preparation and Bonding</Typography>
              </Stack>
            </DTD>
            <DTD>
              <Stack direction="row" alignItems="center" gap={0.8}>
                <SubBadge label="a" />
                <Typography sx={prmSx}>Date of Bellow &amp; Spacers preparation</Typography>
              </Stack>
            </DTD>
            <DTD><Val accent>{ga?.r4a?.m1}</Val></DTD>
            <DTD><Val accent>{ga?.r4a?.m2}</Val></DTD>
          </TableRow>
          {/* 4b */}
          <TableRow sx={{ background: rowBg(0), ...hov }}>
            <DTD>
              <Stack direction="row" alignItems="center" gap={0.8}>
                <SubBadge label="b" />
                <Typography sx={prmSx}>Dimension of Bellow</Typography>
              </Stack>
            </DTD>
            <DTD><Val accent>{ga?.r4b?.m1}</Val></DTD>
            <DTD><Val accent>{ga?.r4b?.m2}</Val></DTD>
          </TableRow>
          {/* 4c */}
          <TableRow sx={{ background: rowBg(1), ...hov }}>
            <DTD>
              <Stack direction="row" alignItems="center" gap={0.8}>
                <SubBadge label="c" />
                <Typography sx={prmSx}>Bellow Bonding date</Typography>
              </Stack>
            </DTD>
            <DTD><Val accent>{ga?.r4c?.m1}</Val></DTD>
            <DTD><Val accent>{ga?.r4c?.m2}</Val></DTD>
          </TableRow>

          {/* Row 5 — Surface Cleaning */}
          <TableRow sx={{ background: rowBg(0), ...hov }}>
            <DTD>
              <Stack direction="row" alignItems="flex-start" gap={1.2}>
                <StepBadge n={5} />
                <Typography sx={actSx}>Surface Cleaning (Mopping)</Typography>
              </Stack>
            </DTD>
            <DTD><Typography sx={prmSx}>Free from dust / foreign materials, excess solvent</Typography></DTD>
            <DTD><OkChip value={ga?.r5?.m1} /></DTD>
            <DTD><OkChip value={ga?.r5?.m2} /></DTD>
          </TableRow>

          {/* Row 6 — Preheating */}
          <TableRow sx={{ background: rowBg(1), ...hov, ...lastTd }}>
            <DTD>
              <Stack direction="row" alignItems="flex-start" gap={1.2}>
                <StepBadge n={6} />
                <Typography sx={actSx}>Preheating</Typography>
              </Stack>
            </DTD>
            <DTD><Typography sx={prmSx}>Temp and Duration</Typography></DTD>
            <DTD><Val accent>{ga?.r6?.m1}</Val></DTD>
            <DTD><Val accent>{ga?.r6?.m2}</Val></DTD>
          </TableRow>

        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ─── Table 2: Linear Coating Operation ───────────────────────────────────────
const LinearCoatingTable = ({ motorNos, lco }) => {
  const m1id = motorNos?.m1 || "Motor 1";
  const m2id = motorNos?.m2 || "Motor 2";

  const actSx = { fontWeight: 700, fontSize: "0.78rem", color: BRAND.text,    lineHeight: 1.4 };
  const prmSx = { fontWeight: 500, fontSize: "0.73rem", color: BRAND.textSub, lineHeight: 1.4, fontStyle: "italic" };

  return (
    <TableContainer sx={{ borderRadius: "8px", border: `1px solid ${BRAND.border}`, boxShadow: `0 1px 8px ${alpha(BRAND.cp, 0.06)}`, overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 700 }}>
        <TableHead>
          <TableRow>
            <DTH sx={{ minWidth: 240 }}>Linear Coating Operation</DTH>
            <DTH sx={{ minWidth: 200 }}>Parameter</DTH>
            <DTH sx={{ minWidth: 160 }}><MotorIdHeader label="Motor No." id={m1id} /></DTH>
            <DTH sx={{ minWidth: 160 }}><MotorIdHeader label="Motor No." id={m2id} /></DTH>
          </TableRow>
        </TableHead>
        <TableBody>

          {/* LCO Row 1 — Inspection */}
          <TableRow sx={{ background: rowBg(0), ...hov }}>
            <DTD>
              <Stack direction="row" alignItems="flex-start" gap={1.2}>
                <StepBadge n={1} />
                <Typography sx={actSx}>Inspection</Typography>
              </Stack>
            </DTD>
            <DTD><Typography sx={prmSx}>Surface clean, free from foreign materials</Typography></DTD>
            <DTD><OkChip value={lco?.r1?.m1} /></DTD>
            <DTD><OkChip value={lco?.r1?.m2} /></DTD>
          </TableRow>

          {/* LCO Row 2 — Insulation Temperature */}
          <TableRow sx={{ background: rowBg(1), ...hov }}>
            <DTD>
              <Stack direction="row" alignItems="flex-start" gap={1.2}>
                <StepBadge n={2} />
                <Typography sx={actSx}>Insulation Temperature</Typography>
              </Stack>
            </DTD>
            <DTD><Typography sx={prmSx}>Measured Temp</Typography></DTD>
            <DTD><Val accent>{lco?.r2?.m1}</Val></DTD>
            <DTD><Val accent>{lco?.r2?.m2}</Val></DTD>
          </TableRow>

          {/* LCO Row 3 — Linear Premix Qualification: rowSpan=3 */}
          {/* 3a */}
          <TableRow sx={{ background: rowBg(0), ...hov }}>
            <DTD rowSpan={3} sx={{ verticalAlign: "top", pt: "13px", borderRight: `1px solid ${alpha(BRAND.border, 0.5)}` }}>
              <Stack direction="row" alignItems="flex-start" gap={1.2}>
                <StepBadge n={3} />
                <Typography sx={actSx}>Linear Premix Qualification</Typography>
              </Stack>
            </DTD>
            <DTD>
              <Stack direction="row" alignItems="center" gap={0.8}>
                <SubBadge label="a" />
                <Typography sx={prmSx}>Linear Premix Batch No.</Typography>
              </Stack>
            </DTD>
            <DTD><Val accent>{lco?.r3a?.m1}</Val></DTD>
            <DTD><Val accent>{lco?.r3a?.m2}</Val></DTD>
          </TableRow>
          {/* 3b */}
          <TableRow sx={{ background: rowBg(1), ...hov }}>
            <DTD>
              <Stack direction="row" alignItems="center" gap={0.8}>
                <SubBadge label="b" />
                <Typography sx={prmSx}>Measured Moisture</Typography>
              </Stack>
            </DTD>
            <DTD><Val accent>{lco?.r3b?.m1}</Val></DTD>
            <DTD><Val accent>{lco?.r3b?.m2}</Val></DTD>
          </TableRow>
          {/* 3c */}
          <TableRow sx={{ background: rowBg(0), ...hov }}>
            <DTD>
              <Stack direction="row" alignItems="center" gap={0.8}>
                <SubBadge label="c" />
                <Typography sx={prmSx}>Qualified Peel Strength</Typography>
              </Stack>
            </DTD>
            <DTD><Val accent>{lco?.r3c?.m1}</Val></DTD>
            <DTD><Val accent>{lco?.r3c?.m2}</Val></DTD>
          </TableRow>

          {/* LCO Row 4 — Linear Coating Operation: rowSpan=2 */}
          {/* 4a */}
          <TableRow sx={{ background: rowBg(1), ...hov }}>
            <DTD rowSpan={2} sx={{ verticalAlign: "top", pt: "13px", borderRight: `1px solid ${alpha(BRAND.border, 0.5)}` }}>
              <Stack direction="row" alignItems="flex-start" gap={1.2}>
                <StepBadge n={4} />
                <Typography sx={actSx}>Linear Coating Operation</Typography>
              </Stack>
            </DTD>
            <DTD>
              <Stack direction="row" alignItems="center" gap={0.8}>
                <SubBadge label="a" />
                <Typography sx={prmSx}>Duration</Typography>
              </Stack>
            </DTD>
            <DTD><Val accent>{lco?.r4a?.m1}</Val></DTD>
            <DTD><Val accent>{lco?.r4a?.m2}</Val></DTD>
          </TableRow>
          {/* 4b */}
          <TableRow sx={{ background: rowBg(0), ...hov }}>
            <DTD>
              <Stack direction="row" alignItems="center" gap={0.8}>
                <SubBadge label="b" />
                <Typography sx={prmSx}>Quantity</Typography>
              </Stack>
            </DTD>
            <DTD><Val accent>{lco?.r4b?.m1}</Val></DTD>
            <DTD><Val accent>{lco?.r4b?.m2}</Val></DTD>
          </TableRow>

          {/* LCO Row 5 — Visual Inspection */}
          <TableRow sx={{ background: rowBg(1), ...hov, ...lastTd }}>
            <DTD>
              <Stack direction="row" alignItems="flex-start" gap={1.2}>
                <StepBadge n={5} />
                <Typography sx={actSx}>Visual Inspection</Typography>
              </Stack>
            </DTD>
            <DTD><Typography sx={prmSx}>Uniform coating, free from any foreign material</Typography></DTD>
            <DTD><OkChip value={lco?.r5?.m1} /></DTD>
            <DTD><OkChip value={lco?.r5?.m2} /></DTD>
          </TableRow>

        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ─── Detail Dialog ────────────────────────────────────────────────────────────
const CPDetailDialog = ({ open, onClose, item, onApprove, onReject }) => {
  const [pdfOpen, setPdfOpen] = useState(false);
  if (!item) return null;

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column", m: 2 } }}
      >
        {/* ── Header ── */}
        <Box sx={{
          p: "14px 20px",
          background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <CleaningServicesRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                Case Preparation Submission
              </Typography>
              <Typography sx={{ color: alpha("#fff", 0.7), fontSize: "0.72rem" }}>
                {item.batchId} · {item.motorId}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" gap={1} alignItems="center">
            <Chip label={item.priority} size="small" sx={{
              height: 20, fontSize: "0.62rem", fontWeight: 700,
              background: PRIORITY_META[item.priority]?.bg,
              color:      PRIORITY_META[item.priority]?.color,
              border: `1px solid ${PRIORITY_META[item.priority]?.border}`,
            }} />
            <Button size="small" variant="contained"
              startIcon={<PictureAsPdfRoundedIcon sx={{ fontSize: "14px !important" }} />}
              onClick={() => setPdfOpen(true)}
              sx={{
                borderRadius: 2, fontWeight: 700, fontSize: "0.72rem", textTransform: "none",
                px: 1.6, py: "5px", whiteSpace: "nowrap",
                background: alpha("#fff", 0.18), color: "#fff",
                border: `1px solid ${alpha("#fff", 0.3)}`, backdropFilter: "blur(8px)",
                "&:hover": { background: alpha("#fff", 0.28), boxShadow: "none" }, boxShadow: "none",
              }}
            >
              View as PDF
            </Button>
            <IconButton onClick={onClose} size="small"
              sx={{ color: alpha("#fff", 0.8), "&:hover": { background: alpha("#fff", 0.1) } }}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {/* ── Motor ID strip ── */}
        <Box sx={{ px: 2.5, py: 1, background: alpha(BRAND.cp, 0.04), borderBottom: `1px solid ${BRAND.border}`, flexShrink: 0 }}>
          <Stack direction="row" gap={3} alignItems="center" flexWrap="wrap">
            <Stack direction="row" gap={0.7} alignItems="center">
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: BRAND.textSub }}>Motor Case IDs:</Typography>
              {[item.motorCaseIds?.m1, item.motorCaseIds?.m2].map((id, i) => (
                <Chip key={i} label={id || "—"} size="small" sx={{
                  height: 20, fontSize: "0.65rem", fontWeight: 700,
                  background: alpha(BRAND.cp, 0.08), color: BRAND.cp,
                  border: `1px solid ${alpha(BRAND.cp, 0.22)}`,
                }} />
              ))}
            </Stack>
            <Stack direction="row" gap={0.7} alignItems="center">
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: BRAND.textSub }}>Motor Nos:</Typography>
              {[item.motorNos?.m1, item.motorNos?.m2].map((id, i) => (
                <Chip key={i} label={id || "—"} size="small" sx={{
                  height: 20, fontSize: "0.65rem", fontWeight: 700,
                  background: alpha(BRAND.cpLight, 0.1), color: BRAND.cpLight,
                  border: `1px solid ${alpha(BRAND.cpLight, 0.22)}`,
                }} />
              ))}
            </Stack>
          </Stack>
        </Box>

        {/* ── Content ── */}
        <DialogContent sx={{ p: 2.5, overflowY: "auto", background: BRAND.surface }}>

          {/* Table 1 */}
          <Box sx={{ mb: 3 }}>
            <SectionDivider icon={CleaningServicesRoundedIcon} label="General Activities" />
            <GeneralActivitiesTable motorCaseIds={item.motorCaseIds} ga={item.ga} />
          </Box>

          {/* Table 2 */}
          <Box>
            <SectionDivider icon={FormatPaintRoundedIcon} label="Linear Coating Operation" />
            <LinearCoatingTable motorNos={item.motorNos} lco={item.lco} />
          </Box>

        </DialogContent>

        {/* ── Footer ── */}
        <Box sx={{
          p: "12px 20px", background: "#fff", borderTop: `1px solid ${BRAND.border}`,
          display: "flex", justifyContent: "flex-end", gap: 1.5, flexShrink: 0,
        }}>
          <Button variant="outlined" onClick={onClose} sx={{
            borderRadius: 2, fontWeight: 700, fontSize: "0.78rem", textTransform: "none",
            borderColor: BRAND.border, color: BRAND.textSub,
          }}>Close</Button>
          <Button variant="contained" startIcon={<CancelRoundedIcon />} onClick={() => onReject(item)}
            sx={{ borderRadius: 2, fontWeight: 700, fontSize: "0.78rem", textTransform: "none", background: BRAND.danger, boxShadow: "none", "&:hover": { background: "#922B21", boxShadow: "none" } }}>
            Reject
          </Button>
          <Button variant="contained" startIcon={<CheckCircleRoundedIcon />} onClick={() => onApprove(item)}
            sx={{ borderRadius: 2, fontWeight: 700, fontSize: "0.78rem", textTransform: "none", background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accentLight})`, boxShadow: `0 3px 10px ${alpha(BRAND.accent, 0.35)}`, "&:hover": { background: BRAND.accent, boxShadow: "none" } }}>
            Approve
          </Button>
        </Box>
      </Dialog>

      <ReportPreviewDialog
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        formId={item.formId}
        department="manufacturing"
        subDepartment="case-preparation"
        dialogTitle={`Case Preparation Report — ${item.batchId}`}
      />
    </>
  );
};

// ─── Chip helpers for list table ──────────────────────────────────────────────
const StatusChip = ({ status }) => (
  <Chip label={status} size="small" sx={{
    height: 20, fontSize: "0.62rem", fontWeight: 700,
    background: CP_STATUS_META[status]?.bg, color: CP_STATUS_META[status]?.color,
    border: `1px solid ${CP_STATUS_META[status]?.border}`,
  }} />
);

const PriorityChip = ({ priority }) => (
  <Chip label={priority} size="small" sx={{
    height: 20, fontSize: "0.62rem", fontWeight: 700,
    background: PRIORITY_META[priority]?.bg, color: PRIORITY_META[priority]?.color,
    border: `1px solid ${PRIORITY_META[priority]?.border}`,
  }} />
);

const TypeChip = ({ type }) => (
  <Chip label={`Type ${type}`} size="small" sx={{
    height: 20, fontSize: "0.62rem", fontWeight: 700,
    background: alpha(BRAND.primaryLight, 0.1), color: BRAND.primaryLight,
    border: `1px solid ${alpha(BRAND.primaryLight, 0.2)}`,
  }} />
);

// Motor case ID pair displayed in list row
const CaseIdBadges = ({ motorCaseIds }) => (
  <Stack direction="row" gap={0.5} flexWrap="wrap">
    {[motorCaseIds?.m1, motorCaseIds?.m2].filter(Boolean).map((id) => (
      <Chip key={id} label={id} size="small" sx={{
        height: 18, fontSize: "0.6rem", fontWeight: 700,
        background: alpha(BRAND.cp, 0.08), color: BRAND.cp,
        border: `1px solid ${alpha(BRAND.cp, 0.2)}`,
      }} />
    ))}
  </Stack>
);

// ─── Main export ──────────────────────────────────────────────────────────────
const CasePreparationApproverPage = () => {
  const [items, setItems]       = useState(MOCK_CP_SUBMISSIONS);
  const [selected, setSelected] = useState(null);
  const { dialogProps, requestApprove, requestReject } = useApproverFormAction({
    department: "manufacturing",
    setItems,
    setSelected,
    subDepartment: "case-preparation",
  });

  return (
    <ApproverList
      department="manufacturing"
      subDepartment="case-preparation"
      items={items}
      statusField="status"
      statusMeta={CP_STATUS_META}
      searchKeys={["batchId", "motorId", "submittedBy"]}
      filterFields={[
        { field: "priority",  label: "Priority", options: ["Critical", "High", "Medium", "Low"] },
        { field: "motorType", label: "Type",      options: ["A", "B", "C"] },
      ]}
    >
      {(filtered) => (
        <>
          <Card elevation={0} sx={{
            borderRadius: 3, border: `1px solid ${BRAND.border}`,
            boxShadow: `0 2px 12px ${alpha(BRAND.primary, 0.06)}`, overflow: "hidden",
          }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TH>Batch ID</TH>
                    <TH>Motor ID</TH>
                    <TH>Type</TH>
                    <TH>Motor Case IDs</TH>
                    <TH>Submitted By</TH>
                    <TH>Date</TH>
                    <TH>Priority</TH>
                    <TH>Status</TH>
                    <TH sx={{ textAlign: "center" }}>Action</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((row, idx) => (
                    <TableRow key={row.id} sx={{
                      background: idx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.5),
                      "&:hover": { background: alpha(BRAND.primaryLight, 0.04) },
                      "&:last-child td": { borderBottom: "none" },
                      animation: `${slideUp} 0.3s ease ${idx * 0.04}s both`,
                    }}>
                      <TD>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", color: BRAND.primary }}>
                          {row.batchId}
                        </Typography>
                      </TD>
                      <TD sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>{row.motorId}</TD>
                      <TD><TypeChip type={row.motorType} /></TD>
                      <TD><CaseIdBadges motorCaseIds={row.motorCaseIds} /></TD>
                      <TD sx={{ fontSize: "0.78rem" }}>{row.submittedBy}</TD>
                      <TD sx={{ color: BRAND.textSub, fontSize: "0.76rem", whiteSpace: "nowrap" }}>
                        {new Date(row.createdOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </TD>
                      <TD><PriorityChip priority={row.priority} /></TD>
                      <TD><StatusChip status={row.status} /></TD>
                      <TD sx={{ textAlign: "center" }}>
                        <Button size="small" variant="outlined"
                          startIcon={<VisibilityRoundedIcon sx={{ fontSize: "13px !important" }} />}
                          onClick={() => setSelected(row)}
                          disabled={!isApproverActionableStatus(row.status)}
                          sx={{
                            borderRadius: 2, fontWeight: 700, fontSize: "0.72rem", textTransform: "none",
                            px: 1.5, py: 0.6,
                            borderColor: isApproverActionableStatus(row.status) ? BRAND.primaryLight : BRAND.border,
                            color:       isApproverActionableStatus(row.status) ? BRAND.primaryLight : alpha(BRAND.textSub, 0.4),
                            "&:hover": { background: alpha(BRAND.primaryLight, 0.06) },
                            "&:disabled": { borderColor: BRAND.border },
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

          <CPDetailDialog
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

export default CasePreparationApproverPage;