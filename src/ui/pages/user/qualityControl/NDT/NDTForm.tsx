// src/ui/pages/user/quality_control/ndt/NDTForm.jsx

import React, { useEffect, useRef, useState } from "react";
import {
  Box, Stack, Typography, TextField, alpha, Button, Tooltip,
  IconButton, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import {
  createDefaultNDTFormState,
  hasAnyNDTValue,
  type NDTDefects,
  type NDTFormState,
} from "../../../../../data/models/user/NDTFormModel";

import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";

const {
  add: AddRoundedIcon,
  delete: DeleteOutlineRoundedIcon,
  save: SaveOutlinedIcon,
  send: SendRoundedIcon,
  warning: WarningAmberRoundedIcon,
  uploadFile: UploadFileRoundedIcon,
  image: ImageRoundedIcon,
  clear: ClearRoundedIcon,
  biotech: BiotechRoundedIcon,
  speed: SpeedRoundedIcon,
  layers: LayersRoundedIcon,
  localFireDepartment: LocalFireDepartmentRoundedIcon,
} = icons.user.qualityControl.ndt.form;

// ─── Palette ──────────────────────────────────────────────────────────────────
const BRAND = {
  primary: "#1B4F72", primaryLight: "#2E86C1", accent: "#148F77",
  warn: "#D4AC0D", danger: "#C0392B", surface: "#F4F6F8",
  border: "#D5D8DC", text: "#1C2833", textSub: "#5D6D7E",
};

const slideIn = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;

// ─── Styled atoms ─────────────────────────────────────────────────────────────
const Card = styled(Box)({
  borderRadius: 16, border: "1px solid rgba(21,101,192,0.18)", background: "#fff",
  overflow: "hidden", boxShadow: "0 2px 18px rgba(21,101,192,0.07)",
  animation: `${slideIn} 0.35s ease both`, marginBottom: 20,
});

const SectionHeader = styled(Box)({
  padding: "13px 20px",
  background: "linear-gradient(135deg,rgba(27,79,114,0.07),rgba(46,134,193,0.03))",
  borderBottom: "1px solid rgba(27,79,114,0.14)",
  display: "flex", alignItems: "center", gap: 12,
});

const TH = styled(TableCell)({
  background: "linear-gradient(135deg,#1B4F72,#2E86C1)", color: "#fff",
  fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.06em",
  textTransform: "uppercase", padding: "11px 14px", whiteSpace: "nowrap",
  borderBottom: "none", verticalAlign: "middle",
});

const TD = styled(TableCell)({
  padding: "8px 12px", borderBottom: "1px solid rgba(213,216,220,0.5)", verticalAlign: "middle",
});

const StaticTD = styled(TD)({
  background: "linear-gradient(135deg,rgba(27,79,114,0.055),rgba(46,134,193,0.03))",
  fontWeight: 700,
});

const rowBg   = (i) => i % 2 === 0 ? "#fff" : "rgba(244,246,248,0.55)";
const hoverSx = { "&:hover": { background: "rgba(27,79,114,0.022)" } };

// ─── Small reusable components ────────────────────────────────────────────────
const IconBadge = ({ icon: Icon, size = 34, iconSize = 18 }) => (
  <Box sx={{ width:size, height:size, borderRadius:"10px", flexShrink:0,
    background:"linear-gradient(135deg,#1B4F72,#2E86C1)",
    display:"flex", alignItems:"center", justifyContent:"center",
    boxShadow:"0 3px 10px rgba(27,79,114,0.3)" }}>
    <Icon sx={{ color:"#fff", fontSize:iconSize }} />
  </Box>
);

const CInput = ({ value, onChange, placeholder = "—", width = 170 }) => (
  <TextField size="small" value={value} onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    sx={{ width, "& .MuiOutlinedInput-root": {
        borderRadius:"7px", background:BRAND.surface, fontSize:"0.75rem",
        "& fieldset": { borderColor:BRAND.border },
        "&:hover fieldset": { borderColor:BRAND.primaryLight },
        "&.Mui-focused fieldset": { borderColor:BRAND.primary, borderWidth:2 },
        "&.Mui-focused": { background:"#fff", boxShadow:"0 0 0 3px rgba(27,79,114,0.1)" },
      },
      "& .MuiInputBase-input": { fontWeight:500, color:BRAND.text, padding:"5px 9px", fontSize:"0.75rem" },
    }}
  />
);

const StaticLabel = ({ text }) => (
  <Typography sx={{ fontSize:"0.78rem", fontWeight:700, color:BRAND.primary }}>{text}</Typography>
);

// ─── Upload cell ─────────────────────────────────────────────────────────────
const UploadCell = ({ files = [], onAdd, onRemove }) => {
  const ref = useRef();
  const handleChange = (e) => {
    const picked = Array.from(e.target.files);
    onAdd(picked);
    e.target.value = "";
  };
  return (
    <Box sx={{ minWidth: 160 }}>
      <input ref={ref} type="file" multiple accept="image/*,video/*,.pdf"
        style={{ display:"none" }} onChange={handleChange} />
      <Stack gap={0.5}>
        {files.map((f, i) => (
          <Stack key={i} direction="row" alignItems="center" gap={0.5}
            sx={{ px:"6px", py:"2px", borderRadius:"6px",
              background:alpha(BRAND.primaryLight,0.08),
              border:`1px solid ${alpha(BRAND.primaryLight,0.2)}`,
              maxWidth:180, overflow:"hidden" }}>
            <ImageRoundedIcon sx={{ fontSize:12, color:BRAND.primaryLight, flexShrink:0 }} />
            <Typography sx={{ fontSize:"0.62rem", color:BRAND.primaryLight, fontWeight:600,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>
              {f.name ?? f}
            </Typography>
            <IconButton size="small" onClick={() => onRemove(i)}
              sx={{ p:0, color:BRAND.danger, "&:hover":{ background:"transparent" } }}>
              <ClearRoundedIcon sx={{ fontSize:11 }} />
            </IconButton>
          </Stack>
        ))}
        <Button size="small" variant="outlined"
          startIcon={<UploadFileRoundedIcon sx={{ fontSize:"13px !important" }} />}
          onClick={() => ref.current.click()}
          sx={{ borderRadius:"7px", fontWeight:700, fontSize:"0.65rem", textTransform:"none",
            px:1.2, py:"3px", borderColor:alpha(BRAND.primaryLight,0.45), color:BRAND.primaryLight,
            "&:hover":{ background:alpha(BRAND.primaryLight,0.06), borderColor:BRAND.primaryLight },
            whiteSpace:"nowrap", alignSelf:"flex-start" }}>
          Upload
        </Button>
      </Stack>
    </Box>
  );
};

// ─── Add Row button ───────────────────────────────────────────────────────────
const AddRowBtn = ({ onClick, label = "Add Row" }) => (
  <Button size="small" variant="text" startIcon={<AddRoundedIcon sx={{ fontSize:"15px !important" }} />}
    onClick={onClick}
    sx={{ fontWeight:700, fontSize:"0.72rem", textTransform:"none", color:BRAND.primaryLight,
      px:1.5, py:"5px", borderRadius:"8px", mt:0.5, ml:0.5,
      "&:hover":{ background:alpha(BRAND.primaryLight,0.08) } }}>
    {label}
  </Button>
);

// ─── Del button ───────────────────────────────────────────────────────────────
const DelBtn = ({ onClick }) => (
  <IconButton size="small" onClick={onClick}
    sx={{ color:BRAND.danger, "&:hover":{ background:alpha(BRAND.danger,0.08) } }}>
    <DeleteOutlineRoundedIcon sx={{ fontSize:17 }} />
  </IconButton>
);

// ─── Data model ───────────────────────────────────────────────────────────────
export const createNDTData = createDefaultNDTFormState;

type Props = {
  initialData?: NDTFormState;
  isEditMode?: boolean;
  onDataChange?: (value: NDTFormState) => void;
  onSaveDraft?: (value: NDTFormState) => Promise<boolean> | boolean;
  onSubmit?: (value: NDTFormState) => Promise<boolean> | boolean;
  actionLoading?: boolean;
};

// ─── NDTForm ──────────────────────────────────────────────────────────────────
const NDTForm = ({
  initialData = createNDTData(),
  isEditMode = false,
  onDataChange,
  onSaveDraft,
  onSubmit,
  actionLoading = false,
}: Props) => {
  const strings = STRINGS.QUALITY_CONTROL.NDT;
  const initData = { ...createNDTData(), ...initialData };

  // Table 1
  const [defects,     setDefects]     = useState(initData.defects);
  // Table 2
  const [mechRows,    setMechRows]    = useState(initData.mechRows?.length ? initData.mechRows : [{ uts:"", elongation:"", eModulus:"", files:[] }]);
  const [mechMean,    setMechMean]    = useState(initData.mechMean);
  const [mechStdDev,  setMechStdDev]  = useState(initData.mechStdDev);
  // Table 3
  const [ifaceRows,   setIfaceRows]   = useState(initData.ifaceRows?.length ? initData.ifaceRows : [{ peelStrength:"", tbs:"", sbs:"", files:[] }]);
  const [ifaceAvg,    setIfaceAvg]    = useState(initData.ifaceAvg);
  const [ifaceStdDev, setIfaceStdDev] = useState(initData.ifaceStdDev);
  // Table 4
  const [burnRows,    setBurnRows]    = useState(initData.burnRows?.length ? initData.burnRows : [{ burnRate:"", density:"", files:[] }]);
  const [burnAvg,     setBurnAvg]     = useState(initData.burnAvg);

  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [draftConfirm,  setDraftConfirm]  = useState(false);
  const onDataChangeRef = useRef(onDataChange);

  const collectData = (): NDTFormState => ({ defects, mechRows, mechMean, mechStdDev, ifaceRows, ifaceAvg, ifaceStdDev, burnRows, burnAvg });

  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    const next = { ...createNDTData(), ...(initialData ?? createNDTData()) };
    setDefects(next.defects);
    setMechRows(next.mechRows?.length ? next.mechRows : [{ uts:"", elongation:"", eModulus:"", files:[] }]);
    setMechMean(next.mechMean);
    setMechStdDev(next.mechStdDev);
    setIfaceRows(next.ifaceRows?.length ? next.ifaceRows : [{ peelStrength:"", tbs:"", sbs:"", files:[] }]);
    setIfaceAvg(next.ifaceAvg);
    setIfaceStdDev(next.ifaceStdDev);
    setBurnRows(next.burnRows?.length ? next.burnRows : [{ burnRate:"", density:"", files:[] }]);
    setBurnAvg(next.burnAvg);
  }, [initialData]);

  useEffect(() => {
    onDataChangeRef.current?.(collectData());
  }, [defects, mechRows, mechMean, mechStdDev, ifaceRows, ifaceAvg, ifaceStdDev, burnRows, burnAvg]);

  // ── helpers ─────────────────────────
  const setDefectField = (key: keyof NDTDefects, field: "observation", val: string) =>
    setDefects((prev) => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  const setDefectFiles = (key: keyof NDTDefects, files: Array<File | string>) =>
    setDefects((prev) => ({ ...prev, [key]: { ...prev[key], files } }));

  const updateRow  = (setter, idx, field, val) =>
    setter((prev) => prev.map((r,i) => i===idx ? { ...r, [field]:val } : r));
  const updateFiles= (setter, idx, newFiles) =>
    setter((prev) => prev.map((r,i) => i===idx ? { ...r, files:newFiles } : r));
  const addRow     = (setter, template) => setter((prev) => [...prev, { ...template }]);
  const removeRow  = (setter, idx)      => setter((prev) => prev.filter((_,i) => i!==idx));

  // canSubmit — any observation or row value filled
  const canSubmit = hasAnyNDTValue(collectData());

  const handleConfirmDraft = async () => {
    setDraftConfirm(false);
    await onSaveDraft?.(collectData());
  };
  const handleConfirmSubmit = async () => {
    setSubmitConfirm(false);
    await onSubmit?.(collectData());
  };

  // ── NDT defect rows config ─────────
  const DEFECT_ROWS = [
    { key:"cracks",       label:"Cracks" },
    { key:"voids",        label:"Voids" },
    { key:"debonds",      label:"De-bonds" },
    { key:"delamination", label:"Delamination" },
    { key:"porosity",     label:"Porosity" },
    { key:"other",        label:"Any other observation" },
  ];

  return (
    <Box sx={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* Edit mode banner */}
      {isEditMode && (
        <Box sx={{ mb:2.5, px:2, py:1.5, borderRadius:2,
          background:alpha(BRAND.danger,0.05), border:`1.5px solid ${alpha(BRAND.danger,0.2)}`,
          display:"flex", alignItems:"center", gap:1.2 }}>
          <WarningAmberRoundedIcon sx={{ fontSize:18, color:BRAND.danger, flexShrink:0 }} />
          <Typography sx={{ fontSize:"0.8rem", color:BRAND.danger, fontWeight:600, lineHeight:1.5 }}>
            You are editing a rejected submission. Previously submitted values are pre-loaded. Review and correct before resubmitting.
          </Typography>
        </Box>
      )}

      {/* ════════════════════ TABLE 1 — NDT ════════════════════ */}
      <Card>
        <SectionHeader>
          <IconBadge icon={BiotechRoundedIcon} />
          <Box>
            <Typography sx={{ fontWeight:800, fontSize:"0.92rem", color:BRAND.text }}>NDT</Typography>
            <Typography sx={{ fontSize:"0.7rem", color:BRAND.textSub, mt:0.15 }}>
              Non-destructive testing — defect observations
            </Typography>
          </Box>
        </SectionHeader>
        <TableContainer sx={{ overflowX:"auto" }}>
          <Table sx={{ minWidth:620 }}>
            <TableHead>
              <TableRow>
                <TH sx={{ minWidth:200 }}>Type of Defects</TH>
                <TH sx={{ minWidth:240 }}>Observation</TH>
                <TH sx={{ minWidth:200 }}>Upload Images / Videos</TH>
              </TableRow>
            </TableHead>
            <TableBody>
              {DEFECT_ROWS.map(({ key, label }, ri) => (
                <TableRow key={key} sx={{ background:rowBg(ri), ...hoverSx, "&:last-child td":{ borderBottom:"none" } }}>
                  <TD>
                    <Typography sx={{ fontWeight:600, fontSize:"0.8rem", color:BRAND.text }}>{label}</Typography>
                  </TD>
                  <TD>
                    <CInput width={280} value={defects[key].observation}
                      onChange={(val) => setDefectField(key,"observation",val)}
                      placeholder="Enter observation" />
                  </TD>
                  <TD>
                    <UploadCell
                      files={defects[key].files}
                      onAdd={(picked) => setDefectFiles(key, [...defects[key].files, ...picked])}
                      onRemove={(i) => setDefectFiles(key, defects[key].files.filter((_,fi) => fi!==i))}
                    />
                  </TD>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ════════════════════ TABLE 2 — Mechanical Properties ════════════════════ */}
      <Card>
        <SectionHeader>
          <IconBadge icon={SpeedRoundedIcon} />
          <Box>
            <Typography sx={{ fontWeight:800, fontSize:"0.92rem", color:BRAND.text }}>Mechanical Properties</Typography>
            <Typography sx={{ fontSize:"0.7rem", color:BRAND.textSub, mt:0.15 }}>
              UTS · Elongation · E-Modulus per sample
            </Typography>
          </Box>
        </SectionHeader>
        <TableContainer sx={{ overflowX:"auto" }}>
          <Table sx={{ minWidth:700 }}>
            <TableHead>
              <TableRow>
                <TH sx={{ minWidth:70 }}>S. No</TH>
                <TH sx={{ minWidth:170 }}>UTS (kgf / cm²)</TH>
                <TH sx={{ minWidth:190 }}>Elongation @ Fmax (%)</TH>
                <TH sx={{ minWidth:190 }}>E-Modulus (kgf / cm²)</TH>
                <TH sx={{ minWidth:180 }}>Upload QA / QC Certificates</TH>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Dynamic rows */}
              {mechRows.map((row, ri) => (
                <TableRow key={ri} sx={{ background:rowBg(ri), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <Typography sx={{ fontSize:"0.78rem", fontWeight:700, color:BRAND.textSub, minWidth:20 }}>
                        {ri + 1}
                      </Typography>
                      {mechRows.length > 1 && <DelBtn onClick={() => removeRow(setMechRows, ri)} />}
                    </Stack>
                  </TD>
                  <TD><CInput value={row.uts}        onChange={(v) => updateRow(setMechRows,ri,"uts",v)} /></TD>
                  <TD><CInput value={row.elongation} onChange={(v) => updateRow(setMechRows,ri,"elongation",v)} /></TD>
                  <TD><CInput value={row.eModulus}   onChange={(v) => updateRow(setMechRows,ri,"eModulus",v)} /></TD>
                  <TD>
                    <UploadCell files={row.files}
                      onAdd={(f) => updateFiles(setMechRows,ri,[...row.files,...f])}
                      onRemove={(i) => updateFiles(setMechRows,ri,row.files.filter((_,fi)=>fi!==i))} />
                  </TD>
                </TableRow>
              ))}
              {/* Mean row */}
              <TableRow sx={{ background:"rgba(27,79,114,0.04)", ...hoverSx }}>
                <StaticTD><StaticLabel text="Mean" /></StaticTD>
                <TD><CInput value={mechMean.uts}        onChange={(v) => setMechMean((p)=>({...p,uts:v}))} /></TD>
                <TD><CInput value={mechMean.elongation} onChange={(v) => setMechMean((p)=>({...p,elongation:v}))} /></TD>
                <TD><CInput value={mechMean.eModulus}   onChange={(v) => setMechMean((p)=>({...p,eModulus:v}))} /></TD>
                <TD />
              </TableRow>
              {/* Std Dev row */}
              <TableRow sx={{ background:"rgba(27,79,114,0.07)", ...hoverSx, "& td":{ borderBottom:"none" } }}>
                <StaticTD><StaticLabel text="Std Dev" /></StaticTD>
                <TD><CInput value={mechStdDev.uts}        onChange={(v) => setMechStdDev((p)=>({...p,uts:v}))} /></TD>
                <TD><CInput value={mechStdDev.elongation} onChange={(v) => setMechStdDev((p)=>({...p,elongation:v}))} /></TD>
                <TD><CInput value={mechStdDev.eModulus}   onChange={(v) => setMechStdDev((p)=>({...p,eModulus:v}))} /></TD>
                <TD />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px:1.5, pb:1.5 }}>
          <AddRowBtn onClick={() => addRow(setMechRows,{ uts:"",elongation:"",eModulus:"",files:[] })} />
        </Box>
      </Card>

      {/* ════════════════════ TABLE 3 — Interface Properties ════════════════════ */}
      <Card>
        <SectionHeader>
          <IconBadge icon={LayersRoundedIcon} />
          <Box>
            <Typography sx={{ fontWeight:800, fontSize:"0.92rem", color:BRAND.text }}>Interface Properties</Typography>
            <Typography sx={{ fontSize:"0.7rem", color:BRAND.textSub, mt:0.15 }}>
              Peel Strength · TBS · SBS per sample
            </Typography>
          </Box>
        </SectionHeader>
        <TableContainer sx={{ overflowX:"auto" }}>
          <Table sx={{ minWidth:700 }}>
            <TableHead>
              <TableRow>
                <TH sx={{ minWidth:100 }}>Sample</TH>
                <TH sx={{ minWidth:170 }}>Peel Strength</TH>
                <TH sx={{ minWidth:130 }}>TBS</TH>
                <TH sx={{ minWidth:170 }}>SBS (kgf / cm²)</TH>
                <TH sx={{ minWidth:180 }}>Upload QA / QC Certificates</TH>
              </TableRow>
            </TableHead>
            <TableBody>
              {ifaceRows.map((row, ri) => (
                <TableRow key={ri} sx={{ background:rowBg(ri), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <Typography sx={{ fontSize:"0.78rem", fontWeight:700, color:BRAND.textSub, minWidth:20 }}>
                        {ri + 1}
                      </Typography>
                      {ifaceRows.length > 1 && <DelBtn onClick={() => removeRow(setIfaceRows,ri)} />}
                    </Stack>
                  </TD>
                  <TD><CInput value={row.peelStrength} onChange={(v) => updateRow(setIfaceRows,ri,"peelStrength",v)} /></TD>
                  <TD><CInput value={row.tbs}          onChange={(v) => updateRow(setIfaceRows,ri,"tbs",v)} /></TD>
                  <TD><CInput value={row.sbs}          onChange={(v) => updateRow(setIfaceRows,ri,"sbs",v)} /></TD>
                  <TD>
                    <UploadCell files={row.files}
                      onAdd={(f) => updateFiles(setIfaceRows,ri,[...row.files,...f])}
                      onRemove={(i) => updateFiles(setIfaceRows,ri,row.files.filter((_,fi)=>fi!==i))} />
                  </TD>
                </TableRow>
              ))}
              {/* Avg row */}
              <TableRow sx={{ background:"rgba(27,79,114,0.04)", ...hoverSx }}>
                <StaticTD><StaticLabel text="Avg" /></StaticTD>
                <TD><CInput value={ifaceAvg.peelStrength} onChange={(v) => setIfaceAvg((p)=>({...p,peelStrength:v}))} /></TD>
                <TD><CInput value={ifaceAvg.tbs}          onChange={(v) => setIfaceAvg((p)=>({...p,tbs:v}))} /></TD>
                <TD><CInput value={ifaceAvg.sbs}          onChange={(v) => setIfaceAvg((p)=>({...p,sbs:v}))} /></TD>
                <TD />
              </TableRow>
              {/* Std Dev row */}
              <TableRow sx={{ background:"rgba(27,79,114,0.07)", ...hoverSx, "& td":{ borderBottom:"none" } }}>
                <StaticTD><StaticLabel text="Std Dev" /></StaticTD>
                <TD><CInput value={ifaceStdDev.peelStrength} onChange={(v) => setIfaceStdDev((p)=>({...p,peelStrength:v}))} /></TD>
                <TD><CInput value={ifaceStdDev.tbs}          onChange={(v) => setIfaceStdDev((p)=>({...p,tbs:v}))} /></TD>
                <TD><CInput value={ifaceStdDev.sbs}          onChange={(v) => setIfaceStdDev((p)=>({...p,sbs:v}))} /></TD>
                <TD />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px:1.5, pb:1.5 }}>
          <AddRowBtn onClick={() => addRow(setIfaceRows,{ peelStrength:"",tbs:"",sbs:"",files:[] })} />
        </Box>
      </Card>

      {/* ════════════════════ TABLE 4 — Burn Rate & Density ════════════════════ */}
      <Card sx={{ mb:0 }}>
        <SectionHeader>
          <IconBadge icon={LocalFireDepartmentRoundedIcon} />
          <Box>
            <Typography sx={{ fontWeight:800, fontSize:"0.92rem", color:BRAND.text }}>Burn Rate and Density</Typography>
            <Typography sx={{ fontSize:"0.7rem", color:BRAND.textSub, mt:0.15 }}>
              Burn rate (mm/s) and density per sample
            </Typography>
          </Box>
        </SectionHeader>
        <TableContainer sx={{ overflowX:"auto" }}>
          <Table sx={{ minWidth:600 }}>
            <TableHead>
              <TableRow>
                <TH sx={{ minWidth:100 }}>Sample No.</TH>
                <TH sx={{ minWidth:170 }}>Burn Rate (mm/s)</TH>
                <TH sx={{ minWidth:150 }}>Density</TH>
                <TH sx={{ minWidth:180 }}>Upload QA / QC Certificates</TH>
              </TableRow>
            </TableHead>
            <TableBody>
              {burnRows.map((row, ri) => (
                <TableRow key={ri} sx={{ background:rowBg(ri), ...hoverSx }}>
                  <TD>
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <Typography sx={{ fontSize:"0.78rem", fontWeight:700, color:BRAND.textSub, minWidth:20 }}>
                        {ri + 1}
                      </Typography>
                      {burnRows.length > 1 && <DelBtn onClick={() => removeRow(setBurnRows,ri)} />}
                    </Stack>
                  </TD>
                  <TD><CInput value={row.burnRate} onChange={(v) => updateRow(setBurnRows,ri,"burnRate",v)} /></TD>
                  <TD><CInput value={row.density}  onChange={(v) => updateRow(setBurnRows,ri,"density",v)} /></TD>
                  <TD>
                    <UploadCell files={row.files}
                      onAdd={(f) => updateFiles(setBurnRows,ri,[...row.files,...f])}
                      onRemove={(i) => updateFiles(setBurnRows,ri,row.files.filter((_,fi)=>fi!==i))} />
                  </TD>
                </TableRow>
              ))}
              {/* Avg row */}
              <TableRow sx={{ background:"rgba(27,79,114,0.04)", ...hoverSx, "& td":{ borderBottom:"none" } }}>
                <StaticTD><StaticLabel text="Avg" /></StaticTD>
                <TD><CInput value={burnAvg.burnRate} onChange={(v) => setBurnAvg((p)=>({...p,burnRate:v}))} /></TD>
                <TD><CInput value={burnAvg.density}  onChange={(v) => setBurnAvg((p)=>({...p,density:v}))} /></TD>
                <TD />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px:1.5, pb:1.5 }}>
          <AddRowBtn onClick={() => addRow(setBurnRows,{ burnRate:"",density:"",files:[] })} />
        </Box>
      </Card>

      {/* ── Action bar ── */}
      <Box sx={{ mt:3, p:"16px 20px", borderRadius:3, background:"#fff",
        border:`1.5px solid ${BRAND.border}`, boxShadow:`0 -2px 16px ${alpha(BRAND.primary,0.06)}` }}>
        <Stack direction={{ xs:"column",sm:"row" }} alignItems={{ sm:"center" }}
          justifyContent="space-between" gap={2}>
          <Box>
            <Typography sx={{ fontSize:"0.78rem", fontWeight:700, color:BRAND.text }}>
              {canSubmit ? strings.READY_TO_SUBMIT : strings.NOT_READY_TO_SUBMIT}
            </Typography>
            <Typography sx={{ fontSize:"0.7rem", color:BRAND.textSub, mt:0.3 }}>
              {isEditMode ? strings.EDIT_MODE_HELP : strings.NORMAL_MODE_HELP}
            </Typography>
          </Box>
          <Stack direction="row" gap={1.5} flexShrink={0}>
            <Button variant="outlined" startIcon={<SaveOutlinedIcon />}
              disabled={actionLoading}
              onClick={() => setDraftConfirm(true)}
              sx={{ borderRadius:2.5, fontWeight:700, fontSize:"0.82rem", textTransform:"none",
                px:2.5, py:1, borderColor:BRAND.primaryLight, color:BRAND.primaryLight,
                "&:hover":{ background:alpha(BRAND.primaryLight,0.06) } }}>
              {strings.SAVE_DRAFT_LABEL}
            </Button>
            <Tooltip title={!canSubmit ? "Fill at least one field before submitting" : ""} arrow placement="top">
              <span>
                <Button variant="contained" startIcon={<SendRoundedIcon />}
                  disabled={!canSubmit || actionLoading} onClick={() => setSubmitConfirm(true)}
                  sx={{ borderRadius:2.5, fontWeight:800, fontSize:"0.82rem", textTransform:"none",
                    px:2.5, py:1,
                    background:`linear-gradient(135deg,${BRAND.accent},#1aaf8f)`,
                    boxShadow:`0 4px 14px ${alpha(BRAND.accent,0.35)}`,
                    "&:hover":{ boxShadow:`0 6px 18px ${alpha(BRAND.accent,0.45)}`, transform:"translateY(-1px)" },
                    "&:disabled":{ background:BRAND.border, boxShadow:"none", color:"#fff" },
                    transition:"all 0.2s" }}>
                  {isEditMode ? strings.RESUBMIT_LABEL : strings.SUBMIT_LABEL}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      <ConfirmAlertDialog open={draftConfirm} severity="info" title={strings.DRAFT_CONFIRM_TITLE}
        message={strings.DRAFT_CONFIRM_MESSAGE}
        confirmLabel={strings.DRAFT_CONFIRM_LABEL} cancelLabel={strings.CONFIRM_CANCEL_LABEL}
        onConfirm={handleConfirmDraft} onCancel={() => setDraftConfirm(false)} />
      <ConfirmAlertDialog open={submitConfirm} severity="warning"
        title={isEditMode ? strings.RESUBMIT_CONFIRM_TITLE : strings.SUBMIT_CONFIRM_TITLE}
        message={isEditMode
          ? strings.RESUBMIT_CONFIRM_MESSAGE
          : strings.SUBMIT_CONFIRM_MESSAGE}
        confirmLabel={isEditMode ? strings.RESUBMIT_CONFIRM_LABEL : strings.SUBMIT_CONFIRM_LABEL}
        cancelLabel={strings.CONFIRM_GO_BACK_LABEL}
        onConfirm={handleConfirmSubmit} onCancel={() => setSubmitConfirm(false)} />
    </Box>
  );
};

export default NDTForm;
