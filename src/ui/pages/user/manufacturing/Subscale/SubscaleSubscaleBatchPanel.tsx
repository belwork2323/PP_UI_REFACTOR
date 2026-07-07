import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FormInput from "../../../../components/common/FormInput";
import { STRINGS } from "../../../../../app/config/strings";
import { SUBSCALE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/subscale_theme";
import {
  SUBSCALE_BATCH_FIELDS,
  SUBSCALE_MIXER_BLDG_OPTIONS,
  SUBSCALE_MOTOR_STAGE_OPTIONS,
  buildSubscaleProcessParticulars,
  createSubscaleMixingCycleEntry,
  isSubscaleGeneralBatchComplete,
  mergeSubscaleBatchFormValues,
  normalizeSubscaleMixingCycles,
  type SubscaleMixingCycleEntry,
  type SubscaleProcessParticularRow,
} from "../../../../../hooks/user/manufacturing/subscaleBatchConfig";
import type { SchemaFormValues } from "../../../../../schema-engine";
import SubscaleHardwareArticlePanel from "./SubscaleHardwareArticlePanel";
import { sectionCardSx, sectionHeaderSx } from "./SubscaleHardwareArticlePanel";

const S = STRINGS.MANUFACTURING.SUBSCALE.BATCH_SETUP;
const PROCESS_S = STRINGS.MANUFACTURING.MIXING;

type SubscaleSubscaleBatchPanelProps = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
};

const SubscaleSubscaleBatchPanel = ({ values, onChange }: SubscaleSubscaleBatchPanelProps) => {
  const generalComplete = isSubscaleGeneralBatchComplete(values);
  const mixingCycles = normalizeSubscaleMixingCycles(values[SUBSCALE_BATCH_FIELDS.MIXING_CYCLES]);

  const patchValues = (patch: SchemaFormValues) => {
    onChange(mergeSubscaleBatchFormValues({ ...values, ...patch }));
  };

  const updateMixingCycles = (cycles: SubscaleMixingCycleEntry[]) => {
    patchValues({ [SUBSCALE_BATCH_FIELDS.MIXING_CYCLES]: cycles });
  };

  const updateCycleStage = (index: number, stage: string) => {
    const next = mixingCycles.map((cycle, cycleIndex) =>
      cycleIndex === index
        ? { ...cycle, stage, processParticulars: buildSubscaleProcessParticulars(stage) }
        : cycle,
    );
    updateMixingCycles(next);
  };

  const updateProcessField = (
    cycleIndex: number,
    rowIndex: number,
    field: keyof SubscaleProcessParticularRow,
    raw: string,
  ) => {
    const next = mixingCycles.map((cycle, index) => {
      if (index !== cycleIndex) return cycle;
      const processParticulars = cycle.processParticulars.map((row, rIndex) =>
        rIndex === rowIndex ? { ...row, [field]: raw } : row,
      );
      return { ...cycle, processParticulars };
    });
    updateMixingCycles(next);
  };

  const addMixingCycle = () => {
    updateMixingCycles([
      ...mixingCycles,
      createSubscaleMixingCycleEntry(mixingCycles.length + 1),
    ]);
  };

  const removeMixingCycle = (index: number) => {
    if (mixingCycles.length <= 1) return;
    updateMixingCycles(mixingCycles.filter((_, cycleIndex) => cycleIndex !== index));
  };

  return (
    <Stack spacing={2.5} sx={{ mb: 3 }}>
      <Box sx={sectionCardSx}>
        <Box sx={sectionHeaderSx}>
          <InfoOutlinedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.02em" }}>
            {S.GENERAL_TITLE}
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
          <FormInput
            label={S.BATCH_SIZE}
            type="number"
            value={values[SUBSCALE_BATCH_FIELDS.BATCH_SIZE] ?? ""}
            onChange={(event) => patchValues({ [SUBSCALE_BATCH_FIELDS.BATCH_SIZE]: event.target.value })}
          />
          <FormInput
            select
            label={S.MIXER_BLDG_NO}
            value={values[SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO] ?? ""}
            onChange={(event) =>
              patchValues({ [SUBSCALE_BATCH_FIELDS.MIXER_BLDG_NO]: event.target.value })
            }
          >
            <MenuItem value="">—</MenuItem>
            {SUBSCALE_MIXER_BLDG_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </FormInput>
          <FormInput
            label={S.PREMIX_DATE}
            type="date"
            InputLabelProps={{ shrink: true }}
            value={values[SUBSCALE_BATCH_FIELDS.PREMIX_DATE] ?? ""}
            onChange={(event) =>
              patchValues({ [SUBSCALE_BATCH_FIELDS.PREMIX_DATE]: event.target.value })
            }
          />
          <FormInput
            label={S.FINAL_MIX_DATE}
            type="date"
            InputLabelProps={{ shrink: true }}
            value={values[SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE] ?? ""}
            onChange={(event) =>
              patchValues({ [SUBSCALE_BATCH_FIELDS.FINAL_MIX_DATE]: event.target.value })
            }
          />
        </Box>

        <Box sx={{ px: 2, pb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: SUBSCALE_BRAND.text }}>
                {S.MIXING_CYCLE_TITLE}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: SUBSCALE_BRAND.textSub }}>
                {S.MIXING_CYCLE_HINT}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddRoundedIcon />}
              onClick={addMixingCycle}
              sx={{ borderColor: SUBSCALE_BRAND.ss, color: SUBSCALE_BRAND.ss }}
            >
              {S.ADD_MIXING_CYCLE}
            </Button>
          </Stack>

          <Stack spacing={2}>
            {mixingCycles.map((cycle, cycleIndex) => (
              <Box
                key={cycle._key}
                sx={{
                  border: `1px solid ${SUBSCALE_BRAND.border}`,
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ px: 1.5, py: 1, background: "rgba(21,101,192,0.06)" }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: SUBSCALE_BRAND.text }}>
                    {S.MIXING_CYCLE_LABEL.replace("{index}", String(cycleIndex + 1))}
                  </Typography>
                  {mixingCycles.length > 1 ? (
                    <IconButton size="small" onClick={() => removeMixingCycle(cycleIndex)}>
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </Stack>
                <Box sx={{ p: 1.5 }}>
                  <FormInput
                    select
                    label={S.MIXING_CYCLE_STAGE}
                    value={cycle.stage}
                    onChange={(event) => updateCycleStage(cycleIndex, event.target.value)}
                    sx={{ mb: 1.5, maxWidth: 280 }}
                  >
                    <MenuItem value="">—</MenuItem>
                    {SUBSCALE_MOTOR_STAGE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </FormInput>

                  <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: SUBSCALE_BRAND.text, mb: 1 }}>
                    {PROCESS_S.SECTION_PROCESS_PARTICULARS}
                  </Typography>
                  <TableContainer sx={{ border: `1px solid ${SUBSCALE_BRAND.border}`, borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ background: "rgba(21,101,192,0.08)" }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem" }}>
                            {PROCESS_S.COL_OPERATION}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem" }}>
                            {PROCESS_S.COL_ROTATION}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem" }}>
                            {PROCESS_S.COL_TIME}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem" }}>
                            {PROCESS_S.COL_TEMP}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem" }}>
                            {PROCESS_S.COL_VACUUM}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cycle.processParticulars.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5}>
                              <Typography sx={{ fontSize: "0.75rem", color: SUBSCALE_BRAND.textSub, py: 1.5 }}>
                                {S.PROCESS_PARTICULARS_EMPTY}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          cycle.processParticulars.map((row, rowIndex) => (
                            <TableRow key={row.id}>
                              <TableCell sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{row.operation}</TableCell>
                              <TableCell>
                                <FormInput
                                  value={row.rpm}
                                  onChange={(event) =>
                                    updateProcessField(cycleIndex, rowIndex, "rpm", event.target.value)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <FormInput
                                  value={row.time}
                                  onChange={(event) =>
                                    updateProcessField(cycleIndex, rowIndex, "time", event.target.value)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <FormInput
                                  value={row.temp}
                                  onChange={(event) =>
                                    updateProcessField(cycleIndex, rowIndex, "temp", event.target.value)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <FormInput
                                  value={row.vacuum}
                                  onChange={(event) =>
                                    updateProcessField(cycleIndex, rowIndex, "vacuum", event.target.value)
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>

      <SubscaleHardwareArticlePanel
        values={values}
        onChange={onChange}
        hardwareFieldsDisabled={!generalComplete}
      />
    </Stack>
  );
};

export default SubscaleSubscaleBatchPanel;
