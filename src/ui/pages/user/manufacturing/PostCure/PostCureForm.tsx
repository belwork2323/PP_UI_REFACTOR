// src/ui/pages/user/manufacturing/PostCure/PostCureForm.tsx

import React from "react";
import {
  Box, Stack, Typography, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment, alpha,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import { POST_CURE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/postCure_theme";
import { createPostCureData } from "../../../../../hooks/user/manufacturing/postCureConfig";
import usePostCureFormHook from "../../../../../hooks/user/manufacturing/usePostCureFormHook";
import FormProgressChip from "../../../../components/common/FormProgressChip";
import type { PostCureFormState } from "../../../../../data/models/user/PostCureFormModel";

const {
  handyman: HandymanRoundedIcon,
  input: InputRoundedIcon,
  scale: ScaleRoundedIcon,
  straighten: StraightenRoundedIcon,
} = icons.user.manufacturing.postCure.form;

const S = STRINGS.MANUFACTURING.POST_CURE;
const BRAND = POST_CURE_BRAND;

const slideIn = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;

// ─── Styled atoms ─────────────────────────────────────────────────────────────
const Card = styled(Box)({
  borderRadius: 16,
  border: `1px solid rgba(21,101,192,0.18)`,
  background: "#fff",
  overflow: "hidden",
  boxShadow: `0 2px 18px rgba(21,101,192,0.07)`,
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
  padding: "10px 14px", whiteSpace: "nowrap", borderBottom: "none",
  verticalAlign: "middle", lineHeight: 1.35,
});

const THInput = styled(TableCell)({
  background: "linear-gradient(135deg, #1565C0, #1976D2)",
  padding: "8px 14px", borderBottom: "none", verticalAlign: "middle", minWidth: 200,
});

const TD = styled(TableCell)({
  padding: "9px 13px",
  borderBottom: "1px solid rgba(213,216,220,0.5)",
  verticalAlign: "middle",
});

const rowBg   = (i: number) => i % 2 === 0 ? "#fff" : "rgba(244,246,248,0.6)";
const hoverSx = { "&:hover": { background: "rgba(21,101,192,0.025)" } };

// ─── Compact input ────────────────────────────────────────────────────────────
const CInput = ({ value, onChange, placeholder = "—", width = 185, icon: Icon }: any) => (
  <TextField size="small" value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    sx={{
      width,
      "& .MuiOutlinedInput-root": {
        borderRadius: "8px", background: BRAND.surface, fontSize: "0.76rem",
        "& fieldset": { borderColor: BRAND.border },
        "&:hover fieldset": { borderColor: BRAND.pcLight },
        "&.Mui-focused fieldset": { borderColor: BRAND.pc, borderWidth: 2 },
        "&.Mui-focused": { background: "#fff", boxShadow: `0 0 0 3px rgba(21,101,192,0.1)` },
      },
      "& .MuiInputBase-input": { fontWeight: 500, color: BRAND.text, padding: "5px 8px", fontSize: "0.76rem" },
      "& .MuiInputAdornment-root svg": { fontSize: "13px !important" },
    }}
    InputProps={Icon ? {
      startAdornment: (
        <InputAdornment position="start">
          <Icon sx={{ color: `rgba(21,101,192,0.5)`, fontSize: 13 }} />
        </InputAdornment>
      ),
    } : undefined}
  />
);

// ─── Motor No. header input ───────────────────────────────────────────────────
const MotorHeaderInput = ({ value, onChange }: any) => (
  <TextField size="small" value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder="e.g. PC-M001"
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
const IconBadge = ({ icon: Icon, size = 34, iconSize = 18 }: any) => (
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
const StepBadge = ({ n }: { n: number }) => (
  <Box sx={{
    width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
    background: "linear-gradient(135deg,#1565C0,#1976D2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 1px 4px rgba(21,101,192,0.3)",
  }}>
    <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800, lineHeight: 1 }}>{n}</Typography>
  </Box>
);

// ─── Sub badge (a / b / c …) ──────────────────────────────────────────────────
const SubBadge = ({ label }: { label: string }) => (
  <Box sx={{
    width: 17, height: 17, borderRadius: "4px", flexShrink: 0,
    background: "rgba(21,101,192,0.12)",
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <Typography sx={{ color: BRAND.pc, fontSize: "0.55rem", fontWeight: 800, lineHeight: 1 }}>{label}</Typography>
  </Box>
);

// ─── Nested sub badge (i / ii / iii …) ───────────────────────────────────────
const NestBadge = ({ label }: { label: string }) => (
  <Box sx={{
    px: "5px", height: 16, borderRadius: "4px", flexShrink: 0,
    background: "rgba(20,143,119,0.12)",
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <Typography sx={{ color: "#148F77", fontSize: "0.5rem", fontWeight: 800, lineHeight: 1 }}>{label}</Typography>
  </Box>
);

// ─── Param label ─────────────────────────────────────────────────────────────
const PLabel = ({ text, bold = false }: { text: string; bold?: boolean }) => (
  <Typography sx={{ fontSize: "0.77rem", color: bold ? BRAND.text : BRAND.textSub,
    fontStyle: bold ? "normal" : "italic", fontWeight: bold ? 700 : 400, lineHeight: 1.4 }}>
    {text}
  </Typography>
);

// ─── PostCureForm ─────────────────────────────────────────────────────────────
const PostCureForm = ({
  initialData   = createPostCureData(),
  isEditMode    = false,
  onBlocksChange,
}: {
  initialData?: PostCureFormState;
  isEditMode?: boolean;
  onBlocksChange?: (payload: PostCureFormState) => void;
}) => {
  const {
    motorId, setMotorId,
    r1, setR1, r2, setR2,
    r3a, setR3a, r3b1, setR3b1, r3b2, setR3b2, r3b3, setR3b3,
    r4a, setR4a, r4b1, setR4b1, r4b2, setR4b2, r4b3, setR4b3,
    filled, total,
  } = usePostCureFormHook(initialData, onBlocksChange);

  const opLabelSx = { fontWeight: 700, fontSize: "0.8rem", color: BRAND.text, lineHeight: 1.4 };

  // border helper for rowSpan cells
  const spanBorder = { borderRight: `1px solid ${alpha(BRAND.border, 0.55)}` };

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Page heading */}
      <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
        <IconBadge icon={HandymanRoundedIcon} size={36} iconSize={19} />
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: BRAND.text }}>{S.FORM_TITLE}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.15 }}>
            {S.FORM_SUBTITLE}
          </Typography>
        </Box>
      </Stack>

      <Card>
        <SectionHeader>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <IconBadge icon={HandymanRoundedIcon} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>{S.SECTION_TITLE}</Typography>
              <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.15 }}>
                {S.SECTION_SUBTITLE}
              </Typography>
            </Box>
          </Stack>
          <FormProgressChip
            filledCount={filled}
            totalCount={total}
            accentColor={BRAND.accent}
            warnColor={BRAND.warn}
          />
        </SectionHeader>

        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                <TH sx={{ minWidth: 240 }}>Activity</TH>
                <TH sx={{ minWidth: 220 }}>Parameter</TH>
                <THInput>
                  <Stack gap={0.5}>
                    <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Motor No.
                    </Typography>
                    <MotorHeaderInput value={motorId} onChange={(v: string) => setMotorId(v)} />
                  </Stack>
                </THInput>
              </TableRow>
            </TableHead>

            <TableBody>

              {/* ── Row 1: De-coring ── */}
              <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                <TD>
                  <Stack direction="row" alignItems="center" gap={1.2}>
                    <StepBadge n={1} />
                    <Typography sx={opLabelSx}>De-coring</Typography>
                  </Stack>
                </TD>
                <TD><PLabel text="De-coring Load" /></TD>
                <TD><CInput value={r1} onChange={setR1} placeholder="Enter value" /></TD>
              </TableRow>

              {/* ── Row 2: Trimming ── */}
              <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                <TD>
                  <Stack direction="row" alignItems="center" gap={1.2}>
                    <StepBadge n={2} />
                    <Typography sx={opLabelSx}>Trimming</Typography>
                  </Stack>
                </TD>
                <TD><PLabel text="Dimension of Trimmed Zone" /></TD>
                <TD><CInput value={r2} onChange={setR2} placeholder="mm" icon={StraightenRoundedIcon} /></TD>
              </TableRow>

              {/* ═══════════════════════════════════════════
                  Row 3: LF Filling — 4 sub-rows
                  Activity rowSpan = 4
                  ═══════════════════════════════════════════ */}

              {/* 3a — Inspection */}
              <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                <TD rowSpan={5} sx={{ verticalAlign: "top", pt: "14px", ...spanBorder }}>
                  <Stack direction="row" alignItems="flex-start" gap={1.2}>
                    <StepBadge n={3} />
                    <Typography sx={opLabelSx}>LF Filling</Typography>
                  </Stack>
                </TD>
                <TD>
                  <Stack direction="row" alignItems="center" gap={0.8}>
                    <SubBadge label="1" />
                    <PLabel text="Inspection for any foreign material in LF" />
                  </Stack>
                </TD>
                <TD><CInput value={r3a} onChange={setR3a} placeholder="Observation" /></TD>
              </TableRow>

              {/* 3b — Weight header (no input) */}
              <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                <TD sx={{ background: "rgba(21,101,192,0.03)" }}>
                  <Stack direction="row" alignItems="center" gap={0.8}>
                    <SubBadge label="2" />
                    <PLabel text="Weight of LF material filled" bold />
                  </Stack>
                </TD>
                <TD sx={{ background: "rgba(21,101,192,0.03)" }} />
              </TableRow>

              {/* 3b-i — HE Side */}
              <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                <TD sx={{ pl: "28px" }}>
                  <Stack direction="row" alignItems="center" gap={0.7}>
                    <NestBadge label="i" />
                    <PLabel text="HE Side and Date" />
                  </Stack>
                </TD>
                <TD><CInput value={r3b1} onChange={setR3b1} placeholder="kg / date" icon={ScaleRoundedIcon} /></TD>
              </TableRow>

              {/* 3b-ii — NE Side */}
              <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                <TD sx={{ pl: "28px" }}>
                  <Stack direction="row" alignItems="center" gap={0.7}>
                    <NestBadge label="ii" />
                    <PLabel text="NE Side and Date" />
                  </Stack>
                </TD>
                <TD><CInput value={r3b2} onChange={setR3b2} placeholder="kg / date" icon={ScaleRoundedIcon} /></TD>
              </TableRow>

              {/* 3b-iii — Total */}
              <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                <TD sx={{ pl: "28px" }}>
                  <Stack direction="row" alignItems="center" gap={0.7}>
                    <NestBadge label="iii" />
                    <PLabel text="Total" />
                  </Stack>
                </TD>
                <TD><CInput value={r3b3} onChange={setR3b3} placeholder="kg" icon={ScaleRoundedIcon} /></TD>
              </TableRow>

              {/* ═══════════════════════════════════════════
                  Row 4: Inhibition Resin (IR) Application — 4 sub-rows
                  Activity rowSpan = 4
                  ═══════════════════════════════════════════ */}

              {/* 4a — Type of IR */}
              <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                <TD rowSpan={5} sx={{ verticalAlign: "top", pt: "14px", ...spanBorder }}>
                  <Stack direction="row" alignItems="flex-start" gap={1.2}>
                    <StepBadge n={4} />
                    <Typography sx={opLabelSx}>Inhibition Resin (IR) Application</Typography>
                  </Stack>
                </TD>
                <TD>
                  <Stack direction="row" alignItems="center" gap={0.8}>
                    <SubBadge label="1" />
                    <PLabel text="Type of IR" />
                  </Stack>
                </TD>
                <TD><CInput value={r4a} onChange={setR4a} placeholder="Enter type" /></TD>
              </TableRow>

              {/* 4b — Weight header (no input) */}
              <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                <TD sx={{ background: "rgba(21,101,192,0.03)" }}>
                  <Stack direction="row" alignItems="center" gap={0.8}>
                    <SubBadge label="2" />
                    <PLabel text="Weight of Inhibition applied" bold />
                  </Stack>
                </TD>
                <TD sx={{ background: "rgba(21,101,192,0.03)" }} />
              </TableRow>

              {/* 4b-i — HE Side */}
              <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                <TD sx={{ pl: "28px" }}>
                  <Stack direction="row" alignItems="center" gap={0.7}>
                    <NestBadge label="i" />
                    <PLabel text="HE Side and Date" />
                  </Stack>
                </TD>
                <TD><CInput value={r4b1} onChange={setR4b1} placeholder="kg / date" icon={ScaleRoundedIcon} /></TD>
              </TableRow>

              {/* 4b-ii — NE Side */}
              <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                <TD sx={{ pl: "28px" }}>
                  <Stack direction="row" alignItems="center" gap={0.7}>
                    <NestBadge label="ii" />
                    <PLabel text="NE Side and Date" />
                  </Stack>
                </TD>
                <TD><CInput value={r4b2} onChange={setR4b2} placeholder="kg / date" icon={ScaleRoundedIcon} /></TD>
              </TableRow>

              {/* 4b-iii — Total */}
              <TableRow sx={{ background: rowBg(1), ...hoverSx, "& td": { borderBottom: "none" } }}>
                <TD sx={{ pl: "28px" }}>
                  <Stack direction="row" alignItems="center" gap={0.7}>
                    <NestBadge label="iii" />
                    <PLabel text="Total" />
                  </Stack>
                </TD>
                <TD><CInput value={r4b3} onChange={setR4b3} placeholder="kg" icon={ScaleRoundedIcon} /></TD>
              </TableRow>

            </TableBody>
          </Table>
        </TableContainer>
      </Card>

    </Box>
  );
};

export default PostCureForm;
