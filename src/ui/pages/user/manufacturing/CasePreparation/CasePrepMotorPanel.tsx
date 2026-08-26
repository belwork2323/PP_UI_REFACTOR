import { useEffect, useRef, type ReactNode } from "react";
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
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  ABRADING_WHEEL_OPTIONS,
  LINER_TYPE_OPTIONS,
  PRE_HEATING_RECIPE_OPTIONS,
  VACUUM_BAGGING_OPTIONS,
  computeAbradingTotalDustWeight,
  syncPreHeatingTemperatureDurationRows,
  type CasePrepAbradingDetailsRow,
  type CasePrepIngredientRow,
  type CasePrepMotorData,
  type CasePrepParameterRow,
  type CasePrepQualificationParameterRow,
} from "../../../../../data/models/user/CasePrepMotorDataModel";
import { DateTimeField, TimeField } from "../../../../components/common/DateField";
import { WorkflowReadOnlyText } from "../../../../components/common/WorkflowReadOnlyText";
import { CASE_PREP_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/casePreparation_theme";
import CasePrepDateField from "./CasePrepDateField";
import CasePrepFileField from "./CasePrepFileField";
import CasePrepSelect from "./CasePrepSelect";
import CasePrepTextField from "./CasePrepTextField";
import {
  FieldGrid,
  FieldLabel,
  ParameterTable,
  ReadOnlyField,
  SectionCard,
  SubsectionHeading,
  TableTextInput,
  casePrepHeaderRowSx,
  casePrepTableCellSx,
  casePrepTableContainerSx,
  casePrepTableHeaderCellSx,
  casePrepTableInputSx,
  casePrepTableRowSx,
} from "./CasePrepFormPrimitives";

type MaterialInput = {
  materialCode?: string;
  materialName?: string;
  lotId?: string;
  requiredComposition?: string | number;
  quantityPerPremix?: string | number;
};

type Props = {
  value: CasePrepMotorData;
  onChange: (next: CasePrepMotorData) => void;
  motorId: string;
  batchId?: string;
  /** From batch identification sheet */
  casingType?: string;
  insulationType?: string;
  materials?: MaterialInput[];
  disabled?: boolean;
  readOnly?: boolean;
  theme?: any;
};

const BRAND = CASE_PREP_BRAND;
const ABRADING_DUST_A = "Dust Weight (in gm) (A)";
const ABRADING_DUST_B = "Dust Weight (in gm) (B)";
const ABRADING_DUST_TOTAL = "Total Dust Weight (in gm) (A+B)";

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

const isAbradingHeader = (
  row: CasePrepAbradingDetailsRow,
): row is Extract<CasePrepAbradingDetailsRow, { type: "header" }> => row.type === "header";

const materialsToIngredientRows = (materials: MaterialInput[]): CasePrepIngredientRow[] =>
  materials.map((material, index) => ({
    srNo: index + 1,
    materialName: str(material.materialName),
    ingredient: str(material.materialCode),
    mfgLot: str(material.lotId),
    partsByWeight: str(material.requiredComposition),
    quantityTaken: str(material.quantityPerPremix),
    totalQuantity: "",
  }));

const sumQuantityPerPremix = (materials: MaterialInput[]): string => {
  let total = 0;
  let any = false;
  for (const material of materials) {
    const raw = str(material.quantityPerPremix).trim().replace(/,/g, "");
    if (!raw) continue;
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    total += n;
    any = true;
  }
  return any ? String(total) : "";
};

const CompactDateTime = ({
  value,
  onChange,
  disabled,
  placeholder = "DD-MM-YYYY HH:mm",
  readOnly,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
}) => (
  <DateTimeField
    value={value}
    onChange={onChange}
    disabled={disabled} readOnly={readOnly}
    compact
    placeholder={placeholder}
    inputSx={casePrepTableInputSx}
  />
);

const CompactTime = ({
  value,
  onChange,
  disabled,
  readOnly,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => (
  <TimeField
    value={value}
    onChange={onChange}
    disabled={disabled} readOnly={readOnly}
    compact
    inputSx={casePrepTableInputSx}
  />
);

const CompactDate = ({
  value,
  onChange,
  disabled,
  theme,
  readOnly,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  theme: any;
}) => (
  <Box sx={{ minWidth: 0, "& > .MuiBox-root": { minWidth: 0, maxWidth: "100%" } }}>
    <CasePrepDateField
      label=""
      value={value}
      onChange={onChange}
      disabled={disabled} readOnly={readOnly}
      theme={theme}
    />
  </Box>
);

const MultilineNoteField = ({
  label,
  value,
  onChange,
  disabled,
  readOnly,
  placeholder,
  minRows = 2,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  minRows?: number;
}) => (
  <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
    <FieldLabel>{label}</FieldLabel>
    {readOnly ? (
      <WorkflowReadOnlyText value={value} sx={{ fontSize: "0.82rem", py: 0.75 }} />
    ) : (
      <TextField
        size="small"
        fullWidth
        multiline
        minRows={minRows}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        sx={casePrepTableInputSx}
      />
    )}
  </Box>
);

const ValueByFieldType = ({
  value,
  valueFieldType,
  onChange,
  disabled,
  theme,
  readOnly,
}: {
  value: string;
  valueFieldType?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  theme: any;
}) => {
  const type = String(valueFieldType ?? "text").toLowerCase();
  if (type === "datetime") {
    return <CompactDateTime value={value} onChange={onChange} disabled={disabled} readOnly={readOnly} />;
  }
  if (type === "date") {
    return <CompactDate value={value} onChange={onChange} disabled={disabled} readOnly={readOnly} theme={theme} />;
  }
  if (type === "time") {
    return <CompactTime value={value} onChange={onChange} disabled={disabled} readOnly={readOnly} />;
  }
  if (type === "textarea") {
    return (
      <TableTextInput
        value={value}
        onChange={onChange}
        disabled={disabled} readOnly={readOnly}
        multiline
        minRows={2}
        placeholder="Enter value"
      />
    );
  }
  if (type === "number") {
    return (
      <TableTextInput
        value={value}
        onChange={onChange}
        disabled={disabled} readOnly={readOnly}
        type="number"
        placeholder="0"
      />
    );
  }
  return (
    <TableTextInput
      value={value}
      onChange={onChange}
      disabled={disabled} readOnly={readOnly}
      placeholder="Enter value"
    />
  );
};

const CasePrepMotorPanel = ({
  value,
  onChange,
  motorId: _motorId,
  batchId: _batchId,
  casingType,
  insulationType,
  materials,
  disabled = false,
  readOnly = false,
  theme,
}: Props) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;
  const syncedCasingRef = useRef<string | null>(null);
  const seededIngredientsRef = useRef(false);

  const patchSection = <K extends keyof CasePrepMotorData>(
    sectionKey: K,
    partial: Partial<CasePrepMotorData[K]>,
  ) => {
    onChange({
      ...value,
      [sectionKey]: {
        ...value[sectionKey],
        ...partial,
      },
    });
  };

  // Sync casing / insulation from identification sheet into abrading section
  useEffect(() => {
    const nextCasing = str(casingType).trim();
    const nextInsulation = str(insulationType).trim();
    const key = `${nextCasing}::${nextInsulation}`;
    if (syncedCasingRef.current === key) return;
    syncedCasingRef.current = key;

    const current = valueRef.current.abradingOperation;
    if (
      current.typeOfCasing === nextCasing &&
      current.typeOfInsulation === nextInsulation
    ) {
      return;
    }

    onChangeRef.current({
      ...valueRef.current,
      abradingOperation: {
        ...current,
        typeOfCasing: nextCasing || current.typeOfCasing,
        typeOfInsulation: nextInsulation || current.typeOfInsulation,
      },
    });
  }, [casingType, insulationType]);

  // Seed premix / final-mix ingredient rows from materials when empty
  useEffect(() => {
    if (seededIngredientsRef.current) return;
    if (!materials?.length) return;

    const liner = valueRef.current.linerCoatingOperation;
    const premixEmpty = !liner.premixIngredients?.length;
    const finalEmpty = !liner.finalMixIngredients?.length;
    if (!premixEmpty && !finalEmpty) {
      seededIngredientsRef.current = true;
      return;
    }

    seededIngredientsRef.current = true;
    const rows = materialsToIngredientRows(materials);
    const batchSize =
      str(liner.batchSize).trim() || sumQuantityPerPremix(materials);

    onChangeRef.current({
      ...valueRef.current,
      linerCoatingOperation: {
        ...liner,
        premixIngredients: premixEmpty ? rows : liner.premixIngredients,
        finalMixIngredients: finalEmpty ? rows.map((row) => ({ ...row })) : liner.finalMixIngredients,
        batchSize,
      },
    });
  }, [materials]);

  const updateAbradingDetails = (rows: CasePrepAbradingDetailsRow[]) => {
    patchSection("abradingOperation", {
      abradingDetails: computeAbradingTotalDustWeight(rows),
    });
  };

  const updateAbradingDataRow = (
    index: number,
    patch: Partial<Extract<CasePrepAbradingDetailsRow, { operation?: string }>>,
  ) => {
    const next = value.abradingOperation.abradingDetails.map((row, i) => {
      if (i !== index || isAbradingHeader(row)) return row;
      return { ...row, ...patch };
    });

    const operation = str(
      !isAbradingHeader(value.abradingOperation.abradingDetails[index])
        ? (value.abradingOperation.abradingDetails[index] as { operation?: string }).operation
        : "",
    ).trim();

    if (
      patch.value !== undefined &&
      (operation === ABRADING_DUST_A || operation === ABRADING_DUST_B)
    ) {
      updateAbradingDetails(next);
      return;
    }
    patchSection("abradingOperation", { abradingDetails: next });
  };

  const patchPreHeating = (partial: Partial<CasePrepMotorData["preHeating"]>) => {
    const next: CasePrepMotorData = {
      ...value,
      preHeating: {
        ...value.preHeating,
        ...partial,
      },
    };
    if (
      partial.preHeatingRecipe !== undefined ||
      partial.otherDuration !== undefined
    ) {
      onChange(syncPreHeatingTemperatureDurationRows(next));
      return;
    }
    onChange(next);
  };

  const updateParameterRow = (
    sectionKey: "preHeating" | "linerCoatingOperation" | "dispatchToCasting",
    listKey: string,
    index: number,
    patch: Partial<CasePrepParameterRow>,
  ) => {
    const section = value[sectionKey] as Record<string, unknown>;
    const rows = Array.isArray(section[listKey])
      ? ([...section[listKey]] as CasePrepParameterRow[])
      : [];
    rows[index] = { ...rows[index], ...patch };
    onChange({
      ...value,
      [sectionKey]: {
        ...section,
        [listKey]: rows,
      },
    });
  };

  const updateIngredientRow = (
    listKey: "premixIngredients" | "finalMixIngredients",
    index: number,
    patch: Partial<CasePrepIngredientRow>,
  ) => {
    const rows = value.linerCoatingOperation[listKey].map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    patchSection("linerCoatingOperation", { [listKey]: rows });
  };

  const updateQualificationRow = (
    index: number,
    patch: Partial<CasePrepQualificationParameterRow>,
  ) => {
    const rows = value.linerCoatingOperation.qualificationParameters.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    patchSection("linerCoatingOperation", { qualificationParameters: rows });
  };

  const addQualificationRow = () => {
    const rows = value.linerCoatingOperation.qualificationParameters;
    patchSection("linerCoatingOperation", {
      qualificationParameters: [
        ...rows,
        {
          srNo: rows.length + 1,
          parameter: "",
          specification: "",
          result: "",
          readonly: false,
        },
      ],
    });
  };

  const deleteQualificationRow = (index: number) => {
    const rows = value.linerCoatingOperation.qualificationParameters
      .filter((_, i) => i !== index)
      .map((row, i) => ({ ...row, srNo: i + 1 }));
    patchSection("linerCoatingOperation", { qualificationParameters: rows });
  };

  const renderParamValue = (
    row: { value?: string; valueFieldType?: string },
    onValue: (v: string) => void,
  ) => (
    <ValueByFieldType
      value={row.value ?? ""}
      valueFieldType={row.valueFieldType}
      onChange={onValue}
      disabled={disabled} readOnly={readOnly}
      theme={theme}
    />
  );

  const ingredientTable = (
    title: string,
    listKey: "premixIngredients" | "finalMixIngredients",
  ): ReactNode => {
    const rows = value.linerCoatingOperation[listKey];
    return (
      <Box sx={{ mb: 2 }}>
        <SubsectionHeading>{title}</SubsectionHeading>
        <TableContainer sx={casePrepTableContainerSx}>
          <Table size="small" sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow>
                {[
                  "Sr No",
                  "Material Name",
                  "Ingredient",
                  "Mfg Lot",
                  "Parts by Weight",
                  "Qty Taken",
                  "Total Qty",
                ].map((label, idx) => (
                  <TableCell key={label} sx={casePrepTableHeaderCellSx(idx === 0)}>
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ ...casePrepTableCellSx, color: BRAND.textSub, textAlign: "center" }}>
                    No ingredients
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={`${listKey}-${index}`} sx={casePrepTableRowSx(index)}>
                    <TableCell sx={casePrepTableCellSx}>{row.srNo || index + 1}</TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      <TableTextInput
                        value={row.materialName}
                        onChange={(v) => updateIngredientRow(listKey, index, { materialName: v })}
                        disabled={disabled} readOnly={readOnly}
                      />
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      <TableTextInput
                        value={row.ingredient}
                        onChange={(v) => updateIngredientRow(listKey, index, { ingredient: v })}
                        disabled={disabled} readOnly={readOnly}
                      />
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      <TableTextInput
                        value={row.mfgLot}
                        onChange={(v) => updateIngredientRow(listKey, index, { mfgLot: v })}
                        disabled={disabled} readOnly={readOnly}
                      />
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      <TableTextInput
                        value={row.partsByWeight}
                        onChange={(v) => updateIngredientRow(listKey, index, { partsByWeight: v })}
                        disabled={disabled} readOnly={readOnly}
                        type="number"
                      />
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      <TableTextInput
                        value={row.quantityTaken}
                        onChange={(v) => updateIngredientRow(listKey, index, { quantityTaken: v })}
                        disabled={disabled} readOnly={readOnly}
                        type="number"
                      />
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      <TableTextInput
                        value={row.totalQuantity}
                        onChange={(v) => updateIngredientRow(listKey, index, { totalQuantity: v })}
                        disabled={disabled} readOnly={readOnly}
                        type="number"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const abrading = value.abradingOperation;
  const bellow = value.bellowBonding;
  const tce = value.tceCleaning;
  const preHeating = value.preHeating;
  const liner = value.linerCoatingOperation;
  const dispatch = value.dispatchToCasting;

  const showVacuumApplied = str(preHeating.vacuumBaggingApplied).toUpperCase() === "YES";
  const showOtherRecipe = str(preHeating.preHeatingRecipe).toUpperCase() === "OTHERS";
  const showOtherLiner = str(liner.linerType).toUpperCase() === "OTHERS";

  return (
    <Box>
      {/* 1. Abrading Operation */}
      <SectionCard title="Abrading Operation" theme={theme}>
        <SubsectionHeading>Abrading Configuration</SubsectionHeading>
        <FieldGrid columns={3}>
          <ReadOnlyField
            label="Type of Casing"
            value={abrading.typeOfCasing || casingType}
          />
          <ReadOnlyField
            label="Type of Insulation"
            value={abrading.typeOfInsulation || insulationType}
          />
          <CasePrepSelect
            label="Abrading Wheel Type"
            value={abrading.abradingWheelType}
            placeholder="Select wheel type"
            options={[...ABRADING_WHEEL_OPTIONS]}
            onChange={(v) => patchSection("abradingOperation", { abradingWheelType: v })}
            disabled={disabled} readOnly={readOnly}
            theme={theme}
          />
        </FieldGrid>

        <SubsectionHeading>Abrading Details</SubsectionHeading>
        <TableContainer sx={casePrepTableContainerSx}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["Operation", "Value", "Remarks / Observations", "Attachments"].map((label, idx) => (
                  <TableCell key={label} sx={casePrepTableHeaderCellSx(idx === 0)}>
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {abrading.abradingDetails.map((row, index) => {
                if (isAbradingHeader(row)) {
                  return (
                    <TableRow key={`hdr-${index}`} sx={casePrepHeaderRowSx}>
                      <TableCell
                        colSpan={4}
                        sx={{ ...casePrepTableCellSx, fontWeight: 800, fontSize: "0.72rem", color: BRAND.cp }}
                      >
                        {row.label}
                      </TableCell>
                    </TableRow>
                  );
                }

                const isTotal = str(row.operation).trim() === ABRADING_DUST_TOTAL;
                return (
                  <TableRow key={`abr-${index}`} sx={casePrepTableRowSx(index)}>
                    <TableCell sx={{ ...casePrepTableCellSx, fontWeight: 600 }}>
                      {row.operation}
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      {isTotal ? (
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
                          {row.value || "—"}
                        </Typography>
                      ) : (
                        <ValueByFieldType
                          value={row.value}
                          valueFieldType={row.valueFieldType}
                          onChange={(v) => updateAbradingDataRow(index, { value: v })}
                          disabled={disabled} readOnly={readOnly}
                          theme={theme}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      <TableTextInput
                        value={row.remarksObservations}
                        onChange={(v) =>
                          updateAbradingDataRow(index, { remarksObservations: v })
                        }
                        disabled={disabled} readOnly={readOnly}
                        placeholder="Remarks"
                      />
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      <CasePrepFileField
                        files={row.attachments ?? []}
                        onChange={(next) => updateAbradingDataRow(index, { attachments: next })}
                        disabled={disabled}
                        readOnly={readOnly}
                        compact
                        multiple
                        acceptMode="imageVideo"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      {/* 2. Bellow Bonding */}
      <SectionCard title="Bellow Bonding" theme={theme}>
        <SubsectionHeading>Adhesive Details</SubsectionHeading>
        <FieldGrid columns={2}>
          <CasePrepTextField
            label="Adhesive Details"
            value={bellow.adhesiveDetails}
            onChange={(v) => patchSection("bellowBonding", { adhesiveDetails: v })}
            disabled={disabled} readOnly={readOnly}
            theme={theme}
            width="100%"
          />
          <CasePrepTextField
            label="Number of Spacers"
            value={bellow.numberOfSpacers}
            onChange={(v) => patchSection("bellowBonding", { numberOfSpacers: v })}
            disabled={disabled} readOnly={readOnly}
            theme={theme}
            width="100%"
          />
          <CasePrepTextField
            label="HE Bellow Dimension"
            value={bellow.heBellowDimension}
            onChange={(v) => patchSection("bellowBonding", { heBellowDimension: v })}
            disabled={disabled} readOnly={readOnly}
            theme={theme}
            width="100%"
          />
          <Box>
            <FieldLabel>HE Motor Pasting Date & Time</FieldLabel>
            <CompactDateTime
              value={bellow.heMotorPastingDateTime}
              onChange={(v) => patchSection("bellowBonding", { heMotorPastingDateTime: v })}
              disabled={disabled} readOnly={readOnly}
            />
          </Box>
          <CasePrepTextField
            label="NE Bellow Dimension"
            value={bellow.neBellowDimension}
            onChange={(v) => patchSection("bellowBonding", { neBellowDimension: v })}
            disabled={disabled} readOnly={readOnly}
            theme={theme}
            width="100%"
          />
          <Box>
            <FieldLabel>NE Motor Pasting Date & Time</FieldLabel>
            <CompactDateTime
              value={bellow.neMotorPastingDateTime}
              onChange={(v) => patchSection("bellowBonding", { neMotorPastingDateTime: v })}
              disabled={disabled} readOnly={readOnly}
            />
          </Box>
        </FieldGrid>
        <FieldGrid columns={2}>
          <MultilineNoteField
            label="Pasting Details"
            value={bellow.pastingDetails}
            onChange={(v) => patchSection("bellowBonding", { pastingDetails: v })}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="Pasting details"
          />
          <MultilineNoteField
            label="Remarks"
            value={bellow.remarks}
            onChange={(v) => patchSection("bellowBonding", { remarks: v })}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="Remarks"
          />
        </FieldGrid>
      </SectionCard>

      {/* 3. TCE Cleaning */}
      <SectionCard title="TCE Cleaning" theme={theme}>
        <FieldGrid columns={2}>
          <Box>
            <FieldLabel>TCE Cleaning Date & Time</FieldLabel>
            <CompactDateTime
              value={tce.tceCleaningDateTime}
              onChange={(v) => patchSection("tceCleaning", { tceCleaningDateTime: v })}
              disabled={disabled} readOnly={readOnly}
            />
          </Box>
          <CasePrepTextField
            label="Solvent Used Qty (kg)"
            value={tce.solventUsedQtyKg}
            onChange={(v) => patchSection("tceCleaning", { solventUsedQtyKg: v })}
            disabled={disabled} readOnly={readOnly}
            theme={theme}
            width="100%"
            placeholder="0"
          />
          <MultilineNoteField
            label="Observation"
            value={tce.observation}
            onChange={(v) => patchSection("tceCleaning", { observation: v })}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="Observation"
            minRows={3}
          />
          <CasePrepFileField
            label="Test Report"
            files={tce.testReport ? [tce.testReport] : []}
            onChange={(next) =>
              patchSection("tceCleaning", { testReport: next[0] ?? null })
            }
            disabled={disabled}
            readOnly={readOnly}
            multiple={false}
            acceptMode="imageVideoPdf"
          />
        </FieldGrid>
      </SectionCard>

      {/* 4. Pre-heating */}
      <SectionCard title="Pre-heating" theme={theme}>
        <FieldGrid columns={3}>
          <CasePrepSelect
            label="Vacuum Bagging Applied"
            value={preHeating.vacuumBaggingApplied}
            placeholder="Select"
            options={[...VACUUM_BAGGING_OPTIONS]}
            onChange={(v) =>
              patchPreHeating({
                vacuumBaggingApplied: v,
                ...(v.toUpperCase() !== "YES" ? { vacuumApplied: "" } : {}),
              })
            }
            disabled={disabled} readOnly={readOnly}
            theme={theme}
          />
          {showVacuumApplied ? (
            <CasePrepTextField
              label="Vacuum Applied"
              value={preHeating.vacuumApplied}
              onChange={(v) => patchPreHeating({ vacuumApplied: v })}
              disabled={disabled} readOnly={readOnly}
              theme={theme}
              width="100%"
            />
          ) : null}
          <CasePrepSelect
            label="Pre-heating Recipe"
            value={preHeating.preHeatingRecipe}
            placeholder="Select recipe"
            options={[...PRE_HEATING_RECIPE_OPTIONS]}
            onChange={(v) =>
              patchPreHeating({
                preHeatingRecipe: v,
                ...(v.toUpperCase() !== "OTHERS"
                  ? { otherTemperature: "", otherDuration: "" }
                  : {}),
              })
            }
            disabled={disabled} readOnly={readOnly}
            theme={theme}
          />
          {showOtherRecipe ? (
            <>
              <CasePrepTextField
                label="Other Temperature"
                value={preHeating.otherTemperature}
                onChange={(v) => patchPreHeating({ otherTemperature: v })}
                disabled={disabled} readOnly={readOnly}
                theme={theme}
                width="100%"
              />
              <CasePrepTextField
                label="Other Duration (hrs)"
                value={preHeating.otherDuration}
                onChange={(v) => patchPreHeating({ otherDuration: v })}
                disabled={disabled} readOnly={readOnly}
                theme={theme}
                width="100%"
                placeholder="Hours"
              />
            </>
          ) : null}
          <CasePrepDateField
            label="Pre-heating Date"
            value={preHeating.preHeatingDate ?? ""}
            onChange={(v) => patchPreHeating({ preHeatingDate: v })}
            disabled={disabled} readOnly={readOnly}
            theme={theme}
          />
        </FieldGrid>

        <Box sx={{ mb: 2 }}>
          <SubsectionHeading>Temperature Duration</SubsectionHeading>
          <ParameterTable
            rows={preHeating.temperatureDuration}
            disabled={disabled} readOnly={readOnly}
            emptyText="Select a recipe to generate temperature rows"
            onChangeValue={(index, v) =>
              updateParameterRow("preHeating", "temperatureDuration", index, { value: v })
            }
            onChangeRemarks={(index, v) =>
              updateParameterRow("preHeating", "temperatureDuration", index, { remarks: v })
            }
            renderValue={(row, index) =>
              renderParamValue(row, (v) =>
                updateParameterRow("preHeating", "temperatureDuration", index, { value: v }),
              )
            }
          />
        </Box>

        <Box>
          <SubsectionHeading>Pre-heating Monitoring</SubsectionHeading>
          <ParameterTable
            rows={preHeating.preHeatingMonitoring}
            disabled={disabled} readOnly={readOnly}
            onChangeValue={(index, v) =>
              updateParameterRow("preHeating", "preHeatingMonitoring", index, { value: v })
            }
            onChangeRemarks={(index, v) =>
              updateParameterRow("preHeating", "preHeatingMonitoring", index, { remarks: v })
            }
            renderValue={(row, index) =>
              renderParamValue(row, (v) =>
                updateParameterRow("preHeating", "preHeatingMonitoring", index, { value: v }),
              )
            }
          />
        </Box>
      </SectionCard>

      {/* 5. Liner Coating */}
      <SectionCard title="Liner Coating Operation" theme={theme}>
        <FieldGrid columns={3}>
          <CasePrepSelect
            label="Liner Type"
            value={liner.linerType}
            placeholder="Select liner type"
            options={[...LINER_TYPE_OPTIONS]}
            onChange={(v) =>
              patchSection("linerCoatingOperation", {
                linerType: v,
                ...(v.toUpperCase() !== "OTHERS" ? { otherLinerType: "" } : {}),
              })
            }
            disabled={disabled} readOnly={readOnly}
            theme={theme}
          />
          {showOtherLiner ? (
            <CasePrepTextField
              label="Other Liner Type"
              value={liner.otherLinerType}
              onChange={(v) => patchSection("linerCoatingOperation", { otherLinerType: v })}
              disabled={disabled} readOnly={readOnly}
              theme={theme}
              width="100%"
            />
          ) : null}
          <CasePrepTextField
            label="Batch No"
            value={liner.batchNo}
            onChange={(v) => patchSection("linerCoatingOperation", { batchNo: v })}
            disabled={disabled} readOnly={readOnly}
            theme={theme}
            width="100%"
          />
          <ReadOnlyField label="Batch Size" value={liner.batchSize} />
          <CasePrepTextField
            label="Qualifying Subscale Batch No"
            value={liner.qualifyingSubscaleBatchNo}
            onChange={(v) =>
              patchSection("linerCoatingOperation", { qualifyingSubscaleBatchNo: v })
            }
            disabled={disabled} readOnly={readOnly}
            theme={theme}
            width="100%"
          />
          <CasePrepDateField
            label="Liner Coating Date"
            value={liner.linerCoatingDate ?? ""}
            onChange={(v) => patchSection("linerCoatingOperation", { linerCoatingDate: v })}
            disabled={disabled} readOnly={readOnly}
            theme={theme}
          />
        </FieldGrid>

        {ingredientTable("Premix Ingredients", "premixIngredients")}
        {ingredientTable("Final Mix Ingredients", "finalMixIngredients")}

        <Box sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <SubsectionHeading>Qualification Parameters</SubsectionHeading>
            {!disabled && !readOnly ? (
              <Typography
                component="button"
                type="button"
                onClick={addQualificationRow}
                sx={{
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                  color: BRAND.cp,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  p: 0,
                }}
              >
                <AddRoundedIcon sx={{ fontSize: 16 }} />
                Add row
              </Typography>
            ) : null}
          </Stack>
          <TableContainer sx={casePrepTableContainerSx}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Sr No", "Parameter", "Specification", "Result", ""].map((label, idx) => (
                    <TableCell key={`${label}-${idx}`} sx={casePrepTableHeaderCellSx(idx === 0)}>
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {liner.qualificationParameters.map((row, index) => (
                  <TableRow key={`qual-${index}`} sx={casePrepTableRowSx(index)}>
                    <TableCell sx={casePrepTableCellSx}>{row.srNo || index + 1}</TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      {row.readonly ? (
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
                          {row.parameter}
                        </Typography>
                      ) : (
                        <TableTextInput
                          value={row.parameter}
                          onChange={(v) => updateQualificationRow(index, { parameter: v })}
                          disabled={disabled} readOnly={readOnly}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      {row.readonly ? (
                        <Typography sx={{ fontSize: "0.82rem" }}>{row.specification}</Typography>
                      ) : (
                        <TableTextInput
                          value={row.specification}
                          onChange={(v) => updateQualificationRow(index, { specification: v })}
                          disabled={disabled} readOnly={readOnly}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      <TableTextInput
                        value={row.result}
                        onChange={(v) => updateQualificationRow(index, { result: v })}
                        disabled={disabled} readOnly={readOnly}
                        placeholder="Result"
                      />
                    </TableCell>
                    <TableCell sx={casePrepTableCellSx}>
                      {!disabled && !readOnly && !row.readonly ? (
                        <IconButton
                          size="small"
                          onClick={() => deleteQualificationRow(index)}
                          aria-label="Delete row"
                          sx={{ color: BRAND.danger }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <SubsectionHeading>Liner Application Log</SubsectionHeading>
          <ParameterTable
            rows={liner.linerApplicationLog}
            disabled={disabled} readOnly={readOnly}
            onChangeValue={(index, v) =>
              updateParameterRow("linerCoatingOperation", "linerApplicationLog", index, {
                value: v,
              })
            }
            onChangeRemarks={(index, v) =>
              updateParameterRow("linerCoatingOperation", "linerApplicationLog", index, {
                remarks: v,
              })
            }
            renderValue={(row, index) =>
              renderParamValue(row, (v) =>
                updateParameterRow("linerCoatingOperation", "linerApplicationLog", index, {
                  value: v,
                }),
              )
            }
          />
        </Box>
      </SectionCard>

      {/* 6. Dispatch To Casting */}
      <SectionCard title="Dispatch To Casting" theme={theme} mb={0}>
        <Box sx={{ mb: 2 }}>
          <SubsectionHeading>Visual Observations</SubsectionHeading>
          <ParameterTable
            columns={[
              { key: "parameter", label: "Parameter", width: "36%" },
              { key: "observations", label: "Observations" },
              { key: "remarks", label: "Remarks" },
            ]}
            rows={dispatch.dispatchVisualObservations}
            disabled={disabled} readOnly={readOnly}
            onChangeObservations={(index, v) => {
              const rows = dispatch.dispatchVisualObservations.map((row, i) =>
                i === index ? { ...row, observations: v } : row,
              );
              patchSection("dispatchToCasting", { dispatchVisualObservations: rows });
            }}
            onChangeRemarks={(index, v) => {
              const rows = dispatch.dispatchVisualObservations.map((row, i) =>
                i === index ? { ...row, remarks: v } : row,
              );
              patchSection("dispatchToCasting", { dispatchVisualObservations: rows });
            }}
          />
        </Box>

        <Box>
          <SubsectionHeading>Dispatch Details</SubsectionHeading>
          <ParameterTable
            rows={dispatch.dispatchToCastingDetails}
            disabled={disabled} readOnly={readOnly}
            onChangeValue={(index, v) =>
              updateParameterRow("dispatchToCasting", "dispatchToCastingDetails", index, {
                value: v,
              })
            }
            onChangeRemarks={(index, v) =>
              updateParameterRow("dispatchToCasting", "dispatchToCastingDetails", index, {
                remarks: v,
              })
            }
            renderValue={(row, index) =>
              renderParamValue(row, (v) =>
                updateParameterRow("dispatchToCasting", "dispatchToCastingDetails", index, {
                  value: v,
                }),
              )
            }
          />
        </Box>
      </SectionCard>
    </Box>
  );
};

export default CasePrepMotorPanel;
