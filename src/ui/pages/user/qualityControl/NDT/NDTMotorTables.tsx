import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";
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
import FieldErrorText from "@/ui/components/validation/FieldErrorText";
import {
  fieldError,
  type ValidationErrors,
} from "@/data/validation/adapters/ndt.validation";

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
    "&.Mui-error fieldset": { borderColor: "#d32f2f" },
    "&.Mui-error:hover fieldset": { borderColor: "#d32f2f" },
    "&.Mui-error.Mui-focused fieldset": { borderColor: "#d32f2f" },
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
  validationErrors?: ValidationErrors;
};

const CInput = ({
  value,
  onChange,
  placeholder = "",
  multiline = false,
  fieldSx,
  error = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  fieldSx: ReturnType<typeof buildFieldSx>;
  error?: boolean;
}) => (
  <TextField
    size="small"
    fullWidth
    multiline={multiline}
    minRows={multiline ? 2 : undefined}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    error={error}
    sx={fieldSx}
  />
);

const CNumericInput = ({
  value,
  onChange,
  placeholder = "",
  fieldSx,
  error = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fieldSx: ReturnType<typeof buildFieldSx>;
  error?: boolean;
}) => (
  <TextField
    size="small"
    fullWidth
    value={value}
    onChange={(e) => onChange(sanitizeNdtNumericInput(e.target.value))}
    placeholder={placeholder}
    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
    error={error}
    sx={fieldSx}
  />
);

const CSelect = ({
  value,
  onChange,
  placeholder = "Select",
  options,
  fieldSx,
  error = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: readonly { value: string; label: string }[];
  fieldSx: ReturnType<typeof buildFieldSx>;
  error?: boolean;
}) => (
  <TextField
    select
    size="small"
    fullWidth
    value={value}
    onChange={(e) => onChange(e.target.value)}
    SelectProps={{ displayEmpty: true }}
    error={error}
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

const NDTMotorTables = ({ motor: rawMotor, theme, onChange, validationErrors }: Props) => {
  const motor = normalizeNDTMotorSession(rawMotor);
  const ndtTheme = theme.qualityControl.ndt;
  const brand = ndtTheme.brand;
  const fieldSx = buildFieldSx(brand.border, brand.primaryLight);
  const err = (path: string) => fieldError(validationErrors, path);
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
                    { label: "Sr.", required: false },
                    { label: "Sections", required: true },
                    { label: "Orientations", required: true },
                    { label: "SFD", required: true },
                    { label: "No. of Normal Exposure", required: true },
                    { label: "No. of Tangential Exposure", required: true },
                    { label: "Type of Detector", required: true },
                  ].map(({ label, required }) => (
                    <TableCell key={label} sx={TH}>
                      {required ? (
                        <FieldLabelWithAsterisk
                          label={label}
                          required
                          sx={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", color: "inherit" }}
                        />
                      ) : (
                        label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {safePlanRows.map((row, index) => {
                  const sectionsErr = err(`radiographyPlanRows.${index}.sections`);
                  const orientationsErr = err(`radiographyPlanRows.${index}.orientations`);
                  const sfdErr = err(`radiographyPlanRows.${index}.sfd`);
                  const normalErr = err(`radiographyPlanRows.${index}.normalExposures`);
                  const tangentialErr = err(`radiographyPlanRows.${index}.tangentialExposures`);
                  const detectorErr = err(`radiographyPlanRows.${index}.detectorType`);
                  return (
                  <TableRow key={`${row.srNo}-${index}`} sx={rowBg(index)}>
                    <TableCell sx={TD}>{row.srNo}</TableCell>
                    <TableCell sx={TD}>
                      <Box>
                        <CNumericInput
                          fieldSx={fieldSx}
                          value={row.sections}
                          placeholder="Sections"
                          error={Boolean(sectionsErr)}
                          onChange={(v) => updatePlanRow(index, { sections: v })}
                        />
                        <FieldErrorText message={sectionsErr} />
                      </Box>
                    </TableCell>
                    <TableCell sx={TD}>
                      <Box>
                        <CNumericInput
                          fieldSx={fieldSx}
                          value={row.orientations}
                          placeholder="Orientations"
                          error={Boolean(orientationsErr)}
                          onChange={(v) => updatePlanRow(index, { orientations: v })}
                        />
                        <FieldErrorText message={orientationsErr} />
                      </Box>
                    </TableCell>
                    <TableCell sx={TD}>
                      <Box>
                        <CNumericInput
                          fieldSx={fieldSx}
                          value={row.sfd}
                          placeholder="SFD"
                          error={Boolean(sfdErr)}
                          onChange={(v) => updatePlanRow(index, { sfd: v })}
                        />
                        <FieldErrorText message={sfdErr} />
                      </Box>
                    </TableCell>
                    <TableCell sx={TD}>
                      <Box>
                        <CNumericInput
                          fieldSx={fieldSx}
                          value={row.normalExposures}
                          placeholder="Normal"
                          error={Boolean(normalErr)}
                          onChange={(v) => updatePlanRow(index, { normalExposures: v })}
                        />
                        <FieldErrorText message={normalErr} />
                      </Box>
                    </TableCell>
                    <TableCell sx={TD}>
                      <Box>
                        <CNumericInput
                          fieldSx={fieldSx}
                          value={row.tangentialExposures}
                          placeholder="Tangential"
                          error={Boolean(tangentialErr)}
                          onChange={(v) => updatePlanRow(index, { tangentialExposures: v })}
                        />
                        <FieldErrorText message={tangentialErr} />
                      </Box>
                    </TableCell>
                    <TableCell sx={TD}>
                      <Box>
                        <CSelect
                          fieldSx={fieldSx}
                          value={row.detectorType}
                          options={NDT_DETECTOR_OPTIONS}
                          placeholder="Select detector"
                          error={Boolean(detectorErr)}
                          onChange={(v) => updatePlanRow(index, { detectorType: v })}
                        />
                        <FieldErrorText message={detectorErr} />
                      </Box>
                    </TableCell>
                  </TableRow>
                  );
                })}
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
              {motor.additionalExposureRows.map((row, index) => {
                const sectionErr = err(`additionalExposureRows.${index}.sectionNumber`);
                const orientationErr = err(`additionalExposureRows.${index}.orientation`);
                const countErr = err(`additionalExposureRows.${index}.exposureCount`);
                return (
                <TableRow key={index} sx={rowBg(index)}>
                  <TableCell sx={TD}>
                    <Box>
                      <CNumericInput
                        fieldSx={fieldSx}
                        value={row.sectionNumber}
                        placeholder="Section no."
                        error={Boolean(sectionErr)}
                        onChange={(v) => updateExposure(index, { sectionNumber: v })}
                      />
                      <FieldErrorText message={sectionErr} />
                    </Box>
                  </TableCell>
                  <TableCell sx={TD}>
                    <Box>
                      <CInput
                        fieldSx={fieldSx}
                        value={row.orientation}
                        placeholder="Orientation"
                        error={Boolean(orientationErr)}
                        onChange={(v) => updateExposure(index, { orientation: v })}
                      />
                      <FieldErrorText message={orientationErr} />
                    </Box>
                  </TableCell>
                  <TableCell sx={TD}>
                    <Box>
                      <CNumericInput
                        fieldSx={fieldSx}
                        value={row.exposureCount}
                        placeholder="Count"
                        error={Boolean(countErr)}
                        onChange={(v) => updateExposure(index, { exposureCount: v })}
                      />
                      <FieldErrorText message={countErr} />
                    </Box>
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
                );
              })}
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
                <TableCell sx={TH}><FieldLabelWithAsterisk label="Observations" required sx={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }} /></TableCell>
                <TableCell sx={TH}>Image</TableCell>
                <TableCell sx={{ ...TH, width: 44 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {motor.radiographyObservationRows.map((row, index) => {
                const sectionErr = err(`radiographyObservationRows.${index}.section`);
                const orientationErr = err(`radiographyObservationRows.${index}.orientation`);
                const observationsErr = err(`radiographyObservationRows.${index}.observations`);
                return (
                <TableRow key={index} sx={rowBg(index)}>
                  <TableCell sx={TD}>{index + 1}</TableCell>
                  <TableCell sx={TD}>
                    <Box>
                      <CNumericInput
                        fieldSx={fieldSx}
                        value={row.section}
                        placeholder="Section no."
                        error={Boolean(sectionErr)}
                        onChange={(v) => updateObservation(index, { section: v })}
                      />
                      <FieldErrorText message={sectionErr} />
                    </Box>
                  </TableCell>
                  <TableCell sx={TD}>
                    <Box>
                      <CInput
                        fieldSx={fieldSx}
                        value={row.orientation}
                        placeholder="Orientation"
                        error={Boolean(orientationErr)}
                        onChange={(v) => updateObservation(index, { orientation: v })}
                      />
                      <FieldErrorText message={orientationErr} />
                    </Box>
                  </TableCell>
                  <TableCell sx={TD}>
                    <Box>
                      <CInput
                        fieldSx={fieldSx}
                        value={row.observations}
                        error={Boolean(observationsErr)}
                        onChange={(v) => updateObservation(index, { observations: v })}
                        multiline
                      />
                      <FieldErrorText message={observationsErr} />
                    </Box>
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
                );
              })}
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
                <TableCell sx={{ ...TH, minWidth: 180 }}><FieldLabelWithAsterisk label="Observation" required sx={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }} /></TableCell>
                <TableCell sx={TH}>Section</TableCell>
                <TableCell sx={TH}>Orientation</TableCell>
                <TableCell sx={TH}>Media</TableCell>
                <TableCell sx={{ ...TH, width: 44 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {motor.visualInspectionRows.map((row, index) => {
                const observationPath = row.isPreset
                  ? `visualInspectionRows.${index}.observationNotes`
                  : `visualInspectionRows.${index}.observation`;
                const observationErr = err(observationPath);
                return (
                <TableRow key={`${row.observation}-${index}`} sx={rowBg(index)}>
                  <TableCell sx={TD}>{index + 1}</TableCell>
                  <TableCell sx={TD}>
                    {row.isPreset ? (
                      <Stack gap={0.75}>
                        <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                          {row.observation}
                        </Typography>
                        <Box>
                          <CInput
                            fieldSx={fieldSx}
                            value={row.observationNotes ?? ""}
                            onChange={(v) => updateVisual(index, { observationNotes: v })}
                            placeholder="Observation"
                            multiline
                            error={Boolean(observationErr)}
                          />
                          <FieldErrorText message={observationErr} />
                        </Box>
                      </Stack>
                    ) : (
                      <Box>
                        <CInput
                          fieldSx={fieldSx}
                          value={row.observation}
                          onChange={(v) => updateVisual(index, { observation: v })}
                          placeholder="Enter observation"
                          error={Boolean(observationErr)}
                        />
                        <FieldErrorText message={observationErr} />
                      </Box>
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
                );
              })}
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
          <Box>
            <NdtFileField
              files={motor.signedReport ? [motor.signedReport] : []}
              onChange={(next) => onChange({ signedReport: next[0] ?? null })}
              multiple={false}
              acceptMode="pdf"
              subDeptSlug="ndt"
              label="Upload PDF *"
              emptyLabel={S.FILE_EMPTY_REPORT}
            />
            <FieldErrorText message={err("signedReport")} />
          </Box>
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
