import React from "react";
import {
  Box, Stack, Typography, TextField, alpha, Button,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, InputAdornment,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { STRINGS } from "../../../../../app/config/strings";
import { icons } from "../../../../../app/theme/icons";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import { createMixingData } from "../../../../../hooks/user/manufacturing/mixingConfig";
import { useMixingFormHook } from "../../../../../hooks/user/manufacturing/useMixingFormHook";
import FormProgressChip from "../../../../components/common/FormProgressChip";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";

const {
  blender: BlenderRoundedIcon,
  add: AddRoundedIcon,
  delete: DeleteOutlineRoundedIcon,
  checklist: ChecklistRoundedIcon,
  checkCircleOutline: CheckCircleOutlineRoundedIcon,
  speed: SpeedRoundedIcon,
  timer: TimerRoundedIcon,
  thermostat: ThermostatRoundedIcon,
  air: AirRoundedIcon,
} = icons.user.manufacturing.mixing.form;

const BRAND = MIXING_BRAND;
const MIXING_STRINGS = STRINGS.MANUFACTURING.MIXING;

const slideIn = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const rowIn   = keyframes`from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}`;

// ─── Styled atoms ─────────────────────────────────────────────────────────────
const SectionCard = styled(Box)({
  borderRadius: 16,
  border: "1px solid rgba(21,101,192,0.2)",
  background: "#fff",
  overflow: "hidden",
  boxShadow: "0 2px 18px rgba(21,101,192,0.07)",
  animation: `${slideIn} 0.35s ease both`,
});

const SectionHeader = styled(Box)({
  padding: "13px 20px",
  background: "linear-gradient(135deg, rgba(21,101,192,0.07), rgba(25,118,210,0.03))",
  borderBottom: "1px solid rgba(21,101,192,0.14)",
  display: "flex", alignItems: "center", justifyContent: "space-between",
});

const TH = styled(TableCell)({
  background: "linear-gradient(135deg, #1565C0, #1976D2)",
  color: "#fff", fontWeight: 700, fontSize: "0.7rem",
  letterSpacing: "0.07em", textTransform: "uppercase",
  padding: "11px 14px", whiteSpace: "nowrap", borderBottom: "none",
  verticalAlign: "middle",
});

const TD = styled(TableCell)({
  padding: "10px 12px",
  borderBottom: "1px solid rgba(213,216,220,0.5)",
  verticalAlign: "middle",
});

const rowBg  = (i) => i % 2 === 0 ? "#fff" : "rgba(244,246,248,0.55)";
const hoverSx = { "&:hover": { background: "rgba(21,101,192,0.025)" } };

// ─── Step badge ───────────────────────────────────────────────────────────────
const StepBadge = ({ n }) => (
  <Box sx={{ width:22, height:22, borderRadius:"6px", flexShrink:0,
    background:"linear-gradient(135deg,#1565C0,#1976D2)",
    display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow:"0 1px 4px rgba(21,101,192,0.3)" }}>
    <Typography sx={{ color:"#fff", fontSize:"0.62rem", fontWeight:800, lineHeight:1 }}>{n}</Typography>
  </Box>
);

// ─── Compact data input ───────────────────────────────────────────────────────
const DataInput = ({ value, onChange, placeholder = "—", width = 120, icon: Icon }) => (
  <TextField size="small" value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    sx={{
      width,
      "& .MuiOutlinedInput-root": {
        borderRadius: 6, background: BRAND.surface, fontSize: "0.78rem",
        "& fieldset": { borderColor: BRAND.border },
        "&:hover fieldset": { borderColor: BRAND.mxLight },
        "&.Mui-focused fieldset": { borderColor: BRAND.mx, borderWidth: 2 },
        "&.Mui-focused": { background: "#fff", boxShadow: "0 0 0 3px rgba(21,101,192,0.1)" },
      },
      "& .MuiInputBase-input": { fontWeight:500, color:BRAND.text, padding:"5px 8px", fontSize:"0.78rem" },
      "& .MuiInputAdornment-root svg": { fontSize:"13px !important" },
    }}
    InputProps={Icon ? {
      startAdornment: (
        <InputAdornment position="start">
          <Icon sx={{ color:"rgba(21,101,192,0.55)" }} />
        </InputAdornment>
      ),
    } : undefined}
  />
);

// ─── Operation label input (used in dynamic rows) ─────────────────────────────
const OpInput = ({ value, onChange }) => (
  <TextField size="small" value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={MIXING_STRINGS.OPERATION_PLACEHOLDER}
    multiline maxRows={3}
    sx={{
      width: "100%", minWidth: 180,
      "& .MuiOutlinedInput-root": {
        borderRadius: 6, background: BRAND.surface, fontSize: "0.78rem",
        "& fieldset": { borderColor: alpha(BRAND.mx, 0.3) },
        "&:hover fieldset": { borderColor: BRAND.mxLight },
        "&.Mui-focused fieldset": { borderColor: BRAND.mx, borderWidth: 2 },
        "&.Mui-focused": { background:"#fff", boxShadow:"0 0 0 3px rgba(21,101,192,0.1)" },
      },
      "& .MuiInputBase-input": { fontWeight:500, color:BRAND.text, padding:"5px 8px", fontSize:"0.78rem" },
    }}
  />
);

// ─── MixingForm ───────────────────────────────────────────────────────────────
const MixingForm = ({
  initialData   = createMixingData(),
  isEditMode    = false,
  onBlocksChange,
}) => {
  const {
    preFixed,
    preDynamic,
    sampling,
    finalRows,
    updateFixed,
    addDynamicRow,
    deleteDynamicRow,
    updateDynamic,
    updateSampling,
    updateFinal,
    preFilled,
    preTotal,
    finalFilled,
    finalTotal,
  } = useMixingFormHook(initialData, onBlocksChange);

  const sectionTitleSx = { fontWeight:800, fontSize:"0.92rem", color:BRAND.text };
  const opLabelSx = { fontWeight:700, fontSize:"0.8rem", color:BRAND.text, lineHeight:1.4 };

  // ── Shared numeric column cells ──
  const NumCells = ({ row, onUpdate }) => (
    <>
      <TD><DataInput value={row.rpm}    onChange={(v)=>onUpdate("rpm",v)}    placeholder="rpm"  icon={SpeedRoundedIcon}      width={108} /></TD>
      <TD><DataInput value={row.time}   onChange={(v)=>onUpdate("time",v)}   placeholder="min"  icon={TimerRoundedIcon}      width={108} /></TD>
      <TD><DataInput value={row.temp}   onChange={(v)=>onUpdate("temp",v)}   placeholder="°C"   icon={ThermostatRoundedIcon} width={108} /></TD>
      <TD><DataInput value={row.vacuum} onChange={(v)=>onUpdate("vacuum",v)} placeholder="torr" icon={AirRoundedIcon}         width={108} /></TD>
    </>
  );

  return (
    <Box sx={{ fontFamily:"'DM Sans', sans-serif" }}>

      {/* ── Page heading ── */}
      <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
        <Box sx={{ width:36, height:36, borderRadius:"11px",
          background:"linear-gradient(135deg,#1565C0,#1976D2)",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 4px 12px rgba(21,101,192,0.3)" }}>
          <BlenderRoundedIcon sx={{ color:"#fff", fontSize:19 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight:800, fontSize:"0.98rem", color:BRAND.text }}>{MIXING_STRINGS.FORM_TITLE}</Typography>
          <Typography sx={{ fontSize:"0.72rem", color:BRAND.textSub, mt:0.15 }}>
            {MIXING_STRINGS.FORM_SUBTITLE}
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={3}>

        {/* ════════════════════════════════════════════════════════════════════
            TABLE 1 — Pre-Mixing
        ════════════════════════════════════════════════════════════════════ */}
        <SectionCard>
          <SectionHeader>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box sx={{ width:34, height:34, borderRadius:"10px", flexShrink:0,
                background:"linear-gradient(135deg,#1565C0,#1976D2)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 3px 10px rgba(21,101,192,0.3)" }}>
                <ChecklistRoundedIcon sx={{ color:"#fff", fontSize:18 }} />
              </Box>
              <Box>
                <Typography sx={sectionTitleSx}>{MIXING_STRINGS.SECTION_PRE_TITLE}</Typography>
                <Typography sx={{ fontSize:"0.7rem", color:BRAND.textSub, mt:0.15 }}>
                  {MIXING_STRINGS.SECTION_PRE_SUBTITLE}
                </Typography>
              </Box>
            </Stack>
            <FormProgressChip
              filledCount={preFilled}
              totalCount={preTotal}
              accentColor={BRAND.accent}
              warnColor={BRAND.warn}
              completeLabel={MIXING_STRINGS.ALL_FILLED}
              suffixLabel={MIXING_STRINGS.FILLED_SUFFIX}
            />
          </SectionHeader>

          <TableContainer sx={{ overflowX:"auto" }}>
            <Table sx={{ minWidth:780 }}>
              <TableHead>
                <TableRow>
                  <TH sx={{ minWidth:260 }}>{MIXING_STRINGS.COL_OPERATION_STATUS}</TH>
                  <TH sx={{ minWidth:120 }}>Rotation (rpm)</TH>
                  <TH sx={{ minWidth:110 }}>Time (min)</TH>
                  <TH sx={{ minWidth:110 }}>Temp (°C)</TH>
                  <TH sx={{ minWidth:115 }}>Vacuum (torr)</TH>
                </TableRow>
              </TableHead>
              <TableBody>

                {/* ── Fixed rows 1–4 ── */}
                {preFixed.map((row, idx) => (
                  <TableRow key={row.id} sx={{ background:rowBg(idx), ...hoverSx }}>
                    <TD>
                      <Stack direction="row" alignItems="flex-start" gap={1.2}>
                        <StepBadge n={idx + 1} />
                        <Typography sx={opLabelSx}>{row.operation}</Typography>
                      </Stack>
                    </TD>
                    <NumCells row={row} onUpdate={(f,v) => updateFixed(idx, f, v)} />
                  </TableRow>
                ))}

                {/* ── Dynamic rows ── */}
                {preDynamic.map((row, idx) => (
                  <TableRow key={row.id}
                    sx={{ background:rowBg((preFixed.length + idx) % 2),
                      animation:`${rowIn} 0.22s ease`, ...hoverSx }}>
                    <TD>
                      <Stack direction="row" alignItems="flex-start" gap={1.2}>
                        <StepBadge n={preFixed.length + idx + 1} />
                        <Box sx={{ flex:1 }}>
                          <OpInput value={row.operation} onChange={(v) => updateDynamic(row.id,"operation",v)} />
                        </Box>
                        <RemoveProcessButton
                          onClick={() => deleteDynamicRow(row.id)}
                          tooltip={MIXING_STRINGS.REMOVE_ROW_TOOLTIP}
                          dangerColor={BRAND.danger}
                        />
                      </Stack>
                    </TD>
                    <NumCells row={row} onUpdate={(f,v) => updateDynamic(row.id, f, v)} />
                  </TableRow>
                ))}

                {/* ── Add row button row ── */}
                <TableRow>
                  <TD colSpan={5} sx={{ py:1.5, borderBottom:"1px dashed rgba(21,101,192,0.2)", background:"rgba(21,101,192,0.015)" }}>
                    <Button
                      variant="outlined" size="small"
                      startIcon={<AddRoundedIcon />}
                      onClick={addDynamicRow}
                      sx={{
                        borderRadius: 2, fontWeight: 700, fontSize: "0.72rem",
                        textTransform: "none", px: 1.8, py: "5px",
                        borderColor: alpha(BRAND.mx, 0.35), color: BRAND.mx,
                        borderStyle: "dashed",
                        "&:hover": { borderColor:BRAND.mx, background:alpha(BRAND.mx, 0.05), borderStyle:"solid" },
                        transition: "all 0.18s",
                      }}
                    >
                      {MIXING_STRINGS.ADD_OPERATION_ROW}
                    </Button>
                  </TD>
                </TableRow>

                {/* ── Fixed last row: Sampling ── */}
                <TableRow sx={{ background:rowBg((preFixed.length + preDynamic.length) % 2), ...hoverSx, "& td":{ borderBottom:"none" } }}>
                  <TD>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={preFixed.length + preDynamic.length + 1} />
                      <Typography sx={opLabelSx}>
                        {sampling.operation}
                      </Typography>
                    </Stack>
                  </TD>
                  <NumCells row={sampling} onUpdate={(f,v) => updateSampling(f, v)} />
                </TableRow>

              </TableBody>
            </Table>
          </TableContainer>
        </SectionCard>

        {/* ════════════════════════════════════════════════════════════════════
            TABLE 2 — Final Mixing
        ════════════════════════════════════════════════════════════════════ */}
        <SectionCard sx={{ animationDelay: "80ms" }}>
          <SectionHeader>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box sx={{ width:34, height:34, borderRadius:"10px", flexShrink:0,
                background:"linear-gradient(135deg,#1565C0,#1976D2)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 3px 10px rgba(21,101,192,0.3)" }}>
                <BlenderRoundedIcon sx={{ color:"#fff", fontSize:18 }} />
              </Box>
              <Box>
                <Typography sx={sectionTitleSx}>{MIXING_STRINGS.SECTION_FINAL_TITLE}</Typography>
                <Typography sx={{ fontSize:"0.7rem", color:BRAND.textSub, mt:0.15 }}>
                  {MIXING_STRINGS.SECTION_FINAL_SUBTITLE}
                </Typography>
              </Box>
            </Stack>
            <FormProgressChip
              filledCount={finalFilled}
              totalCount={finalTotal}
              accentColor={BRAND.accent}
              warnColor={BRAND.warn}
              completeLabel={MIXING_STRINGS.ALL_FILLED}
              suffixLabel={MIXING_STRINGS.FILLED_SUFFIX}
            />
          </SectionHeader>

          <TableContainer sx={{ overflowX:"auto" }}>
            <Table sx={{ minWidth:780 }}>
              <TableHead>
                <TableRow>
                  <TH sx={{ minWidth:260 }}>{MIXING_STRINGS.COL_OPERATION_STATUS}</TH>
                  <TH sx={{ minWidth:120 }}>Rotation (rpm)</TH>
                  <TH sx={{ minWidth:110 }}>Time (min)</TH>
                  <TH sx={{ minWidth:110 }}>Temp (°C)</TH>
                  <TH sx={{ minWidth:115 }}>Vacuum (torr)</TH>
                </TableRow>
              </TableHead>
              <TableBody>

                {/* Row 1: TDI Addition */}
                <TableRow sx={{ background:rowBg(0), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={1} />
                      <Typography sx={opLabelSx}>{finalRows.tdi.operation}</Typography>
                    </Stack>
                  </TD>
                  <NumCells row={finalRows.tdi} onUpdate={(f,v) => updateFinal("tdi", f, v)} />
                </TableRow>

                {/* Row 2: Sample for Viscosity */}
                <TableRow sx={{ background:rowBg(1), ...hoverSx, "& td":{ borderBottom:"none" } }}>
                  <TD>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={2} />
                      <Typography sx={opLabelSx}>{finalRows.viscosity.operation}</Typography>
                    </Stack>
                  </TD>
                  <NumCells row={finalRows.viscosity} onUpdate={(f,v) => updateFinal("viscosity", f, v)} />
                </TableRow>

              </TableBody>
            </Table>
          </TableContainer>
        </SectionCard>

      </Stack>
    </Box>
  );
};

export default MixingForm;
