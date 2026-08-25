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
  StfBemGrainRow,
  StfBemMotorData,
  StfBemSensorRow,
  StfMainMotorData,
  StfMainSensorRow,
  StfMotorData,
} from "../../../../../data/models/user/StfMotorDataModel";
import { DateField } from "../../../../components/common/DateField";
import StfFileField, { type StfFileSubDeptSlug } from "./StfFileField";
import {
  FieldGrid,
  FieldLabel,
  SectionCard,
  TableTextInput,
  postCureTableCellSx,
  postCureTableContainerSx,
  postCureTableHeaderCellSx,
  postCureTableInputSx,
  postCureTableRowSx,
} from "./STFFormPrimitives";

type Props = {
  value: StfMotorData;
  onChange: (next: StfMotorData) => void;
  disabled?: boolean;
  readOnly?: boolean;
  theme?: any;
  subDeptSlug?: StfFileSubDeptSlug;
  subDepartmentId?: number;
  batchId?: string;
  motorId?: string;
};

const patchSection = <T extends Record<string, string>>(section: T, key: keyof T, val: string) => ({
  ...section,
  [key]: val,
});

const formatFieldLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const CompactDate = ({
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
  <DateField value={value} onChange={onChange} disabled={disabled} readOnly={readOnly} compact inputSx={postCureTableInputSx} />
);

const ScalarFields = <T extends Record<string, string>>({
  section,
  fields,
  onChange,
  disabled,
  readOnly,
  columns = 2,
  multilineKeys = ["REMARKS", "OBSERVATION"],
}: {
  section: T;
  fields: Array<keyof T & string>;
  onChange: (next: T) => void;
  disabled?: boolean;
  readOnly?: boolean;
  columns?: 2 | 3 | 4;
  multilineKeys?: string[];
}) => (
  <FieldGrid columns={columns}>
    {fields.map((key) => {
      const multiline = multilineKeys.includes(key);
      return (
        <Box key={key} sx={multiline ? { gridColumn: { xs: "1", md: "1 / -1" } } : undefined}>
          <FieldLabel>{formatFieldLabel(key)}</FieldLabel>
          <TableTextInput
            value={section[key]}
            onChange={(val) => onChange(patchSection(section, key, val))}
            disabled={disabled} readOnly={readOnly}
            {...(multiline ? { multiline: true, minRows: 2 } : {})}
          />
        </Box>
      );
    })}
  </FieldGrid>
);

const MainSensorTable = ({
  rows,
  onChange,
  disabled,
  readOnly,
}: {
  rows: StfMainSensorRow[];
  onChange: (rows: StfMainSensorRow[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const columns: Array<{ key: keyof StfMainSensorRow; readonly?: boolean }> = [
    { key: "CHANNEL", readonly: true },
    { key: "SENSOR" },
    { key: "SENSITIVITY" },
    { key: "MAX_EXPECTED" },
    { key: "SENSOR_RANGE" },
    { key: "FILTER_HZ" },
    { key: "IA_NO" },
    { key: "IA_GAIN" },
    { key: "EXT_VOLTAGE" },
    { key: "OFFSET_VALUE" },
    { key: "PRELOADING" },
  ];

  const updateRow = (index: number, key: keyof StfMainSensorRow, val: string) =>
    onChange(rows.map((row, i) => (i === index ? patchSection(row, key, val) : row)));

  return (
    <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 960 }}>
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
            <TableRow key={`main-sensor-${row.CHANNEL}-${index}`} sx={postCureTableRowSx(index)}>
              {columns.map(({ key, readonly }) => (
                <TableCell
                  key={key}
                  sx={{ ...postCureTableCellSx, ...(readonly ? { fontWeight: 600 } : {}) }}
                >
                  {readonly ? (
                    row.CHANNEL
                  ) : (
                    <TableTextInput
                      value={row[key]}
                      onChange={(val) => updateRow(index, key, val)}
                      disabled={disabled} readOnly={readOnly}
                    />
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

const BemSensorTable = ({
  rows,
  onChange,
  disabled,
  readOnly,
}: {
  rows: StfBemSensorRow[];
  onChange: (rows: StfBemSensorRow[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const columns: Array<{ key: keyof StfBemSensorRow; readonly?: boolean }> = [
    { key: "CHANNEL", readonly: true },
    { key: "SENSOR" },
    { key: "SENSITIVITY" },
    { key: "MAX_RANGE" },
    { key: "SENSOR_RANGE" },
    { key: "FILTER_HZ" },
    { key: "IA_NO" },
    { key: "IA_GAIN" },
    { key: "EXT_V" },
    { key: "OFFSET_VALUE" },
    { key: "PRELOADING" },
  ];

  const updateRow = (index: number, key: keyof StfBemSensorRow, val: string) =>
    onChange(rows.map((row, i) => (i === index ? patchSection(row, key, val) : row)));

  return (
    <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 960 }}>
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
            <TableRow key={`bem-sensor-${row.CHANNEL}-${index}`} sx={postCureTableRowSx(index)}>
              {columns.map(({ key, readonly }) => (
                <TableCell
                  key={key}
                  sx={{ ...postCureTableCellSx, ...(readonly ? { fontWeight: 600 } : {}) }}
                >
                  {readonly ? (
                    row.CHANNEL
                  ) : (
                    <TableTextInput
                      value={row[key]}
                      onChange={(val) => updateRow(index, key, val)}
                      disabled={disabled} readOnly={readOnly}
                    />
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

const GrainDimensionTable = ({
  rows,
  onChange,
  disabled,
  readOnly,
}: {
  rows: StfBemGrainRow[];
  onChange: (rows: StfBemGrainRow[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const columns: Array<{ key: keyof StfBemGrainRow; readonly?: boolean }> = [
    { key: "SIDE", readonly: true },
    { key: "OD" },
    { key: "A" },
    { key: "B" },
    { key: "C" },
    { key: "LENGTH" },
    { key: "WEIGHT" },
  ];

  const updateRow = (index: number, key: keyof StfBemGrainRow, val: string) =>
    onChange(rows.map((row, i) => (i === index ? patchSection(row, key, val) : row)));

  return (
    <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
      <Table size="small">
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
            <TableRow key={`grain-${row.SIDE}-${index}`} sx={postCureTableRowSx(index)}>
              {columns.map(({ key, readonly }) => (
                <TableCell
                  key={key}
                  sx={{ ...postCureTableCellSx, ...(readonly ? { fontWeight: 600 } : {}) }}
                >
                  {readonly ? (
                    row.SIDE
                  ) : (
                    <TableTextInput
                      value={row[key]}
                      onChange={(val) => updateRow(index, key, val)}
                      disabled={disabled} readOnly={readOnly}
                    />
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

const IGNITER_FIELDS = [
  "CONTAINER_TYPE",
  "COMPOSITION",
  "WEIGHT_OF_COMPOSITION",
  "SQUIB_RESISTANCE",
  "REMARKS",
] as const;

const MainMotorPanel = ({
  data,
  onChange,
  disabled,
  theme,
  readOnly,
  subDeptSlug,
}: {
  data: StfMainMotorData;
  onChange: (next: StfMainMotorData) => void;
  disabled?: boolean;
  readOnly?: boolean;
  theme?: any;
  subDeptSlug?: StfFileSubDeptSlug;
}) => (
  <Box>
    <SectionCard title="Igniter Details" theme={theme}>
      <ScalarFields
        section={data.IGNITER_DETAILS}
        fields={[...IGNITER_FIELDS]}
        onChange={(next) => onChange({ ...data, IGNITER_DETAILS: next })}
        disabled={disabled} readOnly={readOnly}
        columns={3}
      />
    </SectionCard>

    <SectionCard title="Nozzle Details" theme={theme}>
      <ScalarFields
        section={data.NOZZLE_DETAILS}
        fields={[
          "NOZZLE_CLOSURE_MATERIAL",
          "MOTHER_GRAPHITE",
          "NOZZLE_INSERT",
          "DT_BEFORE",
          "DE_BEFORE",
          "DT_AFTER",
          "DE_AFTER",
          "REMARKS",
        ]}
        onChange={(next) => onChange({ ...data, NOZZLE_DETAILS: next })}
        disabled={disabled} readOnly={readOnly}
        columns={3}
      />
    </SectionCard>

    <SectionCard title="Testing Details" theme={theme}>
      <ScalarFields
        section={data.TESTING_DETAILS}
        fields={[
          "THROAT_DIAMETER",
          "PROPELLANT_WEIGHT",
          "WEB_THICKNESS",
          "N_VALUE",
          "CONDITIONING_TEMPERATURE",
          "AMBIENT_TEMPERATURE",
          "RH_PERCENT",
        ]}
        onChange={(next) => onChange({ ...data, TESTING_DETAILS: next })}
        disabled={disabled} readOnly={readOnly}
        columns={3}
      />
    </SectionCard>

    <SectionCard title="Sensor Configuration" theme={theme}>
      <MainSensorTable
        rows={data.SENSOR_CONFIGURATION}
        onChange={(rows) => onChange({ ...data, SENSOR_CONFIGURATION: rows })}
        disabled={disabled} readOnly={readOnly}
      />
    </SectionCard>

    <SectionCard title="Static Test Result" theme={theme}>
      <ScalarFields
        section={data.STATIC_TEST_RESULT}
        fields={["AVERAGE_PRESSURE", "PEAK_PRESSURE", "TB", "BURN_RATE", "C_STAR", "ISP"]}
        onChange={(next) => onChange({ ...data, STATIC_TEST_RESULT: next })}
        disabled={disabled} readOnly={readOnly}
        columns={3}
        multilineKeys={[]}
      />
    </SectionCard>

    <SectionCard title="Upload PT Curve" theme={theme}>
      <FieldLabel>{formatFieldLabel("PT_CURVE_FILE")}</FieldLabel>
      <StfFileField
        files={data.UPLOAD_PT_CURVE.PT_CURVE_FILE}
        onChange={(next) =>
          onChange({
            ...data,
            UPLOAD_PT_CURVE: { PT_CURVE_FILE: next },
          })
        }
        multiple={false}
        acceptMode="imageVideoPdf"
        subDeptSlug={subDeptSlug}
        disabled={disabled}
        readOnly={readOnly}
      />
    </SectionCard>
  </Box>
);

const BemMotorPanel = ({
  data,
  onChange,
  disabled,
  theme,
  readOnly,
  subDeptSlug,
}: {
  data: StfBemMotorData;
  onChange: (next: StfBemMotorData) => void;
  disabled?: boolean;
  readOnly?: boolean;
  theme?: any;
  subDeptSlug?: StfFileSubDeptSlug;
}) => (
  <Box>
    <SectionCard title="Conditioning Details" theme={theme}>
      <FieldGrid columns={3}>
        <Box>
          <FieldLabel>{formatFieldLabel("FROM_DATE_TIME")}</FieldLabel>
          <CompactDate
            value={data.CONDITIONING_DETAILS.FROM_DATE_TIME}
            onChange={(next) =>
              onChange({
                ...data,
                CONDITIONING_DETAILS: patchSection(data.CONDITIONING_DETAILS, "FROM_DATE_TIME", next),
              })
            }
            disabled={disabled} readOnly={readOnly}
          />
        </Box>
        <Box>
          <FieldLabel>{formatFieldLabel("TO_DATE_TIME")}</FieldLabel>
          <CompactDate
            value={data.CONDITIONING_DETAILS.TO_DATE_TIME}
            onChange={(next) =>
              onChange({
                ...data,
                CONDITIONING_DETAILS: patchSection(data.CONDITIONING_DETAILS, "TO_DATE_TIME", next),
              })
            }
            disabled={disabled} readOnly={readOnly}
          />
        </Box>
        <Box>
          <FieldLabel>{formatFieldLabel("TEMPERATURE")}</FieldLabel>
          <TableTextInput
            value={data.CONDITIONING_DETAILS.TEMPERATURE}
            onChange={(next) =>
              onChange({
                ...data,
                CONDITIONING_DETAILS: patchSection(data.CONDITIONING_DETAILS, "TEMPERATURE", next),
              })
            }
            disabled={disabled} readOnly={readOnly}
          />
        </Box>
        <Box>
          <FieldLabel>{formatFieldLabel("RH")}</FieldLabel>
          <TableTextInput
            value={data.CONDITIONING_DETAILS.RH}
            onChange={(next) =>
              onChange({
                ...data,
                CONDITIONING_DETAILS: patchSection(data.CONDITIONING_DETAILS, "RH", next),
              })
            }
            disabled={disabled} readOnly={readOnly}
          />
        </Box>
        <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
          <FieldLabel>{formatFieldLabel("OBSERVATION")}</FieldLabel>
          <TableTextInput
            value={data.CONDITIONING_DETAILS.OBSERVATION}
            onChange={(next) =>
              onChange({
                ...data,
                CONDITIONING_DETAILS: patchSection(data.CONDITIONING_DETAILS, "OBSERVATION", next),
              })
            }
            disabled={disabled} readOnly={readOnly}
            multiline
            minRows={2}
          />
        </Box>
      </FieldGrid>
    </SectionCard>

    <SectionCard title="Grain Dimension" theme={theme}>
      <GrainDimensionTable
        rows={data.GRAIN_DIMENSION}
        onChange={(rows) => onChange({ ...data, GRAIN_DIMENSION: rows })}
        disabled={disabled} readOnly={readOnly}
      />
    </SectionCard>

    <SectionCard title="BEM Hardware Details" theme={theme}>
      <ScalarFields
        section={data.BEM_HARDWARE_DETAILS}
        fields={[
          "HEAD_END_NO",
          "NOZZLE_END_NO",
          "RETAINER_RING_NO",
          "CASING_NO",
          "CASING_OD",
          "CASING_ID",
          "CASING_LENGTH",
          "FIRING_NO",
        ]}
        onChange={(next) => onChange({ ...data, BEM_HARDWARE_DETAILS: next })}
        disabled={disabled} readOnly={readOnly}
        columns={3}
        multilineKeys={[]}
      />
    </SectionCard>

    <SectionCard title="Igniter Details" theme={theme}>
      <ScalarFields
        section={data.IGNITER_DETAILS}
        fields={[...IGNITER_FIELDS]}
        onChange={(next) => onChange({ ...data, IGNITER_DETAILS: next })}
        disabled={disabled} readOnly={readOnly}
        columns={3}
      />
    </SectionCard>

    <SectionCard title="Nozzle Details" theme={theme}>
      <ScalarFields
        section={data.NOZZLE_DETAILS}
        fields={[
          "NOZZLE_CLOSURE_MATERIAL",
          "THROAT_MATERIAL",
          "MOTHER_GRAPHITE",
          "NOZZLE_INSERT",
          "BEFORE_D1",
          "BEFORE_D2",
          "AFTER_D1",
          "AFTER_D2",
          "REMARKS",
        ]}
        onChange={(next) => onChange({ ...data, NOZZLE_DETAILS: next })}
        disabled={disabled} readOnly={readOnly}
        columns={3}
      />
    </SectionCard>

    <SectionCard title="Testing Details" theme={theme}>
      <ScalarFields
        section={data.TESTING_DETAILS}
        fields={[
          "THROAT_DIAMETER",
          "WT_OF_PROPELLANT",
          "WEB_THICKNESS",
          "N_VALUE",
          "CONDITIONING_TEMP",
          "AMBIENT_TEMP",
          "RH",
        ]}
        onChange={(next) => onChange({ ...data, TESTING_DETAILS: next })}
        disabled={disabled} readOnly={readOnly}
        columns={3}
        multilineKeys={[]}
      />
    </SectionCard>

    <SectionCard title="Sensor Configuration" theme={theme}>
      <BemSensorTable
        rows={data.SENSOR_CONFIGURATION}
        onChange={(rows) => onChange({ ...data, SENSOR_CONFIGURATION: rows })}
        disabled={disabled} readOnly={readOnly}
      />
    </SectionCard>

    <SectionCard title="Result Details" theme={theme}>
      <ScalarFields
        section={data.RESULT_DETAILS}
        fields={["AVG_PRESSURE", "PEAK_PRESSURE", "TB", "BURN_RATE", "C_STAR", "ISP"]}
        onChange={(next) => onChange({ ...data, RESULT_DETAILS: next })}
        disabled={disabled} readOnly={readOnly}
        columns={3}
        multilineKeys={[]}
      />
    </SectionCard>

    <SectionCard title="Upload PT Curve" theme={theme}>
      <FieldLabel>{formatFieldLabel("PT_CURVE_UPLOAD")}</FieldLabel>
      <StfFileField
        files={data.UPLOAD_PT_CURVE.PT_CURVE_UPLOAD}
        onChange={(next) =>
          onChange({
            ...data,
            UPLOAD_PT_CURVE: { PT_CURVE_UPLOAD: next },
          })
        }
        multiple={false}
        acceptMode="imageVideoPdf"
        subDeptSlug={subDeptSlug}
        disabled={disabled}
        readOnly={readOnly}
      />
    </SectionCard>
  </Box>
);

const StfMotorPanel = ({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  theme,
  subDeptSlug = "static-test-facility",
  subDepartmentId: _subDepartmentId,
  batchId: _batchId,
  motorId: _motorId,
}: Props) => {
  if (value.variant === "MAIN_MOTOR") {
    return (
      <MainMotorPanel
        data={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        theme={theme}
        subDeptSlug={subDeptSlug}
      />
    );
  }

  return (
    <BemMotorPanel
      data={value}
      onChange={onChange}
      disabled={disabled}
      readOnly={readOnly}
      theme={theme}
      subDeptSlug={subDeptSlug}
    />
  );
};

export default StfMotorPanel;
