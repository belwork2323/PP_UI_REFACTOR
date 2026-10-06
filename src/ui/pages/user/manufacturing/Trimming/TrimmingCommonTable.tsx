import { FieldLabelWithAsterisk } from "@/ui/components/common/FieldLabelWithAsterisk";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  MenuItem,
  TextField,
  alpha,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import FormInput from "@/ui/components/common/FormInput";
import DateField from "@/ui/components/common/DateField";
import { STRINGS } from "../../../../../app/config/strings";
import { TRIMMING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/trimming_theme";
import {
  uniformTableBodyCellSx,
  uniformTableHeaderCellSx,
} from "../../../../../app/theme/custom_themes/shared/data_table_theme";
import TrimmingFileField from "./TrimmingFileField";
import QCDivisionFileField from "../../qualityControl/QCDivision/QCDivisionFileField";
import FieldErrorText from "@/ui/components/validation/FieldErrorText";
import type { ValidationErrors } from "@/data/validation/adapters/trimming.validation";
import { fieldError } from "@/data/validation/adapters/trimming.validation";
import { generalController } from "../../../../../controllers/admin/common/generalController";
import { NDT_EQUIPMENT_OPTIONS } from "../../../../../hooks/user/qualityControl/ndtFlowConfig";

const S = STRINGS.MANUFACTURING.TRIMMING;

/** Sentinel select value — free-text is stored in `machineDetails`. */
const MACHINE_DETAILS_OTHER = "OTHER";

type MachineEquipmentOption = { value: string; label: string };

const mapEquipmentListToOptions = (rows: unknown[]): MachineEquipmentOption[] =>
  rows
    .map((item) => {
      const rec = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const name = String(rec.equipmentName ?? rec.name ?? "").trim();
      const code = String(rec.equipmentCode ?? rec.code ?? "").trim();
      const label = name || code;
      return label ? { value: label, label } : null;
    })
    .filter(Boolean) as MachineEquipmentOption[];

const fallbackEquipmentOptions = (): MachineEquipmentOption[] =>
  NDT_EQUIPMENT_OPTIONS.map((label) => ({ value: label, label }));

const sectionTitleSx = (color: string) => ({
  fontWeight: 700,
  fontSize: "0.8rem",
  color,
});

const actionButtonSx = (primary: string) => ({
  fontWeight: 700,
  textTransform: "none" as const,
  borderColor: alpha(primary, 0.4),
  color: primary,
  "&:hover": {
    borderColor: primary,
    background: alpha(primary, 0.04),
  },
});

/** `fileSubDeptSlug` defaults to manufacturing `trimming`; QC Division passes `qc-division`. */
export const TrimmingCommonTable = ({
  activeMotorSession,
  activeMotorEntry,
  onMotorSessionChange,
  readOnly = false,
  disabled = false,
  allowStructureActions = true,
  theme,
  fileSubDeptSlug = "trimming",
  /** When true, use shared QC eager FileRef field (same as hardware / revalidation). */
  useQcDivisionFileField = false,
  validationErrors,
}: {
  activeMotorSession: any;
  activeMotorEntry: { motorId: string; motorStage?: string };
  onMotorSessionChange: (motorId: string, next: any) => void;
  readOnly?: boolean;
  disabled?: boolean;
  allowStructureActions?: boolean;
  theme?: any;
  fileSubDeptSlug?: string;
  useQcDivisionFileField?: boolean;
  validationErrors?: ValidationErrors;
}) => {
  const palette = theme?.palette ?? {};
  const colors = useMemo(
    () => ({
      primary: palette.primary ?? TRIMMING_BRAND.primary,
      primaryLight: palette.primaryLight ?? TRIMMING_BRAND.primaryLight,
      border: palette.border ?? TRIMMING_BRAND.border,
      surface: palette.surface ?? TRIMMING_BRAND.surface,
      text: palette.text ?? TRIMMING_BRAND.text,
      textSub: palette.textSub ?? TRIMMING_BRAND.textSub,
      danger: palette.danger ?? TRIMMING_BRAND.danger,
      pageBg: palette.pageBg ?? "#fff",
    }),
    [palette],
  );

  const inputsLocked = Boolean(readOnly || disabled);
  const err = (path: string) => fieldError(validationErrors, path);
  const showStructureActions = Boolean(allowStructureActions && !inputsLocked);

  const sectionCardSx = {
    borderRadius: 2.5,
    border: `1px solid ${colors.border}`,
    background: colors.pageBg,
    overflow: "hidden",
    mb: 2,
  };

  const sectionHeaderSx = {
    px: 1.5,
    py: 1.1,
    borderBottom: `1px solid ${alpha(colors.border, 0.9)}`,
    background: alpha(colors.primary, readOnly ? 0.06 : 0.04),
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 1,
  };

  const sectionTitleStyle = readOnly
    ? {
        fontWeight: 800,
        fontSize: "0.72rem",
        letterSpacing: "0.02em",
        textTransform: "uppercase" as const,
        color: colors.primary,
      }
    : sectionTitleSx(colors.primary);

  const thSx = readOnly
    ? {
        ...uniformTableHeaderCellSx(colors.primary, colors.primaryLight, {
          headerFontSize: "0.65rem",
          headerLetterSpacing: "0.02em",
          headerPaddingY: 0.5,
          headerPaddingX: 1,
        }),
      }
    : uniformTableHeaderCellSx(colors.primary, colors.primaryLight, {
        headerFontSize: "0.68rem",
        headerLetterSpacing: "0.06em",
        headerPaddingY: "10px",
        headerPaddingX: "12px",
      });

  const tdSx = readOnly
    ? uniformTableBodyCellSx(
        { border: colors.border, text: colors.text },
        {
          bodyFontSize: "0.72rem",
          bodyPaddingY: 0.5,
          bodyPaddingX: 1,
        },
      )
    : uniformTableBodyCellSx(
        { border: colors.border, text: colors.text },
        {
          bodyPaddingY: "8px",
          bodyPaddingX: "10px",
        },
      );

  const tableShellSx = {
    border: `1px solid ${alpha(colors.primary, readOnly ? 0.12 : 0.18)}`,
    borderRadius: readOnly ? 1 : 2,
    background: colors.pageBg,
    overflowX: "auto",
  };

  const displayValue = (value: unknown) => {
    const text = String(value ?? "").trim();
    return text || "—";
  };

  const ReadOnlyValue = ({ value }: { value: unknown }) => (
    <Typography
      sx={{
        fontSize: "0.72rem",
        fontWeight: String(value ?? "").trim() ? 600 : 500,
        color: String(value ?? "").trim() ? colors.text : colors.textSub,
        lineHeight: 1.35,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {displayValue(value)}
    </Typography>
  );

  const dynamicLocations = activeMotorSession.commonFormatLocations ?? [];
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColInput, setNewColInput] = useState("");
  const [equipmentOptions, setEquipmentOptions] = useState<MachineEquipmentOption[]>(
    fallbackEquipmentOptions,
  );
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  /** Row indexes where user chose "Other" (keeps select on Other even if text is empty). */
  const [machineOtherModeByRow, setMachineOtherModeByRow] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    const loadEquipment = async () => {
      setEquipmentLoading(true);
      try {
        const response = await generalController.getEquipmentList();
        if (cancelled) return;
        if (!response?.success || !Array.isArray(response.data) || response.data.length === 0) {
          setEquipmentOptions(fallbackEquipmentOptions());
          return;
        }
        const mapped = mapEquipmentListToOptions(response.data);
        setEquipmentOptions(mapped.length ? mapped : fallbackEquipmentOptions());
      } catch {
        if (!cancelled) setEquipmentOptions(fallbackEquipmentOptions());
      } finally {
        if (!cancelled) setEquipmentLoading(false);
      }
    };
    void loadEquipment();
    return () => {
      cancelled = true;
    };
  }, []);

  // Reset Other-mode flags when switching motors (row indexes are per-session).
  useEffect(() => {
    setMachineOtherModeByRow({});
  }, [activeMotorEntry.motorId]);

  const machineSelectOptions = useMemo(
    () => [
      ...equipmentOptions,
      { value: MACHINE_DETAILS_OTHER, label: "Other" },
    ],
    [equipmentOptions],
  );

  const isMachineOtherMode = (rowIndex: number, stored: string): boolean => {
    if (machineOtherModeByRow[rowIndex]) return true;
    const text = String(stored ?? "").trim();
    if (!text) return false;
    return !equipmentOptions.some((opt) => opt.value === text);
  };

  const resolveMachineSelectValue = (rowIndex: number, stored: string): string => {
    if (isMachineOtherMode(rowIndex, stored)) return MACHINE_DETAILS_OTHER;
    return String(stored ?? "").trim();
  };

  const patchTrimmingDetailRow = (rowIndex: number, patch: Record<string, unknown>) => {
    const nextRows = [...(activeMotorSession.trimmingDetails ?? [])];
    nextRows[rowIndex] = { ...nextRows[rowIndex], ...patch };
    onMotorSessionChange(activeMotorEntry.motorId, {
      ...activeMotorSession,
      trimmingDetails: nextRows,
    });
  };

  // --- Handlers for Dynamic Columns ---
  const handleSaveNewColumn = () => {
    if (!showStructureActions) return;
    const formattedColName = newColInput.trim().toUpperCase();
    if (!formattedColName) {
      setIsAddingColumn(false);
      return;
    }

    if (dynamicLocations.includes(formattedColName)) {
      alert(`Column "${formattedColName}" already exists!`);
      setNewColInput("");
      return;
    }

    const updatedLocations = [...dynamicLocations, formattedColName];
    const updatedParams = (activeMotorSession.commonFormatParameters ?? []).map((param) => ({
      ...param,
      stages: param.stages.map((stage) => ({
        ...stage,
        readings: {
          ...stage.readings,
          [formattedColName]: "",
        },
      })),
    }));

    onMotorSessionChange(activeMotorEntry.motorId, {
      ...activeMotorSession,
      commonFormatLocations: updatedLocations,
      commonFormatParameters: updatedParams,
    });

    setNewColInput("");
    setIsAddingColumn(false);
  };

  const handleDeleteColumn = (colToDelete) => {
    if (!showStructureActions) return;
    const updatedLocations = dynamicLocations.filter((loc) => loc !== colToDelete);
    const updatedParams = (activeMotorSession.commonFormatParameters ?? []).map((param) => ({
      ...param,
      stages: param.stages.map((stage) => {
        const nextReadings = { ...stage.readings };
        delete nextReadings[colToDelete];
        return { ...stage, readings: nextReadings };
      }),
    }));

    onMotorSessionChange(activeMotorEntry.motorId, {
      ...activeMotorSession,
      commonFormatLocations: updatedLocations,
      commonFormatParameters: updatedParams,
    });
  };

  // --- Handlers for Rows & Parameters ---
  const handleDeleteTrimmingRow = (rowIndex) => {
    if (!showStructureActions) return;
    const nextRows = [...(activeMotorSession.trimmingDetails ?? [])];
    nextRows.splice(rowIndex, 1);
    setMachineOtherModeByRow((prev) => {
      const next: Record<number, boolean> = {};
      Object.entries(prev).forEach(([key, enabled]) => {
        const index = Number(key);
        if (!Number.isFinite(index) || index === rowIndex || !enabled) return;
        next[index > rowIndex ? index - 1 : index] = true;
      });
      return next;
    });
    onMotorSessionChange(activeMotorEntry.motorId, {
      ...activeMotorSession,
      trimmingDetails: nextRows,
    });
  };

  // Deletes the entire parameter (including both before & after trimming stages)
  const handleDeleteParameter = (paramIndex) => {
    if (!showStructureActions) return;
    const currentParams = [...(activeMotorSession.commonFormatParameters ?? [])];
    currentParams.splice(paramIndex, 1);

    onMotorSessionChange(activeMotorEntry.motorId, {
      ...activeMotorSession,
      commonFormatParameters: currentParams,
    });
  };

  return (
    <Box
      sx={{
        // Waiting / locked (not approved details theme): soft-disable interactions.
        ...(disabled && !readOnly
          ? {
              pointerEvents: "none",
              userSelect: "none",
              opacity: 0.92,
            }
          : null),
      }}
    >
      <Box sx={sectionCardSx}>
        <Box sx={sectionHeaderSx}>
          <Typography sx={sectionTitleStyle} component="div">
            <FieldLabelWithAsterisk
              label={S.MOTOR_RECEIVED_AT_LABEL}
              required
              sx={{ fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }}
            />
          </Typography>
        </Box>
        <Box sx={{ p: 1.5, maxWidth: 320 }}>
          {readOnly ? (
            <ReadOnlyValue value={activeMotorSession.motorReceivedAt} />
          ) : (
            <Box data-qc-field="motorReceivedAt">
              <DateField
                value={activeMotorSession.motorReceivedAt ?? ""}
                onChange={(value) =>
                  onMotorSessionChange(activeMotorEntry.motorId, {
                    ...activeMotorSession,
                    motorReceivedAt: value,
                  })
                }
                placeholder={S.MOTOR_RECEIVED_AT_PLACEHOLDER}
                compact
                disabled={inputsLocked}
                error={Boolean(err("motorReceivedAt"))}
              />
              <FieldErrorText message={err("motorReceivedAt")} />
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={sectionCardSx}>
        <Box sx={sectionHeaderSx}>
          <Typography sx={sectionTitleStyle}>Trimming Details</Typography>
        </Box>

        <Box sx={{ p: 1.5 }}>
          <TableContainer sx={{ ...tableShellSx, mb: 1.5 }}>
            <Table size="small" sx={{ borderCollapse: "collapse", minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={thSx}><FieldLabelWithAsterisk label="Machine Details" required sx={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }} /></TableCell>
                  <TableCell sx={thSx}><FieldLabelWithAsterisk label="Start Date" required sx={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }} /></TableCell>
                  <TableCell sx={thSx}><FieldLabelWithAsterisk label="Completion Date" required sx={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }} /></TableCell>
                  <TableCell sx={thSx}><FieldLabelWithAsterisk label="Arbor Size" required sx={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }} /></TableCell>
                  <TableCell sx={thSx}><FieldLabelWithAsterisk label="Cutter Size" required sx={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }} /></TableCell>
                  <TableCell sx={thSx}>Remarks</TableCell>
                  {showStructureActions ? (
                    <TableCell align="center" sx={{ ...thSx, width: 50 }}>
                      Actions
                    </TableCell>
                  ) : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {(activeMotorSession.trimmingDetails ?? []).map((row, rowIndex) => (
                  <TableRow
                    key={`detail-row-${rowIndex}`}
                    sx={{
                      background: rowIndex % 2 === 0 ? colors.pageBg : alpha(colors.surface, 0.7),
                    }}
                  >
                    <TableCell sx={{ ...tdSx, minWidth: 180 }}>
                      {readOnly ? (
                        <ReadOnlyValue value={row.machineDetails} />
                      ) : (
                        <Stack
                          spacing={0.75}
                          data-qc-field={`trimmingDetails.${rowIndex}.machineDetails`}
                        >
                          <TextField
                            select
                            fullWidth
                            size="small"
                            value={resolveMachineSelectValue(rowIndex, row.machineDetails)}
                            disabled={inputsLocked || equipmentLoading}
                            error={Boolean(err(`trimmingDetails.${rowIndex}.machineDetails`))}
                            onChange={(e) => {
                              const next = String(e.target.value ?? "");
                              if (next === MACHINE_DETAILS_OTHER) {
                                const current = String(row.machineDetails ?? "").trim();
                                const isKnown = equipmentOptions.some((opt) => opt.value === current);
                                setMachineOtherModeByRow((prev) => ({ ...prev, [rowIndex]: true }));
                                patchTrimmingDetailRow(rowIndex, {
                                  machineDetails: isKnown ? "" : current,
                                });
                                return;
                              }
                              setMachineOtherModeByRow((prev) => ({ ...prev, [rowIndex]: false }));
                              patchTrimmingDetailRow(rowIndex, { machineDetails: next });
                            }}
                            SelectProps={{ displayEmpty: true }}
                            sx={{
                              "& .MuiInputBase-input": { fontSize: "0.82rem", py: 0.75 },
                            }}
                          >
                            <MenuItem value="" disabled>
                              <em>{equipmentLoading ? "Loading…" : "Select machine"}</em>
                            </MenuItem>
                            {machineSelectOptions.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </TextField>
                          {isMachineOtherMode(rowIndex, row.machineDetails) ? (
                            <FormInput
                              value={row.machineDetails}
                              size="small"
                              placeholder="Enter machine details"
                              error={Boolean(err(`trimmingDetails.${rowIndex}.machineDetails`))}
                              onChange={(e) =>
                                patchTrimmingDetailRow(rowIndex, {
                                  machineDetails: e.target.value,
                                })
                              }
                              disabled={inputsLocked}
                            />
                          ) : null}
                          <FieldErrorText
                            message={err(`trimmingDetails.${rowIndex}.machineDetails`)}
                          />
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell sx={tdSx}>
                      {readOnly ? (
                        <ReadOnlyValue value={row.startDate} />
                      ) : (
                        <Box data-qc-field={`trimmingDetails.${rowIndex}.startDate`}>
                          <DateField
                            value={row.startDate}
                            compact
                            error={Boolean(err(`trimmingDetails.${rowIndex}.startDate`))}
                            onChange={(val) => {
                              const nextRows = [...(activeMotorSession.trimmingDetails ?? [])];
                              nextRows[rowIndex] = { ...nextRows[rowIndex], startDate: val };
                              onMotorSessionChange(activeMotorEntry.motorId, {
                                ...activeMotorSession,
                                trimmingDetails: nextRows,
                              });
                            }}
                            disabled={inputsLocked}
                          />
                          <FieldErrorText message={err(`trimmingDetails.${rowIndex}.startDate`)} />
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={tdSx}>
                      {readOnly ? (
                        <ReadOnlyValue value={row.completionDate} />
                      ) : (
                        <Box data-qc-field={`trimmingDetails.${rowIndex}.completionDate`}>
                          <DateField
                            value={row.completionDate}
                            compact
                            error={Boolean(err(`trimmingDetails.${rowIndex}.completionDate`))}
                            onChange={(val) => {
                              const nextRows = [...(activeMotorSession.trimmingDetails ?? [])];
                              nextRows[rowIndex] = { ...nextRows[rowIndex], completionDate: val };
                              onMotorSessionChange(activeMotorEntry.motorId, {
                                ...activeMotorSession,
                                trimmingDetails: nextRows,
                              });
                            }}
                            disabled={inputsLocked}
                          />
                          <FieldErrorText
                            message={err(`trimmingDetails.${rowIndex}.completionDate`)}
                          />
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={tdSx}>
                      {readOnly ? (
                        <ReadOnlyValue value={row.arborSize} />
                      ) : (
                        <Box data-qc-field={`trimmingDetails.${rowIndex}.arborSize`}>
                          <FormInput
                            value={row.arborSize}
                            inputMode="decimal"
                            error={Boolean(err(`trimmingDetails.${rowIndex}.arborSize`))}
                            onChange={(e) => {
                              const nextRows = [...(activeMotorSession.trimmingDetails ?? [])];
                              nextRows[rowIndex] = {
                                ...nextRows[rowIndex],
                                arborSize: e.target.value,
                              };
                              onMotorSessionChange(activeMotorEntry.motorId, {
                                ...activeMotorSession,
                                trimmingDetails: nextRows,
                              });
                            }}
                            disabled={inputsLocked}
                          />
                          <FieldErrorText message={err(`trimmingDetails.${rowIndex}.arborSize`)} />
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={tdSx}>
                      {readOnly ? (
                        <ReadOnlyValue value={row.cutterSize} />
                      ) : (
                        <Box data-qc-field={`trimmingDetails.${rowIndex}.cutterSize`}>
                          <FormInput
                            value={row.cutterSize}
                            inputMode="decimal"
                            error={Boolean(err(`trimmingDetails.${rowIndex}.cutterSize`))}
                            onChange={(e) => {
                              const nextRows = [...(activeMotorSession.trimmingDetails ?? [])];
                              nextRows[rowIndex] = {
                                ...nextRows[rowIndex],
                                cutterSize: e.target.value,
                              };
                              onMotorSessionChange(activeMotorEntry.motorId, {
                                ...activeMotorSession,
                                trimmingDetails: nextRows,
                              });
                            }}
                            disabled={inputsLocked}
                          />
                          <FieldErrorText message={err(`trimmingDetails.${rowIndex}.cutterSize`)} />
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={tdSx}>
                      {readOnly ? (
                        <ReadOnlyValue value={row.remarks} />
                      ) : (
                        <Box data-qc-field={`trimmingDetails.${rowIndex}.remarks`}>
                          <FormInput
                            value={row.remarks}
                            size="small"
                            error={Boolean(err(`trimmingDetails.${rowIndex}.remarks`))}
                            onChange={(e) => {
                              const nextRows = [...(activeMotorSession.trimmingDetails ?? [])];
                              nextRows[rowIndex] = { ...nextRows[rowIndex], remarks: e.target.value };
                              onMotorSessionChange(activeMotorEntry.motorId, {
                                ...activeMotorSession,
                                trimmingDetails: nextRows,
                              });
                            }}
                            disabled={inputsLocked}
                          />
                          <FieldErrorText message={err(`trimmingDetails.${rowIndex}.remarks`)} />
                        </Box>
                      )}
                    </TableCell>
                    {showStructureActions ? (
                      <TableCell align="center" sx={tdSx}>
                        {rowIndex > 0 && (
                          <IconButton
                            size="small"
                            sx={{ color: colors.danger }}
                            onClick={() => handleDeleteTrimmingRow(rowIndex)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {showStructureActions ? (
            <Stack direction="row" justifyContent="flex-start">
              <Button
                variant="outlined"
                size="small"
                sx={actionButtonSx(colors.primary)}
                onClick={() => {
                  const details = activeMotorSession.trimmingDetails ?? [];
                  onMotorSessionChange(activeMotorEntry.motorId, {
                    ...activeMotorSession,
                    trimmingDetails: [
                      ...details,
                      {
                        machineDetails: "",
                        startDate: "",
                        completionDate: "",
                        arborSize: "",
                        cutterSize: "",
                        remarks: "",
                      },
                    ],
                  });
                }}
              >
                Add row
              </Button>
            </Stack>
          ) : null}
        </Box>
      </Box>

      <Box sx={sectionCardSx}>
        <Box sx={sectionHeaderSx}>
          <Typography sx={sectionTitleStyle}>Dimensions After Trimming</Typography>
          {showStructureActions ? (
            <Button
              variant="contained"
              size="small"
              disableElevation
              startIcon={<AddIcon />}
              sx={{
                fontWeight: 700,
                textTransform: "none",
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                color: "#fff",
                "&:hover": {
                  background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.primary})`,
                },
              }}
              onClick={() => setIsAddingColumn(true)}
            >
              Add Column
            </Button>
          ) : null}
        </Box>

        <Box sx={{ p: 1.5 }}>
          <TableContainer sx={{ ...tableShellSx, mb: 1.5 }}>
            <Table size="small" sx={{ borderCollapse: "collapse", minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...thSx, minWidth: 160 }}>Parameter</TableCell>
                  <TableCell sx={{ ...thSx, minWidth: 110 }}>Stage</TableCell>
                  <TableCell sx={{ ...thSx, minWidth: 110 }}>Specification</TableCell>
                  <TableCell sx={{ ...thSx, minWidth: 80 }}><FieldLabelWithAsterisk label="R2T" required sx={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }} /></TableCell>
                  <TableCell sx={{ ...thSx, minWidth: 80 }}><FieldLabelWithAsterisk label="R2B" required sx={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }} /></TableCell>
                  <TableCell sx={{ ...thSx, minWidth: 80 }}><FieldLabelWithAsterisk label="R1R" required sx={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }} /></TableCell>
                  <TableCell sx={{ ...thSx, minWidth: 80 }}><FieldLabelWithAsterisk label="R1L" required sx={{ display: "inline", fontSize: "inherit", fontWeight: "inherit", color: "inherit", mb: 0 }} /></TableCell>
                  {dynamicLocations.map((loc) => (
                    <TableCell key={`col-head-${loc}`} sx={{ ...thSx, minWidth: 100 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <span>{loc}</span>
                        {showStructureActions ? (
                          <IconButton
                            size="small"
                            sx={{ color: "#fff", p: 0.2 }}
                            onClick={() => handleDeleteColumn(loc)}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: "1rem" }} />
                          </IconButton>
                        ) : null}
                      </Stack>
                    </TableCell>
                  ))}
                  {isAddingColumn && (
                    <TableCell sx={{ ...thSx, minWidth: 120, p: "4px 8px" }}>
                      <TextField
                        autoFocus
                        size="small"
                        placeholder="NAME..."
                        value={newColInput}
                        onChange={(e) => setNewColInput(e.target.value)}
                        onBlur={handleSaveNewColumn}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveNewColumn();
                          if (e.key === "Escape") setIsAddingColumn(false);
                        }}
                        sx={{
                          bgcolor: "#fff",
                          borderRadius: 1,
                          input: {
                            color: colors.text,
                            fontSize: "0.75rem",
                            padding: "4px 8px",
                            background: "#fff",
                          },
                        }}
                      />
                    </TableCell>
                  )}
                  {showStructureActions ? (
                    <TableCell align="center" sx={{ ...thSx, width: 50 }}>
                      Actions
                    </TableCell>
                  ) : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {(activeMotorSession.commonFormatParameters ?? []).flatMap((param, paramIndex) =>
                  param.stages.map((stage, stageIndex) => (
                    <TableRow
                      key={`param-${paramIndex}-stage-${stageIndex}`}
                      sx={{
                        background:
                          paramIndex % 2 === 0 ? colors.pageBg : alpha(colors.surface, 0.7),
                      }}
                    >
                      {stageIndex === 0 ? (
                        <TableCell
                          rowSpan={param.stages.length}
                          sx={{
                            ...tdSx,
                            fontWeight: 700,
                            verticalAlign: "middle",
                            borderRight: `1px solid ${alpha(colors.border, 0.85)}`,
                          }}
                        >
                          {readOnly ? (
                        <ReadOnlyValue value={param.parameterName} />
                      ) : (
                        <FormInput
                            value={param.parameterName}
                            placeholder={param.parameterName}
                            onChange={(e) => {
                              const nextParams = [
                                ...(activeMotorSession.commonFormatParameters ?? []),
                              ];
                              nextParams[paramIndex] = {
                                ...nextParams[paramIndex],
                                parameterName: e.target.value,
                              };
                              onMotorSessionChange(activeMotorEntry.motorId, {
                                ...activeMotorSession,
                                commonFormatParameters: nextParams,
                              });
                            }}

                        disabled={inputsLocked}
                      />
                      )}
                        </TableCell>
                      ) : null}

                      <TableCell sx={tdSx}>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: colors.text }}>
                          {stage.stage === "BEFORE_TRIMMING" ||
                          stage.stageName === "Before Trimming"
                            ? "Before Trimming"
                            : "After Trimming"}
                        </Typography>
                      </TableCell>

                      <TableCell sx={tdSx}>
                        {readOnly ? (
                        <ReadOnlyValue value={stage.specification ?? ""} />
                      ) : (
                        <FormInput
                          value={stage.specification ?? ""}
                          onChange={(e) => {
                            const nextParams = [
                              ...(activeMotorSession.commonFormatParameters ?? []),
                            ];
                            nextParams[paramIndex] = {
                              ...nextParams[paramIndex],
                              stages: nextParams[paramIndex].stages.map((s, idx) =>
                                idx === stageIndex ? { ...s, specification: e.target.value } : s,
                              ),
                            };
                            onMotorSessionChange(activeMotorEntry.motorId, {
                              ...activeMotorSession,
                              commonFormatParameters: nextParams,
                            });
                          }}

                        disabled={inputsLocked}
                      />
                      )}
                      </TableCell>

                      {["R2T", "R2B", "R1R", "R1L"].map((location) => {
                        const readingPath = `commonFormatParameters.${paramIndex}.stages.${stageIndex}.readings.${location}`;
                        return (
                          <TableCell key={`reading-${location}`} sx={tdSx}>
                            {readOnly ? (
                              <ReadOnlyValue value={stage.readings[location] ?? ""} />
                            ) : (
                              <Box data-qc-field={readingPath}>
                                <FormInput
                                  value={stage.readings[location] ?? ""}
                                  inputMode="decimal"
                                  error={Boolean(err(readingPath))}
                                  onChange={(e) => {
                                    const nextParams = [
                                      ...(activeMotorSession.commonFormatParameters ?? []),
                                    ];
                                    nextParams[paramIndex] = {
                                      ...nextParams[paramIndex],
                                      stages: nextParams[paramIndex].stages.map((s, idx) =>
                                        idx === stageIndex
                                          ? {
                                              ...s,
                                              readings: {
                                                ...s.readings,
                                                [location]: e.target.value,
                                              },
                                            }
                                          : s,
                                      ),
                                    };
                                    onMotorSessionChange(activeMotorEntry.motorId, {
                                      ...activeMotorSession,
                                      commonFormatParameters: nextParams,
                                    });
                                  }}
                                  disabled={inputsLocked}
                                />
                                <FieldErrorText message={err(readingPath)} />
                              </Box>
                            )}
                          </TableCell>
                        );
                      })}

                      {dynamicLocations.map((location) => {
                        const readingPath = `commonFormatParameters.${paramIndex}.stages.${stageIndex}.readings.${location}`;
                        return (
                          <TableCell key={`reading-${location}`} sx={tdSx}>
                            {readOnly ? (
                              <ReadOnlyValue value={stage.readings[location] ?? ""} />
                            ) : (
                              <Box data-qc-field={readingPath}>
                                <FormInput
                                  value={stage.readings[location] ?? ""}
                                  inputMode="decimal"
                                  error={Boolean(err(readingPath))}
                                  onChange={(e) => {
                                    const nextParams = [
                                      ...(activeMotorSession.commonFormatParameters ?? []),
                                    ];
                                    nextParams[paramIndex] = {
                                      ...nextParams[paramIndex],
                                      stages: nextParams[paramIndex].stages.map((s, idx) =>
                                        idx === stageIndex
                                          ? {
                                              ...s,
                                              readings: {
                                                ...s.readings,
                                                [location]: e.target.value,
                                              },
                                            }
                                          : s,
                                      ),
                                    };
                                    onMotorSessionChange(activeMotorEntry.motorId, {
                                      ...activeMotorSession,
                                      commonFormatParameters: nextParams,
                                    });
                                  }}
                                  disabled={inputsLocked}
                                />
                                <FieldErrorText message={err(readingPath)} />
                              </Box>
                            )}
                          </TableCell>
                        );
                      })}

                      {isAddingColumn && <TableCell sx={tdSx} />}

                      {showStructureActions && stageIndex === 0 ? (
                        <TableCell
                          align="center"
                          rowSpan={param.stages.length}
                          sx={{ ...tdSx, verticalAlign: "middle" }}
                        >
                          {paramIndex >= 3 && (
                            <IconButton
                              size="small"
                              sx={{ color: colors.danger }}
                              onClick={() => handleDeleteParameter(paramIndex)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  )),
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {showStructureActions ? (
            <Stack direction="row" justifyContent="flex-start">
              <Button
                variant="outlined"
                size="small"
                sx={actionButtonSx(colors.primary)}
                onClick={() => {
                  const params = activeMotorSession.commonFormatParameters ?? [];
                  const initialReadings = dynamicLocations.reduce((acc, loc) => {
                    acc[loc] = "";
                    return acc;
                  }, {});

                  onMotorSessionChange(activeMotorEntry.motorId, {
                    ...activeMotorSession,
                    commonFormatParameters: [
                      ...params,
                      {
                        parameterName: `Parameter ${params.length + 1}`,
                        stages: [
                          {
                            stage: "BEFORE_TRIMMING",
                            stageName: "Before Trimming",
                            specification: "",
                            readings: { ...initialReadings },
                          },
                          {
                            stage: "AFTER_TRIMMING",
                            stageName: "After Trimming",
                            specification: "",
                            readings: { ...initialReadings },
                          },
                        ],
                      },
                    ],
                  });
                }}
              >
                Add parameter
              </Button>
            </Stack>
          ) : null}
        </Box>
      </Box>

      <Box sx={sectionCardSx}>
        <Box sx={sectionHeaderSx}>
          <Typography sx={sectionTitleStyle}>Remarks & Attachments</Typography>
        </Box>
        <Box sx={{ p: 1.5 }}>
          <Stack spacing={2}>
            {readOnly ? (
              <>
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                      color: colors.primary,
                      mb: 0.5,
                    }}
                  >
                    Remarks
                  </Typography>
                  <ReadOnlyValue value={activeMotorSession.motorRemarks} />
                </Box>
                {useQcDivisionFileField ? (
                  <QCDivisionFileField
                    label="Upload Report"
                    files={activeMotorSession.reportFiles ?? []}
                    onChange={() => {}}
                    multiple
                    acceptMode="imageVideoPdf"
                    readOnly
                  />
                ) : (
                  <TrimmingFileField
                    label="Upload Report"
                    files={activeMotorSession.reportFiles ?? []}
                    onChange={() => {}}
                    multiple
                    acceptMode="imageVideoPdf"
                    readOnly
                    subDeptSlug={fileSubDeptSlug}
                  />
                )}
              </>
            ) : (
              <>
                <FormInput
                  multiline
                  minRows={3}
                  label="Remarks"
                  value={activeMotorSession.motorRemarks ?? ""}
                  onChange={(e) =>
                    onMotorSessionChange(activeMotorEntry.motorId, {
                      ...activeMotorSession,
                      motorRemarks: e.target.value,
                    })
                  }
                  disabled={inputsLocked}
                />
                {useQcDivisionFileField ? (
                  <QCDivisionFileField
                    label="Upload Report"
                    files={activeMotorSession.reportFiles ?? []}
                    onChange={(next) =>
                      onMotorSessionChange(activeMotorEntry.motorId, {
                        ...activeMotorSession,
                        reportFiles: next,
                      })
                    }
                    multiple
                    acceptMode="imageVideoPdf"
                    disabled={inputsLocked}
                  />
                ) : (
                  <TrimmingFileField
                    label="Upload Report"
                    files={activeMotorSession.reportFiles ?? []}
                    onChange={(next) =>
                      onMotorSessionChange(activeMotorEntry.motorId, {
                        ...activeMotorSession,
                        reportFiles: next,
                      })
                    }
                    multiple
                    acceptMode="imageVideoPdf"
                    disabled={inputsLocked}
                    subDeptSlug={fileSubDeptSlug}
                  />
                )}
              </>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};
