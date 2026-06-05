// src/ui/pages/user/manufacturing/CasePrep/CasePreparationForm.jsx

import React from "react";
import {
  Box, Stack, Typography, TextField, Chip, alpha,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, InputAdornment,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { CASE_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/casePreparation_theme";
import {
  createCasePreparationData,
} from "../../../../../hooks/user/manufacturing/casePreparationConfig";
import useCasePreparationFormHook from "../../../../../hooks/user/manufacturing/useCasePreparationFormHook";
import FormProgressChip from "../../../../components/common/FormProgressChip";

const {
  cleaningServices: CleaningServicesRoundedIcon,
  formatPaint: FormatPaintRoundedIcon,
  thermostat: ThermostatRoundedIcon,
  input: InputRoundedIcon,
} = icons.user.manufacturing.casePreparation.form;

const S = STRINGS.MANUFACTURING.CASE_PREP;

// ─── Palette ──────────────────────────────────────────────────────────────────
const BRAND = CASE_PREP_BRAND;

const slideIn = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;

// ─── Styled atoms ─────────────────────────────────────────────────────────────
const SectionCard = styled(Box)(() => ({
  borderRadius: 16,
  border: `1px solid rgba(21,101,192,0.2)`,
  background: "#fff",
  overflow: "hidden",
  boxShadow: `0 2px 18px rgba(21,101,192,0.07)`,
  animation: `${slideIn} 0.35s ease both`,
  animationDelay: "0ms",
}));

const SectionHeader = styled(Box)({
  padding: "13px 20px",
  background: "linear-gradient(135deg, rgba(21,101,192,0.07), rgba(25,118,210,0.03))",
  borderBottom: "1px solid rgba(21,101,192,0.14)",
  display: "flex", alignItems: "center", justifyContent: "space-between",
});

// Header TH — gradient bg
const TH = styled(TableCell)({
  background: "linear-gradient(135deg, #1565C0, #1976D2)",
  color: "#fff", fontWeight: 700, fontSize: "0.7rem",
  letterSpacing: "0.07em", textTransform: "uppercase",
  padding: "10px 14px", whiteSpace: "nowrap", borderBottom: "none",
  verticalAlign: "middle",
});

// Header TH that contains an input (Motor ID columns)
const THInput = styled(TableCell)({
  background: "linear-gradient(135deg, #1565C0, #1976D2)",
  padding: "8px 12px", borderBottom: "none", verticalAlign: "middle", minWidth: 180,
});

const TD = styled(TableCell)({
  padding: "11px 14px",
  borderBottom: "1px solid rgba(213,216,220,0.5)",
  verticalAlign: "middle",
});

const rowBg = (i) => i % 2 === 0 ? "#fff" : "rgba(244,246,248,0.55)";

// ─── Sub / Step badges ────────────────────────────────────────────────────────
const SubBadge = ({ label }) => (
  <Box sx={{ width:17, height:17, borderRadius:"4px", flexShrink:0,
    background:"rgba(21,101,192,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
    <Typography sx={{ color:"#1565C0", fontSize:"0.55rem", fontWeight:800, lineHeight:1 }}>{label}</Typography>
  </Box>
);

const StepBadge = ({ n }) => (
  <Box sx={{ width:22, height:22, borderRadius:"6px", flexShrink:0,
    background:"linear-gradient(135deg,#1565C0,#1976D2)", display:"flex", alignItems:"center",
    justifyContent:"center", boxShadow:"0 1px 4px rgba(21,101,192,0.3)" }}>
    <Typography sx={{ color:"#fff", fontSize:"0.62rem", fontWeight:800, lineHeight:1 }}>{n}</Typography>
  </Box>
);

// ─── Fill Chip ────────────────────────────────────────────────────────────────
// Progress chip is provided via reusable FormProgressChip.

// ─── Motor ID header input ────────────────────────────────────────────────────
const MotorHeaderInput = ({ value, onChange, placeholder }) => (
  <TextField
    size="small" value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    sx={{
      "& .MuiOutlinedInput-root": {
        borderRadius: 6, fontSize: "0.75rem", fontWeight: 700,
        background: "rgba(255,255,255,0.15)",
        "& fieldset": { borderColor: "rgba(255,255,255,0.4)" },
        "&:hover fieldset": { borderColor: "rgba(255,255,255,0.75)" },
        "&.Mui-focused fieldset": { borderColor: "#fff", borderWidth: 2 },
      },
      "& .MuiInputBase-input": {
        color: "#fff", padding: "5px 10px", fontSize: "0.75rem", fontWeight: 700,
        "&::placeholder": { color: "rgba(255,255,255,0.6)", opacity: 1 },
      },
    }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <InputRoundedIcon sx={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }} />
        </InputAdornment>
      ),
    }}
  />
);

// ─── Text input (for data cells) ──────────────────────────────────────────────
const DataInput = ({ value, onChange, placeholder = "Enter value", width = 160, icon: Icon = undefined }) => (
  <TextField
    size="small" value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    sx={{
      width,
      "& .MuiOutlinedInput-root": {
        borderRadius: 7, background: BRAND.surface, fontSize: "0.78rem",
        "& fieldset": { borderColor: BRAND.border },
        "&:hover fieldset": { borderColor: BRAND.cpLight },
        "&.Mui-focused fieldset": { borderColor: BRAND.cp, borderWidth: 2 },
        "&.Mui-focused": { background: "#fff", boxShadow: "0 0 0 3px rgba(21,101,192,0.1)" },
      },
      "& .MuiInputBase-input": { fontWeight: 500, color: BRAND.text, padding: "6px 9px", fontSize: "0.78rem" },
    }}
    InputProps={Icon ? {
      startAdornment: (
        <InputAdornment position="start">
          <Icon sx={{ color: "rgba(21,101,192,0.6)", fontSize: 14 }} />
        </InputAdornment>
      ),
    } : undefined}
  />
);

// ─── OK / Not OK radio toggle ─────────────────────────────────────────────────
const OkToggle = ({ value, onChange }) => {
  const btn = (val, label, color, bg, border) => (
    <Box
      onClick={() => onChange(value === val ? "" : val)}
      sx={{
        px: 1.2, py: "4px", borderRadius: "6px", cursor: "pointer",
        border: `1.5px solid ${value === val ? border : "rgba(213,216,220,0.7)"}`,
        background: value === val ? bg : "rgba(244,246,248,0.6)",
        userSelect: "none", transition: "all 0.16s",
        "&:hover": { borderColor: border, background: bg },
      }}
    >
      <Typography sx={{
        fontSize: "0.68rem", fontWeight: 800, lineHeight: 1,
        color: value === val ? color : BRAND.textSub,
        whiteSpace: "nowrap",
      }}>
        {label}
      </Typography>
    </Box>
  );
  return (
    <Stack direction="row" gap={0.6} alignItems="center">
      {btn("ok",    "OK",      BRAND.ok,    BRAND.okBg,    BRAND.okBorder)}
      {btn("notok", "Not OK",  BRAND.notOk, BRAND.notOkBg, BRAND.notOkBorder)}
    </Stack>
  );
};

// ─── Labeled sub-parameter cell ───────────────────────────────────────────────
const ParamLabel = ({ text }) => (
  <Typography sx={{ fontSize: "0.77rem", color: BRAND.text, fontWeight: 500, lineHeight: 1.4 }}>
    {text}
  </Typography>
);

// ─── CasePreparationForm ──────────────────────────────────────────────────────
const CasePreparationForm = ({
  initialData   = createCasePreparationData(),
  isEditMode    = false,
  onBlocksChange,
}) => {
  const {
    motorCaseIds,
    setMotorCaseIds,
    motorNos,
    setMotorNos,
    ga,
    lco,
    gaFilled,
    gaTotal,
    lcoFilled,
    lcoTotal,
    updateGa,
    updateLco,
  } = useCasePreparationFormHook(initialData as any, onBlocksChange);

  const activitySx   = { fontWeight: 700, fontSize: "0.8rem",  color: BRAND.text,    lineHeight: 1.4 };
  const paramSx      = { fontWeight: 500, fontSize: "0.77rem", color: BRAND.textSub, lineHeight: 1.4, fontStyle: "italic" };
  const sectionTitleSx = { fontWeight: 800, fontSize: "0.92rem", color: BRAND.text };

  const hoverSx = { "&:hover": { background: "rgba(21,101,192,0.025)" } };

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Section heading ── */}
      <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
        <Box sx={{ width:36, height:36, borderRadius:"11px",
          background:"linear-gradient(135deg,#1565C0,#1976D2)", display:"flex",
          alignItems:"center", justifyContent:"center",
          boxShadow:"0 4px 12px rgba(21,101,192,0.3)" }}>
          <CleaningServicesRoundedIcon sx={{ color:"#fff", fontSize:19 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight:800, fontSize:"0.98rem", color:BRAND.text }}>
            {S.FORM_TITLE}
          </Typography>
          <Typography sx={{ fontSize:"0.72rem", color:BRAND.textSub, mt:0.15 }}>
            {S.FORM_SUBTITLE}
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={3}>

        {/* ════════════════════════════════════════════════════════════════════
            TABLE 1 — General Activities
        ════════════════════════════════════════════════════════════════════ */}
        <SectionCard sx={{ animationDelay: "0ms" }}>
          <SectionHeader>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box sx={{ width:34, height:34, borderRadius:"10px", flexShrink:0,
                background:"linear-gradient(135deg,#1565C0,#1976D2)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 3px 10px rgba(21,101,192,0.3)" }}>
                <CleaningServicesRoundedIcon sx={{ color:"#fff", fontSize:18 }} />
              </Box>
              <Box>
                <Typography sx={sectionTitleSx}>{S.SECTION_GA_TITLE}</Typography>
                <Typography sx={{ fontSize:"0.7rem", color:BRAND.textSub, mt:0.15 }}>
                  {S.SECTION_GA_SUBTITLE}
                </Typography>
              </Box>
            </Stack>
            <FormProgressChip
              filledCount={gaFilled}
              totalCount={gaTotal}
              accentColor={BRAND.accent}
              warnColor={BRAND.warn}
              completeLabel={S.ALL_FILLED}
              suffixLabel={S.FILLED_SUFFIX}
            />
          </SectionHeader>

          <TableContainer sx={{ overflowX:"auto" }}>
            <Table sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TH sx={{ minWidth:240 }}>Activity</TH>
                  <TH sx={{ minWidth:210 }}>Parameter</TH>

                  {/* Motor Case ID inputs in header */}
                  <THInput>
                    <Stack gap={0.5}>
                      <Typography sx={{ color:"rgba(255,255,255,0.75)", fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>
                        Motor Case ID No.
                      </Typography>
                      <MotorHeaderInput
                        value={motorCaseIds.m1}
                        onChange={(v) => setMotorCaseIds((p) => ({ ...p, m1: v }))}
                        placeholder={S.PLACEHOLDER_MOTOR_CASE_ID_1}
                      />
                    </Stack>
                  </THInput>
                  <THInput>
                    <Stack gap={0.5}>
                      <Typography sx={{ color:"rgba(255,255,255,0.75)", fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>
                        Motor Case ID No.
                      </Typography>
                      <MotorHeaderInput
                        value={motorCaseIds.m2}
                        onChange={(v) => setMotorCaseIds((p) => ({ ...p, m2: v }))}
                        placeholder={S.PLACEHOLDER_MOTOR_CASE_ID_2}
                      />
                    </Stack>
                  </THInput>
                </TableRow>
              </TableHead>

              <TableBody>

                {/* ── Row 1: Inspect insulator surface ── */}
                <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={1} />
                      <Typography sx={activitySx}>Inspect the Insulator Surface and Loose Flaps</Typography>
                    </Stack>
                  </TD>
                  <TD><Typography sx={paramSx}>Free from oily patches, scratches, cut marks</Typography></TD>
                  <TD><OkToggle value={ga.r1.m1} onChange={(v) => updateGa("r1","m1",v)} /></TD>
                  <TD><OkToggle value={ga.r1.m2} onChange={(v) => updateGa("r1","m2",v)} /></TD>
                </TableRow>

                {/* ── Row 2: Abrading ── */}
                <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={2} />
                      <Typography sx={activitySx}>Abrading</Typography>
                    </Stack>
                  </TD>
                  <TD><Typography sx={paramSx}>Abraded dust quantity (g)</Typography></TD>
                  <TD><OkToggle value={ga.r2.m1} onChange={(v) => updateGa("r2","m1",v)} /></TD>
                  <TD><OkToggle value={ga.r2.m2} onChange={(v) => updateGa("r2","m2",v)} /></TD>
                </TableRow>

                {/* ── Row 3: Inspect surface for proper abrading ── */}
                <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={3} />
                      <Typography sx={activitySx}>Inspect the Surface for Proper Abrading</Typography>
                    </Stack>
                  </TD>
                  <TD><Typography sx={paramSx}>(Uniform abrading, metal surface not exposed)</Typography></TD>
                  <TD><OkToggle value={ga.r3.m1} onChange={(v) => updateGa("r3","m1",v)} /></TD>
                  <TD><OkToggle value={ga.r3.m2} onChange={(v) => updateGa("r3","m2",v)} /></TD>
                </TableRow>

                {/* ── Row 4: Bellow and Spacers — 3 sub-rows ──
                    Activity rowSpan=3, Radio rowSpan=3
                ── */}
                {/* Sub-row a */}
                <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                  <TD rowSpan={3} sx={{ verticalAlign:"top", pt:"14px",
                    borderRight:`1px solid rgba(213,216,220,0.45)` }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={4} />
                      <Typography sx={activitySx}>Bellow and Spacers Preparation and Bonding</Typography>
                    </Stack>
                  </TD>
                  <TD>
                    <Stack direction="row" alignItems="center" gap={0.9}>
                      <SubBadge label="a" />
                      <ParamLabel text="Date of Bellow and Spacers preparation" />
                    </Stack>
                  </TD>
                  <TD><DataInput value={ga.r4a.m1} onChange={(v) => updateGa("r4a","m1",v)} placeholder="DD/MM/YYYY" /></TD>
                  <TD><DataInput value={ga.r4a.m2} onChange={(v) => updateGa("r4a","m2",v)} placeholder="DD/MM/YYYY" /></TD>
                </TableRow>
                {/* Sub-row b */}
                <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="center" gap={0.9}>
                      <SubBadge label="b" />
                      <ParamLabel text="Dimension of Bellow" />
                    </Stack>
                  </TD>
                  <TD><DataInput value={ga.r4b.m1} onChange={(v) => updateGa("r4b","m1",v)} placeholder="e.g. 120×80 mm" /></TD>
                  <TD><DataInput value={ga.r4b.m2} onChange={(v) => updateGa("r4b","m2",v)} placeholder="e.g. 120×80 mm" /></TD>
                </TableRow>
                {/* Sub-row c */}
                <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="center" gap={0.9}>
                      <SubBadge label="c" />
                      <ParamLabel text="Bellow Bonding date" />
                    </Stack>
                  </TD>
                  <TD><DataInput value={ga.r4c.m1} onChange={(v) => updateGa("r4c","m1",v)} placeholder="DD/MM/YYYY" /></TD>
                  <TD><DataInput value={ga.r4c.m2} onChange={(v) => updateGa("r4c","m2",v)} placeholder="DD/MM/YYYY" /></TD>
                </TableRow>

                {/* ── Row 5: Surface Cleaning ── */}
                <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={5} />
                      <Typography sx={activitySx}>Surface Cleaning (Mopping)</Typography>
                    </Stack>
                  </TD>
                  <TD><Typography sx={paramSx}>Surface free from dust / foreign materials, excess solvent</Typography></TD>
                  <TD><OkToggle value={ga.r5.m1} onChange={(v) => updateGa("r5","m1",v)} /></TD>
                  <TD><OkToggle value={ga.r5.m2} onChange={(v) => updateGa("r5","m2",v)} /></TD>
                </TableRow>

                {/* ── Row 6: Preheating — text inputs ── */}
                <TableRow sx={{ background: rowBg(1), ...hoverSx, "& td": { borderBottom:"none" } }}>
                  <TD>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={6} />
                      <Typography sx={activitySx}>Preheating</Typography>
                    </Stack>
                  </TD>
                  <TD>
                    <Typography sx={paramSx}>Temp and Duration</Typography>
                  </TD>
                  <TD>
                    <DataInput
                      value={ga.r6.m1}
                      onChange={(v) => updateGa("r6","m1",v)}
                      placeholder="e.g. 60°C / 30 min"
                      icon={ThermostatRoundedIcon}
                      width={175}
                    />
                  </TD>
                  <TD>
                    <DataInput
                      value={ga.r6.m2}
                      onChange={(v) => updateGa("r6","m2",v)}
                      placeholder="e.g. 60°C / 30 min"
                      icon={ThermostatRoundedIcon}
                      width={175}
                    />
                  </TD>
                </TableRow>

              </TableBody>
            </Table>
          </TableContainer>
        </SectionCard>

        {/* ════════════════════════════════════════════════════════════════════
            TABLE 2 — Linear Coating Operation
        ════════════════════════════════════════════════════════════════════ */}
        <SectionCard sx={{ animationDelay: "80ms" }}>
          <SectionHeader>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box sx={{ width:34, height:34, borderRadius:"10px", flexShrink:0,
                background:"linear-gradient(135deg,#1565C0,#1976D2)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 3px 10px rgba(21,101,192,0.3)" }}>
                <FormatPaintRoundedIcon sx={{ color:"#fff", fontSize:18 }} />
              </Box>
              <Box>
                <Typography sx={sectionTitleSx}>{S.SECTION_LCO_TITLE}</Typography>
                <Typography sx={{ fontSize:"0.7rem", color:BRAND.textSub, mt:0.15 }}>
                  {S.SECTION_LCO_SUBTITLE}
                </Typography>
              </Box>
            </Stack>
            <FormProgressChip
              filledCount={lcoFilled}
              totalCount={lcoTotal}
              accentColor={BRAND.accent}
              warnColor={BRAND.warn}
              completeLabel={S.ALL_FILLED}
              suffixLabel={S.FILLED_SUFFIX}
            />
          </SectionHeader>

          <TableContainer sx={{ overflowX:"auto" }}>
            <Table sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TH sx={{ minWidth:240 }}>Linear Coating Operation</TH>
                  <TH sx={{ minWidth:200 }}>Parameter</TH>

                  {/* Motor No inputs in header */}
                  <THInput>
                    <Stack gap={0.5}>
                      <Typography sx={{ color:"rgba(255,255,255,0.75)", fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>
                        Motor No.
                      </Typography>
                      <MotorHeaderInput
                        value={motorNos.m1}
                        onChange={(v) => setMotorNos((p) => ({ ...p, m1: v }))}
                        placeholder={S.PLACEHOLDER_MOTOR_NO_1}
                      />
                    </Stack>
                  </THInput>
                  <THInput>
                    <Stack gap={0.5}>
                      <Typography sx={{ color:"rgba(255,255,255,0.75)", fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase" }}>
                        Motor No.
                      </Typography>
                      <MotorHeaderInput
                        value={motorNos.m2}
                        onChange={(v) => setMotorNos((p) => ({ ...p, m2: v }))}
                        placeholder={S.PLACEHOLDER_MOTOR_NO_2}
                      />
                    </Stack>
                  </THInput>
                </TableRow>
              </TableHead>

              <TableBody>

                {/* ── LCO Row 1: Inspection ── */}
                <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={1} />
                      <Typography sx={activitySx}>Inspection</Typography>
                    </Stack>
                  </TD>
                  <TD><Typography sx={paramSx}>Surface is clean and free from foreign materials</Typography></TD>
                  <TD><OkToggle value={lco.r1.m1} onChange={(v) => updateLco("r1","m1",v)} /></TD>
                  <TD><OkToggle value={lco.r1.m2} onChange={(v) => updateLco("r1","m2",v)} /></TD>
                </TableRow>

                {/* ── LCO Row 2: Insulation Temperature ── */}
                <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={2} />
                      <Typography sx={activitySx}>Insulation Temperature</Typography>
                    </Stack>
                  </TD>
                  <TD><Typography sx={paramSx}>Temp</Typography></TD>
                  <TD>
                    <Stack gap={0.4}>
                      <Typography sx={{ fontSize:"0.65rem", color:BRAND.textSub, fontWeight:600 }}>Measured Temp</Typography>
                      <DataInput value={lco.r2.m1} onChange={(v) => updateLco("r2","m1",v)}
                        placeholder="e.g. 28°C" icon={ThermostatRoundedIcon} width={155} />
                    </Stack>
                  </TD>
                  <TD>
                    <Stack gap={0.4}>
                      <Typography sx={{ fontSize:"0.65rem", color:BRAND.textSub, fontWeight:600 }}>Measured Temp</Typography>
                      <DataInput value={lco.r2.m2} onChange={(v) => updateLco("r2","m2",v)}
                        placeholder="e.g. 28°C" icon={ThermostatRoundedIcon} width={155} />
                    </Stack>
                  </TD>
                </TableRow>

                {/* ── LCO Row 3: Linear Premix — 3 sub-rows ──
                    Operation rowSpan=3
                ── */}
                {/* Sub-row a: Premix batch no */}
                <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                  <TD rowSpan={3} sx={{ verticalAlign:"top", pt:"14px",
                    borderRight:`1px solid rgba(213,216,220,0.45)` }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={3} />
                      <Typography sx={activitySx}>Linear Premix Qualification</Typography>
                    </Stack>
                  </TD>
                  <TD>
                    <Stack direction="row" alignItems="center" gap={0.9}>
                      <SubBadge label="a" />
                      <ParamLabel text="Linear Premix Batch No." />
                    </Stack>
                  </TD>
                  <TD>
                    <Stack gap={0.4}>
                      <Typography sx={{ fontSize:"0.65rem", color:BRAND.textSub, fontWeight:600 }}>Batch</Typography>
                      <DataInput value={lco.r3a.m1} onChange={(v) => updateLco("r3a","m1",v)} placeholder="Batch no." />
                    </Stack>
                  </TD>
                  <TD>
                    <Stack gap={0.4}>
                      <Typography sx={{ fontSize:"0.65rem", color:BRAND.textSub, fontWeight:600 }}>Batch</Typography>
                      <DataInput value={lco.r3a.m2} onChange={(v) => updateLco("r3a","m2",v)} placeholder="Batch no." />
                    </Stack>
                  </TD>
                </TableRow>
                {/* Sub-row b: Measured Moisture */}
                <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="center" gap={0.9}>
                      <SubBadge label="b" />
                      <ParamLabel text="Measured Moisture" />
                    </Stack>
                  </TD>
                  <TD>
                    <Stack gap={0.4}>
                      <Typography sx={{ fontSize:"0.65rem", color:BRAND.textSub, fontWeight:600 }}>Moisture</Typography>
                      <DataInput value={lco.r3b.m1} onChange={(v) => updateLco("r3b","m1",v)} placeholder="e.g. 0.08%" />
                    </Stack>
                  </TD>
                  <TD>
                    <Stack gap={0.4}>
                      <Typography sx={{ fontSize:"0.65rem", color:BRAND.textSub, fontWeight:600 }}>Moisture</Typography>
                      <DataInput value={lco.r3b.m2} onChange={(v) => updateLco("r3b","m2",v)} placeholder="e.g. 0.08%" />
                    </Stack>
                  </TD>
                </TableRow>
                {/* Sub-row c: Peel Strength */}
                <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="center" gap={0.9}>
                      <SubBadge label="c" />
                      <ParamLabel text="Qualified Peel Strength" />
                    </Stack>
                  </TD>
                  <TD>
                    <Stack gap={0.4}>
                      <Typography sx={{ fontSize:"0.65rem", color:BRAND.textSub, fontWeight:600 }}>Peel Strength</Typography>
                      <DataInput value={lco.r3c.m1} onChange={(v) => updateLco("r3c","m1",v)} placeholder="e.g. 4.5 N/mm" />
                    </Stack>
                  </TD>
                  <TD>
                    <Stack gap={0.4}>
                      <Typography sx={{ fontSize:"0.65rem", color:BRAND.textSub, fontWeight:600 }}>Peel Strength</Typography>
                      <DataInput value={lco.r3c.m2} onChange={(v) => updateLco("r3c","m2",v)} placeholder="e.g. 4.5 N/mm" />
                    </Stack>
                  </TD>
                </TableRow>

                {/* ── LCO Row 4: Linear Coating Operation — 2 sub-rows ──
                    Operation rowSpan=2
                ── */}
                {/* Sub-row a: Duration */}
                <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                  <TD rowSpan={2} sx={{ verticalAlign:"top", pt:"14px",
                    borderRight:`1px solid rgba(213,216,220,0.45)` }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={4} />
                      <Typography sx={activitySx}>Linear Coating Operation</Typography>
                    </Stack>
                  </TD>
                  <TD>
                    <Stack direction="row" alignItems="center" gap={0.9}>
                      <SubBadge label="a" />
                      <ParamLabel text="Duration" />
                    </Stack>
                  </TD>
                  <TD><DataInput value={lco.r4a.m1} onChange={(v) => updateLco("r4a","m1",v)} placeholder="e.g. 45 min" /></TD>
                  <TD><DataInput value={lco.r4a.m2} onChange={(v) => updateLco("r4a","m2",v)} placeholder="e.g. 45 min" /></TD>
                </TableRow>
                {/* Sub-row b: Quantity */}
                <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="center" gap={0.9}>
                      <SubBadge label="b" />
                      <ParamLabel text="Quantity" />
                    </Stack>
                  </TD>
                  <TD><DataInput value={lco.r4b.m1} onChange={(v) => updateLco("r4b","m1",v)} placeholder="e.g. 250 g" /></TD>
                  <TD><DataInput value={lco.r4b.m2} onChange={(v) => updateLco("r4b","m2",v)} placeholder="e.g. 250 g" /></TD>
                </TableRow>

                {/* ── LCO Row 5: Visual Inspection ── */}
                <TableRow sx={{ background: rowBg(1), ...hoverSx, "& td": { borderBottom:"none" } }}>
                  <TD>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={5} />
                      <Typography sx={activitySx}>Visual Inspection</Typography>
                    </Stack>
                  </TD>
                  <TD><Typography sx={paramSx}>Uniform coating and free from any foreign material</Typography></TD>
                  <TD><OkToggle value={lco.r5.m1} onChange={(v) => updateLco("r5","m1",v)} /></TD>
                  <TD><OkToggle value={lco.r5.m2} onChange={(v) => updateLco("r5","m2",v)} /></TD>
                </TableRow>

              </TableBody>
            </Table>
          </TableContainer>
        </SectionCard>

      </Stack>
    </Box>
  );
};

export default CasePreparationForm;
