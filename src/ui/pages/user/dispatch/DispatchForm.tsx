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
  IconButton,
  List,
  ListItem,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { icons } from "../../../../app/theme/icons";
import { STRINGS } from "../../../../app/config/strings";
import {
  createDefaultDispatchFormState,
  hasAnyDispatchValue,
  type DispatchFormState,
  type DispatchSupportingFile,
} from "../../../../data/models/user/DispatchFormModel";

import ConfirmAlertDialog from "../../../components/common/ConfirmAlertDialog";

const {
  localShipping: LocalShippingRoundedIcon,
  save: SaveOutlinedIcon,
  send: SendRoundedIcon,
  warning: WarningAmberRoundedIcon,
  uploadFile: UploadFileRoundedIcon,
  delete: DeleteOutlineRoundedIcon,
  attachFile: AttachFileRoundedIcon,
  insertDriveFile: InsertDriveFileOutlinedIcon,
} = icons.user.dispatch.form;

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
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
  background: "linear-gradient(135deg,rgba(27,79,114,0.07),rgba(46,134,193,0.03))",
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

const RowLabel = ({ text }: { text: string }) => (
  <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: BRAND.text, lineHeight: 1.45 }}>{text}</Typography>
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
  width = "100%",
  multiline = false,
  rows = 1,
}: any) => (
  <TextField
    size="small"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    multiline={multiline}
    rows={multiline ? rows : undefined}
    sx={{
      width,
      "& .MuiOutlinedInput-root": {
        borderRadius: "8px",
        background: BRAND.surface,
        fontSize: "0.78rem",
        "& fieldset": { borderColor: BRAND.border },
        "&:hover fieldset": { borderColor: BRAND.primaryLight },
        "&.Mui-focused fieldset": { borderColor: BRAND.primary, borderWidth: 2 },
        "&.Mui-focused": { background: "#fff", boxShadow: "0 0 0 3px rgba(27,79,114,0.1)" },
      },
      "& .MuiInputBase-input": {
        fontWeight: 500,
        color: BRAND.text,
        padding: "6px 10px",
        fontSize: "0.78rem",
      },
    }}
  />
);

export const createDispatchData = createDefaultDispatchFormState;

type Props = {
  initialData?: DispatchFormState;
  isEditMode?: boolean;
  onDataChange?: (value: DispatchFormState) => void;
  onSaveDraft?: (value: DispatchFormState) => Promise<boolean> | boolean;
  onSubmit?: (value: DispatchFormState) => Promise<boolean> | boolean;
  actionLoading?: boolean;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DispatchForm = ({
  initialData = createDispatchData(),
  isEditMode = false,
  onDataChange,
  onSaveDraft,
  onSubmit,
  actionLoading = false,
}: Props) => {
  const strings = STRINGS.DISPATCH;
  const init = { ...createDispatchData(), ...initialData };

  const [castingDate, setCastingDate] = useState(init.castingDate);
  const [finalWeight, setFinalWeight] = useState(init.finalWeight);
  const [waiversIfAny, setWaiversIfAny] = useState(init.waiversIfAny);
  const [ndtCommitteeMomNumber, setNdtCommitteeMomNumber] = useState(init.ndtCommitteeMomNumber);
  const [finalAcceptanceMomNumber, setFinalAcceptanceMomNumber] = useState(init.finalAcceptanceMomNumber);
  const [deviationDetails, setDeviationDetails] = useState(init.deviationDetails);
  const [dispatchDate, setDispatchDate] = useState(init.dispatchDate);
  const [dispatchLocation, setDispatchLocation] = useState(init.dispatchLocation);
  const [supportingFiles, setSupportingFiles] = useState<DispatchSupportingFile[]>(init.supportingFiles ?? []);

  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [draftConfirm, setDraftConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onDataChangeRef = useRef(onDataChange);

  const collectData = (): DispatchFormState => ({
    castingDate,
    finalWeight,
    waiversIfAny,
    ndtCommitteeMomNumber,
    finalAcceptanceMomNumber,
    deviationDetails,
    dispatchDate,
    dispatchLocation,
    supportingFiles,
  });

  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    const next = { ...createDispatchData(), ...(initialData ?? createDispatchData()) };
    setCastingDate(next.castingDate);
    setFinalWeight(next.finalWeight);
    setWaiversIfAny(next.waiversIfAny);
    setNdtCommitteeMomNumber(next.ndtCommitteeMomNumber);
    setFinalAcceptanceMomNumber(next.finalAcceptanceMomNumber);
    setDeviationDetails(next.deviationDetails);
    setDispatchDate(next.dispatchDate);
    setDispatchLocation(next.dispatchLocation);
    setSupportingFiles(next.supportingFiles ?? []);
  }, [initialData]);

  useEffect(() => {
    onDataChangeRef.current?.(collectData());
  }, [
    castingDate,
    finalWeight,
    waiversIfAny,
    ndtCommitteeMomNumber,
    finalAcceptanceMomNumber,
    deviationDetails,
    dispatchDate,
    dispatchLocation,
    supportingFiles,
  ]);

  const textValues = [
    castingDate,
    finalWeight,
    waiversIfAny,
    ndtCommitteeMomNumber,
    finalAcceptanceMomNumber,
    deviationDetails,
    dispatchDate,
    dispatchLocation,
  ];
  const filledCount = textValues.filter((v) => v.trim() !== "").length;
  const canSubmit = hasAnyDispatchValue(collectData());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const mapped: DispatchSupportingFile[] = selected.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      file: f,
      filePath: f.name,
      fileType: f.type,
    }));
    setSupportingFiles((prev) => [...prev, ...mapped]);
    e.target.value = "";
  };

  const handleRemoveFile = (idx: number) => {
    setSupportingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmDraft = async () => {
    setDraftConfirm(false);
    await onSaveDraft?.(collectData());
  };

  const handleConfirmSubmit = async () => {
    setSubmitConfirm(false);
    await onSubmit?.(collectData());
  };

  const ROWS = [
    { label: strings.FIELD_CASTING_DATE, value: castingDate, set: setCastingDate, placeholder: "e.g. 01 Jan 2024" },
    { label: strings.FIELD_FINAL_WEIGHT, value: finalWeight, set: setFinalWeight, placeholder: "e.g. 145.32 kg" },
    {
      label: strings.FIELD_WAIVERS,
      value: waiversIfAny,
      set: setWaiversIfAny,
      placeholder: "Enter waiver details or N/A",
      multiline: true,
      rows: 2,
    },
    {
      label: strings.FIELD_NDT_MOM,
      value: ndtCommitteeMomNumber,
      set: setNdtCommitteeMomNumber,
      placeholder: "e.g. MOM-NDT-2024-001",
    },
    {
      label: strings.FIELD_FINAL_ACCEPTANCE_MOM,
      value: finalAcceptanceMomNumber,
      set: setFinalAcceptanceMomNumber,
      placeholder: "e.g. MOM-FAC-2024-001",
    },
    {
      label: strings.FIELD_DEVIATION,
      value: deviationDetails,
      set: setDeviationDetails,
      placeholder: "Describe any deviations or enter N/A",
      multiline: true,
      rows: 2,
    },
    { label: strings.FIELD_DISPATCH_DATE, value: dispatchDate, set: setDispatchDate, placeholder: "e.g. 15 Mar 2024" },
    {
      label: strings.FIELD_DISPATCH_LOCATION,
      value: dispatchLocation,
      set: setDispatchLocation,
      placeholder: "Enter dispatch destination",
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
          <WarningAmberRoundedIcon sx={{ fontSize: 18, color: BRAND.danger, flexShrink: 0 }} />
          <Typography sx={{ fontSize: "0.8rem", color: BRAND.danger, fontWeight: 600, lineHeight: 1.5 }}>
            {strings.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      )}

      <Card>
        <SectionHeader>
          <IconBadge icon={LocalShippingRoundedIcon} />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>{strings.TITLE}</Typography>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.15 }}>
              {filledCount} / {textValues.length} fields filled
              {supportingFiles.length > 0 &&
                ` · ${supportingFiles.length} file${supportingFiles.length > 1 ? "s" : ""} attached`}
            </Typography>
          </Box>
        </SectionHeader>

        <TableContainer sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 540 }}>
            <TableHead>
              <TableRow>
                <TH sx={{ minWidth: 260 }}>Operation</TH>
                <TH sx={{ minWidth: 320 }}>Details</TH>
              </TableRow>
            </TableHead>
            <TableBody>
              {ROWS.map(({ label, value, set, placeholder, multiline, rows }, idx) => (
                <TableRow
                  key={label}
                  sx={{
                    background: idx % 2 === 0 ? "#fff" : "rgba(244,246,248,0.55)",
                    "&:hover": { background: "rgba(27,79,114,0.022)" },
                  }}
                >
                  <TD sx={{ verticalAlign: multiline ? "top" : "middle", pt: multiline ? "14px" : undefined }}>
                    <RowLabel text={label} />
                  </TD>
                  <TD>
                    <CInput value={value} onChange={set} placeholder={placeholder} multiline={multiline} rows={rows} />
                  </TD>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Card sx={{ mt: 2.5 }}>
        <SectionHeader>
          <IconBadge icon={AttachFileRoundedIcon} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>{strings.SUPPORTING_FILES_TITLE}</Typography>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.15 }}>
              {strings.SUPPORTING_FILES_SUBTITLE}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<UploadFileRoundedIcon sx={{ fontSize: "15px !important" }} />}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              fontSize: "0.72rem",
              textTransform: "none",
              px: 1.8,
              py: "5px",
              whiteSpace: "nowrap",
              borderColor: BRAND.primaryLight,
              color: BRAND.primaryLight,
              "&:hover": { background: alpha(BRAND.primaryLight, 0.06) },
            }}
          >
            {strings.UPLOAD_FILES}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
          />
        </SectionHeader>

        <Box sx={{ p: "14px 20px" }}>
          {supportingFiles.length === 0 ? (
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: `2px dashed ${alpha(BRAND.primaryLight, 0.35)}`,
                borderRadius: 2,
                py: 4,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.18s",
                "&:hover": {
                  borderColor: alpha(BRAND.primaryLight, 0.7),
                  background: alpha(BRAND.primaryLight, 0.03),
                },
              }}
            >
              <UploadFileRoundedIcon sx={{ fontSize: 36, color: alpha(BRAND.primaryLight, 0.5), mb: 1 }} />
              <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: BRAND.textSub }}>
                {strings.FILE_PLACEHOLDER_TITLE}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", color: alpha(BRAND.textSub, 0.7), mt: 0.4 }}>
                {strings.FILE_PLACEHOLDER_SUBTITLE}
              </Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {supportingFiles.map((f, idx) => (
                <ListItem
                  key={`${f.name}-${idx}`}
                  disableGutters
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    background: alpha(BRAND.primary, 0.03),
                    border: `1px solid ${alpha(BRAND.primary, 0.1)}`,
                    "&:hover": { background: alpha(BRAND.primary, 0.055) },
                    transition: "all 0.15s",
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1.2} sx={{ flex: 1, minWidth: 0 }}>
                    <InsertDriveFileOutlinedIcon sx={{ fontSize: 20, color: BRAND.primaryLight, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          color: BRAND.text,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {f.name}
                      </Typography>
                      {typeof f.size === "number" && (
                        <Typography sx={{ fontSize: "0.68rem", color: BRAND.textSub }}>{formatSize(f.size)}</Typography>
                      )}
                    </Box>
                    <Chip
                      label={(f.fileType || f.type || "file").split("/")[1]?.toUpperCase() || "FILE"}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        flexShrink: 0,
                        background: alpha(BRAND.primaryLight, 0.1),
                        color: BRAND.primaryLight,
                        border: `1px solid ${alpha(BRAND.primaryLight, 0.22)}`,
                      }}
                    />
                    <Tooltip title={strings.REMOVE_FILE_TOOLTIP} arrow placement="top">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveFile(idx)}
                        sx={{
                          flexShrink: 0,
                          color: BRAND.textSub,
                          "&:hover": { color: BRAND.danger, background: alpha(BRAND.danger, 0.08) },
                        }}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </ListItem>
              ))}

              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  mt: 0.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  cursor: "pointer",
                  border: `1.5px dashed ${alpha(BRAND.primaryLight, 0.35)}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  transition: "all 0.18s",
                  "&:hover": {
                    borderColor: alpha(BRAND.primaryLight, 0.7),
                    background: alpha(BRAND.primaryLight, 0.03),
                  },
                }}
              >
                <UploadFileRoundedIcon sx={{ fontSize: 16, color: alpha(BRAND.primaryLight, 0.7) }} />
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: alpha(BRAND.primaryLight, 0.85) }}>
                  {strings.ADD_MORE_FILES}
                </Typography>
              </Box>
            </List>
          )}
        </Box>
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
              {filledCount} / {textValues.length} fields filled
              {supportingFiles.length > 0 &&
                ` · ${supportingFiles.length} file${supportingFiles.length > 1 ? "s" : ""} attached`}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.3 }}>
              {canSubmit ? strings.READY_TO_SUBMIT : strings.NOT_READY_TO_SUBMIT}
            </Typography>
          </Box>
          <Stack direction="row" gap={1.5} flexShrink={0}>
            <Button
              variant="outlined"
              startIcon={<SaveOutlinedIcon />}
              disabled={!canSubmit || actionLoading}
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
            <Tooltip title={!canSubmit ? strings.SUBMIT_DISABLED_TOOLTIP : ""} arrow placement="top">
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
                    background: `linear-gradient(135deg,${BRAND.primary},${BRAND.primaryLight})`,
                    boxShadow: `0 4px 14px ${alpha(BRAND.primary, 0.35)}`,
                    "&:hover": {
                      boxShadow: `0 6px 18px ${alpha(BRAND.primary, 0.45)}`,
                      transform: "translateY(-1px)",
                    },
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

export default DispatchForm;
