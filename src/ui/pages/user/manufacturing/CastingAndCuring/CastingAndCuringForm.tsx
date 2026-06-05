import React from "react";
import {
  Box, Stack, Typography, TextField, Button, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment, alpha, Chip,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { STRINGS } from "../../../../../app/config/strings";
import { CASTING_CURING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/castingAndCuring_theme";
import { createCastingAndCuringData } from "../../../../../hooks/user/manufacturing/castingAndCuringConfig";
import { useCastingAndCuringFormHook } from "../../../../../hooks/user/manufacturing/useCastingAndCuringFormHook";
import { icons } from "../../../../../app/theme/icons";
import type { CastingCuringFormState } from "../../../../../data/models/user/CastingCuringFormModel";

const {
  add: AddRoundedIcon,
  delete: DeleteOutlineRoundedIcon,
  scale: ScaleRoundedIcon,
  timer: TimerRoundedIcon,
  thermostat: ThermostatRoundedIcon,
  speed: SpeedRoundedIcon,
  settings: SettingsRoundedIcon,
  input: InputRoundedIcon,
  compress: CompressRoundedIcon,
  water: WaterRoundedIcon,
  checkCircleOutline: CheckCircleOutlineRoundedIcon,
} = icons.user.manufacturing.castingAndCuring.form;

// ─── Palette ──────────────────────────────────────────────────────────────────
const BRAND = CASTING_CURING_BRAND;
const CC = BRAND.cc;
const CCL = BRAND.ccLight;
const ACCENT = BRAND.accent;
const SURFACE = BRAND.surface;
const BORDER = BRAND.border;
const TEXT = BRAND.text;
const TEXTSUB = BRAND.textSub;
const DANGER = BRAND.danger;
const S = STRINGS.MANUFACTURING.CASTING_CURING;

const slideIn = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;
const rowIn   = keyframes`from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}`;

// ─── Styled atoms ─────────────────────────────────────────────────────────────
const Card = styled(Box)({
  borderRadius: 16,
  border: "1px solid rgba(21,101,192,0.18)",
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
  color: "#fff", fontWeight: 700, fontSize: "0.68rem",
  letterSpacing: "0.06em", textTransform: "uppercase",
  padding: "10px 12px", whiteSpace: "nowrap", borderBottom: "none",
  verticalAlign: "middle", lineHeight: 1.35, textAlign: "center",
});

const THInput = styled(TableCell)({
  background: "linear-gradient(135deg, #1565C0, #1976D2)",
  padding: "8px 12px", borderBottom: "none", verticalAlign: "middle", minWidth: 175,
});

const TD = styled(TableCell)({
  padding: "8px 10px",
  borderBottom: "1px solid rgba(213,216,220,0.5)",
  verticalAlign: "middle",
  textAlign: "center",
});

const rowBg   = (i) => i % 2 === 0 ? "#fff" : "rgba(244,246,248,0.6)";
const hoverSx = { "&:hover": { background: "rgba(21,101,192,0.025)" } };

// ─── Compact input ────────────────────────────────────────────────────────────
const CInput = ({ value, onChange, placeholder = "—", width = 105, icon: Icon = null, align = "center" }) => (
  <TextField size="small" value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    sx={{
      width,
      "& .MuiOutlinedInput-root": {
        borderRadius: "8px", background: SURFACE, fontSize: "0.76rem",
        "& fieldset": { borderColor: BORDER },
        "&:hover fieldset": { borderColor: CCL },
        "&.Mui-focused fieldset": { borderColor: CC, borderWidth: 2 },
        "&.Mui-focused": { background: "#fff", boxShadow: "0 0 0 3px rgba(21,101,192,0.1)" },
      },
      "& .MuiInputBase-input": {
        fontWeight: 500, color: TEXT, padding: "5px 7px",
        fontSize: "0.76rem", textAlign: align,
      },
      "& .MuiInputAdornment-root svg": { fontSize: "13px !important" },
    }}
    InputProps={Icon ? {
      startAdornment: (
        <InputAdornment position="start">
          <Icon sx={{ color: "rgba(21,101,192,0.5)", fontSize: 13 }} />
        </InputAdornment>
      ),
    } : undefined}
  />
);

// ─── Motor No. header input (white-on-blue) ───────────────────────────────────
const MotorHeaderInput = ({ value, onChange, placeholder }) => (
  <TextField size="small" value={value}
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

// ─── Icon badge ───────────────────────────────────────────────────────────────
const IconBadge = ({ icon: Icon, size = 34, iconSize = 18 }) => (
  <Box sx={{
    width: size, height: size, borderRadius: "10px", flexShrink: 0,
    background: "linear-gradient(135deg, #1565C0, #1976D2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 3px 10px rgba(21,101,192,0.3)",
  }}>
    <Icon sx={{ color: "#fff", fontSize: iconSize }} />
  </Box>
);

// ─── Step badge ───────────────────────────────────────────────────────────────
const StepBadge = ({ n }) => (
  <Box sx={{
    width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
    background: "linear-gradient(135deg,#1565C0,#1976D2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 1px 4px rgba(21,101,192,0.3)",
  }}>
    <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800, lineHeight: 1 }}>{n}</Typography>
  </Box>
);

// ─── Add row button ───────────────────────────────────────────────────────────
const AddRowBtn = ({ label, onClick }) => (
  <Button variant="outlined" size="small"
    startIcon={<AddRoundedIcon />} onClick={onClick}
    sx={{
      borderRadius: 2, fontWeight: 700, fontSize: "0.72rem",
      textTransform: "none", px: 1.8, py: "5px",
      borderColor: alpha(CC, 0.35), color: CC, borderStyle: "dashed",
      "&:hover": { borderColor: CC, background: alpha(CC, 0.05), borderStyle: "solid" },
      transition: "all 0.18s",
    }}>
    {label}
  </Button>
);

// ─── Bowl row factory ─────────────────────────────────────────────────────────
let _bowlId = 0;
const newBowlRow = (n) => ({
  id: ++_bowlId, bowlNo: n != null ? String(n) : "",
  propellantQty: "", viscosity: "", viscosityTemp: "",
  arrivalTime: "", slurry1: "", slurry2: "",
});

// ─── T-interval label helper ──────────────────────────────────────────────────
const nextTLabel = (rows) => {
  const nums = rows.map((r) => {
    const m = r.label.match(/T0\s*\+\s*(\d+)/);
    return m ? parseInt(m[1]) : 0;
  });
  return `T0 + ${Math.max(...nums) + 30}`;
};

type CastingCuringFormProps = {
  initialData?: Partial<ReturnType<typeof createCastingAndCuringData>> | CastingCuringFormState;
  isEditMode?: boolean;
  onBlocksChange?: (payload: CastingCuringFormState) => void;
};

// ─── CastingCuringForm ────────────────────────────────────────────────────────
const CastingCuringForm = ({
  initialData = createCastingAndCuringData(),
  isEditMode = false,
  onBlocksChange,
}: CastingCuringFormProps) => {
  const {
    bowlMotorIds,
    setBowlMotorIds,
    bowlRows,
    updateBowl,
    addBowlRow,
    deleteBowlRow,
    cdMotorIds,
    setCdMotorIds,
    cdR1,
    setCdR1,
    cdR2,
    setCdR2,
    cdR3,
    addCdR3Row,
    deleteCdR3Row,
    updateCdR3,
    cdR4,
    setCdR4,
    cdR5a,
    setCdR5a,
    cdR5b,
    setCdR5b,
    cdR6,
    setCdR6,
    cdCureMotorIds,
    setCdCureMotorIds,
    cureR1,
    setCureR1,
    cureR2,
    setCureR2,
    cureR3,
    setCureR3,
    cureR4,
    setCureR4,
  } = useCastingAndCuringFormHook(initialData, onBlocksChange);

  const opLabelSx = { fontWeight: 700, fontSize: "0.8rem", color: TEXT, lineHeight: 1.4, textAlign: "left" };

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Page heading */}
      <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
        <IconBadge icon={ThermostatRoundedIcon} size={36} iconSize={19} />
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: TEXT }}>Casting and Curing</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: TEXTSUB, mt: 0.15 }}>
            Bowl details and curing operation parameters
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={3}>

        {/* ════════════════════════════════════════════════════════════════════
            TABLE 1 — Bowl Details
        ════════════════════════════════════════════════════════════════════ */}
        <Card sx={{ animationDelay: "0ms" }}>
          <SectionHeader>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <IconBadge icon={ScaleRoundedIcon} />
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: TEXT }}>Bowl Details</Typography>
                <Typography sx={{ fontSize: "0.7rem", color: TEXTSUB, mt: 0.15 }}>
                  Per-bowl propellant quantity, viscosity, arrival time and slurry cast data
                </Typography>
              </Box>
            </Stack>
          </SectionHeader>

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                {/* Row 1 */}
                <TableRow>
                  <TH rowSpan={2} sx={{ minWidth: 60 }}>{"Bowl\nNo."}</TH>
                  <TH rowSpan={2} sx={{ minWidth: 115 }}>{"Qty. of Propellant\n(Kg)"}</TH>
                  <TH rowSpan={2} sx={{ minWidth: 145 }}>{"Initial Unloading\nViscosity (P @ °C)"}</TH>
                  <TH rowSpan={2} sx={{ minWidth: 135 }}>{"Time of Arrival of\nBowl to Casting Station"}</TH>
                  <TH colSpan={2} sx={{ minWidth: 260, textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.25)" }}>
                    Slurry Cast from Each Bowl (kg)
                  </TH>
                  <TH rowSpan={2} sx={{ minWidth: 44 }} />
                </TableRow>
                {/* Row 2 — Motor No. sub-headers with inputs */}
                <TableRow>
                  {[{ key: "m1", placeholder: "e.g. M-001" }, { key: "m2", placeholder: "e.g. M-002" }].map(({ key, placeholder }) => (
                    <TH key={key} sx={{ minWidth: 130, borderTop: "1px solid rgba(255,255,255,0.25)" }}>
                      <Stack alignItems="center" gap={0.6}>
                        <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, color: "#fff", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                          Motor No.
                        </Typography>
                        <CInput value={bowlMotorIds[key]}
                          onChange={(v) => setBowlMotorIds((p) => ({ ...p, [key]: v }))}
                          placeholder={placeholder} icon={SettingsRoundedIcon} width={100} />
                      </Stack>
                    </TH>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {bowlRows.map((row, idx) => (
                  <TableRow key={row.id}
                    sx={{ background: rowBg(idx), animation: `${rowIn} 0.2s ease`, ...hoverSx }}>
                    {/* Bowl No. badge */}
                    <TD>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: "8px", margin: "0 auto",
                        background: "linear-gradient(135deg,#1565C0,#1976D2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 1px 4px rgba(21,101,192,0.3)",
                      }}>
                        <Typography sx={{ color: "#fff", fontSize: "0.72rem", fontWeight: 800, lineHeight: 1 }}>
                          {idx + 1}
                        </Typography>
                      </Box>
                    </TD>
                    {/* Propellant Qty */}
                    <TD>
                      <CInput value={row.propellantQty} onChange={(v) => updateBowl(row.id, "propellantQty", v)}
                        placeholder="kg" icon={ScaleRoundedIcon} width={100} />
                    </TD>
                    {/* Viscosity P @ °C */}
                    <TD>
                      <Stack direction="row" gap={0.6} justifyContent="center" alignItems="center">
                        <CInput value={row.viscosity} onChange={(v) => updateBowl(row.id, "viscosity", v)}
                          placeholder="P" icon={SpeedRoundedIcon} width={68} />
                        <Typography sx={{ fontSize: "0.7rem", color: TEXTSUB, fontWeight: 600 }}>@</Typography>
                        <CInput value={row.viscosityTemp} onChange={(v) => updateBowl(row.id, "viscosityTemp", v)}
                          placeholder="°C" icon={ThermostatRoundedIcon} width={68} />
                      </Stack>
                    </TD>
                    {/* Arrival Time */}
                    <TD>
                      <CInput value={row.arrivalTime} onChange={(v) => updateBowl(row.id, "arrivalTime", v)}
                        placeholder="HH:MM" icon={TimerRoundedIcon} width={115} />
                    </TD>
                    {/* Slurry 1 */}
                    <TD>
                      <CInput value={row.slurry1} onChange={(v) => updateBowl(row.id, "slurry1", v)}
                        placeholder="kg" icon={ScaleRoundedIcon} width={105} />
                    </TD>
                    {/* Slurry 2 */}
                    <TD>
                      <CInput value={row.slurry2} onChange={(v) => updateBowl(row.id, "slurry2", v)}
                        placeholder="kg" icon={ScaleRoundedIcon} width={105} />
                    </TD>
                    {/* Delete */}
                    <TD sx={{ px: 0.5 }}>
                      <Tooltip title="Remove row" placement="top" arrow>
                        <span>
                          <IconButton size="small" onClick={() => deleteBowlRow(row.id)}
                            disabled={bowlRows.length <= 1}
                            sx={{ color: DANGER, "&:hover": { background: alpha(DANGER, 0.08) }, "&.Mui-disabled": { opacity: 0.25 } }}>
                            <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TD>
                  </TableRow>
                ))}
                {/* Add bowl row */}
                <TableRow>
                  <TD colSpan={7} sx={{ py: 1.5, borderBottom: "none",
                    background: "rgba(21,101,192,0.015)", borderTop: "1px dashed rgba(21,101,192,0.2)" }}>
                    <AddRowBtn label="Add Bowl Row" onClick={addBowlRow} />
                  </TD>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* ════════════════════════════════════════════════════════════════════
            TABLE 2 — Curing Details
        ════════════════════════════════════════════════════════════════════ */}
        <Card sx={{ animationDelay: "80ms" }}>
          <SectionHeader>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <IconBadge icon={WaterRoundedIcon} />
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: TEXT }}>Casting Details</Typography>
                <Typography sx={{ fontSize: "0.7rem", color: TEXTSUB, mt: 0.15 }}>
                  Vacuum build-up, casting progression, load cell readings and weight records
                </Typography>
              </Box>
            </Stack>
          </SectionHeader>

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 780 }}>
              <TableHead>
                <TableRow>
                  <TH sx={{ minWidth: 310, textAlign: "left", pl: "14px" }}>Activity</TH>
                  <TH sx={{ minWidth: 180, textAlign: "left", pl: "14px" }}>Parameter</TH>
                  <THInput>
                    <Stack gap={0.5}>
                      <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Motor No.
                      </Typography>
                      <MotorHeaderInput value={cdMotorIds.m1}
                        onChange={(v) => setCdMotorIds((p) => ({ ...p, m1: v }))} placeholder="e.g. CC-M001" />
                    </Stack>
                  </THInput>
                  <THInput>
                    <Stack gap={0.5}>
                      <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Motor No.
                      </Typography>
                      <MotorHeaderInput value={cdMotorIds.m2}
                        onChange={(v) => setCdMotorIds((p) => ({ ...p, m2: v }))} placeholder="e.g. CC-M002" />
                    </Stack>
                  </THInput>
                </TableRow>
              </TableHead>

              <TableBody>

                {/* ── Row 1: Vacuum Build Up ── */}
                <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                  <TD sx={{ textAlign: "left" }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={1} />
                      <Typography sx={opLabelSx}>Vacuum Build Up</Typography>
                    </Stack>
                  </TD>
                  <TD sx={{ textAlign: "left" }}>
                    <Typography sx={{ fontSize: "0.77rem", color: TEXTSUB, fontStyle: "italic" }}>Vacuum Level</Typography>
                  </TD>
                  <TD><CInput value={cdR1.m1} onChange={(v) => setCdR1((p) => ({ ...p, m1: v }))} placeholder="torr" icon={CompressRoundedIcon} width={145} /></TD>
                  <TD><CInput value={cdR1.m2} onChange={(v) => setCdR1((p) => ({ ...p, m2: v }))} placeholder="torr" icon={CompressRoundedIcon} width={145} /></TD>
                </TableRow>

                {/* ── Row 2: Start Casting ── */}
                <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                  <TD sx={{ textAlign: "left" }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={2} />
                      <Typography sx={opLabelSx}>Start Casting</Typography>
                    </Stack>
                  </TD>
                  <TD sx={{ textAlign: "left" }}>
                    <Typography sx={{ fontSize: "0.77rem", color: TEXTSUB, fontStyle: "italic" }}>Vacuum and Flow Rate</Typography>
                  </TD>
                  <TD><CInput value={cdR2.m1} onChange={(v) => setCdR2((p) => ({ ...p, m1: v }))} placeholder="value" width={145} /></TD>
                  <TD><CInput value={cdR2.m2} onChange={(v) => setCdR2((p) => ({ ...p, m2: v }))} placeholder="value" width={145} /></TD>
                </TableRow>

                {/* ── Row 3: Check vacuum level – dynamic T intervals ── */}
                {cdR3.map((tRow, idx) => (
                  <TableRow key={tRow.id}
                    sx={{ background: rowBg((idx + 2) % 2), ...hoverSx,
                      ...(idx > 0 ? { animation: `${rowIn} 0.22s ease` } : {}) }}>
                    <TD sx={{ textAlign: "left" }}>
                      <Stack direction="row" alignItems="center" gap={0}>
                        {/* Left — activity label only on first row */}
                        <Box sx={{ width: 195, flexShrink: 0, pr: 1.5, borderRight: `1px solid ${alpha(BORDER, 0.7)}` }}>
                          {idx === 0 && (
                            <Stack direction="row" alignItems="flex-start" gap={1.2}>
                              <StepBadge n={3} />
                              <Typography sx={{ ...opLabelSx, fontSize: "0.77rem" }}>
                                Check vacuum level after every 30 minutes
                              </Typography>
                            </Stack>
                          )}
                        </Box>
                        {/* Right — time chip + delete */}
                        <Stack direction="row" alignItems="center" gap={0.8} sx={{ pl: 1.5, flex: 1 }}>
                          <Box sx={{
                            px: 1.1, py: "3px", borderRadius: "5px",
                            background: alpha(CC, 0.1), border: `1px solid ${alpha(CC, 0.2)}`,
                          }}>
                            <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, color: CC, whiteSpace: "nowrap" }}>
                              {tRow.label}
                            </Typography>
                          </Box>
                          {idx > 0 && (
                            <Tooltip title="Remove" arrow placement="top">
                              <IconButton size="small" onClick={() => deleteCdR3Row(tRow.id)}
                                sx={{ color: DANGER, "&:hover": { background: alpha(DANGER, 0.08) }, p: "3px" }}>
                                <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </Stack>
                    </TD>
                    <TD />
                    <TD><CInput value={tRow.m1} onChange={(v) => updateCdR3(tRow.id, "m1", v)} placeholder="torr" icon={CompressRoundedIcon} width={145} /></TD>
                    <TD><CInput value={tRow.m2} onChange={(v) => updateCdR3(tRow.id, "m2", v)} placeholder="torr" icon={CompressRoundedIcon} width={145} /></TD>
                  </TableRow>
                ))}

                {/* Add T interval button */}
                <TableRow>
                  <TD colSpan={4} sx={{ py: 1.2, borderBottom: "1px dashed rgba(21,101,192,0.2)", background: "rgba(21,101,192,0.015)" }}>
                    <AddRowBtn label={`Add Time Interval (${nextTLabel(cdR3)})`} onClick={addCdR3Row} />
                  </TD>
                </TableRow>

                {/* ── Row 4: Casting Duration ── */}
                <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                  <TD sx={{ textAlign: "left" }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={4} />
                      <Typography sx={opLabelSx}>Casting Duration</Typography>
                    </Stack>
                  </TD>
                  <TD>
                    <CInput value={cdR4.param} onChange={(v) => setCdR4((p) => ({ ...p, param: v }))} placeholder="Parameter" width={160} align="left" />
                  </TD>
                  <TD><CInput value={cdR4.m1} onChange={(v) => setCdR4((p) => ({ ...p, m1: v }))} placeholder="value" icon={TimerRoundedIcon} width={145} /></TD>
                  <TD><CInput value={cdR4.m2} onChange={(v) => setCdR4((p) => ({ ...p, m2: v }))} placeholder="value" icon={TimerRoundedIcon} width={145} /></TD>
                </TableRow>

                {/* ── Row 5: Load Cell Reading — 2 sub-rows ── */}
                <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                  <TD rowSpan={2} sx={{ verticalAlign: "top", pt: "14px", textAlign: "left", borderRight: `1px solid ${alpha(BORDER, 0.5)}` }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={5} />
                      <Typography sx={opLabelSx}>Load Cell Reading</Typography>
                    </Stack>
                  </TD>
                  <TD rowSpan={2} sx={{ verticalAlign: "top", pt: "12px", textAlign: "left", borderRight: `1px solid ${alpha(BORDER, 0.5)}` }}>
                    <Typography sx={{ fontSize: "0.77rem", color: TEXTSUB, fontStyle: "italic" }}>Weight</Typography>
                  </TD>
                  {/* Sub-row a: Initial */}
                  <TD>
                    <Stack direction="row" alignItems="center" gap={1} justifyContent="center">
                      <Box sx={{ px: 0.9, py: "2px", borderRadius: "4px", background: alpha(CC, 0.08), border: `1px solid ${alpha(CC, 0.2)}`, flexShrink: 0 }}>
                        <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: CC }}>Initial</Typography>
                      </Box>
                      <CInput value={cdR5a.m1} onChange={(v) => setCdR5a((p) => ({ ...p, m1: v }))} placeholder="kg" icon={ScaleRoundedIcon} width={105} />
                    </Stack>
                  </TD>
                  <TD>
                    <Stack direction="row" alignItems="center" gap={1} justifyContent="center">
                      <Box sx={{ px: 0.9, py: "2px", borderRadius: "4px", background: alpha(CC, 0.08), border: `1px solid ${alpha(CC, 0.2)}`, flexShrink: 0 }}>
                        <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: CC }}>Initial</Typography>
                      </Box>
                      <CInput value={cdR5a.m2} onChange={(v) => setCdR5a((p) => ({ ...p, m2: v }))} placeholder="kg" icon={ScaleRoundedIcon} width={105} />
                    </Stack>
                  </TD>
                </TableRow>
                {/* Sub-row b: Final */}
                <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="center" gap={1} justifyContent="center">
                      <Box sx={{ px: 0.9, py: "2px", borderRadius: "4px", background: alpha(ACCENT, 0.08), border: `1px solid ${alpha(ACCENT, 0.2)}`, flexShrink: 0 }}>
                        <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: ACCENT }}>Final</Typography>
                      </Box>
                      <CInput value={cdR5b.m1} onChange={(v) => setCdR5b((p) => ({ ...p, m1: v }))} placeholder="kg" icon={ScaleRoundedIcon} width={105} />
                    </Stack>
                  </TD>
                  <TD>
                    <Stack direction="row" alignItems="center" gap={1} justifyContent="center">
                      <Box sx={{ px: 0.9, py: "2px", borderRadius: "4px", background: alpha(ACCENT, 0.08), border: `1px solid ${alpha(ACCENT, 0.2)}`, flexShrink: 0 }}>
                        <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: ACCENT }}>Final</Typography>
                      </Box>
                      <CInput value={cdR5b.m2} onChange={(v) => setCdR5b((p) => ({ ...p, m2: v }))} placeholder="kg" icon={ScaleRoundedIcon} width={105} />
                    </Stack>
                  </TD>
                </TableRow>

                {/* ── Row 6: Total Wt. ── */}
                <TableRow sx={{ background: rowBg(1), ...hoverSx, "& td": { borderBottom: "none" } }}>
                  <TD sx={{ textAlign: "left" }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={6} />
                      <Typography sx={opLabelSx}>Total Wt.</Typography>
                    </Stack>
                  </TD>
                  <TD>
                    <CInput value={cdR6.param} onChange={(v) => setCdR6((p) => ({ ...p, param: v }))} placeholder="Parameter" width={160} align="left" />
                  </TD>
                  <TD><CInput value={cdR6.m1} onChange={(v) => setCdR6((p) => ({ ...p, m1: v }))} placeholder="kg" icon={ScaleRoundedIcon} width={145} /></TD>
                  <TD><CInput value={cdR6.m2} onChange={(v) => setCdR6((p) => ({ ...p, m2: v }))} placeholder="kg" icon={ScaleRoundedIcon} width={145} /></TD>
                </TableRow>

              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* ════════════════════════════════════════════════════════════════════
            TABLE 3 — Curing Details
        ════════════════════════════════════════════════════════════════════ */}
        <Card sx={{ animationDelay: "160ms" }}>
          <SectionHeader>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <IconBadge icon={ThermostatRoundedIcon} />
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: TEXT }}>Curing Details</Typography>
                <Typography sx={{ fontSize: "0.7rem", color: TEXTSUB, mt: 0.15 }}>
                  Temperature achievement, curing cycle, soaking and hardness verification
                </Typography>
              </Box>
            </Stack>
          </SectionHeader>

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 780 }}>
              <TableHead>
                <TableRow>
                  <TH sx={{ minWidth: 240, textAlign: "left", pl: "14px" }}>Activity</TH>
                  <TH sx={{ minWidth: 180, textAlign: "left", pl: "14px" }}>Parameter</TH>
                  <THInput>
                    <Stack gap={0.5}>
                      <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Motor No.
                      </Typography>
                      <MotorHeaderInput value={cdCureMotorIds.m1}
                        onChange={(v) => setCdCureMotorIds((p) => ({ ...p, m1: v }))} placeholder="e.g. CC-M001" />
                    </Stack>
                  </THInput>
                  <THInput>
                    <Stack gap={0.5}>
                      <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Motor No.
                      </Typography>
                      <MotorHeaderInput value={cdCureMotorIds.m2}
                        onChange={(v) => setCdCureMotorIds((p) => ({ ...p, m2: v }))} placeholder="e.g. CC-M002" />
                    </Stack>
                  </THInput>
                </TableRow>
              </TableHead>
              <TableBody>

                {/* Row 1: Achieving desired temp */}
                <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                  <TD sx={{ textAlign: "left" }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={1} />
                      <Typography sx={opLabelSx}>Achieving Desired Temperature</Typography>
                    </Stack>
                  </TD>
                  <TD sx={{ textAlign: "left" }}>
                    <Typography sx={{ fontSize: "0.77rem", color: TEXTSUB, fontStyle: "italic" }}>Temp</Typography>
                  </TD>
                  <TD><CInput value={cureR1.m1} onChange={(v) => setCureR1((p) => ({ ...p, m1: v }))} placeholder="°C" icon={ThermostatRoundedIcon} width={145} /></TD>
                  <TD><CInput value={cureR1.m2} onChange={(v) => setCureR1((p) => ({ ...p, m2: v }))} placeholder="°C" icon={ThermostatRoundedIcon} width={145} /></TD>
                </TableRow>

                {/* Row 2: Curing Cycle Follow */}
                <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                  <TD sx={{ textAlign: "left" }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={2} />
                      <Typography sx={opLabelSx}>Curing Cycle Follow</Typography>
                    </Stack>
                  </TD>
                  <TD sx={{ textAlign: "left" }}>
                    <Typography sx={{ fontSize: "0.77rem", color: TEXTSUB, fontStyle: "italic" }}>Temp and Duration</Typography>
                  </TD>
                  <TD><CInput value={cureR2.m1} onChange={(v) => setCureR2((p) => ({ ...p, m1: v }))} placeholder="value" width={145} /></TD>
                  <TD><CInput value={cureR2.m2} onChange={(v) => setCureR2((p) => ({ ...p, m2: v }))} placeholder="value" width={145} /></TD>
                </TableRow>

                {/* Row 3: Soaking */}
                <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                  <TD sx={{ textAlign: "left" }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={3} />
                      <Typography sx={opLabelSx}>Soaking</Typography>
                    </Stack>
                  </TD>
                  <TD sx={{ textAlign: "left" }}>
                    <Typography sx={{ fontSize: "0.77rem", color: TEXTSUB, fontStyle: "italic" }}>Temp and Duration</Typography>
                  </TD>
                  <TD><CInput value={cureR3.m1} onChange={(v) => setCureR3((p) => ({ ...p, m1: v }))} placeholder="value" width={145} /></TD>
                  <TD><CInput value={cureR3.m2} onChange={(v) => setCureR3((p) => ({ ...p, m2: v }))} placeholder="value" width={145} /></TD>
                </TableRow>

                {/* Row 4: Hardness */}
                <TableRow sx={{ background: rowBg(1), ...hoverSx, "& td": { borderBottom: "none" } }}>
                  <TD sx={{ textAlign: "left" }}>
                    <Stack direction="row" alignItems="flex-start" gap={1.2}>
                      <StepBadge n={4} />
                      <Typography sx={opLabelSx}>Hardness</Typography>
                    </Stack>
                  </TD>
                  <TD sx={{ textAlign: "left" }}>
                    <Typography sx={{ fontSize: "0.77rem", color: TEXTSUB, fontStyle: "italic" }}>Shore A Hardness</Typography>
                  </TD>
                  <TD><CInput value={cureR4.m1} onChange={(v) => setCureR4((p) => ({ ...p, m1: v }))} placeholder="value" width={145} /></TD>
                  <TD><CInput value={cureR4.m2} onChange={(v) => setCureR4((p) => ({ ...p, m2: v }))} placeholder="value" width={145} /></TD>
                </TableRow>

              </TableBody>
            </Table>
          </TableContainer>
        </Card>

      </Stack>
    </Box>
  );
};

export default CastingCuringForm;
