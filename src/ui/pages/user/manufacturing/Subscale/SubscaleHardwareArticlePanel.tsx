import {
  useEffect,
  useRef,
  useState,
  type ChangeEventHandler,
  type CSSProperties,
  type ElementType,
} from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  type ButtonProps,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SpeedIcon from "@mui/icons-material/Speed";
import ShieldIcon from "@mui/icons-material/Shield";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import ScienceIcon from "@mui/icons-material/Science";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";

import FormInput from "../../../../components/common/FormInput";
import DateField, { TimeField } from "../../../../components/common/DateField";
import { AppDatePickerProvider } from "../../../../components/common/datePickerShared";
import {
  APP_CONTROL_FONT_SIZE,
  appDropdownMenuProps,
  appDropdownPlaceholderSx,
} from "../../../../components/common/fieldStyles";
import { STRINGS } from "../../../../../app/config/strings";
import { formatToUiDate } from "../../../../../utils/dateUtils";
import { FILE_PICKER_ACCEPT } from "../../../../../utils/FileUtils";
import { SUBSCALE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/subscale_theme";
import fonts from "../../../../../app/theme/fonts";
import {
  ARTICLE_TYPE_TABLE_ID,
  ARTICLE_TYPE_SPECS,
  HARDWARE_COUNT_FIELDS,
  LINER_TYPE_FIELD,
  RUBBER_MATERIAL_OPTIONS,
  isHardwarePreparationComplete,
  syncHardwareArticleTable,
  LINER_BATCH_NO_FIELD,
  LINER_BATCH_DATE_FIELD,
  LINER_TYPE_OPTIONS,
  isMainScaleSubscaleBatch,
} from "../../../../../hooks/user/manufacturing/subscaleHardwareConfig";
import type { SchemaFormValues } from "../../../../../schema-engine";

const S = STRINGS.MANUFACTURING.SUBSCALE.HARDWARE;

/** When Casting BEM Mould No changes, mirror it into matching row fields on other process tables. */
const BEM_NO_SYNC_TARGETS = [
  { tableId: "CURING_TABLE", fieldId: "BEM_MOULD_NO" },
  { tableId: "NDT_TABLE", fieldId: "BEM_NO" },
  { tableId: "TRIMMING_TABLE", fieldId: "BEM_NO" },
  { tableId: "INHIBITION_TABLE", fieldId: "BEM_NO" },
  { tableId: "STATIC_TESTING_TABLE", fieldId: "BEM_NO" },
  { tableId: "MECHANICAL_PROPERTIES_TABLE", fieldId: "BEM_NO" },
] as const;

const syncBemNoAcrossProcessTables = (
  values: SchemaFormValues,
  rowIndex: number,
  bemNo: string,
): SchemaFormValues => {
  const next: SchemaFormValues = { ...values };
  BEM_NO_SYNC_TARGETS.forEach(({ tableId, fieldId }) => {
    const rows = Array.isArray(next[tableId]) ? [...(next[tableId] as Record<string, unknown>[])] : [];
    if (!rows[rowIndex]) return;
    rows[rowIndex] = { ...rows[rowIndex], [fieldId]: bemNo };
    next[tableId] = rows;
  });
  return next;
};

export const sectionCardSx = {
  borderRadius: 2.5,
  border: `1px solid ${SUBSCALE_BRAND.border}`,
  background: "#fff",
  overflow: "hidden",
  boxShadow: "0 2px 10px rgba(28,40,51,0.04)",
  fontFamily: fonts.family.primary,
  // Skip layout/paint for off-screen process tables until scrolled into view.
  contentVisibility: "auto" as const,
  containIntrinsicSize: "auto 360px",
};

export const sectionHeaderSx = {
  px: 2,
  py: 1.25,
  background: `linear-gradient(135deg, ${SUBSCALE_BRAND.ss}, ${SUBSCALE_BRAND.ssLight})`,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  gap: 1,
};

const sectionTitleSx = {
  fontFamily: fonts.family.primary,
  fontWeight: 700,
  fontSize: "0.8rem",
  letterSpacing: "0.01em",
};

const tableHeaderCellSx = {
  fontFamily: fonts.family.primary,
  fontWeight: 800,
  fontSize: "0.68rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  background: `linear-gradient(180deg, ${SUBSCALE_BRAND.ssLight} 0%, ${SUBSCALE_BRAND.ss} 100%)`,
  color: "#fff",
  whiteSpace: "nowrap" as const,
  borderBottom: "none",
  borderRight: "1px solid rgba(255,255,255,0.32)",
  py: 1.15,
  "&:last-of-type": { borderRight: "none" },
};

const tableBodyCellSx = {
  fontFamily: fonts.family.primary,
  fontSize: APP_CONTROL_FONT_SIZE,
  fontWeight: 500,
  color: SUBSCALE_BRAND.text,
  py: 0.75,
};

const articleTypeCellSx = {
  ...tableBodyCellSx,
  fontWeight: 600,
  minWidth: 150,
};

const bemNoTextSx = {
  ...tableBodyCellSx,
  minWidth: 88,
  fontWeight: 600,
  color: SUBSCALE_BRAND.text,
};

// Clean Article Label Helper (Formats label nicely e.g. "10 kg BEM")
const formatArticleTypeLabel = (rawLabel: string) => {
  if (!rawLabel) return "";
  return String(rawLabel)
    .replace(/no\s*of\s*['"]?/gi, "")
    .replace(/['"]/g, "")
    .trim();
};

// Reusable File Upload Button Component
type FileUploadButtonProps = Omit<ButtonProps<"button">, "onChange" | "component" | "onClick"> & {
  label?: string;
  icon?: ElementType;
  accept?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

const FileUploadButton = ({
  label,
  icon: Icon,
  onChange,
  accept: _accept,
  ...props
}: FileUploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        style={{ display: "none" }}
        onChange={onChange}
        tabIndex={-1}
      />
      <Button
        type="button"
        variant="outlined"
        fullWidth
        disableRipple
        startIcon={Icon ? <Icon /> : null}
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.click();
          }
        }}
        sx={{
          textTransform: "none",
          borderRadius: 2,
          borderStyle: "dashed",
          py: 1,
          fontSize: "0.78rem",
          backgroundColor: "rgba(0, 0, 0, 0.02)",
          "&:hover": {
            borderStyle: "solid",
            backgroundColor: "rgba(25, 118, 210, 0.04)",
          },
        }}
        {...props}
      >
        {label || "Choose File"}
      </Button>
    </>
  );
};

type SubscaleHardwareArticlePanelProps = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  hardwareFieldsDisabled?: boolean;
  /** When MAIN / MAIN_SCALE, Static Testing + Mechanical tables are hidden. */
  batchType?: string | null;
  actionLoading?: boolean;
  isEditMode?: boolean;
  onRequestSaveDraft?: () => void;
  onRequestSubmit?: () => void;
};

const SubscaleHardwareArticlePanel = ({
  values,
  onChange,
  hardwareFieldsDisabled = false,
  batchType,
  actionLoading = false,
  isEditMode = false,
  onRequestSaveDraft,
  onRequestSubmit,
}: SubscaleHardwareArticlePanelProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const hardwareComplete = isHardwarePreparationComplete(values);
  const isFormLoaded = Boolean(values.IS_PROCESS_FORM_LOADED);
  const showBemTestingTables = !isMainScaleSubscaleBatch(batchType);

  // Dismiss the compact overlay after the form tree has committed and painted.
  useEffect(() => {
    if (!isLoading || !isFormLoaded) return;
    let outer = 0;
    let inner = 0;
    outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setIsLoading(false));
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
    };
  }, [isLoading, isFormLoaded]);

  // Calculate target Article Types array based on entered hardware counts
  const getCalculatedArticleTypes = () => {
    const types: string[] = [];
    ARTICLE_TYPE_SPECS.forEach(({ countField, articleType }) => {
      const count = parseInt(String(values[countField] ?? 0), 10) || 0;
      for (let i = 0; i < count; i++) {
        types.push(articleType);
      }
    });
    return types;
  };

  // Handle Load Form Click
  const handleLoadForm = () => {
    setIsLoading(true);

    const baseTypes = getCalculatedArticleTypes();

    const articleTableRows = baseTypes.map((typeLabel, i) => ({
      SR_NO: i + 1,
      ARTICLE_TYPE: typeLabel,
      RUBBER_MATERIAL: "",
      SLEEVE_NO: "",
      MOULD_NO: "",
      SIZE_MM: "",
      THICKNESS_MM: "",
      LINER_APPLIED: "",
      OBSERVATIONS: "",
    }));

    const createDefaultRows = (defaultRow: object) =>
      baseTypes.map((typeLabel, i) => ({
        SR_NO: i + 1,
        ARTICLE_TYPE: typeLabel,
        ...defaultRow,
      }));

    const nextValues: SchemaFormValues = {
      ...values,
      IS_PROCESS_FORM_LOADED: true,
      [ARTICLE_TYPE_TABLE_ID]: articleTableRows,
      CASTING_TABLE: createDefaultRows({
        BEM_MOULD_NO: "",
        CASTING_PIT_NO: "",
        CASTING_START_TIME: "",
        CASTING_END_TIME: "",
        VACUUM_LEVEL: "",
        REMARKS: "",
      }),
      CURING_TABLE: createDefaultRows({
        BEM_MOULD_NO: "",
        CURING_START_DATE: "",
        CURING_END_DATE: "",
        OVEN_NO: "",
        TEMPERATURE: "",
        HARDNESS: "",
        DECORING_DATE: "",
        DECORING_LOAD: "",
        GRAIN_SURFACE_OBSERVATIONS: "",
      }),
      NDT_TABLE: createDefaultRows({ BEM_NO: "", DATE_OF_NDT: "", OBSERVATIONS: "" }),
      TRIMMING_TABLE: createDefaultRows({
        BEM_NO: "",
        HE_OD: "",
        HE_PORT_INNER: "",
        HE_PORT_OUTER: "",
        HE_BEFORE_INHIBITION_INNER: "",
        HE_BEFORE_INHIBITION_OUTER: "",
        NE_OD: "",
        NE_PORT_INNER: "",
        NE_PORT_OUTER: "",
        NE_WEB_INNER: "",
        NE_WEB_OUTER: "",
        LENGTH_BEFORE_INHIBITION: "",
      }),
      INHIBITION_TABLE: createDefaultRows({
        BEM_NO: "",
        LINER_COATED_SLEEVE_WEIGHT: "",
        WEIGHT_BEFORE_INHIBITION: "",
        WEIGHT_AFTER_INHIBITION: "",
        IR_APPLIED_WEIGHT: "",
        PROPELLANT_WEIGHT: "",
        DATE_OF_APPLICATION: "",
        REMARKS: "",
      }),
      STATIC_TESTING_TABLE: showBemTestingTables
        ? createDefaultRows({
            BEM_NO: "",
            PROPELLANT_MASS: "",
            DT: "",
            WEB_THICKNESS: "",
            N_VALUE: "",
            PRESSURE_AVG: "",
            THRUST_AVG: "",
            BURN_RATE: "",
            GRAPH_UPLOAD: null,
          })
        : [],
      MECHANICAL_PROPERTIES_TABLE: showBemTestingTables
        ? createDefaultRows({
            BEM_NO: "",
            TS: "",
            ELONGATION: "",
            MODULUS: "",
            SBS: "",
            TBS: "",
            PEEL_STRENGTH: "",
            DENSITY: "",
            ACTOR: "",
          })
        : [],
    };

    // Paint the compact overlay first, then commit all tables in one update.
    window.requestAnimationFrame(() => {
      onChange(nextValues);
    });
  };

  // Reset Tables & Enable Hardware Controls
  const handleResetForm = () => {
    setIsLoading(false);
    onChange({
      ...values,
      IS_PROCESS_FORM_LOADED: false,
      [ARTICLE_TYPE_TABLE_ID]: [],
      CASTING_TABLE: [],
      CURING_TABLE: [],
      NDT_TABLE: [],
      TRIMMING_TABLE: [],
      INHIBITION_TABLE: [],
      STATIC_TESTING_TABLE: [],
      MECHANICAL_PROPERTIES_TABLE: [],
    });
  };

  // Row Cell Updater Helper
  const updateTableRowCell = (tableId: string, rowIndex: number, fieldId: string, value: any) => {
    const tableData = Array.isArray(values[tableId]) ? [...values[tableId]] : [];
    const targetRow = { ...tableData[rowIndex], [fieldId]: value };

    if (tableId === "INHIBITION_TABLE") {
      const aRaw = targetRow.LINER_COATED_SLEEVE_WEIGHT;
      const bRaw = targetRow.WEIGHT_BEFORE_INHIBITION;
      const hasInputs =
        String(aRaw ?? "").trim() !== "" || String(bRaw ?? "").trim() !== "";
      if (!hasInputs) {
        targetRow.PROPELLANT_WEIGHT = "";
      } else {
        const b = parseFloat(bRaw || 0);
        const a = parseFloat(aRaw || 0);
        targetRow.PROPELLANT_WEIGHT = b - a;
      }
    }

    tableData[rowIndex] = targetRow;
    let nextValues: SchemaFormValues = { ...values, [tableId]: tableData };

    // Casting BEM Mould No drives BEM Mould No / BEM No on the same article row elsewhere.
    if (tableId === "CASTING_TABLE" && fieldId === "BEM_MOULD_NO") {
      nextValues = syncBemNoAcrossProcessTables(nextValues, rowIndex, String(value ?? ""));
    }

    onChange(nextValues);
  };

  const getSyncedBemNo = (rowIndex: number, fallback?: unknown) =>
    String(
      (values.CASTING_TABLE as Record<string, unknown>[] | undefined)?.[rowIndex]?.BEM_MOULD_NO ??
        fallback ??
        "",
    );

  const updateCountField = (fieldId: string, raw: string) => {
    onChange(syncHardwareArticleTable({ ...values, [fieldId]: raw }));
  };

  const handleLinerFieldChange = (fieldId: string, value: string) => {
    onChange(syncHardwareArticleTable({ ...values, [fieldId]: value }));
  };

  // Only disable the Hardware Details section when loaded or explicitly disabled
  const isHardwareSectionLocked = hardwareFieldsDisabled || isFormLoaded;

  return (
    <AppDatePickerProvider>
      <Stack
        spacing={3}
        sx={{
          position: "relative",
          ...(isLoading ? { pointerEvents: "none", userSelect: "none" } : null),
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 20,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 1.25,
              pt: { xs: 6, sm: 10 },
              bgcolor: "rgba(255, 255, 255, 0.45)",
              "@keyframes subscaleDottedSpin": {
                to: { transform: "rotate(360deg)" },
              },
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: `3px dotted ${SUBSCALE_BRAND.ss}`,
                borderTopColor: "transparent",
                animation: "subscaleDottedSpin 0.85s linear infinite",
              }}
            />
            <Typography
              sx={{
                fontSize: "0.82rem",
                fontWeight: 500,
                color: SUBSCALE_BRAND.textSub,
                fontFamily: fonts.family.primary,
              }}
            >
              {S.LOADING_FORM_TITLE}
            </Typography>
          </Box>
        ) : null}

      {/* SECTION 1: HARDWARE PREPARATION COUNTS (DISABLED ON LOAD) */}
      <Box
        sx={{
          ...sectionCardSx,
          ...(isHardwareSectionLocked ? { opacity: 0.65, pointerEvents: "none" } : {}),
        }}
      >
        <Box sx={sectionHeaderSx}>
          <BuildRoundedIcon sx={{ fontSize: 18 }} />
          <Typography sx={sectionTitleSx}>
            {S.PREPARATION_TITLE}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {HARDWARE_COUNT_FIELDS.map((field) => (
            <FormInput
              key={field.id}
              label={field.label}
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={values[field.id] ?? ""}
              onChange={(e) => updateCountField(field.id, e.target.value)}
            />
          ))}

          <FormInput
            select
            label={LINER_TYPE_FIELD.label}
            value={values[LINER_TYPE_FIELD.id] ?? ""}
            onChange={(e) => handleLinerFieldChange(LINER_TYPE_FIELD.id, e.target.value)}
            SelectProps={{ displayEmpty: true, MenuProps: appDropdownMenuProps }}
          >
            <MenuItem value="">
              <em style={{ ...appDropdownPlaceholderSx, fontStyle: "normal" } as CSSProperties}>
                Select Liner Type
              </em>
            </MenuItem>
            {LINER_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value} sx={{ fontSize: APP_CONTROL_FONT_SIZE }}>
                {option.label}
              </MenuItem>
            ))}
          </FormInput>

          <FormInput
            label={LINER_BATCH_NO_FIELD.label}
            value={values[LINER_BATCH_NO_FIELD.id] ?? ""}
            onChange={(e) => handleLinerFieldChange(LINER_BATCH_NO_FIELD.id, e.target.value)}
          />

          <DateField
            label={LINER_BATCH_DATE_FIELD.label}
            value={formatToUiDate(String(values[LINER_BATCH_DATE_FIELD.id] ?? ""))}
            onChange={(next) => handleLinerFieldChange(LINER_BATCH_DATE_FIELD.id, next)}
            placeholder="DD-MM-YYYY"
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 1.25,
          px: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {isFormLoaded && (
            <Tooltip title="Delete loaded form & enable hardware details">
              <IconButton color="error" onClick={handleResetForm} size="small">
                <DeleteOutlineRoundedIcon />
              </IconButton>
            </Tooltip>
          )}
          <Button
            variant="contained"
            size="small"
            disabled={!hardwareComplete || isFormLoaded || isLoading}
            onClick={handleLoadForm}
            startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {isLoading ? S.LOADING_FORM_TITLE : S.LOAD_FORM}
          </Button>
        </Box>

        {isFormLoaded && onRequestSaveDraft && onRequestSubmit ? (
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.25} justifyContent="flex-end">
            <Button
              variant="outlined"
              size="small"
              disabled={actionLoading || isLoading}
              onClick={onRequestSaveDraft}
              startIcon={
                actionLoading ? <CircularProgress size={14} color="inherit" /> : undefined
              }
            >
              {S.SAVE_DRAFT}
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={actionLoading || isLoading}
              onClick={onRequestSubmit}
            >
              {isEditMode ? S.RESUBMIT : S.SUBMIT}
            </Button>
          </Stack>
        ) : null}
      </Box>

      {/* PROCESS & ARTICLE TABLES (DISPLAY ONLY WHEN FORM IS LOADED) */}
      {isFormLoaded && (
        <>
          {/* SECTION 2: HARDWARE ARTICLE TABLE (ENABLED FOR EDITING) */}
          <Box sx={sectionCardSx}>
            <Box sx={sectionHeaderSx}>
              <TableChartRoundedIcon sx={{ fontSize: 18 }} />
              <Typography sx={sectionTitleSx}>
                {S.ARTICLE_TABLE_TITLE}
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <TableContainer
                sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Article Type</TableCell>
                      <TableCell sx={tableHeaderCellSx}>{S.COL_RUBBER_MATERIAL}</TableCell>
                      <TableCell sx={tableHeaderCellSx}>{S.COL_SLEEVE_NO}</TableCell>
                      <TableCell sx={tableHeaderCellSx}>{S.COL_MOULD_NO}</TableCell>
                      <TableCell sx={tableHeaderCellSx}>{S.COL_LENGTH}</TableCell>
                      <TableCell sx={tableHeaderCellSx}>{S.COL_THICKNESS}</TableCell>
                      <TableCell sx={tableHeaderCellSx}>{S.COL_LINER_APPLIED}</TableCell>
                      <TableCell sx={tableHeaderCellSx}>{S.COL_OBSERVATIONS}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {((values[ARTICLE_TYPE_TABLE_ID] as []) ?? []).map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
                        <TableCell sx={articleTypeCellSx}>
                          {formatArticleTypeLabel(row.ARTICLE_TYPE)}
                        </TableCell>
                        <TableCell sx={{ minWidth: 160, ...tableBodyCellSx }}>
                          <FormInput
                            select
                            compact
                            value={row.RUBBER_MATERIAL ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                ARTICLE_TYPE_TABLE_ID,
                                idx,
                                "RUBBER_MATERIAL",
                                e.target.value,
                              )
                            }
                            SelectProps={{
                              displayEmpty: true,
                              MenuProps: appDropdownMenuProps,
                            }}
                          >
                            <MenuItem value="">
                              <em
                                style={
                                  {
                                    ...appDropdownPlaceholderSx,
                                    fontStyle: "normal",
                                  } as CSSProperties
                                }
                              >
                                Select Rubber Material
                              </em>
                            </MenuItem>
                            {RUBBER_MATERIAL_OPTIONS.map((opt) => (
                              <MenuItem key={opt} value={opt} sx={{ fontSize: APP_CONTROL_FONT_SIZE }}>
                                {opt}
                              </MenuItem>
                            ))}
                          </FormInput>
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            value={row.SLEEVE_NO ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                ARTICLE_TYPE_TABLE_ID,
                                idx,
                                "SLEEVE_NO",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            value={row.MOULD_NO ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                ARTICLE_TYPE_TABLE_ID,
                                idx,
                                "MOULD_NO",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            value={row.SIZE_MM ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                ARTICLE_TYPE_TABLE_ID,
                                idx,
                                "SIZE_MM",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.THICKNESS_MM ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                ARTICLE_TYPE_TABLE_ID,
                                idx,
                                "THICKNESS_MM",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            value={row.LINER_APPLIED ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                ARTICLE_TYPE_TABLE_ID,
                                idx,
                                "LINER_APPLIED",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            value={row.OBSERVATIONS ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                ARTICLE_TYPE_TABLE_ID,
                                idx,
                                "OBSERVATIONS",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>

          {/* SECTION 3: CASTING DETAILS TABLE */}
          <Box sx={sectionCardSx}>
            <Box sx={sectionHeaderSx}>
              <PrecisionManufacturingIcon sx={{ fontSize: 18 }} />
              <Typography sx={sectionTitleSx}>Casting Details</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Box sx={{ mb: 2, maxWidth: 280 }}>
                <DateField
                  label="Date Of Casting"
                  value={formatToUiDate(String(values.DATE_OF_CASTING ?? ""))}
                  onChange={(next) => onChange({ ...values, DATE_OF_CASTING: next })}
                  placeholder="DD-MM-YYYY"
                />
              </Box>
              <TableContainer
                sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Article Type</TableCell>
                      <TableCell sx={tableHeaderCellSx}>BEM Mould No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Casting Pit No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Start Time</TableCell>
                      <TableCell sx={tableHeaderCellSx}>End Time</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Vacuum Level</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {((values.CASTING_TABLE as []) ?? []).map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
                        <TableCell sx={articleTypeCellSx}>
                          {formatArticleTypeLabel(row.ARTICLE_TYPE)}
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            value={row.BEM_MOULD_NO ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "CASTING_TABLE",
                                idx,
                                "BEM_MOULD_NO",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            value={row.CASTING_PIT_NO ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "CASTING_TABLE",
                                idx,
                                "CASTING_PIT_NO",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <TimeField
                            compact
                            value={String(row.CASTING_START_TIME ?? "")}
                            onChange={(next) =>
                              updateTableRowCell(
                                "CASTING_TABLE",
                                idx,
                                "CASTING_START_TIME",
                                next,
                              )
                            }
                            placeholder="HH:mm"
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <TimeField
                            compact
                            value={String(row.CASTING_END_TIME ?? "")}
                            onChange={(next) =>
                              updateTableRowCell(
                                "CASTING_TABLE",
                                idx,
                                "CASTING_END_TIME",
                                next,
                              )
                            }
                            placeholder="HH:mm"
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.VACUUM_LEVEL ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "CASTING_TABLE",
                                idx,
                                "VACUUM_LEVEL",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            value={row.REMARKS ?? ""}
                            onChange={(e) =>
                              updateTableRowCell("CASTING_TABLE", idx, "REMARKS", e.target.value)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>

          {/* SECTION 4: CURING DETAILS TABLE */}
          <Box sx={sectionCardSx}>
            <Box sx={sectionHeaderSx}>
              <ThermostatIcon sx={{ fontSize: 18 }} />
              <Typography sx={sectionTitleSx}>Curing Details</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <TableContainer
                sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Article Type</TableCell>
                      <TableCell sx={tableHeaderCellSx}>BEM Mould No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Curing Start Date</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Curing End Date</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Oven No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Temperature (°C)</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Hardness</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Decoring Date</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Decoring Load</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Grain Surface Obs.</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {((values.CURING_TABLE as []) ?? []).map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
                        <TableCell sx={articleTypeCellSx}>
                          {formatArticleTypeLabel(row.ARTICLE_TYPE)}
                        </TableCell>
                        <TableCell sx={bemNoTextSx}>
                          {getSyncedBemNo(idx) || "—"}
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <DateField
                            compact
                            value={formatToUiDate(String(row.CURING_START_DATE ?? ""))}
                            onChange={(next) =>
                              updateTableRowCell(
                                "CURING_TABLE",
                                idx,
                                "CURING_START_DATE",
                                next,
                              )
                            }
                            placeholder="DD-MM-YYYY"
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <DateField
                            compact
                            value={formatToUiDate(String(row.CURING_END_DATE ?? ""))}
                            onChange={(next) =>
                              updateTableRowCell(
                                "CURING_TABLE",
                                idx,
                                "CURING_END_DATE",
                                next,
                              )
                            }
                            placeholder="DD-MM-YYYY"
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            value={row.OVEN_NO ?? ""}
                            onChange={(e) =>
                              updateTableRowCell("CURING_TABLE", idx, "OVEN_NO", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.TEMPERATURE ?? ""}
                            onChange={(e) =>
                              updateTableRowCell("CURING_TABLE", idx, "TEMPERATURE", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.HARDNESS ?? ""}
                            onChange={(e) =>
                              updateTableRowCell("CURING_TABLE", idx, "HARDNESS", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <DateField
                            compact
                            value={formatToUiDate(String(row.DECORING_DATE ?? ""))}
                            onChange={(next) =>
                              updateTableRowCell(
                                "CURING_TABLE",
                                idx,
                                "DECORING_DATE",
                                next,
                              )
                            }
                            placeholder="DD-MM-YYYY"
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.DECORING_LOAD ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "CURING_TABLE",
                                idx,
                                "DECORING_LOAD",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            value={row.GRAIN_SURFACE_OBSERVATIONS ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "CURING_TABLE",
                                idx,
                                "GRAIN_SURFACE_OBSERVATIONS",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>

          {/* SECTION 5: NDT DETAILS TABLE */}
          <Box sx={sectionCardSx}>
            <Box sx={sectionHeaderSx}>
              <ShieldIcon sx={{ fontSize: 18 }} />
              <Typography sx={sectionTitleSx}>NDT Details</Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <TableContainer
                sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Article Type</TableCell>
                      <TableCell sx={tableHeaderCellSx}>BEM No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Date Of NDT</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Observations</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {((values.NDT_TABLE as []) ?? []).map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
                        <TableCell sx={articleTypeCellSx}>
                          {formatArticleTypeLabel(row.ARTICLE_TYPE)}
                        </TableCell>
                        <TableCell sx={bemNoTextSx}>
                          {getSyncedBemNo(idx) || "—"}
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <DateField
                            compact
                            value={formatToUiDate(String(row.DATE_OF_NDT ?? ""))}
                            onChange={(next) =>
                              updateTableRowCell("NDT_TABLE", idx, "DATE_OF_NDT", next)
                            }
                            placeholder="DD-MM-YYYY"
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            value={row.OBSERVATIONS ?? ""}
                            onChange={(e) =>
                              updateTableRowCell("NDT_TABLE", idx, "OBSERVATIONS", e.target.value)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>

          {/* SECTION 6: TRIMMING DETAILS TABLE */}
          <Box sx={sectionCardSx}>
            <Box sx={sectionHeaderSx}>
              <ContentCutIcon sx={{ fontSize: 18 }} />
              <Typography sx={sectionTitleSx}>
                Trimming Details
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <TableContainer
                sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Article Type</TableCell>
                      <TableCell sx={tableHeaderCellSx}>BEM No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>HE Side OD</TableCell>
                      <TableCell sx={tableHeaderCellSx}>HE Port Inner</TableCell>
                      <TableCell sx={tableHeaderCellSx}>HE Port Outer</TableCell>
                      <TableCell sx={tableHeaderCellSx}>HE Before Inhib. In</TableCell>
                      <TableCell sx={tableHeaderCellSx}>HE Before Inhib. Out</TableCell>
                      <TableCell sx={tableHeaderCellSx}>NE Side OD</TableCell>
                      <TableCell sx={tableHeaderCellSx}>NE Port Inner</TableCell>
                      <TableCell sx={tableHeaderCellSx}>NE Port Outer</TableCell>
                      <TableCell sx={tableHeaderCellSx}>NE Web Inner</TableCell>
                      <TableCell sx={tableHeaderCellSx}>NE Web Outer</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Length Before Inhib.</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {((values.TRIMMING_TABLE as []) ?? []).map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
                        <TableCell sx={articleTypeCellSx}>
                          {formatArticleTypeLabel(row.ARTICLE_TYPE)}
                        </TableCell>
                        <TableCell sx={bemNoTextSx}>
                          {getSyncedBemNo(idx) || "—"}
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.HE_OD ?? ""}
                            onChange={(e) =>
                              updateTableRowCell("TRIMMING_TABLE", idx, "HE_OD", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.HE_PORT_INNER ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "TRIMMING_TABLE",
                                idx,
                                "HE_PORT_INNER",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.HE_PORT_OUTER ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "TRIMMING_TABLE",
                                idx,
                                "HE_PORT_OUTER",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.HE_BEFORE_INHIBITION_INNER ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "TRIMMING_TABLE",
                                idx,
                                "HE_BEFORE_INHIBITION_INNER",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.HE_BEFORE_INHIBITION_OUTER ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "TRIMMING_TABLE",
                                idx,
                                "HE_BEFORE_INHIBITION_OUTER",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.NE_OD ?? ""}
                            onChange={(e) =>
                              updateTableRowCell("TRIMMING_TABLE", idx, "NE_OD", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.NE_PORT_INNER ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "TRIMMING_TABLE",
                                idx,
                                "NE_PORT_INNER",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.NE_PORT_OUTER ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "TRIMMING_TABLE",
                                idx,
                                "NE_PORT_OUTER",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.NE_WEB_INNER ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "TRIMMING_TABLE",
                                idx,
                                "NE_WEB_INNER",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.NE_WEB_OUTER ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "TRIMMING_TABLE",
                                idx,
                                "NE_WEB_OUTER",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.LENGTH_BEFORE_INHIBITION ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "TRIMMING_TABLE",
                                idx,
                                "LENGTH_BEFORE_INHIBITION",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>

          {/* SECTION 7: INHIBITION DETAILS TABLE */}
          <Box sx={sectionCardSx}>
            <Box sx={sectionHeaderSx}>
              <ScienceIcon sx={{ fontSize: 18 }} />
              <Typography sx={sectionTitleSx}>
                Inhibition Details
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <FormInput
                  label="IR Batch No"
                  value={values.IR_BATCH_NO ?? ""}
                  onChange={(e) => onChange({ ...values, IR_BATCH_NO: e.target.value })}
                />
                <DateField
                  label="Date Of Manufacturing"
                  value={formatToUiDate(String(values.DATE_OF_MFG ?? ""))}
                  onChange={(next) => onChange({ ...values, DATE_OF_MFG: next })}
                  placeholder="DD-MM-YYYY"
                />
              </Stack>
              <TableContainer
                sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Article Type</TableCell>
                      <TableCell sx={tableHeaderCellSx}>BEM No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Liner Coated Sleeve Wt (A)</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Wt Before Inhib. (B)</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Wt After Inhib.</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Wt Of IR Applied</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Propellant Wt (C-B-A)</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Date of Application</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {((values.INHIBITION_TABLE as []) ?? []).map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
                        <TableCell sx={articleTypeCellSx}>
                          {formatArticleTypeLabel(row.ARTICLE_TYPE)}
                        </TableCell>
                        <TableCell sx={bemNoTextSx}>
                          {getSyncedBemNo(idx) || "—"}
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.LINER_COATED_SLEEVE_WEIGHT ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "INHIBITION_TABLE",
                                idx,
                                "LINER_COATED_SLEEVE_WEIGHT",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.WEIGHT_BEFORE_INHIBITION ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "INHIBITION_TABLE",
                                idx,
                                "WEIGHT_BEFORE_INHIBITION",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.WEIGHT_AFTER_INHIBITION ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "INHIBITION_TABLE",
                                idx,
                                "WEIGHT_AFTER_INHIBITION",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.IR_APPLIED_WEIGHT ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "INHIBITION_TABLE",
                                idx,
                                "IR_APPLIED_WEIGHT",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact disabled value={row.PROPELLANT_WEIGHT ?? ""} />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <DateField
                            compact
                            value={formatToUiDate(String(row.DATE_OF_APPLICATION ?? ""))}
                            onChange={(next) =>
                              updateTableRowCell(
                                "INHIBITION_TABLE",
                                idx,
                                "DATE_OF_APPLICATION",
                                next,
                              )
                            }
                            placeholder="DD-MM-YYYY"
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            value={row.REMARKS ?? ""}
                            onChange={(e) =>
                              updateTableRowCell("INHIBITION_TABLE", idx, "REMARKS", e.target.value)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>

          {showBemTestingTables ? (
            <>
          {/* SECTION 8: STATIC TESTING TABLE */}
          <Box sx={sectionCardSx}>
            <Box sx={sectionHeaderSx}>
              <SpeedIcon sx={{ fontSize: 18 }} />
              <Typography sx={sectionTitleSx}>
                Static Testing Of BEM
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <TableContainer
                sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Article Type</TableCell>
                      <TableCell sx={tableHeaderCellSx}>BEM No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Prop Mass</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Dt</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Web Thk</TableCell>
                      <TableCell sx={tableHeaderCellSx}>n Value</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Pr Avg</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Th Avg</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Burn Rate</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Upload Graph</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {((values.STATIC_TESTING_TABLE as []) ?? []).map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
                        <TableCell sx={articleTypeCellSx}>
                          {formatArticleTypeLabel(row.ARTICLE_TYPE)}
                        </TableCell>
                        <TableCell sx={bemNoTextSx}>
                          {getSyncedBemNo(idx) || "—"}
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.PROPELLANT_MASS ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "STATIC_TESTING_TABLE",
                                idx,
                                "PROPELLANT_MASS",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.DT ?? ""}
                            onChange={(e) =>
                              updateTableRowCell("STATIC_TESTING_TABLE", idx, "DT", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.WEB_THICKNESS ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "STATIC_TESTING_TABLE",
                                idx,
                                "WEB_THICKNESS",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.N_VALUE ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "STATIC_TESTING_TABLE",
                                idx,
                                "N_VALUE",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.PRESSURE_AVG ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "STATIC_TESTING_TABLE",
                                idx,
                                "PRESSURE_AVG",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.THRUST_AVG ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "STATIC_TESTING_TABLE",
                                idx,
                                "THRUST_AVG",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput
                            compact
                            type="number"
                            value={row.BURN_RATE ?? ""}
                            onChange={(e) =>
                              updateTableRowCell(
                                "STATIC_TESTING_TABLE",
                                idx,
                                "BURN_RATE",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 180 }}>
                          <FileUploadButton
                            icon={UploadFileIcon}
                            label={row.GRAPH_UPLOAD ? row.GRAPH_UPLOAD.name : "Upload Graph"}
                            accept={FILE_PICKER_ACCEPT.IMAGE_PDF}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                updateTableRowCell(
                                  "STATIC_TESTING_TABLE",
                                  idx,
                                  "GRAPH_UPLOAD",
                                  file,
                                );
                              }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>

          {/* SECTION 9: MECHANICAL INTERFACE PROPERTIES TABLE */}
          <Box sx={sectionCardSx}>
            <Box sx={sectionHeaderSx}>
              <FitnessCenterIcon sx={{ fontSize: 18 }} />
              <Typography sx={sectionTitleSx}>
                Mechanical Interface Properties
              </Typography>
            </Box>
            <Box sx={{ p: 2 }}>
              <TableContainer
                sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Article Type</TableCell>
                      <TableCell sx={tableHeaderCellSx}>BEM No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>TS</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Elong</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Modulus</TableCell>
                      <TableCell sx={tableHeaderCellSx}>SBS</TableCell>
                      <TableCell sx={tableHeaderCellSx}>TBS</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Peel Strength</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Density</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Actor</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {((values.MECHANICAL_PROPERTIES_TABLE as []) ?? []).map(
                      (row: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
                          <TableCell sx={articleTypeCellSx}>
                            {formatArticleTypeLabel(row.ARTICLE_TYPE)}
                          </TableCell>
                          <TableCell sx={bemNoTextSx}>
                            {getSyncedBemNo(idx) || "—"}
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            <FormInput
                            compact
                              type="number"
                              value={row.TS ?? ""}
                              onChange={(e) =>
                                updateTableRowCell(
                                  "MECHANICAL_PROPERTIES_TABLE",
                                  idx,
                                  "TS",
                                  e.target.value,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            <FormInput
                            compact
                              type="number"
                              value={row.ELONGATION ?? ""}
                              onChange={(e) =>
                                updateTableRowCell(
                                  "MECHANICAL_PROPERTIES_TABLE",
                                  idx,
                                  "ELONGATION",
                                  e.target.value,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            <FormInput
                            compact
                              type="number"
                              value={row.MODULUS ?? ""}
                              onChange={(e) =>
                                updateTableRowCell(
                                  "MECHANICAL_PROPERTIES_TABLE",
                                  idx,
                                  "MODULUS",
                                  e.target.value,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            <FormInput
                            compact
                              type="number"
                              value={row.SBS ?? ""}
                              onChange={(e) =>
                                updateTableRowCell(
                                  "MECHANICAL_PROPERTIES_TABLE",
                                  idx,
                                  "SBS",
                                  e.target.value,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            <FormInput
                            compact
                              type="number"
                              value={row.TBS ?? ""}
                              onChange={(e) =>
                                updateTableRowCell(
                                  "MECHANICAL_PROPERTIES_TABLE",
                                  idx,
                                  "TBS",
                                  e.target.value,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            <FormInput
                            compact
                              type="number"
                              value={row.PEEL_STRENGTH ?? ""}
                              onChange={(e) =>
                                updateTableRowCell(
                                  "MECHANICAL_PROPERTIES_TABLE",
                                  idx,
                                  "PEEL_STRENGTH",
                                  e.target.value,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            <FormInput
                            compact
                              type="number"
                              value={row.DENSITY ?? ""}
                              onChange={(e) =>
                                updateTableRowCell(
                                  "MECHANICAL_PROPERTIES_TABLE",
                                  idx,
                                  "DENSITY",
                                  e.target.value,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            <FormInput
                            compact
                              value={row.ACTOR ?? ""}
                              onChange={(e) =>
                                updateTableRowCell(
                                  "MECHANICAL_PROPERTIES_TABLE",
                                  idx,
                                  "ACTOR",
                                  e.target.value,
                                )
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
            </>
          ) : null}

        </>
      )}
    </Stack>
    </AppDatePickerProvider>
  );
};

export default SubscaleHardwareArticlePanel;
