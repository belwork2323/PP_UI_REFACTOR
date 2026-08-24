import {
  Box,
  IconButton,
  MenuItem,
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
import type { NDTMotorSession } from "../../../../../data/models/user/NDTFormModel";
import { normalizeNDTMotorSession } from "../../../../../data/models/user/NDTFormModel";
import getQualityControlTheme from "../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import {
  NDT_FLOW_LABELS,
  NDT_RADIOGRAPHY_PLANS,
  type RadiographyPlanKey,
} from "../../../../../hooks/user/qualityControl/ndtFlowConfig";
import {
  NDT_ORIENTATION_OPTIONS,
  sanitizeNdtNumericInput,
} from "../../../../../hooks/user/qualityControl/ndtApiMappings";
import { STRINGS } from "../../../../../app/config/strings";
import NdtFileField from "./NdtFileField";

const S = STRINGS.QUALITY_CONTROL.NDT;

const {
  add: AddRoundedIcon,
  delete: DeleteOutlineRoundedIcon,
  uploadFile: UploadFileRoundedIcon,
} = icons.user.qualityControl.ndt.form;

const buildFieldSx = (border: string, primaryLight: string) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    background: "#fff",
    fontSize: "0.8rem",
    minHeight: 36,
    "& fieldset": { borderColor: border },
    "&:hover fieldset": { borderColor: alpha(primaryLight, 0.55) },
    "&.Mui-focused fieldset": { borderColor: primaryLight },
  },
});

const SectionTitle = ({
  icon: Icon,
  title,
  theme,
}: {
  icon: typeof DescriptionRoundedIcon;
  title: string;
  theme: ReturnType<typeof getQualityControlTheme>;
}) => {
  const panel = theme.qualityControl.ndt.panel;
  const brand = theme.qualityControl.ndt.brand;
  return (
    <Stack direction="row" alignItems="center" gap={1} sx={panel.sectionHeader}>
      <Icon sx={{ fontSize: 18, color: brand.primaryLight }} />
      <Typography sx={panel.sectionTitle}>{title}</Typography>
    </Stack>
  );
};

const CompactCard = ({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: ReturnType<typeof getQualityControlTheme>;
}) => <Box sx={theme.qualityControl.ndt.panel.card}>{children}</Box>;

const SetupDetailItem = ({
  label,
  value,
  brand,
}: {
  label: string;
  value: string;
  brand: { textSub: string; text: string };
}) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: brand.textSub, mb: 0.35 }}>
      {label}
    </Typography>
    <Typography
      sx={{ fontSize: "0.82rem", fontWeight: 600, color: brand.text, wordBreak: "break-word" }}
    >
      {value || "—"}
    </Typography>
  </Box>
);

type NDTMotorTablesTheme = ReturnType<typeof getQualityControlTheme>;

type Props = {
  motor: NDTMotorSession;
  theme: NDTMotorTablesTheme;
  onChange: (patch: Partial<NDTMotorSession>) => void;
};

const CInput = ({
  value,
  onChange,
  placeholder = "",
  multiline = false,
  fieldSx,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  fieldSx: ReturnType<typeof buildFieldSx>;
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

const CNumericInput = ({
  value,
  onChange,
  placeholder = "",
  fieldSx,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fieldSx: ReturnType<typeof buildFieldSx>;
}) => (
  <TextField
    size="small"
    fullWidth
    value={value}
    onChange={(e) => onChange(sanitizeNdtNumericInput(e.target.value))}
    placeholder={placeholder}
    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
    sx={fieldSx}
  />
);

const CSelect = ({
  value,
  onChange,
  placeholder = "Select",
  options,
  fieldSx,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: readonly { value: string; label: string }[];
  fieldSx: ReturnType<typeof buildFieldSx>;
}) => (
  <TextField
    select
    size="small"
    fullWidth
    value={value}
    onChange={(e) => onChange(e.target.value)}
    SelectProps={{ displayEmpty: true }}
    sx={fieldSx}
  >
    <MenuItem value="">
      <Typography sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{placeholder}</Typography>
    </MenuItem>
    {options.map((option) => (
      <MenuItem key={option.value} value={option.value}>
        {option.label}
      </MenuItem>
    ))}
  </TextField>
);

const NDT_DETECTOR_OPTIONS = [
  { value: "Imaging Plate", label: "Imaging Plate" },
  { value: "DR Panel", label: "DR Panel" },
  { value: "Film", label: "Film" },
] as const;

const NDTMotorTables = ({ motor: rawMotor, theme, onChange }: Props) => {
  const motor = normalizeNDTMotorSession(rawMotor);
  const ndtTheme = theme.qualityControl.ndt;
  const brand = ndtTheme.brand;
  const fieldSx = buildFieldSx(brand.border, brand.primaryLight);
  const L = NDT_FLOW_LABELS;
  const safeBeamEnergies = Array.isArray(motor.beamEnergies) ? motor.beamEnergies : [];
  const safePlanRows = Array.isArray(motor.radiographyPlanRows) ? motor.radiographyPlanRows : [];
  const planId = String(motor.radiographyPlan ?? "").trim();
  const planName =
    String(motor.radiographyPlanName ?? "").trim() ||
    NDT_RADIOGRAPHY_PLANS[motor.radiographyPlan as RadiographyPlanKey]?.label ||
    "";

  const updateExposure = (
    index: number,
    patch: Partial<NDTMotorSession["additionalExposureRows"][number]>,
  ) => {
    onChange({
      additionalExposureRows: motor.additionalExposureRows.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    });
  };

  const updatePlanRow = (
    index: number,
    patch: Partial<NDTMotorSession["radiographyPlanRows"][number]>,
  ) => {
    onChange({
      radiographyPlanRows: safePlanRows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    });
  };

  const updateObservation = (
    index: number,
    patch: Partial<NDTMotorSession["radiographyObservationRows"][number]>,
  ) => {
    onChange({
      radiographyObservationRows: motor.radiographyObservationRows.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    });
  };

  const updateVisual = (
    index: number,
    patch: Partial<NDTMotorSession["visualInspectionRows"][number]>,
  ) => {
    onChange({
      visualInspectionRows: motor.visualInspectionRows.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    });
  };

  const TH = ndtTheme.table.headerCell;
  const TD = ndtTheme.table.bodyCell;
  const rowBg = ndtTheme.table.row;
  const addRowSx = {
    cursor: "pointer",
    width: "fit-content",
    color: brand.primaryLight,
    fontSize: "0.72rem",
    fontWeight: 700,
  };

  return (
    <Stack spacing={1.5}>
      <CompactCard theme={theme}>
        <SectionTitle icon={DescriptionRoundedIcon} title="Radiography setup" theme={theme} />
        <Box
          sx={{
            p: 1.75,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" },
            gap: 2,
          }}
        >
          <SetupDetailItem label={L.equipment} value={motor.equipment.join(", ")} brand={brand} />
          <SetupDetailItem
            label={L.beamEnergies}
            value={safeBeamEnergies.length > 0 ? safeBeamEnergies.join(", ") : ""}
            brand={brand}
          />
        </Box>
      </CompactCard>

      {safePlanRows.length > 0 ? (
        <CompactCard theme={theme}>
          <SectionTitle
            icon={DescriptionRoundedIcon}
            title="Radiography plan details"
            theme={theme}
          />
          {(planId || planName) && (
            <Box
              sx={{
                px: 1.75,
                pb: 1,
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.25,
              }}
            >
              {planId ? (
                <SetupDetailItem label="Radiography plan ID" value={planId} brand={brand} />
              ) : null}
              {planName ? (
                <SetupDetailItem label="Plan name" value={planName} brand={brand} />
              ) : null}
            </Box>
          )}
          <TableContainer sx={{ overflowX: "auto", px: 0.5, pb: 0.5 }}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  {[
                    "Sr.",
                    "Sections",
                    "Orientations",
                    "SFD",
                    "No. of Normal Exposure",
                    "No. of Tangential Exposure",
                    "Type of Detector",
                  ].map((label) => (
                    <TableCell key={label} sx={TH}>
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {safePlanRows.map((row, index) => (
                  <TableRow key={`${row.srNo}-${index}`} sx={rowBg(index)}>
                    <TableCell sx={TD}>{row.srNo}</TableCell>
                    <TableCell sx={TD}>
                      <CNumericInput
                        fieldSx={fieldSx}
                        value={row.sections}
                        placeholder="Sections"
                        onChange={(v) => updatePlanRow(index, { sections: v })}
                      />
                    </TableCell>
                    <TableCell sx={TD}>
                      <CNumericInput
                        fieldSx={fieldSx}
                        value={row.orientations}
                        placeholder="Orientations"
                        onChange={(v) => updatePlanRow(index, { orientations: v })}
                      />
                    </TableCell>
                    <TableCell sx={TD}>
                      <CNumericInput
                        fieldSx={fieldSx}
                        value={row.sfd}
                        placeholder="SFD"
                        onChange={(v) => updatePlanRow(index, { sfd: v })}
                      />
                    </TableCell>
                    <TableCell sx={TD}>
                      <CNumericInput
                        fieldSx={fieldSx}
                        value={row.normalExposures}
                        placeholder="Normal"
                        onChange={(v) => updatePlanRow(index, { normalExposures: v })}
                      />
                    </TableCell>
                    <TableCell sx={TD}>
                      <CNumericInput
                        fieldSx={fieldSx}
                        value={row.tangentialExposures}
                        placeholder="Tangential"
                        onChange={(v) => updatePlanRow(index, { tangentialExposures: v })}
                      />
                    </TableCell>
                    <TableCell sx={TD}>
                      <CSelect
                        fieldSx={fieldSx}
                        value={row.detectorType}
                        options={NDT_DETECTOR_OPTIONS}
                        placeholder="Select detector"
                        onChange={(v) => updatePlanRow(index, { detectorType: v })}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CompactCard>
      ) : null}

      <CompactCard theme={theme}>
        <SectionTitle
          icon={DescriptionRoundedIcon}
          title="Additional exposure details"
          theme={theme}
        />
        <TableContainer sx={{ overflowX: "auto", px: 0.5, pb: 0.5 }}>
          <Table size="small" sx={{ minWidth: 420 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={TH}>Section</TableCell>
                <TableCell sx={TH}>Orientation</TableCell>
                <TableCell sx={TH}>Exposures</TableCell>
                <TableCell sx={{ ...TH, width: 44 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {motor.additionalExposureRows.map((row, index) => (
                <TableRow key={index} sx={rowBg(index)}>
                  <TableCell sx={TD}>
                    <CNumericInput
                      fieldSx={fieldSx}
                      value={row.sectionNumber}
                      placeholder="Section no."
                      onChange={(v) => updateExposure(index, { sectionNumber: v })}
                    />
                  </TableCell>
                  <TableCell sx={TD}>
                    {/* <CSelect
                      fieldSx={fieldSx}
                      value={row.orientation}
                      options={NDT_ORIENTATION_OPTIONS}
                      placeholder="Select orientation"
                      onChange={(v) => updateExposure(index, { orientation: v })}
                    /> */}
                    <CInput
                      fieldSx={fieldSx}
                      value={row.orientation}
                      placeholder="Orientation"
                      onChange={(v) => updateExposure(index, { orientation: v })}
                    />
                  </TableCell>
                  <TableCell sx={TD}>
                    <CNumericInput
                      fieldSx={fieldSx}
                      value={row.exposureCount}
                      placeholder="Count"
                      onChange={(v) => updateExposure(index, { exposureCount: v })}
                    />
                  </TableCell>
                  <TableCell sx={TD}>
                    {motor.additionalExposureRows.length > 1 ? (
                      <IconButton
                        size="small"
                        onClick={() =>
                          onChange({
                            additionalExposureRows: motor.additionalExposureRows.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                        sx={{ color: brand.danger, p: 0.5 }}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px: 1.75, pb: 1.25 }}>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.5}
            onClick={() =>
              onChange({
                additionalExposureRows: [
                  ...motor.additionalExposureRows,
                  { sectionNumber: "", orientation: "", exposureCount: "" },
                ],
              })
            }
            sx={addRowSx}
          >
            <AddRoundedIcon sx={{ fontSize: 15 }} />
            Add row
          </Stack>
        </Box>
      </CompactCard>

      <CompactCard theme={theme}>
        <SectionTitle
          icon={PhotoCameraRoundedIcon}
          title="Observation in radiography"
          theme={theme}
        />
        <TableContainer sx={{ overflowX: "auto", px: 0.5, pb: 0.5 }}>
          <Table size="small" sx={{ minWidth: 560 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...TH, width: 44 }}>#</TableCell>
                <TableCell sx={TH}>Section</TableCell>
                <TableCell sx={TH}>Orientation</TableCell>
                <TableCell sx={TH}>Observations</TableCell>
                <TableCell sx={TH}>Image</TableCell>
                <TableCell sx={{ ...TH, width: 44 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {motor.radiographyObservationRows.map((row, index) => (
                <TableRow key={index} sx={rowBg(index)}>
                  <TableCell sx={TD}>{index + 1}</TableCell>
                  <TableCell sx={TD}>
                    <CNumericInput
                      fieldSx={fieldSx}
                      value={row.section}
                      placeholder="Section no."
                      onChange={(v) => updateObservation(index, { section: v })}
                    />
                  </TableCell>
                  <TableCell sx={TD}>
                    {/* <CSelect
                      fieldSx={fieldSx}
                      value={row.orientation}
                      options={NDT_ORIENTATION_OPTIONS}
                      placeholder="Select orientation"
                      onChange={(v) => updateObservation(index, { orientation: v })}
                    /> */}

                    <CInput
                      fieldSx={fieldSx}
                      value={row.orientation}
                      placeholder="Orientation"
                      onChange={(v) => updateObservation(index, { orientation: v })}
                    />
                  </TableCell>
                  <TableCell sx={TD}>
                    <CInput
                      fieldSx={fieldSx}
                      value={row.observations}
                      onChange={(v) => updateObservation(index, { observations: v })}
                      multiline
                    />
                  </TableCell>
                  <TableCell sx={TD}>
                    <NdtFileField
                      files={row.files ?? []}
                      onChange={(next) => updateObservation(index, { files: next })}
                      multiple
                      acceptMode="image"
                      subDeptSlug="ndt"
                      compact
                      emptyLabel={S.FILE_EMPTY_IMAGE}
                    />
                  </TableCell>
                  <TableCell sx={TD}>
                    {motor.radiographyObservationRows.length > 1 ? (
                      <IconButton
                        size="small"
                        onClick={() =>
                          onChange({
                            radiographyObservationRows: motor.radiographyObservationRows.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                        sx={{ color: brand.danger, p: 0.5 }}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px: 1.75, pb: 1.25 }}>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.5}
            onClick={() =>
              onChange({
                radiographyObservationRows: [
                  ...motor.radiographyObservationRows,
                  { section: "", orientation: "", observations: "", files: [] },
                ],
              })
            }
            sx={addRowSx}
          >
            <AddRoundedIcon sx={{ fontSize: 15 }} />
            Add row
          </Stack>
        </Box>
      </CompactCard>

      <CompactCard theme={theme}>
        <SectionTitle icon={VisibilityRoundedIcon} title="Visual inspection" theme={theme} />
        <TableContainer sx={{ overflowX: "auto", px: 0.5, pb: 0.5 }}>
          <Table size="small" sx={{ minWidth: 620 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...TH, width: 44 }}>#</TableCell>
                <TableCell sx={{ ...TH, minWidth: 180 }}>Observation</TableCell>
                <TableCell sx={TH}>Section</TableCell>
                <TableCell sx={TH}>Orientation</TableCell>
                <TableCell sx={TH}>Media</TableCell>
                <TableCell sx={{ ...TH, width: 44 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {motor.visualInspectionRows.map((row, index) => (
                <TableRow key={`${row.observation}-${index}`} sx={rowBg(index)}>
                  <TableCell sx={TD}>{index + 1}</TableCell>
                  <TableCell sx={TD}>
                    {row.isPreset ? (
                      <Stack gap={0.75}>
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                          {row.observation}
                        </Typography>
                        <CInput
                          fieldSx={fieldSx}
                          value={row.observationNotes ?? ""}
                          onChange={(v) => updateVisual(index, { observationNotes: v })}
                          placeholder="Observation"
                          multiline
                        />
                      </Stack>
                    ) : (
                      <CInput
                        fieldSx={fieldSx}
                        value={row.observation}
                        onChange={(v) => updateVisual(index, { observation: v })}
                        placeholder="Enter observation"
                      />
                    )}
                  </TableCell>
                  <TableCell sx={TD}>
                    <CNumericInput
                      fieldSx={fieldSx}
                      value={row.section}
                      placeholder="Section no."
                      onChange={(v) => updateVisual(index, { section: v })}
                    />
                  </TableCell>
                  <TableCell sx={TD}>
                    {/* <CSelect
                      fieldSx={fieldSx}
                      value={row.orientation}
                      options={NDT_ORIENTATION_OPTIONS}
                      placeholder="Select orientation"
                      onChange={(v) => updateVisual(index, { orientation: v })}
                    /> */}
                    <CInput
                      fieldSx={fieldSx}
                      value={row.orientation}
                      placeholder="Orientation"
                      onChange={(v) => updateVisual(index, { orientation: v })}
                    />
                  </TableCell>
                  <TableCell sx={TD}>
                    <NdtFileField
                      files={row.files ?? []}
                      onChange={(next) => updateVisual(index, { files: next })}
                      multiple
                      acceptMode="imageVideo"
                      subDeptSlug="ndt"
                      compact
                      emptyLabel={S.FILE_EMPTY_IMAGE}
                    />
                  </TableCell>
                  <TableCell sx={TD}>
                    {!row.isPreset ? (
                      <IconButton
                        size="small"
                        onClick={() =>
                          onChange({
                            visualInspectionRows: motor.visualInspectionRows.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                        sx={{ color: brand.danger, p: 0.5 }}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ px: 1.75, py: 1.25 }}>
          <Stack
            direction="row"
            alignItems="center"
            gap={0.5}
            onClick={() =>
              onChange({
                visualInspectionRows: [
                  ...motor.visualInspectionRows,
                  { observation: "", isPreset: false, section: "", orientation: "", files: [] },
                ],
              })
            }
            sx={{ ...addRowSx, mb: 1 }}
          >
            <AddRoundedIcon sx={{ fontSize: 15 }} />
            Add observation
          </Stack>
          <NdtFileField
            files={motor.visualInspectionMedia ?? []}
            onChange={(next) => onChange({ visualInspectionMedia: next })}
            multiple
            acceptMode="imageVideo"
            subDeptSlug="ndt"
            label="Upload media"
            emptyLabel={S.FILE_EMPTY_MEDIA}
          />
        </Box>
      </CompactCard>

      <CompactCard theme={theme}>
        <SectionTitle
          icon={UploadFileRoundedIcon}
          title="Signed NDT report & remarks"
          theme={theme}
        />
        <Box sx={{ px: 1.75, py: 1.25 }}>
          <NdtFileField
            files={motor.signedReport ? [motor.signedReport] : []}
            onChange={(next) => onChange({ signedReport: next[0] ?? null })}
            multiple={false}
            acceptMode="pdf"
            subDeptSlug="ndt"
            label="Upload PDF"
            emptyLabel={S.FILE_EMPTY_REPORT}
          />
          <Box sx={{ mt: 1.25 }}>
            <CInput
              fieldSx={fieldSx}
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
