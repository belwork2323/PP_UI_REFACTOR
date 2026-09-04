import { useEffect, useState } from "react";
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
import { STRINGS } from "../../../../../../app/config/strings";
import { fetchCastingStationsApi } from "../../../../../../data/api/users/operationsApi";
import {
  computeMockTrialDifferenceC,
  computeMockTrialMandrelLiftE,
  createEmptyMockTrialMandrelAssemblyRow,
  createEmptyMockTrialMotorDimensionRow,
  type MockTrialMandrelAssemblyRow,
  type MockTrialMotorDimensionRow,
  type RocketMotorCasingMockTrialData,
} from "../../../../../../data/models/user/RocketMotorCasingFormModel";
import { isCasingFieldRequired } from "../../../../../../data/validation/adapters/rocketMotorCasing.validation";
import {
  FieldGrid,
  RequiredMark,
  SelectField,
  SubsectionTitle,
  TextFieldField,
} from "./CasingFormPrimitives";

type RocketMotorCasingMockTrialPanelProps = {
  value: RocketMotorCasingMockTrialData;
  onChange: (next: RocketMotorCasingMockTrialData) => void;
  disabled?: boolean;
  validationErrors?: Record<string, string>;
  theme: any;
  cf: any;
};

const decimalOnly = (raw: string) => String(raw ?? "").replace(/[^\d.-]/g, "");

const MOTOR_DIM_KEYS: Array<keyof Omit<MockTrialMotorDimensionRow, "srNo">> = [
  "lfRubberThicknessHe",
  "heBossWidthWithoutLfRubber",
  "heDiaId",
];

const MOTOR_LENGTH_KEYS: Array<keyof Omit<MockTrialMotorDimensionRow, "srNo">> = [
  "heOuterToNeOuter",
  "heInnerToNeInner",
  "neOuterToHeInner",
];

const MANDREL_A_B_KEYS: Array<keyof Omit<MockTrialMandrelAssemblyRow, "srNo">> = [
  "mandrelRestOnDomeA",
  "mandrelRestOnBottomCupB",
];

const mockTrialMotorDimRequired = (key: string) =>
  key === "heBossWidthWithoutLfRubber" || key === "heDiaId";

const RocketMotorCasingMockTrialPanel = ({
  value,
  onChange,
  disabled = false,
  validationErrors = {},
  theme,
  cf,
}: RocketMotorCasingMockTrialPanelProps) => {
  const casingTheme = theme.sourcing.rocketMotor.casingForm;
  const S = STRINGS.SOURCING.CASING_CREATE;
  const req = isCasingFieldRequired;
  const [stationOptions, setStationOptions] = useState<Array<{ value: string; label: string }>>(
    [],
  );

  useEffect(() => {
    let active = true;
    void fetchCastingStationsApi()
      .then((response: any) => {
        if (!active) return;
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
        setStationOptions(
          list
            .map((item: Record<string, unknown>) => {
              const stationValue = String(
                item.stationCode ?? item.stationId ?? item.stationName ?? item.code ?? "",
              );
              const label = String(item.stationName ?? item.stationCode ?? stationValue);
              return { value: stationValue, label };
            })
            .filter((item: { value: string }) => item.value),
        );
      })
      .catch(() => {
        if (!active) return;
        setStationOptions([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const patch = (partial: Partial<RocketMotorCasingMockTrialData>) => {
    onChange({ ...value, ...partial });
  };

  const updateMotorDimension = (
    index: number,
    field: keyof Omit<MockTrialMotorDimensionRow, "srNo">,
    nextValue: string,
  ) => {
    patch({
      motorDimensions: value.motorDimensions.map((row, i) =>
        i === index ? { ...row, [field]: decimalOnly(nextValue) } : row,
      ),
    });
  };

  const updateMandrelRow = (
    index: number,
    field: keyof Omit<MockTrialMandrelAssemblyRow, "srNo">,
    nextValue: string,
  ) => {
    patch({
      mandrelAssemblyMeasurements: value.mandrelAssemblyMeasurements.map((row, i) =>
        i === index ? { ...row, [field]: decimalOnly(nextValue) } : row,
      ),
    });
  };

  const cellFieldSx = {
    ...theme.workflow.formElements.cellField,
    ...casingTheme.dimInput,
  };

  const addRowSx = {
    cursor: disabled ? "not-allowed" : "pointer",
    width: "fit-content",
    mt: 1.25,
    color: theme.palette.primaryLight,
    fontSize: "0.72rem",
    fontWeight: 700,
    opacity: disabled ? 0.5 : 1,
  };

  const motorDimLabels: Partial<Record<(typeof MOTOR_DIM_KEYS)[number], string>> = {
    lfRubberThicknessHe: S.MOCK_TRIAL_COL_LF_RUBBER,
    heBossWidthWithoutLfRubber: S.MOCK_TRIAL_COL_HE_BOSS_WIDTH,
    heDiaId: S.MOCK_TRIAL_COL_HE_DIA_ID,
  };

  const motorLengthLabels: Partial<Record<(typeof MOTOR_LENGTH_KEYS)[number], string>> = {
    heOuterToNeOuter: S.MOCK_TRIAL_COL_HE_OUTER_NE_OUTER,
    heInnerToNeInner: S.MOCK_TRIAL_COL_HE_INNER_NE_INNER,
    neOuterToHeInner: S.MOCK_TRIAL_COL_NE_OUTER_HE_INNER,
  };

  const mandrelLabels: Partial<Record<(typeof MANDREL_A_B_KEYS)[number], string>> = {
    mandrelRestOnDomeA: S.MOCK_TRIAL_COL_MANDREL_A,
    mandrelRestOnBottomCupB: S.MOCK_TRIAL_COL_MANDREL_B,
  };

  return (
    <Box>
      <SubsectionTitle cf={cf}>{S.MOCK_TRIAL_BASIC_DETAILS}</SubsectionTitle>
      <FieldGrid theme={theme} cf={cf}>
        <SelectField
          label={S.MOCK_TRIAL_CASTING_STATION}
          required={req("mockTrialCastingStation")}
          value={value.castingStation}
          onChange={(v) => patch({ castingStation: v })}
          options={stationOptions}
          placeholder={S.MOCK_TRIAL_CASTING_STATION_PH}
          disabled={disabled}
          error={validationErrors["mockTrial.castingStation"]}
          theme={theme}
        />
        <TextFieldField
          label={S.MOCK_TRIAL_MANDREL_ID}
          required={req("mockTrialMandrelId")}
          value={value.mandrelId}
          onChange={(v) => patch({ mandrelId: v })}
          placeholder={S.MOCK_TRIAL_MANDREL_ID_PH}
          disabled={disabled}
          error={validationErrors["mockTrial.mandrelId"]}
          theme={theme}
        />
        <TextFieldField
          label={S.MOCK_TRIAL_BOTTOM_CUP_ID}
          value={value.bottomCupId}
          onChange={(v) => patch({ bottomCupId: v })}
          placeholder={S.MOCK_TRIAL_BOTTOM_CUP_ID_PH}
          disabled={disabled}
          error={validationErrors["mockTrial.bottomCupId"]}
          theme={theme}
        />
      </FieldGrid>

      <Box sx={{ mt: 2.5 }}>
        <SubsectionTitle cf={cf}>{S.MOCK_TRIAL_MOTOR_DIMS}</SubsectionTitle>
        {validationErrors["mockTrial.motorDimensions"] ? (
          <Typography color="error" variant="caption" sx={{ display: "block", mb: 0.5 }}>
            {validationErrors["mockTrial.motorDimensions"]}
          </Typography>
        ) : null}
        <TableContainer sx={{ ...casingTheme.tableContainer, mt: 1, overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow>
                <TableCell
                  rowSpan={2}
                  sx={{ ...theme.workflow.formElements.tableHeader, width: 64 }}
                >
                  {S.MOCK_TRIAL_COL_SR}
                </TableCell>
                {MOTOR_DIM_KEYS.map((key) => (
                  <TableCell key={key} rowSpan={2} sx={theme.workflow.formElements.tableHeader}>
                    {motorDimLabels[key]}
                    {mockTrialMotorDimRequired(key) ? <RequiredMark theme={theme} /> : null}
                  </TableCell>
                ))}
                <TableCell
                  colSpan={MOTOR_LENGTH_KEYS.length}
                  align="center"
                  sx={theme.workflow.formElements.tableHeader}
                >
                  {S.MOCK_TRIAL_MOTOR_LENGTH}
                </TableCell>
                <TableCell
                  rowSpan={2}
                  sx={{ ...theme.workflow.formElements.tableHeader, width: 44 }}
                />
              </TableRow>
              <TableRow>
                {MOTOR_LENGTH_KEYS.map((key) => (
                  <TableCell key={key} sx={theme.workflow.formElements.tableHeader}>
                    {motorLengthLabels[key]}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {value.motorDimensions.map((row, index) => (
                <TableRow
                  key={`motor-dim-${row.srNo}-${index}`}
                  sx={casingTheme.dataRow(index % 2 === 0)}
                >
                  <TableCell sx={theme.workflow.formElements.tableCell}>{row.srNo}</TableCell>
                  {[...MOTOR_DIM_KEYS, ...MOTOR_LENGTH_KEYS].map((key) => (
                    <TableCell key={key} sx={theme.workflow.formElements.tableCell}>
                      <TextField
                        size="small"
                        fullWidth
                        value={row[key]}
                        onChange={(e) => updateMotorDimension(index, key, e.target.value)}
                        disabled={disabled}
                        error={Boolean(validationErrors[`mockTrial.motorDimensions.${index}.${key}`])}
                        helperText={validationErrors[`mockTrial.motorDimensions.${index}.${key}`]}
                        inputProps={{ inputMode: "decimal" }}
                        sx={cellFieldSx}
                      />
                    </TableCell>
                  ))}
                  <TableCell sx={theme.workflow.formElements.tableCell}>
                    {value.motorDimensions.length > 1 ? (
                      <IconButton
                        size="small"
                        disabled={disabled}
                        onClick={() =>
                          patch({
                            motorDimensions: value.motorDimensions
                              .filter((_, i) => i !== index)
                              .map((r, i) => ({ ...r, srNo: i + 1 })),
                          })
                        }
                        sx={{ color: theme.palette.danger, p: 0.5 }}
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
        <Stack
          direction="row"
          alignItems="center"
          gap={0.5}
          onClick={() => {
            if (disabled) return;
            patch({
              motorDimensions: [
                ...value.motorDimensions,
                createEmptyMockTrialMotorDimensionRow(value.motorDimensions.length + 1),
              ],
            });
          }}
          sx={addRowSx}
        >
          <AddRoundedIcon sx={{ fontSize: 15 }} />
          {S.MOCK_TRIAL_ADD_MOTOR_DIM_ROW}
        </Stack>
      </Box>

      <Box sx={{ mt: 2.5 }}>
        <SubsectionTitle cf={cf}>{S.MOCK_TRIAL_MANDREL_ASSEMBLY}</SubsectionTitle>
        {validationErrors["mockTrial.mandrelAssemblyMeasurements"] ? (
          <Typography color="error" variant="caption" sx={{ display: "block", mb: 0.5 }}>
            {validationErrors["mockTrial.mandrelAssemblyMeasurements"]}
          </Typography>
        ) : null}
        <TableContainer sx={{ ...casingTheme.tableContainer, mt: 1, overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...theme.workflow.formElements.tableHeader, width: 64 }}>
                  {S.MOCK_TRIAL_COL_SR}
                </TableCell>
                {MANDREL_A_B_KEYS.map((key) => (
                  <TableCell key={key} sx={theme.workflow.formElements.tableHeader}>
                    {mandrelLabels[key]}
                    <RequiredMark theme={theme} />
                  </TableCell>
                ))}
                <TableCell sx={theme.workflow.formElements.tableHeader}>
                  {S.MOCK_TRIAL_COL_DIFF_C}
                </TableCell>
                <TableCell sx={theme.workflow.formElements.tableHeader}>
                  {S.MOCK_TRIAL_COL_BELLOW_D}
                  <RequiredMark theme={theme} />
                </TableCell>
                <TableCell sx={theme.workflow.formElements.tableHeader}>
                  {S.MOCK_TRIAL_COL_LIFT_E}
                </TableCell>
                <TableCell sx={{ ...theme.workflow.formElements.tableHeader, width: 44 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {value.mandrelAssemblyMeasurements.map((row, index) => {
                const differenceC = computeMockTrialDifferenceC(row);
                const mandrelLiftE = computeMockTrialMandrelLiftE(row);
                return (
                  <TableRow
                    key={`mandrel-${row.srNo}-${index}`}
                    sx={casingTheme.dataRow(index % 2 === 0)}
                  >
                    <TableCell sx={theme.workflow.formElements.tableCell}>{row.srNo}</TableCell>
                    {MANDREL_A_B_KEYS.map((key) => (
                      <TableCell key={key} sx={theme.workflow.formElements.tableCell}>
                        <TextField
                          size="small"
                          fullWidth
                          value={row[key]}
                          onChange={(e) => updateMandrelRow(index, key, e.target.value)}
                          disabled={disabled}
                          error={Boolean(validationErrors[`mockTrial.mandrelAssemblyMeasurements.${index}.${key}`])}
                          helperText={validationErrors[`mockTrial.mandrelAssemblyMeasurements.${index}.${key}`]}
                          inputProps={{ inputMode: "decimal" }}
                          sx={cellFieldSx}
                        />
                      </TableCell>
                    ))}
                    <TableCell sx={theme.workflow.formElements.tableCell}>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                        {differenceC || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={theme.workflow.formElements.tableCell}>
                      <TextField
                        size="small"
                        fullWidth
                        value={row.bellowThicknessD}
                        onChange={(e) =>
                          updateMandrelRow(index, "bellowThicknessD", e.target.value)
                        }
                        disabled={disabled}
                        error={Boolean(validationErrors[`mockTrial.mandrelAssemblyMeasurements.${index}.bellowThicknessD`])}
                        helperText={validationErrors[`mockTrial.mandrelAssemblyMeasurements.${index}.bellowThicknessD`]}
                        inputProps={{ inputMode: "decimal" }}
                        sx={cellFieldSx}
                      />
                    </TableCell>
                    <TableCell sx={theme.workflow.formElements.tableCell}>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                        {mandrelLiftE || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={theme.workflow.formElements.tableCell}>
                      {value.mandrelAssemblyMeasurements.length > 1 ? (
                        <IconButton
                          size="small"
                          disabled={disabled}
                          onClick={() =>
                            patch({
                              mandrelAssemblyMeasurements: value.mandrelAssemblyMeasurements
                                .filter((_, i) => i !== index)
                                .map((r, i) => ({ ...r, srNo: i + 1 })),
                            })
                          }
                          sx={{ color: theme.palette.danger, p: 0.5 }}
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
        <Stack
          direction="row"
          alignItems="center"
          gap={0.5}
          onClick={() => {
            if (disabled) return;
            patch({
              mandrelAssemblyMeasurements: [
                ...value.mandrelAssemblyMeasurements,
                createEmptyMockTrialMandrelAssemblyRow(
                  value.mandrelAssemblyMeasurements.length + 1,
                ),
              ],
            });
          }}
          sx={addRowSx}
        >
          <AddRoundedIcon sx={{ fontSize: 15 }} />
          {S.MOCK_TRIAL_ADD_MANDREL_ROW}
        </Stack>
      </Box>
    </Box>
  );
};

export default RocketMotorCasingMockTrialPanel;
