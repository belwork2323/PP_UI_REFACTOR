import { memo, type ChangeEvent, type CSSProperties, type ComponentType } from "react";
import {
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import FormInput from "../../../../../components/common/FormInput";
import DateField, { TimeField } from "../../../../../components/common/DateField";
import {
  APP_CONTROL_FONT_SIZE,
  appDropdownMenuProps,
  appDropdownPlaceholderSx,
} from "../../../../../components/common/fieldStyles";
import { formatToUiDate } from "../../../../../../utils/dateUtils";
import { FILE_PICKER_ACCEPT } from "../../../../../../utils/FileUtils";
import { SUBSCALE_BRAND } from "../../../../../../app/theme/custom_themes/user/manufacturing/subscale_theme";
import {
  ARTICLE_TYPE_TABLE_ID,
  RUBBER_MATERIAL_OPTIONS,
} from "../../../../../../hooks/user/manufacturing/subscaleHardwareConfig";
import { SubscaleTableTextCell, type SubscaleCellChangeHandler } from "./SubscaleTableCells";
import {
  articleTypeCellSx,
  bemNoTextSx,
  formatArticleTypeLabel,
  tableBodyCellSx,
  tableHeaderCellSx,
} from "../utils/subscaleHardwareTableStyles";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";
import { Controller, useFormContext } from "react-hook-form";

type RowsProps = {
  rows: any[];
  onCellChange: SubscaleCellChangeHandler;
  getSyncedBemNo?: (rowIndex: number) => string;
};

export const ArticleTypeTableSection = memo(function ArticleTypeTableSection({
  rows,
  onCellChange,
}: RowsProps) {
  const { control } = useFormContext();

  return (
    <TableContainer sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="Article Type" required sx={tableHeaderCellSx} />
            </TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="Rubber Material" required sx={tableHeaderCellSx} />
            </TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="Sleeve No" required sx={tableHeaderCellSx} />
            </TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="Mould No" required sx={tableHeaderCellSx} />
            </TableCell>
            <TableCell sx={tableHeaderCellSx}>Length</TableCell>
            <TableCell sx={tableHeaderCellSx}>Thickness</TableCell>
            <TableCell sx={tableHeaderCellSx}>Liner Applied</TableCell>
            <TableCell sx={tableHeaderCellSx}>Observations</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
              <TableCell sx={articleTypeCellSx}>
                {formatArticleTypeLabel(row.ARTICLE_TYPE)}
              </TableCell>
              <TableCell sx={{ minWidth: 160, ...tableBodyCellSx }}>
                <Controller
                  name={`schemaFormValues.ARTICLE_TYPE_TABLE.${idx}.RUBBER_MATERIAL`}
                  control={control}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <FormInput
                      select
                      compact
                      value={value ?? ""}
                      onChange={(e) => {
                        onChange(e);
                        onCellChange(ARTICLE_TYPE_TABLE_ID, idx, "RUBBER_MATERIAL", e.target.value);
                      }}
                      error={!!error}
                      helperText={error?.message || ""}
                      SelectProps={{ displayEmpty: true, MenuProps: appDropdownMenuProps }}
                    >
                      <MenuItem value="">
                        <em
                          style={
                            { ...appDropdownPlaceholderSx, fontStyle: "normal" } as CSSProperties
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
                  )}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  tableId={ARTICLE_TYPE_TABLE_ID}
                  rowIndex={idx}
                  fieldId="SLEEVE_NO"
                  value={row.SLEEVE_NO ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  tableId={ARTICLE_TYPE_TABLE_ID}
                  rowIndex={idx}
                  fieldId="MOULD_NO"
                  value={row.MOULD_NO ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  tableId={ARTICLE_TYPE_TABLE_ID}
                  rowIndex={idx}
                  fieldId="SIZE_MM"
                  value={row.SIZE_MM ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  type="number"
                  tableId={ARTICLE_TYPE_TABLE_ID}
                  rowIndex={idx}
                  fieldId="THICKNESS_MM"
                  value={row.THICKNESS_MM ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  tableId={ARTICLE_TYPE_TABLE_ID}
                  rowIndex={idx}
                  fieldId="LINER_APPLIED"
                  value={row.LINER_APPLIED ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  tableId={ARTICLE_TYPE_TABLE_ID}
                  rowIndex={idx}
                  fieldId="OBSERVATIONS"
                  value={row.OBSERVATIONS ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export const TrimmingTableSection = memo(function TrimmingTableSection({
  rows,
  onCellChange,
  getSyncedBemNo = () => "",
}: RowsProps) {
  return (
    <TableContainer sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="Article Type" required sx={tableHeaderCellSx} />
            </TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="BEM No" required sx={tableHeaderCellSx} />
            </TableCell>
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
          {rows.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
              <TableCell sx={articleTypeCellSx}>
                {formatArticleTypeLabel(row.ARTICLE_TYPE)}
              </TableCell>
              <TableCell sx={bemNoTextSx}>{getSyncedBemNo(idx) || "—"}</TableCell>
              {(
                [
                  "HE_OD",
                  "HE_PORT_INNER",
                  "HE_PORT_OUTER",
                  "HE_BEFORE_INHIBITION_INNER",
                  "HE_BEFORE_INHIBITION_OUTER",
                  "NE_OD",
                  "NE_PORT_INNER",
                  "NE_PORT_OUTER",
                  "NE_WEB_INNER",
                  "NE_WEB_OUTER",
                  "LENGTH_BEFORE_INHIBITION",
                ] as const
              ).map((fieldId) => (
                <TableCell key={fieldId} sx={tableBodyCellSx}>
                  <SubscaleTableTextCell
                    compact
                    type="number"
                    tableId="TRIMMING_TABLE"
                    rowIndex={idx}
                    fieldId={fieldId}
                    value={row[fieldId] ?? ""}
                    onCellChange={onCellChange}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export const CastingTableSection = memo(function CastingTableSection({
  rows,
  onCellChange,
}: RowsProps) {
  const { control } = useFormContext();
  return (
    <TableContainer sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="Article Type" required sx={tableHeaderCellSx} />
            </TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="BEM Mould No" required sx={tableHeaderCellSx} />
            </TableCell>
            <TableCell sx={tableHeaderCellSx}>Casting Pit No</TableCell>
            <TableCell sx={tableHeaderCellSx}>Start Time</TableCell>
            <TableCell sx={tableHeaderCellSx}>End Time</TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="Vacuum Level" required sx={tableHeaderCellSx} />
            </TableCell>
            <TableCell sx={tableHeaderCellSx}>Remarks</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
              <TableCell sx={articleTypeCellSx}>
                {formatArticleTypeLabel(row.ARTICLE_TYPE)}
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  tableId="CASTING_TABLE"
                  rowIndex={idx}
                  fieldId="BEM_MOULD_NO"
                  value={row.BEM_MOULD_NO ?? ""}
                  onCellChange={onCellChange}
                  required
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  tableId="CASTING_TABLE"
                  rowIndex={idx}
                  fieldId="CASTING_PIT_NO"
                  value={row.CASTING_PIT_NO ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <Controller
                  name={`schemaFormValues.CASTING_TABLE.${idx}.CASTING_START_TIME`}
                  control={useFormContext().control}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <TimeField
                      compact
                      value={String(value ?? row.CASTING_START_TIME ?? "")}
                      onChange={(next) => {
                        onChange(next);
                        onCellChange("CASTING_TABLE", idx, "CASTING_START_TIME", next);
                      }}
                      placeholder="HH:mm"
                      error={!!error}
                      helperText={error?.message || ""}
                    />
                  )}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <Controller
                  name={`schemaFormValues.CASTING_TABLE.${idx}.CASTING_END_TIME`}
                  control={useFormContext().control}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <TimeField
                      compact
                      value={String(value ?? row.CASTING_END_TIME ?? "")}
                      onChange={(next) => {
                        onChange(next);
                        onCellChange("CASTING_TABLE", idx, "CASTING_END_TIME", next);
                      }}
                      placeholder="HH:mm"
                      error={!!error}
                      helperText={error?.message || ""}
                    />
                  )}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  type="number"
                  tableId="CASTING_TABLE"
                  rowIndex={idx}
                  fieldId="VACUUM_LEVEL"
                  value={row.VACUUM_LEVEL ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  tableId="CASTING_TABLE"
                  rowIndex={idx}
                  fieldId="REMARKS"
                  value={row.REMARKS ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

type StaticTestingProps = RowsProps & {
  onFileUpload: (rowIndex: number, file: File) => void;
  FileUploadButton: ComponentType<any>;
};

export const StaticTestingTableSection = memo(function StaticTestingTableSection({
  rows,
  onCellChange,
  getSyncedBemNo = () => "",
  onFileUpload,
  FileUploadButton,
}: StaticTestingProps) {
  return (
    <TableContainer sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="Article Type" required sx={tableHeaderCellSx} />
            </TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="BEM No" required sx={tableHeaderCellSx} />
            </TableCell>
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
          {rows.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
              <TableCell sx={articleTypeCellSx}>
                {formatArticleTypeLabel(row.ARTICLE_TYPE)}
              </TableCell>
              <TableCell sx={bemNoTextSx}>{getSyncedBemNo(idx) || "—"}</TableCell>
              {(
                [
                  "PROPELLANT_MASS",
                  "DT",
                  "WEB_THICKNESS",
                  "N_VALUE",
                  "PRESSURE_AVG",
                  "THRUST_AVG",
                  "BURN_RATE",
                ] as const
              ).map((fieldId) => (
                <TableCell key={fieldId} sx={tableBodyCellSx}>
                  <SubscaleTableTextCell
                    compact
                    type="number"
                    tableId="STATIC_TESTING_TABLE"
                    rowIndex={idx}
                    fieldId={fieldId}
                    value={row[fieldId] ?? ""}
                    onCellChange={onCellChange}
                  />
                </TableCell>
              ))}
              <TableCell sx={{ minWidth: 180 }}>
                <FileUploadButton
                  icon={UploadFileIcon}
                  label={row.GRAPH_UPLOAD ? row.GRAPH_UPLOAD.name : "Upload Graph"}
                  accept={FILE_PICKER_ACCEPT.IMAGE_PDF}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) onFileUpload(idx, file);
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export const MechanicalPropertiesTableSection = memo(function MechanicalPropertiesTableSection({
  rows,
  onCellChange,
  getSyncedBemNo = () => "",
}: RowsProps) {
  return (
    <TableContainer sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="Article Type" required sx={tableHeaderCellSx} />
            </TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="BEM No" required sx={tableHeaderCellSx} />
            </TableCell>
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
          {rows.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
              <TableCell sx={articleTypeCellSx}>
                {formatArticleTypeLabel(row.ARTICLE_TYPE)}
              </TableCell>
              <TableCell sx={bemNoTextSx}>{getSyncedBemNo(idx) || "—"}</TableCell>
              {(
                [
                  ["TS", true],
                  ["ELONGATION", true],
                  ["MODULUS", true],
                  ["SBS", true],
                  ["TBS", true],
                  ["PEEL_STRENGTH", true],
                  ["DENSITY", true],
                  ["ACTOR", false],
                ] as const
              ).map(([fieldId, isNumber]) => (
                <TableCell key={fieldId} sx={tableBodyCellSx}>
                  <SubscaleTableTextCell
                    compact
                    type={isNumber ? "number" : undefined}
                    tableId="MECHANICAL_PROPERTIES_TABLE"
                    rowIndex={idx}
                    fieldId={fieldId}
                    value={row[fieldId] ?? ""}
                    onCellChange={onCellChange}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export const CuringTableSection = memo(function CuringTableSection({
  rows,
  onCellChange,
  getSyncedBemNo = () => "",
}: RowsProps) {
  const { control } = useFormContext();
  return (
    <TableContainer sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="Article Type" required sx={tableHeaderCellSx} />
            </TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="BEM Mould No" required sx={tableHeaderCellSx} />
            </TableCell>
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
          {rows.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
              <TableCell sx={articleTypeCellSx}>
                {formatArticleTypeLabel(row.ARTICLE_TYPE)}
              </TableCell>
              <TableCell sx={bemNoTextSx}>{getSyncedBemNo(idx) || "—"}</TableCell>
              <TableCell sx={tableBodyCellSx}>
                <Controller
                  name={`schemaFormValues.CURING_TABLE.${idx}.CURING_START_DATE`}
                  control={control}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <DateField
                      compact
                      value={formatToUiDate(String(value ?? row.CURING_START_DATE ?? ""))}
                      onChange={(next) => {
                        onChange(next);
                        onCellChange("CURING_TABLE", idx, "CURING_START_DATE", next);
                      }}
                      placeholder="DD-MM-YYYY"
                      error={!!error}
                      helperText={error?.message || ""}
                    />
                  )}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <Controller
                  name={`schemaFormValues.CURING_TABLE.${idx}.CURING_END_DATE`}
                  control={control}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <DateField
                      compact
                      value={formatToUiDate(String(value ?? row.CURING_END_DATE ?? ""))}
                      onChange={(next) => {
                        onChange(next);
                        onCellChange("CURING_TABLE", idx, "CURING_END_DATE", next);
                      }}
                      placeholder="DD-MM-YYYY"
                      error={!!error}
                      helperText={error?.message || ""}
                    />
                  )}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  tableId="CURING_TABLE"
                  rowIndex={idx}
                  fieldId="OVEN_NO"
                  value={row.OVEN_NO ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  type="number"
                  tableId="CURING_TABLE"
                  rowIndex={idx}
                  fieldId="TEMPERATURE"
                  value={row.TEMPERATURE ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  type="number"
                  tableId="CURING_TABLE"
                  rowIndex={idx}
                  fieldId="HARDNESS"
                  value={row.HARDNESS ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <Controller
                  name={`schemaFormValues.CURING_TABLE.${idx}.DECORING_DATE`}
                  control={control}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <DateField
                      compact
                      value={formatToUiDate(String(value ?? row.DECORING_DATE ?? ""))}
                      onChange={(next) => {
                        onChange(next);
                        onCellChange("CURING_TABLE", idx, "DECORING_DATE", next);
                      }}
                      placeholder="DD-MM-YYYY"
                      error={!!error}
                      helperText={error?.message || ""}
                    />
                  )}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  type="number"
                  tableId="CURING_TABLE"
                  rowIndex={idx}
                  fieldId="DECORING_LOAD"
                  value={row.DECORING_LOAD ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  tableId="CURING_TABLE"
                  rowIndex={idx}
                  fieldId="GRAIN_SURFACE_OBSERVATIONS"
                  value={row.GRAIN_SURFACE_OBSERVATIONS ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export const NdtTableSection = memo(function NdtTableSection({
  rows,
  onCellChange,
  getSyncedBemNo = () => "",
}: RowsProps) {
  const { control } = useFormContext();
  return (
    <TableContainer sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={tableHeaderCellSx}>Sr No</TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="Article Type" required sx={tableHeaderCellSx} />
            </TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="BEM No" required sx={tableHeaderCellSx} />
            </TableCell>
            <TableCell sx={tableHeaderCellSx}>
              <FieldLabelWithAsterisk label="Date Of NDT" required sx={tableHeaderCellSx} />
            </TableCell>
            <TableCell sx={tableHeaderCellSx}>Observations</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell sx={tableBodyCellSx}>{idx + 1}</TableCell>
              <TableCell sx={articleTypeCellSx}>
                {formatArticleTypeLabel(row.ARTICLE_TYPE)}
              </TableCell>
              <TableCell sx={bemNoTextSx}>{getSyncedBemNo(idx) || "—"}</TableCell>
              <TableCell sx={tableBodyCellSx}>
                <Controller
                  name={`schemaFormValues.NDT_TABLE.${idx}.DATE_OF_NDT`}
                  control={control}
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <DateField
                      compact
                      required
                      value={formatToUiDate(String(value ?? row.DATE_OF_NDT ?? ""))}
                      onChange={(next) => {
                        onChange(next);
                        onCellChange("NDT_TABLE", idx, "DATE_OF_NDT", next);
                      }}
                      placeholder="DD-MM-YYYY"
                      error={!!error}
                      helperText={error?.message || ""}
                    />
                  )}
                />
              </TableCell>
              <TableCell sx={tableBodyCellSx}>
                <SubscaleTableTextCell
                  compact
                  tableId="NDT_TABLE"
                  rowIndex={idx}
                  fieldId="OBSERVATIONS"
                  value={row.OBSERVATIONS ?? ""}
                  onCellChange={onCellChange}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});
