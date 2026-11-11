import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import type {
  StfBemBallisticRow,
  StfBemMotorData,
  StfMainBallisticRow,
  StfMainMotorData,
  StfMotorData,
} from "../../../../../data/models/user/StfMotorDataModel";
import {
  STF_BEM_GRAIN_CONFIGURATION_OPTIONS,
  STF_BEM_WT_OF_GRAIN_OPTIONS,
} from "../../../../../data/models/user/StfMotorDataModel";
import { DateTimeField } from "../../../../components/common/DateField";
import { type StfFileSubDeptSlug } from "./StfFileField";
import {
  FieldGrid,
  FieldLabel,
  SectionCard,
  TableSelectInput,
  TableTextInput,
  postCureTableCellSx,
  postCureTableContainerSx,
  postCureTableHeaderCellSx,
  postCureTableInputSx,
  postCureTableRowSx,
} from "./STFFormPrimitives";
import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";
import FieldErrorText from "@/ui/components/validation/FieldErrorText";
import { fieldError, type ValidationErrors } from "@/data/validation/adapters/stf.validation";

type Props = {
  value: StfMotorData;
  onChange: (next: StfMotorData) => void;
  disabled?: boolean;
  readOnly?: boolean;
  /** QC Division only: QA Remarks columns/fields; mfg Remarks stay read-only. */
  qaRemarksMode?: boolean;
  /**
   * Details / approver read-only: show QA Remarks when a section/row has a non-empty value.
   * Does not enable empty QA fields (unlike qaRemarksMode).
   */
  showQaRemarks?: boolean;
  theme?: any;
  subDeptSlug?: StfFileSubDeptSlug;
  subDepartmentId?: number;
  batchId?: string;
  motorId?: string;
  validationErrors?: ValidationErrors;
};

const hasQaText = (value?: string) => Boolean(String(value ?? "").trim());

/** Include QA_REMARKS field for a scalar section. */
const qaFieldIf = (
  qaRemarksMode: boolean,
  showQaRemarks: boolean,
  value: string,
): Array<"QA_REMARKS"> =>
  qaRemarksMode || (showQaRemarks && hasQaText(value)) ? ["QA_REMARKS"] : [];

const patchSection = <T extends Record<string, string>>(section: T, key: keyof T, val: string) => ({
  ...section,
  [key]: val,
});

const FIELD_LABELS: Record<string, string> = {
  LOADING_NO: "Loading No.",
  FIRING_NO: "Firing No.",
  FIRING_DATE: "Firing Date & Time",
  AMBIENT_TEMPERATURE: "Amb. Temp.",
  TEMPERATURE: "Temperature",
  RH: "RH",
  WT_OF_GRAIN: "Wt. of Grain (kg)",
  GRAIN_CONFIGURATION: "Grain Configuration",
  TYPE: "Type",
  SR_NO_AND_LOT_NO: "Sr No. & Lot No.",
  CHARGE_MASS_GM: "Charge Mass (gm)",
  COMPOSITION: "Composition",
  BEFORE_DT: "Before Dt",
  BEFORE_DE: "Before De",
  AFTER_DT: "After Dt",
  AFTER_DE: "After De",
  NOZZLE_CLOSURE_THICKNESS_MM: "Nozzle Closure Thickness (mm)",
  NOZZLE_EROSION_RATE_MM_S: "Nozzle Erosion Rate (mm/s)",
  PROPELLANT_WEIGHT_KG: "Wt of Propellant",
  AVG_BEM_BURN_RATE_MM_S: "Avg. BEM Burn Rate (mm/s)",
  CONDITIONING_TEMPERATURE: "Conditioning Temperature",
  N_VALUE: "n value",
  PROPELLANT_DENSITY: "Propellant Density",
  GAMMA: "Gamma",
  WEB_THICKNESS_AVERAGE_MIN: "Web Thickness Average/Min",
  WEB_THICKNESS_STD_DEV: "Web Thickness Std Dev",
  CHANNEL_1: "Channel 1",
  CHANNEL_2: "Channel 2",
  PARAMETER: "Parameter",
  BURN_RATE_MM_S: "Burn Rate (mm/s)",
  PRESSURE_ABS_KSC: "Pressure Abs (ksc)",
  QA_REMARKS: "QA Remarks",
};

const formatFieldLabel = (key: string) => {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  if (key === "QA_REMARKS") return "QA Remarks";
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const WT_OF_GRAIN_SELECT_OPTIONS = STF_BEM_WT_OF_GRAIN_OPTIONS.map((value) => ({
  value,
  label: value,
}));

const GRAIN_CONFIGURATION_SELECT_OPTIONS = STF_BEM_GRAIN_CONFIGURATION_OPTIONS.map((value) => ({
  value,
  label: value,
}));

const CompactDateTime = ({
  value,
  onChange,
  disabled,
  readOnly,
  fieldPath,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  fieldPath?: string;
  error?: boolean;
}) => (
  <Box {...(fieldPath ? { "data-stf-field": fieldPath } : {})}>
    <DateTimeField
      value={value}
      onChange={onChange}
      disabled={disabled}
      readOnly={readOnly}
      compact
      placeholder="DD-MM-YYYY HH:mm"
      inputSx={postCureTableInputSx}
      error={error}
    />
  </Box>
);

const ScalarFields = <T extends Record<string, string>>({
  section,
  fields,
  onChange,
  disabled,
  readOnly,
  columns = 2,
  multilineKeys = ["REMARKS", "OBSERVATION", "QA_REMARKS"],
  readOnlyKeys = [],
  pathPrefix,
  validationErrors,
}: {
  section: T;
  fields: Array<keyof T & string>;
  onChange: (next: T) => void;
  disabled?: boolean;
  readOnly?: boolean;
  columns?: 2 | 3 | 4;
  multilineKeys?: string[];
  /** Force specific keys read-only (e.g. mfg REMARKS in QC qaRemarksMode). */
  readOnlyKeys?: string[];
  pathPrefix?: string;
  validationErrors?: ValidationErrors;
}) => (
  <FieldGrid columns={columns}>
    {fields.map((key) => {
      const multiline = multilineKeys.includes(key);
      const path = pathPrefix ? `${pathPrefix}.${key}` : key;
      const message = fieldError(validationErrors, path);
      const fieldReadOnly = Boolean(readOnly || readOnlyKeys.includes(key));
      return (
        <Box
          key={key}
          data-stf-field={path}
          sx={multiline ? { gridColumn: { xs: "1", md: "1 / -1" } } : undefined}
        >
          <FieldLabelWithAsterisk
            label={formatFieldLabel(key)}
            required={key !== "QA_REMARKS"}
          />
          <TableTextInput
            value={section[key]}
            onChange={(val) => onChange(patchSection(section, key, val))}
            disabled={disabled}
            readOnly={fieldReadOnly}
            error={Boolean(message)}
            {...(multiline ? { multiline: true, minRows: 2 } : {})}
          />
          <FieldErrorText message={message} />
        </Box>
      );
    })}
  </FieldGrid>
);

const MainBallisticTable = ({
  rows,
  onChange,
  disabled,
  readOnly,
  qaRemarksMode = false,
  showQaRemarks = false,
  validationErrors,
}: {
  rows: StfMainBallisticRow[];
  onChange: (rows: StfMainBallisticRow[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  qaRemarksMode?: boolean;
  showQaRemarks?: boolean;
  validationErrors?: ValidationErrors;
}) => {
  const showQaColumn =
    qaRemarksMode || (showQaRemarks && rows.some((row) => hasQaText(row.QA_REMARKS)));
  const columns: Array<{ key: keyof StfMainBallisticRow; readonly?: boolean }> = [
    { key: "PARAMETER", readonly: true },
    { key: "CHANNEL_1" },
    ...(showQaColumn ? [{ key: "QA_REMARKS" as const }] : []),
  ];

  const updateRow = (index: number, key: keyof StfMainBallisticRow, val: string) =>
    onChange(rows.map((row, i) => (i === index ? patchSection(row, key, val) : row)));

  return (
    <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: showQaColumn ? 640 : 480 }}>
        <TableHead>
          <TableRow>
            {columns.map(({ key }, idx) => (
              <TableCell key={key} sx={postCureTableHeaderCellSx(idx === 0)}>
                {formatFieldLabel(key)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`main-ballistic-${row.PARAMETER}`} sx={postCureTableRowSx(index)}>
              {columns.map(({ key, readonly }) => (
                <TableCell
                  key={key}
                  sx={{ ...postCureTableCellSx, ...(readonly ? { fontWeight: 600 } : {}) }}
                >
                  {readonly ? (
                    row.PARAMETER_LABEL
                  ) : (
                    (() => {
                      const path = `BALLISTIC_PARAMETERS.${index}.${key}`;
                      const message = fieldError(validationErrors, path);
                      return (
                        <Box data-stf-field={path}>
                          <TableTextInput
                            value={row[key]}
                            onChange={(val) => updateRow(index, key, val)}
                            disabled={disabled}
                            readOnly={readOnly}
                            error={Boolean(message)}
                          />
                          <FieldErrorText message={message} />
                        </Box>
                      );
                    })()
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const BemBallisticTable = ({
  rows,
  onChange,
  disabled,
  readOnly,
  qaRemarksMode = false,
  showQaRemarks = false,
  validationErrors,
}: {
  rows: StfBemBallisticRow[];
  onChange: (rows: StfBemBallisticRow[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  qaRemarksMode?: boolean;
  showQaRemarks?: boolean;
  validationErrors?: ValidationErrors;
}) => {
  const showQaColumn =
    qaRemarksMode || (showQaRemarks && rows.some((row) => hasQaText(row.QA_REMARKS)));
  const columns: Array<{ key: keyof StfBemBallisticRow; readonly?: boolean }> = [
    { key: "PARAMETER", readonly: true },
    { key: "CHANNEL_1" },
    { key: "CHANNEL_2" },
    ...(showQaColumn ? [{ key: "QA_REMARKS" as const }] : []),
  ];

  const updateRow = (index: number, key: keyof StfBemBallisticRow, val: string) =>
    onChange(rows.map((row, i) => (i === index ? patchSection(row, key, val) : row)));

  return (
    <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: showQaColumn ? 720 : 560 }}>
        <TableHead>
          <TableRow>
            {columns.map(({ key }, idx) => (
              <TableCell key={key} sx={postCureTableHeaderCellSx(idx === 0)}>
                {formatFieldLabel(key)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`bem-ballistic-${row.PARAMETER}`} sx={postCureTableRowSx(index)}>
              {columns.map(({ key, readonly }) => (
                <TableCell
                  key={key}
                  sx={{ ...postCureTableCellSx, ...(readonly ? { fontWeight: 600 } : {}) }}
                >
                  {readonly ? (
                    row.PARAMETER_LABEL
                  ) : (
                    (() => {
                      const path = `BALLISTIC_PARAMETERS.${index}.${key}`;
                      const message = fieldError(validationErrors, path);
                      return (
                        <Box data-stf-field={path}>
                          <TableTextInput
                            value={row[key]}
                            onChange={(val) => updateRow(index, key, val)}
                            disabled={disabled}
                            readOnly={readOnly}
                            error={Boolean(message)}
                          />
                          <FieldErrorText message={message} />
                        </Box>
                      );
                    })()
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const MainMotorPanel = ({
  data,
  onChange,
  disabled,
  theme,
  readOnly,
  qaRemarksMode = false,
  showQaRemarks = false,
  validationErrors,
}: {
  data: StfMainMotorData;
  onChange: (next: StfMainMotorData) => void;
  disabled?: boolean;
  readOnly?: boolean;
  qaRemarksMode?: boolean;
  showQaRemarks?: boolean;
  theme?: any;
  validationErrors?: ValidationErrors;
}) => {
  const nozzleQa = qaFieldIf(qaRemarksMode, showQaRemarks, data.NOZZLE_DETAILS.QA_REMARKS);
  const mainDataQa = qaFieldIf(qaRemarksMode, showQaRemarks, data.MAIN_MOTOR_DATA.QA_REMARKS);
  const burnQa = qaFieldIf(qaRemarksMode, showQaRemarks, data.BURN_RATE.QA_REMARKS);
  const headerQa = qaFieldIf(qaRemarksMode, showQaRemarks, data.TEST_HEADER.QA_REMARKS);
  return (
  <Box>
    <SectionCard theme={theme}>
      <FieldGrid columns={3}>
        <Box data-stf-field="TEST_HEADER.FIRING_DATE">
          <FieldLabelWithAsterisk label={formatFieldLabel("FIRING_DATE")} required />
          <CompactDateTime
            value={data.TEST_HEADER.FIRING_DATE}
            onChange={(next) =>
              onChange({
                ...data,
                TEST_HEADER: patchSection(data.TEST_HEADER, "FIRING_DATE", next),
              })
            }
            disabled={disabled}
            readOnly={readOnly}
            fieldPath="TEST_HEADER.FIRING_DATE"
            error={Boolean(fieldError(validationErrors, "TEST_HEADER.FIRING_DATE"))}
          />
          <FieldErrorText message={fieldError(validationErrors, "TEST_HEADER.FIRING_DATE")} />
        </Box>
        <Box data-stf-field="TEST_HEADER.AMBIENT_TEMPERATURE">
          <FieldLabelWithAsterisk label={formatFieldLabel("AMBIENT_TEMPERATURE")} required />
          <TableTextInput
            value={data.TEST_HEADER.AMBIENT_TEMPERATURE}
            onChange={(next) =>
              onChange({
                ...data,
                TEST_HEADER: patchSection(data.TEST_HEADER, "AMBIENT_TEMPERATURE", next),
              })
            }
            disabled={disabled}
            readOnly={readOnly}
            error={Boolean(fieldError(validationErrors, "TEST_HEADER.AMBIENT_TEMPERATURE"))}
          />
          <FieldErrorText
            message={fieldError(validationErrors, "TEST_HEADER.AMBIENT_TEMPERATURE")}
          />
        </Box>
        {headerQa.length ? (
          <Box
            data-stf-field="TEST_HEADER.QA_REMARKS"
            sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}
          >
            <FieldLabel>{formatFieldLabel("QA_REMARKS")}</FieldLabel>
            <TableTextInput
              value={data.TEST_HEADER.QA_REMARKS}
              onChange={(next) =>
                onChange({
                  ...data,
                  TEST_HEADER: patchSection(data.TEST_HEADER, "QA_REMARKS", next),
                })
              }
              disabled={disabled}
              readOnly={readOnly}
              multiline
              minRows={2}
              error={Boolean(fieldError(validationErrors, "TEST_HEADER.QA_REMARKS"))}
            />
            <FieldErrorText message={fieldError(validationErrors, "TEST_HEADER.QA_REMARKS")} />
          </Box>
        ) : null}
      </FieldGrid>
    </SectionCard>

    <SectionCard title="Nozzle" theme={theme}>
      <ScalarFields
        section={data.NOZZLE_DETAILS}
        fields={[
          "BEFORE_DT",
          "BEFORE_DE",
          "AFTER_DT",
          "AFTER_DE",
          "NOZZLE_EROSION_RATE_MM_S",
          ...nozzleQa,
        ]}
        onChange={(next) => onChange({ ...data, NOZZLE_DETAILS: next })}
        disabled={disabled}
        readOnly={readOnly}
        columns={3}
        multilineKeys={nozzleQa.length ? ["QA_REMARKS"] : []}
        pathPrefix="NOZZLE_DETAILS"
        validationErrors={validationErrors}
      />
    </SectionCard>

    <SectionCard title="Main Motor Data" theme={theme}>
      <ScalarFields
        section={data.MAIN_MOTOR_DATA}
        fields={[
          "PROPELLANT_WEIGHT_KG",
          "AVG_BEM_BURN_RATE_MM_S",
          "N_VALUE",
          "PROPELLANT_DENSITY",
          "GAMMA",
          ...mainDataQa,
        ]}
        onChange={(next) => onChange({ ...data, MAIN_MOTOR_DATA: next })}
        disabled={disabled}
        readOnly={readOnly}
        columns={3}
        multilineKeys={mainDataQa.length ? ["QA_REMARKS"] : []}
        pathPrefix="MAIN_MOTOR_DATA"
        validationErrors={validationErrors}
      />
    </SectionCard>

    <SectionCard title="Ballistic Parameter" theme={theme}>
      <MainBallisticTable
        rows={data.BALLISTIC_PARAMETERS}
        onChange={(rows) => onChange({ ...data, BALLISTIC_PARAMETERS: rows })}
        disabled={disabled}
        readOnly={readOnly}
        qaRemarksMode={qaRemarksMode}
        showQaRemarks={showQaRemarks}
        validationErrors={validationErrors}
      />
    </SectionCard>

    <SectionCard title="Burn Rate" theme={theme}>
      <ScalarFields
        section={data.BURN_RATE}
        fields={[
          "BURN_RATE_MM_S",
          "PRESSURE_ABS_KSC",
          "N_VALUE",
          ...burnQa,
        ]}
        onChange={(next) => onChange({ ...data, BURN_RATE: next })}
        disabled={disabled}
        readOnly={readOnly}
        columns={3}
        multilineKeys={burnQa.length ? ["QA_REMARKS"] : []}
        pathPrefix="BURN_RATE"
        validationErrors={validationErrors}
      />
    </SectionCard>
  </Box>
  );
};

const BemMotorPanel = ({
  data,
  onChange,
  disabled,
  theme,
  readOnly,
  qaRemarksMode = false,
  showQaRemarks = false,
  validationErrors,
}: {
  data: StfBemMotorData;
  onChange: (next: StfBemMotorData) => void;
  disabled?: boolean;
  readOnly?: boolean;
  qaRemarksMode?: boolean;
  showQaRemarks?: boolean;
  theme?: any;
  subDeptSlug?: StfFileSubDeptSlug;
  validationErrors?: ValidationErrors;
}) => {
  const headerQa = qaFieldIf(qaRemarksMode, showQaRemarks, data.TEST_HEADER.QA_REMARKS);
  const igniterQa = qaFieldIf(qaRemarksMode, showQaRemarks, data.IGNITER_DETAILS.QA_REMARKS);
  const nozzleQa = qaFieldIf(qaRemarksMode, showQaRemarks, data.NOZZLE_DETAILS.QA_REMARKS);
  const bemDataQa = qaFieldIf(qaRemarksMode, showQaRemarks, data.BEM_DATA.QA_REMARKS);
  const burnQa = qaFieldIf(qaRemarksMode, showQaRemarks, data.BURN_RATE.QA_REMARKS);
  return (
  <Box>
    <SectionCard theme={theme}>
      <FieldGrid columns={3}>
        {(
          [
            "LOADING_NO",
            "FIRING_NO",
            "TEMPERATURE",
            "RH",
          ] as const
        ).map((key) => {
          const path = `TEST_HEADER.${key}`;
          const message = fieldError(validationErrors, path);
          return (
            <Box key={key} data-stf-field={path}>
              <FieldLabelWithAsterisk label={formatFieldLabel(key)} required />
              <TableTextInput
                value={data.TEST_HEADER[key]}
                onChange={(next) =>
                  onChange({
                    ...data,
                    TEST_HEADER: patchSection(data.TEST_HEADER, key, next),
                  })
                }
                disabled={disabled}
                readOnly={readOnly}
                error={Boolean(message)}
              />
              <FieldErrorText message={message} />
            </Box>
          );
        })}
        <Box data-stf-field="TEST_HEADER.FIRING_DATE">
          <FieldLabelWithAsterisk label={formatFieldLabel("FIRING_DATE")} required />
          <CompactDateTime
            value={data.TEST_HEADER.FIRING_DATE}
            onChange={(next) =>
              onChange({
                ...data,
                TEST_HEADER: patchSection(data.TEST_HEADER, "FIRING_DATE", next),
              })
            }
            disabled={disabled}
            readOnly={readOnly}
            fieldPath="TEST_HEADER.FIRING_DATE"
            error={Boolean(fieldError(validationErrors, "TEST_HEADER.FIRING_DATE"))}
          />
          <FieldErrorText message={fieldError(validationErrors, "TEST_HEADER.FIRING_DATE")} />
        </Box>
        <Box data-stf-field="TEST_HEADER.WT_OF_GRAIN">
          <FieldLabelWithAsterisk label={formatFieldLabel("WT_OF_GRAIN")} required />
          <TableSelectInput
            value={data.TEST_HEADER.WT_OF_GRAIN}
            onChange={(next) =>
              onChange({
                ...data,
                TEST_HEADER: patchSection(data.TEST_HEADER, "WT_OF_GRAIN", next),
              })
            }
            options={WT_OF_GRAIN_SELECT_OPTIONS}
            disabled={disabled}
            readOnly={readOnly}
            error={Boolean(fieldError(validationErrors, "TEST_HEADER.WT_OF_GRAIN"))}
            fieldPath="TEST_HEADER.WT_OF_GRAIN"
          />
          <FieldErrorText message={fieldError(validationErrors, "TEST_HEADER.WT_OF_GRAIN")} />
        </Box>
        <Box data-stf-field="TEST_HEADER.GRAIN_CONFIGURATION">
          <FieldLabelWithAsterisk label={formatFieldLabel("GRAIN_CONFIGURATION")} required />
          <TableSelectInput
            value={data.TEST_HEADER.GRAIN_CONFIGURATION}
            onChange={(next) =>
              onChange({
                ...data,
                TEST_HEADER: patchSection(data.TEST_HEADER, "GRAIN_CONFIGURATION", next),
              })
            }
            options={GRAIN_CONFIGURATION_SELECT_OPTIONS}
            disabled={disabled}
            readOnly={readOnly}
            error={Boolean(fieldError(validationErrors, "TEST_HEADER.GRAIN_CONFIGURATION"))}
            fieldPath="TEST_HEADER.GRAIN_CONFIGURATION"
          />
          <FieldErrorText
            message={fieldError(validationErrors, "TEST_HEADER.GRAIN_CONFIGURATION")}
          />
        </Box>
        {headerQa.length ? (
          <Box
            data-stf-field="TEST_HEADER.QA_REMARKS"
            sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}
          >
            <FieldLabel>{formatFieldLabel("QA_REMARKS")}</FieldLabel>
            <TableTextInput
              value={data.TEST_HEADER.QA_REMARKS}
              onChange={(next) =>
                onChange({
                  ...data,
                  TEST_HEADER: patchSection(data.TEST_HEADER, "QA_REMARKS", next),
                })
              }
              disabled={disabled}
              readOnly={readOnly}
              multiline
              minRows={2}
              error={Boolean(fieldError(validationErrors, "TEST_HEADER.QA_REMARKS"))}
            />
            <FieldErrorText message={fieldError(validationErrors, "TEST_HEADER.QA_REMARKS")} />
          </Box>
        ) : null}
      </FieldGrid>
    </SectionCard>

    <SectionCard title="Igniter" theme={theme}>
      <ScalarFields
        section={data.IGNITER_DETAILS}
        fields={[
          "TYPE",
          "SR_NO_AND_LOT_NO",
          "CHARGE_MASS_GM",
          "COMPOSITION",
          ...igniterQa,
        ]}
        onChange={(next) => onChange({ ...data, IGNITER_DETAILS: next })}
        disabled={disabled}
        readOnly={readOnly}
        columns={4}
        multilineKeys={igniterQa.length ? ["QA_REMARKS"] : []}
        pathPrefix="IGNITER_DETAILS"
        validationErrors={validationErrors}
      />
    </SectionCard>

    <SectionCard title="Nozzle" theme={theme}>
      <ScalarFields
        section={data.NOZZLE_DETAILS}
        fields={[
          "BEFORE_DT",
          "BEFORE_DE",
          "AFTER_DT",
          "AFTER_DE",
          "NOZZLE_CLOSURE_THICKNESS_MM",
          ...nozzleQa,
        ]}
        onChange={(next) => onChange({ ...data, NOZZLE_DETAILS: next })}
        disabled={disabled}
        readOnly={readOnly}
        columns={3}
        multilineKeys={nozzleQa.length ? ["QA_REMARKS"] : []}
        pathPrefix="NOZZLE_DETAILS"
        validationErrors={validationErrors}
      />
    </SectionCard>

    <SectionCard title="BEM Data" theme={theme}>
      <ScalarFields
        section={data.BEM_DATA}
        fields={[
          "PROPELLANT_WEIGHT_KG",
          "CONDITIONING_TEMPERATURE",
          "N_VALUE",
          "WEB_THICKNESS_AVERAGE_MIN",
          "WEB_THICKNESS_STD_DEV",
          ...bemDataQa,
        ]}
        onChange={(next) => onChange({ ...data, BEM_DATA: next })}
        disabled={disabled}
        readOnly={readOnly}
        columns={3}
        multilineKeys={bemDataQa.length ? ["QA_REMARKS"] : []}
        pathPrefix="BEM_DATA"
        validationErrors={validationErrors}
      />
    </SectionCard>

    <SectionCard title="Ballistic Parameter" theme={theme}>
      <BemBallisticTable
        rows={data.BALLISTIC_PARAMETERS}
        onChange={(rows) => onChange({ ...data, BALLISTIC_PARAMETERS: rows })}
        disabled={disabled}
        readOnly={readOnly}
        qaRemarksMode={qaRemarksMode}
        showQaRemarks={showQaRemarks}
        validationErrors={validationErrors}
      />
    </SectionCard>

    <SectionCard title="Burn Rate" theme={theme}>
      <ScalarFields
        section={data.BURN_RATE}
        fields={[
          "BURN_RATE_MM_S",
          "PRESSURE_ABS_KSC",
          ...burnQa,
        ]}
        onChange={(next) => onChange({ ...data, BURN_RATE: next })}
        disabled={disabled}
        readOnly={readOnly}
        columns={2}
        multilineKeys={burnQa.length ? ["QA_REMARKS"] : []}
        pathPrefix="BURN_RATE"
        validationErrors={validationErrors}
      />
    </SectionCard>
  </Box>
  );
};

const StfMotorPanel = ({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  qaRemarksMode = false,
  showQaRemarks = false,
  theme,
  subDeptSlug = "static-test-facility",
  subDepartmentId: _subDepartmentId,
  batchId: _batchId,
  motorId: _motorId,
  validationErrors,
}: Props) => {
  if (value.variant === "MAIN_MOTOR") {
    return (
      <MainMotorPanel
        data={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        qaRemarksMode={qaRemarksMode}
        showQaRemarks={showQaRemarks}
        theme={theme}
        validationErrors={validationErrors}
      />
    );
  }

  return (
    <BemMotorPanel
      data={value}
      onChange={onChange}
      disabled={disabled}
      readOnly={readOnly}
      qaRemarksMode={qaRemarksMode}
      showQaRemarks={showQaRemarks}
      theme={theme}
      subDeptSlug={subDeptSlug}
      validationErrors={validationErrors}
    />
  );
};

export default StfMotorPanel;
