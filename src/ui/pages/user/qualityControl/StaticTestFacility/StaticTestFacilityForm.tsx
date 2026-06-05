import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  alpha,
  Button,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import {
  createDefaultStaticTestFacilityFormState,
  hasAnyStaticTestFacilityValue,
  type StaticTestFacilityFormState,
} from "../../../../../data/models/user/StaticTestFacilityFormModel";

import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";

const {
  rocketLaunch: RocketLaunchRoundedIcon,
  save: SaveOutlinedIcon,
  send: SendRoundedIcon,
  warning: WarningAmberRoundedIcon,
  functions: FunctionsRoundedIcon,
} = icons.user.qualityControl.staticTestFacility.form;

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  accent: "#148F77",
  warn: "#D4AC0D",
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
  background:
    "linear-gradient(135deg,rgba(27,79,114,0.07),rgba(46,134,193,0.03))",
  borderBottom: "1px solid rgba(27,79,114,0.14)",
  display: "flex",
  alignItems: "center",
  gap: 12,
});

const TH = styled(TableCell)({
  background: "linear-gradient(135deg,#1B4F72,#2E86C1)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.68rem",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  padding: "11px 18px",
  whiteSpace: "nowrap",
  borderBottom: "none",
  verticalAlign: "middle",
});

const TD = styled(TableCell)({
  padding: "10px 18px",
  borderBottom: "1px solid rgba(213,216,220,0.5)",
  verticalAlign: "middle",
});

const FormulaTD = styled(TableCell)({
  padding: "10px 18px",
  borderBottom: "none",
  verticalAlign: "middle",
  background: "linear-gradient(135deg,rgba(20,143,119,0.07),rgba(20,143,119,0.03))",
});

const RowLabel = ({ letter, text }: { letter: string; text: string }) => (
  <Stack direction="row" alignItems="flex-start" gap={1.2}>
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: "7px",
        flexShrink: 0,
        background: "linear-gradient(135deg,#1B4F72,#2E86C1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 1px 5px rgba(27,79,114,0.3)",
      }}
    >
      <Typography
        sx={{ color: "#fff", fontSize: "0.65rem", fontWeight: 800, lineHeight: 1 }}
      >
        {letter}
      </Typography>
    </Box>
    <Typography
      sx={{
        fontSize: "0.82rem",
        fontWeight: 600,
        color: BRAND.text,
        lineHeight: 1.45,
        pt: "2px",
      }}
    >
      {text}
    </Typography>
  </Stack>
);

const IconBadge = ({ icon: Icon, size = 34, iconSize = 18 }: any) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: "10px",
      flexShrink: 0,
      background: "linear-gradient(135deg,#1B4F72,#2E86C1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 3px 10px rgba(27,79,114,0.3)",
    }}
  >
    <Icon sx={{ color: "#fff", fontSize: iconSize }} />
  </Box>
);

const CInput = ({
  value,
  onChange,
  placeholder = "-",
  width = 220,
  readOnly = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  width?: number;
  readOnly?: boolean;
}) => (
  <TextField
    size="small"
    value={value}
    onChange={readOnly ? undefined : (event) => onChange?.(event.target.value)}
    placeholder={placeholder}
    InputProps={{ readOnly }}
    sx={{
      width,
      "& .MuiOutlinedInput-root": {
        borderRadius: "8px",
        background: readOnly ? alpha(BRAND.accent, 0.06) : BRAND.surface,
        fontSize: "0.78rem",
        "& fieldset": {
          borderColor: readOnly ? alpha(BRAND.accent, 0.3) : BRAND.border,
        },
        "&:hover fieldset": {
          borderColor: readOnly
            ? alpha(BRAND.accent, 0.4)
            : BRAND.primaryLight,
        },
        "&.Mui-focused fieldset": {
          borderColor: BRAND.primary,
          borderWidth: 2,
        },
        "&.Mui-focused": {
          background: "#fff",
          boxShadow: "0 0 0 3px rgba(27,79,114,0.1)",
        },
      },
      "& .MuiInputBase-input": {
        fontWeight: readOnly ? 800 : 500,
        color: readOnly ? BRAND.accent : BRAND.text,
        padding: "6px 10px",
        fontSize: "0.78rem",
      },
    }}
  />
);

const calcH = (form: StaticTestFacilityFormState) => {
  const toNum = (value: string | undefined) => parseFloat(value ?? "") || 0;
  const A = toNum(form.a_emptyMotor);
  const B = toNum(form.b_rubberDust);
  const C = toNum(form.c_linearCoating);
  const D = toNum(form.d_looseFlapFill);
  const E = toNum(form.e_extraRubber);
  const F = toNum(form.f_inhibition);
  const G = toNum(form.g_finalWeight);
  const result = G - (A - B + C + D - E + F);
  if (!G && !A && !B && !C && !D && !E && !F) return "";
  return Number.isNaN(result)
    ? ""
    : result.toFixed(4).replace(/\.?0+$/, "");
};

type Props = {
  initialData?: StaticTestFacilityFormState;
  isEditMode?: boolean;
  onDataChange?: (value: StaticTestFacilityFormState) => void;
  onSaveDraft?: (value: StaticTestFacilityFormState) => Promise<boolean> | boolean;
  onSubmit?: (value: StaticTestFacilityFormState) => Promise<boolean> | boolean;
  actionLoading?: boolean;
};

const STFForm = ({
  initialData = createDefaultStaticTestFacilityFormState(),
  isEditMode = false,
  onDataChange,
  onSaveDraft,
  onSubmit,
  actionLoading = false,
}: Props) => {
  const strings = STRINGS.QUALITY_CONTROL.STATIC_TEST_FACILITY;
  const [form, setForm] = useState<StaticTestFacilityFormState>(initialData);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [draftConfirm, setDraftConfirm] = useState(false);
  const onDataChangeRef = useRef(onDataChange);

  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    setForm(initialData ?? createDefaultStaticTestFacilityFormState());
  }, [initialData]);

  const setField = (field: keyof StaticTestFacilityFormState, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      const hValue = calcH(next);
      const payload = { ...next, h_propellent: hValue };
      onDataChangeRef.current?.(payload);
      return payload;
    });
  };

  const hPropellent = calcH(form);
  const payload = { ...form, h_propellent: hPropellent };
  const filledValues = [
    form.motorNo,
    form.a_emptyMotor,
    form.b_rubberDust,
    form.c_linearCoating,
    form.d_looseFlapFill,
    form.e_extraRubber,
    form.f_inhibition,
    form.g_finalWeight,
  ];
  const filledCount = filledValues.filter((value) => value.trim() !== "").length;
  const canSubmit = hasAnyStaticTestFacilityValue(payload);

  const handleConfirmDraft = async () => {
    setDraftConfirm(false);
    await onSaveDraft?.(payload);
  };

  const handleConfirmSubmit = async () => {
    setSubmitConfirm(false);
    await onSubmit?.(payload);
  };

  const rows = [
    {
      letter: "A",
      label: "Weight of empty motor",
      field: "a_emptyMotor" as const,
    },
    {
      letter: "B",
      label: "Weight of rubber dust after abrading",
      field: "b_rubberDust" as const,
    },
    {
      letter: "C",
      label: "Weight of linear coating material",
      field: "c_linearCoating" as const,
    },
    {
      letter: "D",
      label: "Weight of loose flap filling material",
      field: "d_looseFlapFill" as const,
    },
    {
      letter: "E",
      label: "Weight of extra rubber trimmed",
      field: "e_extraRubber" as const,
    },
    {
      letter: "F",
      label: "Weight of inhibition material applied",
      field: "f_inhibition" as const,
    },
    {
      letter: "G",
      label: "Final weight of motor after all operations",
      field: "g_finalWeight" as const,
    },
  ];

  return (
    <Box sx={{ fontFamily: "'DM Sans',sans-serif" }}>
      {isEditMode && (
        <Box
          sx={{
            mb: 2.5,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            background: alpha(BRAND.danger, 0.05),
            border: `1.5px solid ${alpha(BRAND.danger, 0.2)}`,
            display: "flex",
            alignItems: "center",
            gap: 1.2,
          }}
        >
          <WarningAmberRoundedIcon
            sx={{ fontSize: 18, color: BRAND.danger, flexShrink: 0 }}
          />
          <Typography
            sx={{
              fontSize: "0.8rem",
              color: BRAND.danger,
              fontWeight: 600,
              lineHeight: 1.5,
            }}
          >
            {strings.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      )}

      <Card>
        <SectionHeader>
          <IconBadge icon={RocketLaunchRoundedIcon} />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
              {strings.TITLE}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.15 }}>
              {filledCount} / {filledValues.length} fields filled
              {hPropellent !== "" && " · Propellant weight auto-calculated"}
            </Typography>
          </Box>
        </SectionHeader>

        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 540 }}>
            <TableHead>
              <TableRow>
                <TH sx={{ minWidth: 260 }}>Details</TH>
                <TH sx={{ minWidth: 240 }}>Motor No.</TH>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow
                  key={row.letter}
                  sx={{
                    background: index % 2 === 0 ? "#fff" : "rgba(244,246,248,0.55)",
                    "&:hover": { background: "rgba(27,79,114,0.022)" },
                  }}
                >
                  <TD>
                    <RowLabel letter={row.letter} text={row.label} />
                  </TD>
                  <TD>
                    <CInput
                      value={form[row.field] ?? ""}
                      onChange={(value) => setField(row.field, value)}
                      placeholder="Enter weight (kg)"
                    />
                  </TD>
                </TableRow>
              ))}

              <TableRow sx={{ "&:hover": { background: "rgba(20,143,119,0.025)" } }}>
                <FormulaTD>
                  <Stack direction="row" alignItems="flex-start" gap={1.2}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: "7px",
                        flexShrink: 0,
                        background: "linear-gradient(135deg,#148F77,#1aaf8f)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 5px rgba(20,143,119,0.35)",
                      }}
                    >
                      <Typography
                        sx={{ color: "#fff", fontSize: "0.65rem", fontWeight: 800, lineHeight: 1 }}
                      >
                        H
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: BRAND.accent,
                          lineHeight: 1.4,
                        }}
                      >
                        Weight of Propellant (Kg)
                      </Typography>
                      <Stack direction="row" alignItems="center" gap={0.6} mt={0.4}>
                        <FunctionsRoundedIcon
                          sx={{ fontSize: 13, color: alpha(BRAND.accent, 0.65) }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.68rem",
                            color: alpha(BRAND.accent, 0.8),
                            fontStyle: "italic",
                            fontFamily: "monospace",
                          }}
                        >
                          H = G - ( A - B + C + D - E + F )
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </FormulaTD>
                <FormulaTD>
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <CInput value={hPropellent} readOnly placeholder="Auto-calculated" />
                    {hPropellent !== "" && (
                      <Chip
                        label="Auto"
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          background: alpha(BRAND.accent, 0.1),
                          color: BRAND.accent,
                          border: `1px solid ${alpha(BRAND.accent, 0.25)}`,
                        }}
                      />
                    )}
                  </Stack>
                </FormulaTD>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Box
        sx={{
          mt: 3,
          p: "16px 20px",
          borderRadius: 3,
          background: "#fff",
          border: `1.5px solid ${BRAND.border}`,
          boxShadow: `0 -2px 16px ${alpha(BRAND.primary, 0.06)}`,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          gap={2}
        >
          <Box>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: BRAND.text }}>
              {filledCount} / {filledValues.length} fields filled
              {hPropellent !== "" && ` · H = ${hPropellent} kg`}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.3 }}>
              {canSubmit ? strings.READY_TO_SUBMIT : strings.NOT_READY_TO_SUBMIT}
            </Typography>
          </Box>
          <Stack direction="row" gap={1.5} flexShrink={0}>
            <Button
              variant="outlined"
              startIcon={<SaveOutlinedIcon />}
              disabled={filledCount === 0 || actionLoading}
              onClick={() => setDraftConfirm(true)}
              sx={{
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: "0.82rem",
                textTransform: "none",
                px: 2.5,
                py: 1,
                borderColor: BRAND.primaryLight,
                color: BRAND.primaryLight,
                "&:hover": { background: alpha(BRAND.primaryLight, 0.06) },
                "&:disabled": { borderColor: BRAND.border, color: BRAND.border },
              }}
            >
              {strings.SAVE_DRAFT_LABEL}
            </Button>
            <Tooltip
              title={!canSubmit ? "Fill at least one field before submitting" : ""}
              arrow
              placement="top"
            >
              <span>
                <Button
                  variant="contained"
                  startIcon={<SendRoundedIcon />}
                  disabled={!canSubmit || actionLoading}
                  onClick={() => setSubmitConfirm(true)}
                  sx={{
                    borderRadius: 2.5,
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    textTransform: "none",
                    px: 2.5,
                    py: 1,
                    background: `linear-gradient(135deg,${BRAND.accent},#1aaf8f)`,
                    boxShadow: `0 4px 14px ${alpha(BRAND.accent, 0.35)}`,
                    "&:hover": {
                      boxShadow: `0 6px 18px ${alpha(BRAND.accent, 0.45)}`,
                      transform: "translateY(-1px)",
                    },
                    "&:disabled": {
                      background: BRAND.border,
                      boxShadow: "none",
                      color: "#fff",
                    },
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
        title={
          isEditMode ? strings.RESUBMIT_CONFIRM_TITLE : strings.SUBMIT_CONFIRM_TITLE
        }
        message={
          isEditMode
            ? strings.RESUBMIT_CONFIRM_MESSAGE
            : strings.SUBMIT_CONFIRM_MESSAGE
        }
        confirmLabel={
          isEditMode ? strings.RESUBMIT_CONFIRM_LABEL : strings.SUBMIT_CONFIRM_LABEL
        }
        cancelLabel={strings.CONFIRM_GO_BACK_LABEL}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setSubmitConfirm(false)}
      />
    </Box>
  );
};

export default STFForm;
