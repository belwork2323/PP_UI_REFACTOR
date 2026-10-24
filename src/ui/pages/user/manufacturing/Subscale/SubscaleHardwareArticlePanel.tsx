import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler,
  type ElementType,
} from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
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
import AppTextField from "../../../../components/common/AppTextField";
import AppDropdown from "../../../../components/common/AppDropdown";
import {
  ArticleTypeTableSection,
  CastingTableSection,
  CuringTableSection,
  MechanicalPropertiesTableSection,
  NdtTableSection,
  StaticTestingTableSection,
  TrimmingTableSection,
} from "./components/SubscaleHardwareTableSections";
import { applySubscaleFormScopePatch, syncProcessTableScope } from "./utils/subscaleFormScopeSync";
import { SubscaleTableTextCell } from "./components/SubscaleTableCells";
import SubscaleProcessSection from "./components/SubscaleProcessSection";
import {
  hasProcessTableData,
  hasValidationErrorsForPrefixes,
  scheduleIdleWork,
} from "./utils/subscaleTableUtils";
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
import DateField from "../../../../components/common/DateField";
import { AppDatePickerProvider } from "../../../../components/common/datePickerShared";
import { APP_CONTROL_HEIGHT } from "../../../../components/common/fieldStyles";
import { getSubscaleFieldFormatError } from "../../../../../data/validation/configs/subscale.validation.config";
import FieldErrorText from "../../../../components/validation/FieldErrorText";
import { STRINGS } from "../../../../../app/config/strings";
import { formatToUiDate } from "../../../../../utils/dateUtils";
import { SUBSCALE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/subscale_theme";
import fonts from "../../../../../app/theme/fonts";
import {
  ARTICLE_TYPE_TABLE_ID,
  HARDWARE_ARTICLE_SELECTIONS_ID,
  LINER_TYPE_FIELD,
  isHardwarePreparationComplete,
  syncHardwareArticleTable,
  LINER_BATCH_NO_FIELD,
  LINER_BATCH_DATE_FIELD,
  LINER_TYPE_OPTIONS,
  isMainScaleSubscaleBatch,
  getHardwareArticleSelections,
  getArticleTypesFromSelections,
  buildTrimmingRowsFromCasting,
  buildStaticTestingRowsFromTrimming,
  parseCount,
  type HardwareArticleOption,
  type HardwareArticleSelection,
  type TrimmingTableRow,
  type StaticTestingTableRow,
} from "../../../../../hooks/user/manufacturing/subscaleHardwareConfig";
import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";
import { generalController } from "@/controllers/admin/common/generalController";
import type { SubscaleArticleOption } from "@/data/api/common/generalAPI";

const S = STRINGS.MANUFACTURING.SUBSCALE.HARDWARE;
const BEM_NO_SYNC_TARGETS = [
  { tableId: "CURING_TABLE", fieldId: "BEM_NO" },
  { tableId: "NDT_TABLE", fieldId: "BEM_NO" },
  { tableId: "INHIBITION_TABLE", fieldId: "BEM_NO" },
  { tableId: "MECHANICAL_PROPERTIES_TABLE", fieldId: "BEM_NO" },
] as const;

const syncBemNoAcrossProcessTables = (
  values: SchemaFormValues,
  rowIndex: number,
  bemNo: string,
): SchemaFormValues => {
  let next: SchemaFormValues = { ...values };
  BEM_NO_SYNC_TARGETS.forEach(({ tableId, fieldId }) => {
    const rows = Array.isArray(next[tableId])
      ? [...(next[tableId] as Record<string, unknown>[])]
      : [];
    if (!rows[rowIndex]) return;
    rows[rowIndex] = { ...rows[rowIndex], [fieldId]: bemNo };
    next = syncProcessTableScope(next, tableId, rows);
  });
  return next;
};

/** Article Type MOULD_NO → Casting Details BEM_MOULD_NO (same row index). */
const syncMouldNoToCastingTable = (
  values: SchemaFormValues,
  rowIndex: number,
  mouldNo: string,
): SchemaFormValues => {
  const rows = Array.isArray(values.CASTING_TABLE)
    ? [...(values.CASTING_TABLE as Record<string, unknown>[])]
    : [];
  if (!rows[rowIndex]) return values;
  rows[rowIndex] = { ...rows[rowIndex], BEM_MOULD_NO: mouldNo };
  return syncProcessTableScope({ ...values }, "CASTING_TABLE", rows);
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
  batchDetails?: {
    subBatchType?: string | null;
    articles?: Array<{
      subscaleArticleId?: number;
      subscaleArticleCode?: string;
      subscaleArticleName?: string;
      isBem?: boolean;
      isActive?: boolean;
    }> | null;
  } | null;
  canManageProcessTables?: boolean;
  errors?: Record<string, string> | null;
  clearFieldError?: (path: string) => void;
  validationFocusPath?: string | null;
};

const mapMdmOption = (row: SubscaleArticleOption): HardwareArticleOption => ({
  subscaleArticleId: row.subscaleArticleId,
  subscaleArticleCode: row.subscaleArticleCode,
  subscaleArticleName: row.subscaleArticleName,
  isBem: row.isBem === true,
});

const SubscaleHardwareArticlePanel = ({
  values,
  onChange,
  hardwareFieldsDisabled = false,
  batchType,
  batchDetails = null,
  canManageProcessTables = true,
  errors,
  clearFieldError,
  validationFocusPath = null,
}: SubscaleHardwareArticlePanelProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [articleOptions, setArticleOptions] = useState<HardwareArticleOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [draftArticleCode, setDraftArticleCode] = useState("");
  const [draftNoOfArticles, setDraftNoOfArticles] = useState("");
  const [draftNoOfParts, setDraftNoOfParts] = useState("");
  const [addError, setAddError] = useState("");
  const valuesRef = useRef(values);
  const pendingValuesRef = useRef(values);
  valuesRef.current = values;
  pendingValuesRef.current = values;

  const subBatchType = String(batchDetails?.subBatchType ?? "").toUpperCase();
  const useBatchArticles = subBatchType === "EXPERIMENTAL";

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      if (useBatchArticles) {
        const fromBatch = (batchDetails?.articles ?? [])
          .filter((a) => a && (a.isActive !== false) && String(a.subscaleArticleName ?? "").trim())
          .map((a) => ({
            subscaleArticleId: Number(a.subscaleArticleId ?? 0),
            subscaleArticleCode: String(a.subscaleArticleCode ?? "").trim(),
            subscaleArticleName: String(a.subscaleArticleName ?? "").trim(),
            isBem: a.isBem === true,
          }));
        if (!cancelled) setArticleOptions(fromBatch);
        return;
      }

      setOptionsLoading(true);
      try {
        const response = await generalController.getSubscaleArticles();
        const list = Array.isArray(response?.data) ? (response.data as SubscaleArticleOption[]) : [];
        if (!cancelled) {
          setArticleOptions(
            list.filter((item) => item.isActive !== false).map(mapMdmOption),
          );
        }
      } catch {
        if (!cancelled) setArticleOptions([]);
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    };

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, [useBatchArticles, batchDetails?.articles]);

  const selections = useMemo(() => getHardwareArticleSelections(values), [values]);

  const dropdownOptions = useMemo(() => {
    const selectedCodes = new Set(
      selections.map((row) => row.subscaleArticleCode || String(row.subscaleArticleId)),
    );
    const selectedNames = new Set(
      selections.map((row) => row.subscaleArticleName.trim().toLowerCase()).filter(Boolean),
    );
    return articleOptions
      .filter((opt) => {
        const code = opt.subscaleArticleCode || String(opt.subscaleArticleId);
        if (selectedCodes.has(code)) return false;
        const name = opt.subscaleArticleName.trim().toLowerCase();
        return !name || !selectedNames.has(name);
      })
      .map((opt) => ({
        value: opt.subscaleArticleCode || String(opt.subscaleArticleId),
        label: opt.subscaleArticleName,
      }));
  }, [articleOptions, selections]);

  // Clear draft selection if that article was added (no longer in the dropdown).
  useEffect(() => {
    if (!draftArticleCode) return;
    if (!dropdownOptions.some((opt) => opt.value === draftArticleCode)) {
      setDraftArticleCode("");
    }
  }, [draftArticleCode, dropdownOptions]);

  const patchFormValues = useCallback(
    (patch: Partial<SchemaFormValues>) => {
      const next = applySubscaleFormScopePatch(pendingValuesRef.current, patch);
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

  const articleMouldSyncKey = useMemo(() => {
    const rows = Array.isArray(values[ARTICLE_TYPE_TABLE_ID])
      ? (values[ARTICLE_TYPE_TABLE_ID] as Record<string, unknown>[])
      : [];
    return rows.map((row) => String(row?.MOULD_NO ?? "").trim()).join("\u0001");
  }, [values[ARTICLE_TYPE_TABLE_ID]]);

  const castingRowCount = Array.isArray(values.CASTING_TABLE)
    ? values.CASTING_TABLE.length
    : 0;

  // Keep casting mould nos aligned with article type mould nos (drafts / hydrate).
  useEffect(() => {
    if (!isFormLoaded) return;
    const current = valuesRef.current;
    const articleRows = Array.isArray(current[ARTICLE_TYPE_TABLE_ID])
      ? (current[ARTICLE_TYPE_TABLE_ID] as Record<string, unknown>[])
      : [];
    const castingRows = Array.isArray(current.CASTING_TABLE)
      ? (current.CASTING_TABLE as Record<string, unknown>[])
      : [];
    if (!articleRows.length || !castingRows.length) return;

    let changed = false;
    const nextCasting = castingRows.map((row, idx) => {
      const mould = String(articleRows[idx]?.MOULD_NO ?? "").trim();
      if (!mould) return row;
      if (String(row.BEM_MOULD_NO ?? "").trim() === mould) return row;
      changed = true;
      return { ...row, BEM_MOULD_NO: mould };
    });
    if (!changed) return;
    onChange(syncProcessTableScope({ ...current }, "CASTING_TABLE", nextCasting));
  }, [isFormLoaded, articleMouldSyncKey, castingRowCount, onChange]);

  const commitSelections = (nextSelections: HardwareArticleSelection[]) => {
    clearFieldError?.(HARDWARE_ARTICLE_SELECTIONS_ID);
    onChange(
      syncHardwareArticleTable({
        ...values,
        [HARDWARE_ARTICLE_SELECTIONS_ID]: nextSelections,
      }),
    );
  };

  const draftOption = useMemo(
    () =>
      articleOptions.find(
        (opt) =>
          (opt.subscaleArticleCode || String(opt.subscaleArticleId)) === draftArticleCode,
      ) ?? null,
    [articleOptions, draftArticleCode],
  );
  const draftIsBem = draftOption?.isBem === true;

  const handleAddArticle = () => {
    setAddError("");
    const option = draftOption;
    const noOfArticles = parseCount(draftNoOfArticles);
    // No. of Parts applies only to BEM articles (isBem).
    const noOfParts = option?.isBem === true ? parseCount(draftNoOfParts) : 0;

    if (!option || noOfArticles <= 0) {
      setAddError(S.ARTICLE_ADD_REQUIRED);
      return;
    }

    const alreadyAdded = selections.some(
      (row) =>
        row.subscaleArticleCode === option.subscaleArticleCode ||
        row.subscaleArticleName === option.subscaleArticleName,
    );
    if (alreadyAdded) {
      setAddError(S.ARTICLE_ALREADY_ADDED);
      return;
    }

    commitSelections([
      ...selections,
      {
        subscaleArticleId: option.subscaleArticleId,
        subscaleArticleCode: option.subscaleArticleCode,
        subscaleArticleName: option.subscaleArticleName,
        noOfArticles,
        noOfParts,
        isBem: option.isBem === true,
      },
    ]);
    setDraftArticleCode("");
    setDraftNoOfArticles("");
    setDraftNoOfParts("");
  };

  const handleRemoveArticle = (code: string) => {
    commitSelections(selections.filter((row) => row.subscaleArticleCode !== code));
  };

  // Handle Load Form Click — article table first, remaining tables staggered on idle.
  const handleLoadForm = () => {
    setIsLoading(true);

    const baseTypes = getArticleTypesFromSelections(values);

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
      const articleRows = Array.isArray(valuesRef.current[ARTICLE_TYPE_TABLE_ID])
        ? (valuesRef.current[ARTICLE_TYPE_TABLE_ID] as Record<string, unknown>[])
        : [];
      patchFormValues({
        CASTING_TABLE: baseTypes.map((typeLabel, i) => ({
          SR_NO: i + 1,
          ARTICLE_TYPE: typeLabel,
          BEM_NO: "",
          BEM_MOULD_NO: String(articleRows[i]?.MOULD_NO ?? ""),
          CASTING_PIT_NO: "",
          CASTING_START_TIME: "",
          CASTING_END_TIME: "",
          VACUUM_LEVEL: "",
          REMARKS: "",
        })),
        CURING_TABLE: createDefaultRows({
          BEM_NO: "",
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
        // Built from casting BEM Nos + No. of Parts once casting IDs are entered.
        TRIMMING_TABLE: [],
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
        // Built from trimming BEM part IDs (BEM article types only) once casting IDs are entered.
        STATIC_TESTING_TABLE: [],
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
        const hasInputs = String(aRaw ?? "").trim() !== "" || String(bRaw ?? "").trim() !== "";
        if (!hasInputs) {
          targetRow.PROPELLANT_WEIGHT = "";
        } else {
          const b = parseFloat(bRaw || 0);
          const a = parseFloat(aRaw || 0);
          targetRow.PROPELLANT_WEIGHT = b - a;
        }
      }

      tableData[rowIndex] = targetRow;
      let nextValues: SchemaFormValues = syncProcessTableScope(
        { ...currentValues },
        tableId,
        tableData,
      );

      if (tableId === ARTICLE_TYPE_TABLE_ID && fieldId === "MOULD_NO") {
        nextValues = syncMouldNoToCastingTable(nextValues, rowIndex, String(value ?? ""));
      }

      if (tableId === "CASTING_TABLE" && fieldId === "BEM_NO") {
        nextValues = syncBemNoAcrossProcessTables(nextValues, rowIndex, String(value ?? ""));
        const existingTrimming = Array.isArray(nextValues.TRIMMING_TABLE)
          ? (nextValues.TRIMMING_TABLE as TrimmingTableRow[])
          : [];
        nextValues = syncProcessTableScope(
          nextValues,
          "TRIMMING_TABLE",
          buildTrimmingRowsFromCasting(nextValues, existingTrimming),
        );
        if (!isMainScaleSubscaleBatch(batchType)) {
          const existingStatic = Array.isArray(nextValues.STATIC_TESTING_TABLE)
            ? (nextValues.STATIC_TESTING_TABLE as StaticTestingTableRow[])
            : [];
          nextValues = syncProcessTableScope(
            nextValues,
            "STATIC_TESTING_TABLE",
            buildStaticTestingRowsFromTrimming(nextValues, existingStatic, {
              subBatchType,
            }),
          );
        }
      }
      onChange(nextValues);
    },
    [onChange, batchType, subBatchType],
  );

  const getSyncedBemNo = (rowIndex: number, fallback?: unknown) =>
    String(
      (values.CASTING_TABLE as Record<string, unknown>[] | undefined)?.[rowIndex]?.BEM_NO ??
        fallback ??
        "",
    );

  const getSyncedMouldNo = (rowIndex: number, fallback?: unknown) =>
    String(
      (values[ARTICLE_TYPE_TABLE_ID] as Record<string, unknown>[] | undefined)?.[rowIndex]
        ?.MOULD_NO ??
        (values.CASTING_TABLE as Record<string, unknown>[] | undefined)?.[rowIndex]
          ?.BEM_MOULD_NO ??
        fallback ??
        "",
    );

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
            <Typography sx={sectionTitleSx}>{S.PREPARATION_TITLE}</Typography>
          </Box>
          <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                  md: draftIsBem
                    ? "minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr) auto"
                    : "minmax(0, 1.4fr) minmax(0, 1fr) auto",
                },
                gap: 2,
                alignItems: "flex-end",
              }}
            >
              <Box data-ss-field={HARDWARE_ARTICLE_SELECTIONS_ID} sx={{ minWidth: 0 }}>
                <AppDropdown
                  // Visual-only asterisk — do not set HTML `required` (blocks form submit).
                  label={`${S.ARTICLE_TYPE_LABEL} *`}
                  value={draftArticleCode}
                  onChange={(value) => {
                    setDraftArticleCode(value);
                    setDraftNoOfParts("");
                    setAddError("");
                  }}
                  options={dropdownOptions}
                  placeholder={S.ARTICLE_TYPE_PLACEHOLDER}
                  loading={optionsLoading}
                  error={Boolean(errors?.[HARDWARE_ARTICLE_SELECTIONS_ID] || addError)}
                  helperText={errors?.[HARDWARE_ARTICLE_SELECTIONS_ID] || addError || undefined}
                  sx={{ mb: 0 }}
                />
              </Box>
              <AppTextField
                fullWidth
                label={`${S.NO_OF_ARTICLES_LABEL} *`}
                type="number"
                inputProps={{ min: 1, step: 1 }}
                value={draftNoOfArticles}
                onChange={(e) => {
                  setDraftNoOfArticles(e.target.value);
                  setAddError("");
                }}
                placeholder="0"
                sx={{ mb: 0 }}
              />
              {draftIsBem ? (
                <AppTextField
                  fullWidth
                  label={S.NO_OF_PARTS_LABEL}
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  value={draftNoOfParts}
                  onChange={(e) => setDraftNoOfParts(e.target.value)}
                  placeholder="0"
                  sx={{ mb: 0 }}
                />
              ) : null}
              <Button
                type="button"
                variant="contained"
                onClick={handleAddArticle}
                sx={{
                  height: APP_CONTROL_HEIGHT,
                  minHeight: APP_CONTROL_HEIGHT,
                  minWidth: 96,
                  px: 2.5,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "8px",
                  mb: 0,
                  alignSelf: "flex-end",
                }}
              >
                {S.ADD_ARTICLE}
              </Button>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", mb: 1, color: SUBSCALE_BRAND.text }}>
                {S.SELECTION_TABLE_TITLE}
              </Typography>
              <TableContainer
                sx={{
                  border: "1px solid rgba(148,163,184,0.35)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                      <TableCell sx={tableHeaderCellSx}>{S.COL_ARTICLE_TYPE}</TableCell>
                      <TableCell sx={tableHeaderCellSx}>{S.COL_NO_OF_ARTICLES}</TableCell>
                      <TableCell sx={tableHeaderCellSx}>{S.COL_NO_OF_PARTS}</TableCell>
                      <TableCell sx={tableHeaderCellSx} align="center">
                        {S.COL_ACTION}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selections.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ ...tableBodyCellSx, color: "#94a3b8", py: 2 }}>
                          {S.SELECTION_TABLE_EMPTY}
                        </TableCell>
                      </TableRow>
                    ) : (
                      selections.map((row) => (
                        <TableRow key={row.subscaleArticleCode || row.subscaleArticleName}>
                          <TableCell sx={tableBodyCellSx}>{row.subscaleArticleName}</TableCell>
                          <TableCell sx={tableBodyCellSx}>{row.noOfArticles}</TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            {row.isBem === true ? row.noOfParts : "—"}
                          </TableCell>
                          <TableCell sx={tableBodyCellSx} align="center">
                            <IconButton
                              size="small"
                              aria-label={S.REMOVE_ARTICLE}
                              onClick={() => handleRemoveArticle(row.subscaleArticleCode)}
                              sx={{ color: "#b71c1c" }}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" },
                gap: 2,
                alignItems: "flex-start",
              }}
            >
              <Box data-ss-field={LINER_TYPE_FIELD.id} sx={{ minWidth: 0 }}>
                <AppDropdown
                  label={LINER_TYPE_FIELD.label}
                  required
                  value={String(values[LINER_TYPE_FIELD.id] ?? "")}
                  onChange={(value) => {
                    handleLinerFieldChange(LINER_TYPE_FIELD.id, value);
                  }}
                  options={LINER_TYPE_OPTIONS}
                  placeholder="Select Liner Type"
                  error={Boolean(errors?.[LINER_TYPE_FIELD.id])}
                  helperText={errors?.[LINER_TYPE_FIELD.id] || undefined}
                  sx={{ mb: 0 }}
                />
              </Box>

              <Box data-ss-field={LINER_BATCH_NO_FIELD.id} sx={{ minWidth: 0 }}>
                {(() => {
                  const linerBatchValue = String(values[LINER_BATCH_NO_FIELD.id] ?? "");
                  const linerBatchError =
                    getSubscaleFieldFormatError(LINER_BATCH_NO_FIELD.id, linerBatchValue) ||
                    errors?.[LINER_BATCH_NO_FIELD.id];
                  return (
                    <>
                      <AppTextField
                        fullWidth
                        label={LINER_BATCH_NO_FIELD.label}
                        required
                        value={linerBatchValue}
                        onChange={(e) => {
                          handleLinerFieldChange(LINER_BATCH_NO_FIELD.id, e.target.value);
                        }}
                        error={Boolean(linerBatchError)}
                        helperText=""
                        placeholder="Enter batch no."
                        sx={{ mb: 0 }}
                      />
                      <FieldErrorText message={linerBatchError} />
                    </>
                  );
                })()}
              </Box>

              <Box data-ss-field={LINER_BATCH_DATE_FIELD.id} sx={{ minWidth: 0 }}>
                <DateField
                  label={LINER_BATCH_DATE_FIELD.label}
                  required
                  value={formatToUiDate(String(values[LINER_BATCH_DATE_FIELD.id] ?? ""))}
                  onChange={(next) => {
                    handleLinerFieldChange(LINER_BATCH_DATE_FIELD.id, next);
                  }}
                  placeholder="DD-MM-YYYY"
                  error={Boolean(errors?.[LINER_BATCH_DATE_FIELD.id])}
                  helperText={errors?.[LINER_BATCH_DATE_FIELD.id] || undefined}
                  sx={{ mb: 0 }}
                />
              </Box>
            </Box>
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
            disabled={!hardwareComplete || isFormLoaded || isLoading || !canManageProcessTables}
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
                <Typography sx={sectionTitleSx}>{S.ARTICLE_TABLE_TITLE}</Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <ArticleTypeTableSection
                  rows={(values[ARTICLE_TYPE_TABLE_ID] as []) ?? []}
                  onCellChange={updateTableRowCell}
                  errors={errors}
                  clearFieldError={clearFieldError}
                />
              </Box>
            </Box>

            {/* SECTION 3: CASTING DETAILS TABLE */}
            <SubscaleProcessSection
              id="casting"
              title="Casting Details"
              icon={PrecisionManufacturingIcon}
              defaultExpanded={hasProcessTableData(values.CASTING_TABLE as unknown[])}
              forceExpand={hasValidationErrorsForPrefixes(
                errors,
                ["CASTING_TABLE.", "DATE_OF_CASTING"],
                validationFocusPath,
              )}
              lazyMount
            >
              <Box sx={{ mb: 2, maxWidth: 280 }}>
                {(() => {
                  const castingDateValue = formatToUiDate(String(values.DATE_OF_CASTING ?? ""));
                  const errorMessage =
                    getSubscaleFieldFormatError("DATE_OF_CASTING", castingDateValue) ||
                    errors?.DATE_OF_CASTING;
                  return (
                    <Box data-ss-field="DATE_OF_CASTING">
                      <DateField
                        required
                        label={<FieldLabelWithAsterisk label="Date Of Casting" required />}
                        value={castingDateValue}
                        onChange={(next) => {
                          patchFormValues({ DATE_OF_CASTING: next });
                        }}
                        placeholder="DD-MM-YYYY"
                        error={Boolean(errorMessage)}
                        helperText={errorMessage || ""}
                      />
                    </Box>
                  );
                })()}
              </Box>
              <CastingTableSection
                rows={(values.CASTING_TABLE as []) ?? []}
                onCellChange={updateTableRowCell}
                getSyncedMouldNo={getSyncedMouldNo}
                errors={errors}
              />
            </SubscaleProcessSection>

            {/* SECTION 4: CURING DETAILS TABLE */}
            <SubscaleProcessSection
              id="curing"
              title="Curing Details"
              icon={ThermostatIcon}
              defaultExpanded={hasProcessTableData(values.CURING_TABLE as unknown[])}
              forceExpand={hasValidationErrorsForPrefixes(
                errors,
                ["CURING_TABLE."],
                validationFocusPath,
              )}
              lazyMount
            >
              <CuringTableSection
                rows={(values.CURING_TABLE as []) ?? []}
                onCellChange={updateTableRowCell}
                getSyncedBemNo={getSyncedBemNo}
                errors={errors}
              />
            </SubscaleProcessSection>

            {/* SECTION 5: NDT DETAILS TABLE */}
            <SubscaleProcessSection
              id="ndt"
              title="NDT Details"
              icon={ShieldIcon}
              defaultExpanded={hasProcessTableData(values.NDT_TABLE as unknown[])}
              forceExpand={hasValidationErrorsForPrefixes(
                errors,
                ["NDT_TABLE."],
                validationFocusPath,
              )}
              lazyMount
            >
              <NdtTableSection
                rows={(values.NDT_TABLE as []) ?? []}
                onCellChange={updateTableRowCell}
                getSyncedBemNo={getSyncedBemNo}
                errors={errors}
              />
            </SubscaleProcessSection>

            {/* SECTION 6: TRIMMING DETAILS TABLE */}
            <SubscaleProcessSection
              id="trimming"
              title="Trimming Details"
              icon={ContentCutIcon}
              defaultExpanded={hasProcessTableData(values.TRIMMING_TABLE as unknown[])}
              forceExpand={hasValidationErrorsForPrefixes(
                errors,
                ["TRIMMING_TABLE."],
                validationFocusPath,
              )}
              lazyMount
            >
              <TrimmingTableSection
                rows={(values.TRIMMING_TABLE as []) ?? []}
                onCellChange={updateTableRowCell}
                errors={errors}
              />
            </SubscaleProcessSection>
            <SubscaleProcessSection
              id="inhibition"
              title="Inhibition Details"
              icon={ScienceIcon}
              defaultExpanded={hasProcessTableData(values.INHIBITION_TABLE as unknown[])}
              forceExpand={hasValidationErrorsForPrefixes(
                errors,
                ["INHIBITION_TABLE.", "IR_BATCH_NO", "DATE_OF_MFG", "DATE_OF_APPLICATION"],
                validationFocusPath,
              )}
              lazyMount
            >
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                {(() => {
                  const irBatchValue = String(values.IR_BATCH_NO ?? "");
                  const errorMessage =
                    getSubscaleFieldFormatError("IR_BATCH_NO", irBatchValue) ||
                    errors?.IR_BATCH_NO;
                  return (
                    <Box data-ss-field="IR_BATCH_NO" sx={{ flex: 1 }}>
                      <FormInput
                        required
                        label={<FieldLabelWithAsterisk label="IR Batch No" required />}
                        value={irBatchValue}
                        onChange={(e) => {
                          patchFormValues({ IR_BATCH_NO: e.target.value });
                        }}
                        error={Boolean(errorMessage)}
                        helperText=""
                        sx={{ mb: 0 }}
                      />
                      <FieldErrorText message={errorMessage} />
                    </Box>
                  );
                })()}

                {(() => {
                  const mfgValue = formatToUiDate(String(values.DATE_OF_MFG ?? ""));
                  const errorMessage =
                    getSubscaleFieldFormatError("DATE_OF_MFG", mfgValue) || errors?.DATE_OF_MFG;
                  return (
                    <Box data-ss-field="DATE_OF_MFG" sx={{ flex: 1 }}>
                      <DateField
                        required
                        label={<FieldLabelWithAsterisk label="Date Of Manufacturing" required />}
                        value={mfgValue}
                        onChange={(next) => {
                          patchFormValues({ DATE_OF_MFG: next });
                        }}
                        placeholder="DD-MM-YYYY"
                        error={Boolean(errorMessage)}
                        helperText={errorMessage || ""}
                      />
                    </Box>
                  );
                })()}
              </Stack>
              <TableContainer
                sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
                      <TableCell sx={tableHeaderCellSx}>
                        <FieldLabelWithAsterisk
                          label="Article Type"
                          required
                          sx={tableHeaderCellSx}
                        />
                      </TableCell>
                      <TableCell sx={tableHeaderCellSx}>
                        <FieldLabelWithAsterisk label="BEM No" required sx={tableHeaderCellSx} />
                      </TableCell>
                      <TableCell sx={tableHeaderCellSx}>
                        <FieldLabelWithAsterisk
                          label="Liner Coated Sleeve Wt (A)"
                          sx={tableHeaderCellSx}
                        />
                      </TableCell>
                      <TableCell sx={tableHeaderCellSx}>Wt Before Inhib. (B)</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Wt After Inhib.</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Wt Of IR Applied</TableCell>
                      <TableCell sx={tableHeaderCellSx}>Propellant Wt (C-B-A)</TableCell>
                      <TableCell sx={tableHeaderCellSx}>
                        <FieldLabelWithAsterisk
                          label="Date of Application"
                          required
                          sx={tableHeaderCellSx}
                        />
                      </TableCell>
                      <TableCell sx={tableHeaderCellSx}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {((values.INHIBITION_TABLE as []) ?? []).map((row: any, idx: number) => {
                      const errKey = `INHIBITION_TABLE.${idx}.DATE_OF_APPLICATION`;
                      const applicationDate = formatToUiDate(
                        String(row.DATE_OF_APPLICATION ?? ""),
                      );
                      const errorMessage =
                        getSubscaleFieldFormatError("DATE_OF_APPLICATION", applicationDate) ||
                        errors?.[errKey];
                      return (
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
                              errorMessage={
                                errors?.[`INHIBITION_TABLE.${idx}.LINER_COATED_SLEEVE_WEIGHT`]
                              }
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
                              errorMessage={
                                errors?.[`INHIBITION_TABLE.${idx}.WEIGHT_BEFORE_INHIBITION`]
                              }
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
                              errorMessage={
                                errors?.[`INHIBITION_TABLE.${idx}.WEIGHT_AFTER_INHIBITION`]
                              }
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
                              errorMessage={errors?.[`INHIBITION_TABLE.${idx}.IR_APPLIED_WEIGHT`]}
                            />
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            <FormInput compact disabled value={row.PROPELLANT_WEIGHT ?? ""} />
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            <Box data-ss-field={errKey}>
                              <DateField
                                compact
                                required
                                value={applicationDate}
                                onChange={(next) => {
                                  updateTableRowCell(
                                    "INHIBITION_TABLE",
                                    idx,
                                    "DATE_OF_APPLICATION",
                                    next,
                                  );
                                }}
                                placeholder="DD-MM-YYYY"
                                error={Boolean(errorMessage)}
                                helperText={errorMessage || ""}
                              />
                            </Box>
                          </TableCell>
                          <TableCell sx={tableBodyCellSx}>
                            <SubscaleTableTextCell
                              compact
                              tableId="INHIBITION_TABLE"
                              rowIndex={idx}
                              fieldId="REMARKS"
                              value={row.REMARKS ?? ""}
                              onCellChange={updateTableRowCell}
                              errorMessage={errors?.[`INHIBITION_TABLE.${idx}.REMARKS`]}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
                  forceExpand={hasValidationErrorsForPrefixes(
                    errors,
                    ["STATIC_TESTING_TABLE."],
                    validationFocusPath,
                  )}
                  lazyMount
                >
                  <StaticTestingTableSection
                    rows={(values.STATIC_TESTING_TABLE as []) ?? []}
                    onCellChange={updateTableRowCell}
                    errors={errors}
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
                  defaultExpanded={hasProcessTableData(
                    values.MECHANICAL_PROPERTIES_TABLE as unknown[],
                  )}
                  forceExpand={hasValidationErrorsForPrefixes(
                    errors,
                    ["MECHANICAL_PROPERTIES_TABLE."],
                    validationFocusPath,
                  )}
                  lazyMount
                >
                  <MechanicalPropertiesTableSection
                    rows={(values.MECHANICAL_PROPERTIES_TABLE as []) ?? []}
                    onCellChange={updateTableRowCell}
                    getSyncedBemNo={getSyncedBemNo}
                    errors={errors}
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
