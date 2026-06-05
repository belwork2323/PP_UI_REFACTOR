import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Tooltip,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import {
  createDefaultQCDivisionFormState,
  type QCDivisionFormState,
} from "../../../../../data/models/user/QCDivisionFormModel";

const {
  factCheck: FactCheckRoundedIcon,
  save: SaveOutlinedIcon,
  send: SendRoundedIcon,
  warning: WarningAmberRoundedIcon,
} = icons.user.qualityControl.qcDivision.form;

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  accent: "#148F77",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
};

const slideIn = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;

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
  background: "linear-gradient(135deg, rgba(27,79,114,0.07), rgba(46,134,193,0.03))",
  borderBottom: "1px solid rgba(27,79,114,0.14)",
  display: "flex", alignItems: "center", gap: 12,
});

const TH = styled(TableCell)({
  background: "linear-gradient(135deg, #1B4F72, #2E86C1)",
  color: "#fff", fontWeight: 700, fontSize: "0.68rem",
  letterSpacing: "0.06em", textTransform: "uppercase",
  padding: "11px 16px", whiteSpace: "nowrap",
  borderBottom: "none", verticalAlign: "middle",
});

const TD = styled(TableCell)({
  padding: "9px 16px",
  borderBottom: "1px solid rgba(213,216,220,0.5)",
  verticalAlign: "middle",
});

const rowBg = (index: number) => (index % 2 === 0 ? "#fff" : "rgba(244,246,248,0.6)");
const hoverSx = { "&:hover": { background: "rgba(27,79,114,0.022)" } };
const spanBorder = { borderRight: `1px solid ${alpha(BRAND.border, 0.55)}` };

const SubLabel = ({ text }: { text: string }) => (
  <Box
    sx={{
      display: "inline-flex", alignItems: "center",
      px: "6px", height: 17, borderRadius: "4px", mr: 0.7, flexShrink: 0,
      background: "rgba(27,79,114,0.1)",
    }}
  >
    <Typography sx={{ fontSize: "0.55rem", fontWeight: 800, color: BRAND.primary, lineHeight: 1 }}>
      {text}
    </Typography>
  </Box>
);

const StepBadge = ({ n }: { n: number }) => (
  <Box
    sx={{
      width: 22, height: 22, borderRadius: "6px", flexShrink: 0,
      background: "linear-gradient(135deg,#1B4F72,#2E86C1)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 1px 4px rgba(27,79,114,0.3)",
    }}
  >
    <Typography sx={{ color: "#fff", fontSize: "0.62rem", fontWeight: 800, lineHeight: 1 }}>{n}</Typography>
  </Box>
);

const IconBadge = ({ icon: Icon, size = 34, iconSize = 18 }: any) => (
  <Box
    sx={{
      width: size, height: size, borderRadius: "10px", flexShrink: 0,
      background: "linear-gradient(135deg, #1B4F72, #2E86C1)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 3px 10px rgba(27,79,114,0.3)",
    }}
  >
    <Icon sx={{ color: "#fff", fontSize: iconSize }} />
  </Box>
);

const PLabel = ({ text }: { text: string }) => (
  <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub, fontStyle: "italic" }}>{text}</Typography>
);

const OLabel = ({ text }: { text: string }) => (
  <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: BRAND.text, lineHeight: 1.4 }}>{text}</Typography>
);

const CInput = ({ value, onChange, placeholder = "-", width = 200 }: any) => (
  <TextField
    size="small"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
    sx={{
      width,
      "& .MuiOutlinedInput-root": {
        borderRadius: "8px", background: BRAND.surface, fontSize: "0.76rem",
        "& fieldset": { borderColor: BRAND.border },
        "&:hover fieldset": { borderColor: BRAND.primaryLight },
        "&.Mui-focused fieldset": { borderColor: BRAND.primary, borderWidth: 2 },
        "&.Mui-focused": { background: "#fff", boxShadow: "0 0 0 3px rgba(27,79,114,0.1)" },
      },
      "& .MuiInputBase-input": { fontWeight: 500, color: BRAND.text, padding: "5px 9px", fontSize: "0.76rem" },
    }}
  />
);

export const createInProcessData = createDefaultQCDivisionFormState;

type Props = {
  initialData?: QCDivisionFormState;
  isEditMode?: boolean;
  onDataChange?: (value: QCDivisionFormState) => void;
  onSaveDraft?: (value: QCDivisionFormState) => Promise<boolean> | boolean;
  onSubmit?: (value: QCDivisionFormState) => Promise<boolean> | boolean;
  actionLoading?: boolean;
};

const QCInProcessForm = ({
  initialData = createDefaultQCDivisionFormState(),
  isEditMode = false,
  onDataChange,
  onSaveDraft,
  onSubmit,
  actionLoading = false,
}: Props) => {
  const strings = STRINGS.QUALITY_CONTROL.QC_DIVISION;
  const [form, setForm] = useState<QCDivisionFormState>(initialData);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [draftConfirm, setDraftConfirm] = useState(false);
  const onDataChangeRef = useRef(onDataChange);

  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    setForm(initialData ?? createDefaultQCDivisionFormState());
  }, [initialData]);

  const setField = (field: keyof QCDivisionFormState, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      onDataChangeRef.current?.(next);
      return next;
    });
  };

  const allValues = Object.values(form).map((value) => String(value ?? ""));
  const filledCount = allValues.filter((value) => value.trim() !== "").length;
  const canSubmit = filledCount > 0;

  const handleConfirmDraft = async () => {
    setDraftConfirm(false);
    await onSaveDraft?.(form);
  };

  const handleConfirmSubmit = async () => {
    setSubmitConfirm(false);
    await onSubmit?.(form);
  };

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
        <IconBadge icon={FactCheckRoundedIcon} size={36} iconSize={19} />
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: BRAND.text }}>
            {strings.TITLE}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.15 }}>
            {strings.SUBTITLE}
          </Typography>
        </Box>
      </Stack>

      {isEditMode && (
        <Box
          sx={{
            mb: 2.5, px: 2, py: 1.5, borderRadius: 2,
            background: alpha(BRAND.danger, 0.05),
            border: `1.5px solid ${alpha(BRAND.danger, 0.2)}`,
            display: "flex", alignItems: "center", gap: 1.2,
          }}
        >
          <WarningAmberRoundedIcon sx={{ fontSize: 18, color: BRAND.danger, flexShrink: 0 }} />
          <Typography sx={{ fontSize: "0.8rem", color: BRAND.danger, fontWeight: 600, lineHeight: 1.5 }}>
            {strings.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      )}

      <Card>
        <SectionHeader>
          <IconBadge icon={FactCheckRoundedIcon} />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
              In Process Checks
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.15 }}>
              {filledCount} / {allValues.length} fields filled
            </Typography>
          </Box>
        </SectionHeader>

        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TH sx={{ minWidth: 240 }}>Operation</TH>
                <TH sx={{ minWidth: 220 }}>Parameters</TH>
                <TH sx={{ minWidth: 220 }}>Actual Value</TH>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                <TD rowSpan={2} sx={{ verticalAlign: "top", pt: "14px", ...spanBorder }}>
                  <Stack direction="row" alignItems="flex-start" gap={1.2}>
                    <StepBadge n={1} />
                    <OLabel text="Raw Material" />
                  </Stack>
                </TD>
                <TD><PLabel text="Particle Size" /></TD>
                <TD><CInput value={form.rm_particleSize} onChange={(v: string) => setField("rm_particleSize", v)} placeholder="Enter value" /></TD>
              </TableRow>
              <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                <TD><PLabel text="Moisture" /></TD>
                <TD><CInput value={form.rm_moisture} onChange={(v: string) => setField("rm_moisture", v)} placeholder="Enter value" /></TD>
              </TableRow>

              <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                <TD rowSpan={3} sx={{ verticalAlign: "top", pt: "14px", ...spanBorder }}>
                  <Stack direction="row" alignItems="flex-start" gap={1.2}>
                    <StepBadge n={2} />
                    <OLabel text="Mixing" />
                  </Stack>
                </TD>
                <TD><Stack direction="row" alignItems="center"><SubLabel text="Pre-mix" /><PLabel text="Homogeneity" /></Stack></TD>
                <TD><CInput value={form.mx_pre_homogeneity} onChange={(v: string) => setField("mx_pre_homogeneity", v)} placeholder="Enter value" /></TD>
              </TableRow>
              <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                <TD><Stack direction="row" alignItems="center"><SubLabel text="Pre-mix" /><PLabel text="Moisture" /></Stack></TD>
                <TD><CInput value={form.mx_pre_moisture} onChange={(v: string) => setField("mx_pre_moisture", v)} placeholder="Enter value" /></TD>
              </TableRow>
              <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                <TD><Stack direction="row" alignItems="center"><SubLabel text="Final-mix" /><PLabel text="Viscosity" /></Stack></TD>
                <TD><CInput value={form.mx_fin_viscosity} onChange={(v: string) => setField("mx_fin_viscosity", v)} placeholder="Enter value" /></TD>
              </TableRow>

              <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                <TD>
                  <Stack direction="row" alignItems="center" gap={1.2}>
                    <StepBadge n={3} />
                    <OLabel text="Linear Preparation" />
                  </Stack>
                </TD>
                <TD><PLabel text="Moisture" /></TD>
                <TD><CInput value={form.lp_moisture} onChange={(v: string) => setField("lp_moisture", v)} placeholder="Enter value" /></TD>
              </TableRow>

              <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                <TD rowSpan={2} sx={{ verticalAlign: "top", pt: "14px", ...spanBorder }}>
                  <Stack direction="row" alignItems="flex-start" gap={1.2}>
                    <StepBadge n={4} />
                    <OLabel text="Casting" />
                  </Stack>
                </TD>
                <TD><PLabel text="Flow Rate" /></TD>
                <TD><CInput value={form.cast_flowRate} onChange={(v: string) => setField("cast_flowRate", v)} placeholder="Enter value" /></TD>
              </TableRow>
              <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                <TD><PLabel text="Viscosity after every 30 min" /></TD>
                <TD><CInput value={form.cast_viscosity} onChange={(v: string) => setField("cast_viscosity", v)} placeholder="Enter value" /></TD>
              </TableRow>

              <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                <TD>
                  <Stack direction="row" alignItems="center" gap={1.2}>
                    <StepBadge n={5} />
                    <OLabel text="De-coring" />
                  </Stack>
                </TD>
                <TD><PLabel text="De-coring Load" /></TD>
                <TD><CInput value={form.dc_load} onChange={(v: string) => setField("dc_load", v)} placeholder="Enter value" /></TD>
              </TableRow>

              <TableRow sx={{ background: rowBg(1), ...hoverSx }}>
                <TD>
                  <Stack direction="row" alignItems="center" gap={1.2}>
                    <StepBadge n={6} />
                    <OLabel text="Trimming" />
                  </Stack>
                </TD>
                <TD><PLabel text="Dimension" /></TD>
                <TD><CInput value={form.tr_dimension} onChange={(v: string) => setField("tr_dimension", v)} placeholder="Enter value" /></TD>
              </TableRow>

              <TableRow sx={{ background: rowBg(0), ...hoverSx }}>
                <TD>
                  <Stack direction="row" alignItems="center" gap={1.2}>
                    <StepBadge n={7} />
                    <OLabel text="LF Filling" />
                  </Stack>
                </TD>
                <TD><PLabel text="Mechanical Properties" /></TD>
                <TD><CInput value={form.lf_mechProps} onChange={(v: string) => setField("lf_mechProps", v)} placeholder="Enter value" /></TD>
              </TableRow>

              <TableRow sx={{ background: rowBg(1), ...hoverSx, "& td": { borderBottom: "none" } }}>
                <TD>
                  <Stack direction="row" alignItems="center" gap={1.2}>
                    <StepBadge n={8} />
                    <OLabel text="Inhibitor Resin" />
                  </Stack>
                </TD>
                <TD><PLabel text="Mechanical Properties" /></TD>
                <TD><CInput value={form.ir_mechProps} onChange={(v: string) => setField("ir_mechProps", v)} placeholder="Enter value" /></TD>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Box
        sx={{
          mt: 3, p: "16px 20px", borderRadius: 3,
          background: "#fff", border: `1.5px solid ${BRAND.border}`,
          boxShadow: `0 -2px 16px ${alpha(BRAND.primary, 0.06)}`,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: BRAND.text }}>
              {filledCount} / {allValues.length} fields filled
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.3 }}>
              {canSubmit ? strings.READY_TO_SUBMIT : strings.NOT_READY_TO_SUBMIT}
            </Typography>
          </Box>

          <Stack direction="row" gap={1.5} flexShrink={0}>
            <Tooltip title={strings.DRAFT_CONFIRM_MESSAGE} arrow placement="top">
              <span>
                <Button
                  variant="outlined"
                  startIcon={<SaveOutlinedIcon />}
                  disabled={filledCount === 0 || actionLoading}
                  onClick={() => setDraftConfirm(true)}
                  sx={{
                    borderRadius: 2.5, fontWeight: 700, fontSize: "0.82rem",
                    textTransform: "none", px: 2.5, py: 1,
                    borderColor: BRAND.primaryLight, color: BRAND.primaryLight,
                    "&:hover": { background: alpha(BRAND.primaryLight, 0.06) },
                    "&:disabled": { borderColor: BRAND.border, color: BRAND.border },
                  }}
                >
                  {strings.SAVE_DRAFT_LABEL}
                </Button>
              </span>
            </Tooltip>

            <Tooltip title={!canSubmit ? strings.EMPTY_FORM_ERROR : ""} arrow placement="top">
              <span>
                <Button
                  variant="contained"
                  startIcon={<SendRoundedIcon />}
                  disabled={!canSubmit || actionLoading}
                  onClick={() => setSubmitConfirm(true)}
                  sx={{
                    borderRadius: 2.5, fontWeight: 800, fontSize: "0.82rem",
                    textTransform: "none", px: 2.5, py: 1,
                    background: `linear-gradient(135deg, ${BRAND.accent}, #1aaf8f)`,
                    boxShadow: `0 4px 14px ${alpha(BRAND.accent, 0.35)}`,
                    "&:hover": { boxShadow: `0 6px 18px ${alpha(BRAND.accent, 0.45)}`, transform: "translateY(-1px)" },
                    "&:disabled": { background: BRAND.border, boxShadow: "none", color: "#fff" },
                    transition: "all 0.2s",
                  }}
                >
                  {isEditMode ? strings.RESUBMIT_LABEL : strings.SUBMIT_LABEL}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      <ConfirmAlertDialog
        open={draftConfirm}
        severity="info"
        title={strings.DRAFT_CONFIRM_TITLE}
        message={strings.DRAFT_CONFIRM_MESSAGE}
        confirmLabel={strings.DRAFT_CONFIRM_LABEL}
        cancelLabel={strings.CONFIRM_CANCEL_LABEL}
        onConfirm={handleConfirmDraft}
        onCancel={() => setDraftConfirm(false)}
      />

      <ConfirmAlertDialog
        open={submitConfirm}
        severity="warning"
        title={isEditMode ? strings.RESUBMIT_CONFIRM_TITLE : strings.SUBMIT_CONFIRM_TITLE}
        message={isEditMode ? strings.RESUBMIT_CONFIRM_MESSAGE : strings.SUBMIT_CONFIRM_MESSAGE}
        confirmLabel={isEditMode ? strings.RESUBMIT_CONFIRM_LABEL : strings.SUBMIT_CONFIRM_LABEL}
        cancelLabel={strings.CONFIRM_GO_BACK_LABEL}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setSubmitConfirm(false)}
      />
    </Box>
  );
};

export default QCInProcessForm;
