import {
  Box,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
} from "@mui/material";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { icons } from "../../../../../app/theme/icons";
import type { NDTFileValue, NDTMotorSession } from "../../../../../data/models/user/NDTFormModel";
import { normalizeNDTMotorSession } from "../../../../../data/models/user/NDTFormModel";

const {
  add: AddRoundedIcon,
  delete: DeleteOutlineRoundedIcon,
  uploadFile: UploadFileRoundedIcon,
  image: ImageRoundedIcon,
  clear: ClearRoundedIcon,
} = icons.user.qualityControl.ndt.form;

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  accent: "#148F77",
  danger: "#C0392B",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
};

const TH = {
  background: "linear-gradient(135deg,#1B4F72,#2E86C1)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.6rem",
  letterSpacing: "0.05em",
  textTransform: "uppercase" as const,
  padding: "5px 8px",
  whiteSpace: "nowrap" as const,
  borderBottom: "none",
  verticalAlign: "middle" as const,
};

const TD = {
  padding: "4px 6px",
  borderBottom: "1px solid rgba(213,216,220,0.45)",
  verticalAlign: "middle" as const,
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    background: "#fff",
    fontSize: "0.74rem",
    minHeight: 32,
    "& fieldset": { borderColor: BRAND.border },
    "&:hover fieldset": { borderColor: alpha(BRAND.primaryLight, 0.55) },
    "&.Mui-focused fieldset": { borderColor: BRAND.primaryLight },
  },
};

const rowBg = (i: number) => (i % 2 === 0 ? "#fff" : "rgba(244,246,248,0.55)");

const CInput = ({
  value,
  onChange,
  placeholder = "",
  multiline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) => (
  <TextField
    size="small"
    fullWidth
    multiline={multiline}
    minRows={multiline ? 2 : undefined}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    sx={fieldSx}
  />
);

const UploadCell = ({
  files = [],
  onAdd,
  onRemove,
  accept = "image/*,video/*",
  label = "Upload",
}: {
  files?: NDTFileValue[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  accept?: string;
  label?: string;
}) => (
  <Box sx={{ minWidth: 120 }}>
    <input
      type="file"
      multiple
      accept={accept}
      style={{ display: "none" }}
      id={`ndt-upload-${label}-${accept}`}
      onChange={(e) => {
        onAdd(Array.from(e.target.files ?? []));
        e.target.value = "";
      }}
    />
    <Stack gap={0.35}>
      {files.map((file, index) => (
        <Stack
          key={index}
          direction="row"
          alignItems="center"
          gap={0.4}
          sx={{
            px: "4px",
            py: "2px",
            borderRadius: "5px",
            background: alpha(BRAND.primaryLight, 0.08),
            border: `1px solid ${alpha(BRAND.primaryLight, 0.2)}`,
            maxWidth: 180,
            overflow: "hidden",
          }}
        >
          <ImageRoundedIcon sx={{ fontSize: 11, color: BRAND.primaryLight }} />
          <Typography sx={{ fontSize: "0.58rem", fontWeight: 600, color: BRAND.primaryLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {typeof file === "string" ? file : file.name}
          </Typography>
          <IconButton size="small" onClick={() => onRemove(index)} sx={{ p: 0, color: BRAND.danger }}>
            <ClearRoundedIcon sx={{ fontSize: 10 }} />
          </IconButton>
        </Stack>
      ))}
      <label htmlFor={`ndt-upload-${label}-${accept}`}>
        <Stack
          direction="row"
          alignItems="center"
          gap={0.4}
          sx={{
            cursor: "pointer",
            px: 0.75,
            py: 0.35,
            borderRadius: "6px",
            border: `1px solid ${alpha(BRAND.primaryLight, 0.4)}`,
            color: BRAND.primaryLight,
            fontSize: "0.62rem",
            fontWeight: 700,
            width: "fit-content",
          }}
        >
          <UploadFileRoundedIcon sx={{ fontSize: 12 }} />
          {label}
        </Stack>
      </label>
    </Stack>
  </Box>
);

const SectionTitle = ({ icon: Icon, title }: { icon: typeof DescriptionRoundedIcon; title: string }) => (
  <Stack direction="row" alignItems="center" gap={0.75} sx={{ px: 1, py: 0.75, borderBottom: `1px solid ${alpha(BRAND.primary, 0.1)}` }}>
    <Icon sx={{ fontSize: 15, color: BRAND.primaryLight }} />
    <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: BRAND.text }}>{title}</Typography>
  </Stack>
);

const CompactCard = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      borderRadius: 2,
      border: `1px solid ${alpha(BRAND.primary, 0.14)}`,
      background: "#fff",
      overflow: "hidden",
      mb: 1,
    }}
  >
    {children}
  </Box>
);

type Props = {
  motor: NDTMotorSession;
  onChange: (patch: Partial<NDTMotorSession>) => void;
};

const NDTMotorTables = ({ motor: rawMotor, onChange }: Props) => {
  const motor = normalizeNDTMotorSession(rawMotor);

  const updateExposure = (index: number, patch: Partial<NDTMotorSession["additionalExposureRows"][number]>) => {
    onChange({
      additionalExposureRows: motor.additionalExposureRows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    });
  };

  const updateObservation = (index: number, patch: Partial<NDTMotorSession["radiographyObservationRows"][number]>) => {
    onChange({
      radiographyObservationRows: motor.radiographyObservationRows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    });
  };

  const updateVisual = (index: number, patch: Partial<NDTMotorSession["visualInspectionRows"][number]>) => {
    onChange({
      visualInspectionRows: motor.visualInspectionRows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    });
  };

  return (
    <Stack spacing={1}>
      <CompactCard>
        <SectionTitle icon={DescriptionRoundedIcon} title="Additional exposure details" />
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 420 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={TH}>Section</TableCell>
                <TableCell sx={TH}>Orientation</TableCell>
                <TableCell sx={TH}>Exposures</TableCell>
                <TableCell sx={{ ...TH, width: 36 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {motor.additionalExposureRows.map((row, index) => (
                <TableRow key={index} sx={{ background: rowBg(index) }}>
                  <TableCell sx={TD}><CInput value={row.sectionNumber} onChange={(v) => updateExposure(index, { sectionNumber: v })} /></TableCell>
                  <TableCell sx={TD}><CInput value={row.orientation} onChange={(v) => updateExposure(index, { orientation: v })} /></TableCell>
                  <TableCell sx={TD}><CInput value={row.exposureCount} onChange={(v) => updateExposure(index, { exposureCount: v })} /></TableCell>
                  <TableCell sx={TD}>
                    {motor.additionalExposureRows.length > 1 ? (
                      <IconButton size="small" onClick={() => onChange({ additionalExposureRows: motor.additionalExposureRows.filter((_, i) => i !== index) })} sx={{ color: BRAND.danger, p: 0.25 }}>
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px: 1, pb: 0.75 }}>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.4}
            onClick={() => onChange({ additionalExposureRows: [...motor.additionalExposureRows, { sectionNumber: "", orientation: "", exposureCount: "" }] })}
            sx={{ cursor: "pointer", width: "fit-content", color: BRAND.primaryLight, fontSize: "0.68rem", fontWeight: 700 }}
          >
            <AddRoundedIcon sx={{ fontSize: 14 }} />
            Add row
          </Stack>
        </Box>
      </CompactCard>

      <CompactCard>
        <SectionTitle icon={PhotoCameraRoundedIcon} title="Observation in radiography" />
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 560 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...TH, width: 36 }}>#</TableCell>
                <TableCell sx={TH}>Section</TableCell>
                <TableCell sx={TH}>Orientation</TableCell>
                <TableCell sx={TH}>Observations</TableCell>
                <TableCell sx={TH}>Image</TableCell>
                <TableCell sx={{ ...TH, width: 36 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {motor.radiographyObservationRows.map((row, index) => (
                <TableRow key={index} sx={{ background: rowBg(index) }}>
                  <TableCell sx={TD}>{index + 1}</TableCell>
                  <TableCell sx={TD}><CInput value={row.section} onChange={(v) => updateObservation(index, { section: v })} /></TableCell>
                  <TableCell sx={TD}><CInput value={row.orientation} onChange={(v) => updateObservation(index, { orientation: v })} /></TableCell>
                  <TableCell sx={TD}><CInput value={row.observations} onChange={(v) => updateObservation(index, { observations: v })} multiline /></TableCell>
                  <TableCell sx={TD}>
                    <UploadCell
                      files={row.files}
                      accept="image/*"
                      label="Image"
                      onAdd={(picked) => updateObservation(index, { files: [...row.files, ...picked] })}
                      onRemove={(fi) => updateObservation(index, { files: row.files.filter((_, i) => i !== fi) })}
                    />
                  </TableCell>
                  <TableCell sx={TD}>
                    {motor.radiographyObservationRows.length > 1 ? (
                      <IconButton size="small" onClick={() => onChange({ radiographyObservationRows: motor.radiographyObservationRows.filter((_, i) => i !== index) })} sx={{ color: BRAND.danger, p: 0.25 }}>
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px: 1, pb: 0.75 }}>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.4}
            onClick={() => onChange({ radiographyObservationRows: [...motor.radiographyObservationRows, { section: "", orientation: "", observations: "", files: [] }] })}
            sx={{ cursor: "pointer", width: "fit-content", color: BRAND.primaryLight, fontSize: "0.68rem", fontWeight: 700 }}
          >
            <AddRoundedIcon sx={{ fontSize: 14 }} />
            Add row
          </Stack>
        </Box>
      </CompactCard>

      <CompactCard>
        <SectionTitle icon={VisibilityRoundedIcon} title="Visual inspection" />
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 620 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...TH, width: 36 }}>#</TableCell>
                <TableCell sx={{ ...TH, minWidth: 180 }}>Observation</TableCell>
                <TableCell sx={TH}>Section</TableCell>
                <TableCell sx={TH}>Orientation</TableCell>
                <TableCell sx={TH}>Media</TableCell>
                <TableCell sx={{ ...TH, width: 36 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {motor.visualInspectionRows.map((row, index) => (
                <TableRow key={`${row.observation}-${index}`} sx={{ background: rowBg(index) }}>
                  <TableCell sx={TD}>{index + 1}</TableCell>
                  <TableCell sx={TD}>
                    {row.isPreset ? (
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 600 }}>{row.observation}</Typography>
                    ) : (
                      <CInput value={row.observation} onChange={(v) => updateVisual(index, { observation: v })} placeholder="Enter observation" />
                    )}
                  </TableCell>
                  <TableCell sx={TD}><CInput value={row.section} onChange={(v) => updateVisual(index, { section: v })} /></TableCell>
                  <TableCell sx={TD}><CInput value={row.orientation} onChange={(v) => updateVisual(index, { orientation: v })} /></TableCell>
                  <TableCell sx={TD}>
                    <UploadCell
                      files={row.files}
                      onAdd={(picked) => updateVisual(index, { files: [...row.files, ...picked] })}
                      onRemove={(fi) => updateVisual(index, { files: row.files.filter((_, i) => i !== fi) })}
                    />
                  </TableCell>
                  <TableCell sx={TD}>
                    {!row.isPreset ? (
                      <IconButton size="small" onClick={() => onChange({ visualInspectionRows: motor.visualInspectionRows.filter((_, i) => i !== index) })} sx={{ color: BRAND.danger, p: 0.25 }}>
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px: 1, py: 0.75 }}>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.4}
            onClick={() => onChange({ visualInspectionRows: [...motor.visualInspectionRows, { observation: "", isPreset: false, section: "", orientation: "", files: [] }] })}
            sx={{ cursor: "pointer", width: "fit-content", color: BRAND.primaryLight, fontSize: "0.68rem", fontWeight: 700, mb: 0.75 }}
          >
            <AddRoundedIcon sx={{ fontSize: 14 }} />
            Add observation
          </Stack>
          <UploadCell
            files={motor.visualInspectionMedia}
            accept="image/*,video/*"
            label="Upload media"
            onAdd={(picked) => onChange({ visualInspectionMedia: [...motor.visualInspectionMedia, ...picked] })}
            onRemove={(fi) => onChange({ visualInspectionMedia: motor.visualInspectionMedia.filter((_, i) => i !== fi) })}
          />
        </Box>
      </CompactCard>

      <CompactCard>
        <SectionTitle icon={UploadFileRoundedIcon} title="Signed NDT report & remarks" />
        <Box sx={{ px: 1, py: 0.75 }}>
          <UploadCell
            files={motor.signedReport ? [motor.signedReport] : []}
            accept=".pdf,application/pdf"
            label="Upload PDF"
            onAdd={(picked) => onChange({ signedReport: picked[0] ?? null })}
            onRemove={() => onChange({ signedReport: null })}
          />
          <Box sx={{ mt: 1 }}>
            <CInput
              value={motor.additionalRemarks}
              onChange={(v) => onChange({ additionalRemarks: v })}
              placeholder="Additional remarks"
              multiline
            />
          </Box>
        </Box>
      </CompactCard>
    </Stack>
  );
};

export default NDTMotorTables;
