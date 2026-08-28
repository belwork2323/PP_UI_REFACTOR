import {
  memo,
  useCallback,
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
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import {
  ArticleTypeTableSection,
  CastingTableSection,
  CuringTableSection,
  MechanicalPropertiesTableSection,
  NdtTableSection,
  StaticTestingTableSection,
  TrimmingTableSection,
} from "./components/SubscaleHardwareTableSections";
import { SubscaleTableTextCell } from "./components/SubscaleTableCells";
import SubscaleProcessSection from "./components/SubscaleProcessSection";
import { hasProcessTableData, scheduleIdleWork } from "./utils/subscaleTableUtils";
import {
  sectionCardSx,
  sectionHeaderSx,
  sectionTitleSx,
  tableHeaderCellSx,
  tableBodyCellSx,
  articleTypeCellSx,
  bemNoTextSx,
  formatArticleTypeLabel,
} from "./utils/subscaleHardwareTableStyles";
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
  canManageProcessTables?: boolean;
};

const SubscaleHardwareArticlePanel = ({
  values,
  onChange,
  hardwareFieldsDisabled = false,
  batchType,
  canManageProcessTables = true,
}: SubscaleHardwareArticlePanelProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const valuesRef = useRef(values);
  const pendingValuesRef = useRef(values);
  valuesRef.current = values;
  pendingValuesRef.current = values;

  const patchFormValues = useCallback(
    (patch: Partial<SchemaFormValues>) => {
      const next = { ...pendingValuesRef.current, ...patch };
      pendingValuesRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  const hardwareComplete = isHardwarePreparationComplete(values);
  const isFormLoaded = Boolean(values.IS_PROCESS_FORM_LOADED);
  const showBemTestingTables = !isMainScaleSubscaleBatch(batchType);

  // Dismiss loader after the article table has committed and painted.
  useEffect(() => {
    if (!isLoading || !isFormLoaded) return;
    const articleRows = values[ARTICLE_TYPE_TABLE_ID];
    if (!Array.isArray(articleRows) || articleRows.length === 0) return;

    let outer = 0;
    let inner = 0;
    outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setIsLoading(false));
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
    };
  }, [isLoading, isFormLoaded, values[ARTICLE_TYPE_TABLE_ID]]);

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

  // Handle Load Form Click — article table first, remaining tables staggered on idle.
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

    patchFormValues({
      IS_PROCESS_FORM_LOADED: true,
      [ARTICLE_TYPE_TABLE_ID]: articleTableRows,
      CASTING_TABLE: [],
      CURING_TABLE: [],
      NDT_TABLE: [],
      TRIMMING_TABLE: [],
      INHIBITION_TABLE: [],
      STATIC_TESTING_TABLE: [],
      MECHANICAL_PROPERTIES_TABLE: [],
    });

    scheduleIdleWork(() => {
      patchFormValues({
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
      });
    });

    scheduleIdleWork(() => {
      patchFormValues({
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
      });
    });

    scheduleIdleWork(() => {
      patchFormValues({
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
      });
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
  const updateTableRowCell = useCallback(
    (tableId: string, rowIndex: number, fieldId: string, value: any) => {
      const currentValues = valuesRef.current;
      const sourceTable = Array.isArray(currentValues[tableId]) ? currentValues[tableId] : [];
      const tableData = sourceTable.slice();
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
      let nextValues: SchemaFormValues = { ...currentValues, [tableId]: tableData };

      if (tableId === "CASTING_TABLE" && fieldId === "BEM_MOULD_NO") {
        nextValues = syncBemNoAcrossProcessTables(nextValues, rowIndex, String(value ?? ""));
      }

      onChange(nextValues);
    },
    [onChange],
  );

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
          justifyContent: "flex-end",
          gap: 1.25,
          px: 1,
        }}
      >
        {isFormLoaded ? (
          <Button
            variant="outlined"
            color="error"
            size="small"
            disabled={!canManageProcessTables}
            onClick={handleResetForm}
            startIcon={<DeleteOutlineRoundedIcon />}
          >
            {S.DELETE_TABLES}
          </Button>
        ) : null}
        <Button
          variant="outlined"
          size="small"
          disabled={
            !hardwareComplete || isFormLoaded || isLoading || !canManageProcessTables
          }
          onClick={handleLoadForm}
          startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {isLoading ? S.LOADING_FORM_TITLE : S.LOAD_FORM}
        </Button>
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
              <ArticleTypeTableSection
                rows={(values[ARTICLE_TYPE_TABLE_ID] as []) ?? []}
                onCellChange={updateTableRowCell}
              />
            </Box>
          </Box>

          {/* SECTION 3: CASTING DETAILS TABLE */}
          <SubscaleProcessSection
            id="casting"
            title="Casting Details"
            icon={PrecisionManufacturingIcon}
            defaultExpanded={hasProcessTableData(values.CASTING_TABLE as unknown[])}
            lazyMount
          >
              <Box sx={{ mb: 2, maxWidth: 280 }}>
                <DateField
                  label="Date Of Casting"
                  value={formatToUiDate(String(values.DATE_OF_CASTING ?? ""))}
                  onChange={(next) => patchFormValues({ DATE_OF_CASTING: next })}
                  placeholder="DD-MM-YYYY"
                />
              </Box>
              <CastingTableSection
                rows={(values.CASTING_TABLE as []) ?? []}
                onCellChange={updateTableRowCell}
              />
          </SubscaleProcessSection>

          {/* SECTION 4: CURING DETAILS TABLE */}
          <SubscaleProcessSection
            id="curing"
            title="Curing Details"
            icon={ThermostatIcon}
            defaultExpanded={hasProcessTableData(values.CURING_TABLE as unknown[])}
            lazyMount
          >
              <CuringTableSection
                rows={(values.CURING_TABLE as []) ?? []}
                onCellChange={updateTableRowCell}
                getSyncedBemNo={getSyncedBemNo}
              />
          </SubscaleProcessSection>

          {/* SECTION 5: NDT DETAILS TABLE */}
          <SubscaleProcessSection
            id="ndt"
            title="NDT Details"
            icon={ShieldIcon}
            defaultExpanded={hasProcessTableData(values.NDT_TABLE as unknown[])}
            lazyMount
          >
              <NdtTableSection
                rows={(values.NDT_TABLE as []) ?? []}
                onCellChange={updateTableRowCell}
                getSyncedBemNo={getSyncedBemNo}
              />
          </SubscaleProcessSection>

          {/* SECTION 6: TRIMMING DETAILS TABLE */}
          <SubscaleProcessSection
            id="trimming"
            title="Trimming Details"
            icon={ContentCutIcon}
            defaultExpanded={hasProcessTableData(values.TRIMMING_TABLE as unknown[])}
            lazyMount
          >
              <TrimmingTableSection
                rows={(values.TRIMMING_TABLE as []) ?? []}
                onCellChange={updateTableRowCell}
                getSyncedBemNo={getSyncedBemNo}
              />
          </SubscaleProcessSection>
          <SubscaleProcessSection
            id="inhibition"
            title="Inhibition Details"
            icon={ScienceIcon}
            defaultExpanded={hasProcessTableData(values.INHIBITION_TABLE as unknown[])}
            lazyMount
          >
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <FormInput
                  label="IR Batch No"
                  value={values.IR_BATCH_NO ?? ""}
                  onChange={(e) => patchFormValues({ IR_BATCH_NO: e.target.value })}
                />
                <DateField
                  label="Date Of Manufacturing"
                  value={formatToUiDate(String(values.DATE_OF_MFG ?? ""))}
                  onChange={(next) => patchFormValues({ DATE_OF_MFG: next })}
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
                        <TableCell sx={bemNoTextSx}>{getSyncedBemNo(idx) || "—"}</TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <SubscaleTableTextCell
                            compact
                            type="number"
                            tableId="INHIBITION_TABLE"
                            rowIndex={idx}
                            fieldId="LINER_COATED_SLEEVE_WEIGHT"
                            value={row.LINER_COATED_SLEEVE_WEIGHT ?? ""}
                            onCellChange={updateTableRowCell}
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <SubscaleTableTextCell
                            compact
                            type="number"
                            tableId="INHIBITION_TABLE"
                            rowIndex={idx}
                            fieldId="WEIGHT_BEFORE_INHIBITION"
                            value={row.WEIGHT_BEFORE_INHIBITION ?? ""}
                            onCellChange={updateTableRowCell}
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <SubscaleTableTextCell
                            compact
                            type="number"
                            tableId="INHIBITION_TABLE"
                            rowIndex={idx}
                            fieldId="WEIGHT_AFTER_INHIBITION"
                            value={row.WEIGHT_AFTER_INHIBITION ?? ""}
                            onCellChange={updateTableRowCell}
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <SubscaleTableTextCell
                            compact
                            type="number"
                            tableId="INHIBITION_TABLE"
                            rowIndex={idx}
                            fieldId="IR_APPLIED_WEIGHT"
                            value={row.IR_APPLIED_WEIGHT ?? ""}
                            onCellChange={updateTableRowCell}
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <FormInput compact disabled value={row.PROPELLANT_WEIGHT ?? ""} />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <DateField
                            compact
                            value={formatToUiDate(String(row.DATE_OF_APPLICATION ?? ""))}
                            onChange={(next) =>
                              updateTableRowCell("INHIBITION_TABLE", idx, "DATE_OF_APPLICATION", next)
                            }
                            placeholder="DD-MM-YYYY"
                          />
                        </TableCell>
                        <TableCell sx={tableBodyCellSx}>
                          <SubscaleTableTextCell
                            compact
                            tableId="INHIBITION_TABLE"
                            rowIndex={idx}
                            fieldId="REMARKS"
                            value={row.REMARKS ?? ""}
                            onCellChange={updateTableRowCell}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
          </SubscaleProcessSection>

          {showBemTestingTables ? (
            <>
          {/* SECTION 8: STATIC TESTING TABLE */}
          <SubscaleProcessSection
            id="static-testing"
            title="Static Testing Of BEM"
            icon={SpeedIcon}
            defaultExpanded={hasProcessTableData(values.STATIC_TESTING_TABLE as unknown[])}
            lazyMount
          >
              <StaticTestingTableSection
                rows={(values.STATIC_TESTING_TABLE as []) ?? []}
                onCellChange={updateTableRowCell}
                getSyncedBemNo={getSyncedBemNo}
                FileUploadButton={FileUploadButton}
                onFileUpload={(idx, file) =>
                  updateTableRowCell("STATIC_TESTING_TABLE", idx, "GRAPH_UPLOAD", file)
                }
              />
          </SubscaleProcessSection>

          {/* SECTION 9: MECHANICAL INTERFACE PROPERTIES TABLE */}
          <SubscaleProcessSection
            id="mechanical"
            title="Mechanical Interface Properties"
            icon={FitnessCenterIcon}
            defaultExpanded={hasProcessTableData(values.MECHANICAL_PROPERTIES_TABLE as unknown[])}
            lazyMount
          >
              <MechanicalPropertiesTableSection
                rows={(values.MECHANICAL_PROPERTIES_TABLE as []) ?? []}
                onCellChange={updateTableRowCell}
                getSyncedBemNo={getSyncedBemNo}
              />
          </SubscaleProcessSection>
            </>
          ) : null}

        </>
      )}
    </Stack>
    </AppDatePickerProvider>
  );
};

export default memo(SubscaleHardwareArticlePanel);
