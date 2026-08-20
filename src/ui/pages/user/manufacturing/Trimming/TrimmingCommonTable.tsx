import React, { useMemo, useState } from "react";
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
  TextField,
  alpha,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import FormInput from "@/ui/components/common/FormInput";
import DateField from "@/ui/components/common/DateField";
import SchemaFileField from "@/ui/components/common/SchemaFileField";
import { FILE_PICKER_ACCEPT } from "@/utils/FileUtils";
import { STRINGS } from "../../../../../app/config/strings";
import { TRIMMING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/trimming_theme";

const S = STRINGS.MANUFACTURING.TRIMMING;

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

export const TrimmingCommonTable = ({
  activeMotorSession,
  activeMotorEntry,
  onMotorSessionChange,
  readOnly = false,
  disabled = false,
  allowStructureActions = true,
  theme,
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
        fontSize: "0.65rem",
        fontWeight: 800,
        letterSpacing: "0.02em",
        textTransform: "uppercase" as const,
        color: colors.primary,
        background: alpha(colors.primaryLight, 0.08),
        whiteSpace: "nowrap" as const,
        py: 0.5,
        px: 1,
        verticalAlign: "middle" as const,
        border: `1px solid ${alpha(colors.primary, 0.12)}`,
      }
    : {
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
        color: "#fff",
        fontWeight: 700,
        fontSize: "0.68rem",
        letterSpacing: "0.06em",
        textTransform: "uppercase" as const,
        padding: "10px 12px",
        whiteSpace: "nowrap" as const,
        border: `1px solid ${alpha("#fff", 0.22)}`,
        verticalAlign: "middle" as const,
      };

  const tdSx = readOnly
    ? {
        fontSize: "0.72rem",
        py: 0.5,
        px: 1,
        verticalAlign: "middle" as const,
        border: `1px solid ${alpha(colors.primary, 0.12)}`,
      }
    : {
        padding: "8px 10px",
        border: `1px solid ${alpha(colors.primary, 0.18)}`,
        verticalAlign: "middle" as const,
      };

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
          <Typography sx={sectionTitleStyle}>
            {S.MOTOR_RECEIVED_AT_LABEL}
          </Typography>
        </Box>
        <Box sx={{ p: 1.5, maxWidth: 320 }}>
          {readOnly ? (
            <ReadOnlyValue value={activeMotorSession.motorReceivedAt} />
          ) : (
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
            />
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
                  <TableCell sx={thSx}>Machine Details</TableCell>
                  <TableCell sx={thSx}>Start Date</TableCell>
                  <TableCell sx={thSx}>Completion Date</TableCell>
                  <TableCell sx={thSx}>Arbor Size</TableCell>
                  <TableCell sx={thSx}>Cutter Size</TableCell>
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
                    <TableCell sx={tdSx}>
                      {readOnly ? (
                        <ReadOnlyValue value={row.machineDetails} />
                      ) : (
                        <FormInput
                          value={row.machineDetails}
                          size="small"
                          onChange={(e) => {
                            const nextRows = [...(activeMotorSession.trimmingDetails ?? [])];
                            nextRows[rowIndex] = {
                              ...nextRows[rowIndex],
                              machineDetails: e.target.value,
                            };
                            onMotorSessionChange(activeMotorEntry.motorId, {
                              ...activeMotorSession,
                              trimmingDetails: nextRows,
                            });
                          }}
                          disabled={inputsLocked}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={tdSx}>
                      {readOnly ? (
                        <ReadOnlyValue value={row.startDate} />
                      ) : (
                        <DateField
                          value={row.startDate}
                          compact
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
                      )}
                    </TableCell>
                    <TableCell sx={tdSx}>
                      {readOnly ? (
                        <ReadOnlyValue value={row.completionDate} />
                      ) : (
                        <DateField
                          value={row.completionDate}
                          compact
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
                      )}
                    </TableCell>
                    <TableCell sx={tdSx}>
                      {readOnly ? (
                        <ReadOnlyValue value={row.arborSize} />
                      ) : (
                        <FormInput
                          value={row.arborSize}
                          inputMode="decimal"
                          onChange={(e) => {
                            const nextRows = [...(activeMotorSession.trimmingDetails ?? [])];
                            nextRows[rowIndex] = { ...nextRows[rowIndex], arborSize: e.target.value };
                            onMotorSessionChange(activeMotorEntry.motorId, {
                              ...activeMotorSession,
                              trimmingDetails: nextRows,
                            });
                          }}
                          disabled={inputsLocked}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={tdSx}>
                      {readOnly ? (
                        <ReadOnlyValue value={row.cutterSize} />
                      ) : (
                        <FormInput
                          value={row.cutterSize}
                          inputMode="decimal"
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
                      )}
                    </TableCell>
                    <TableCell sx={tdSx}>
                      {readOnly ? (
                        <ReadOnlyValue value={row.remarks} />
                      ) : (
                        <FormInput
                          value={row.remarks}
                          size="small"
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
                  <TableCell sx={{ ...thSx, minWidth: 80 }}>R2T</TableCell>
                  <TableCell sx={{ ...thSx, minWidth: 80 }}>R2B</TableCell>
                  <TableCell sx={{ ...thSx, minWidth: 80 }}>R1R</TableCell>
                  <TableCell sx={{ ...thSx, minWidth: 80 }}>R1L</TableCell>
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

                      {["R2T", "R2B", "R1R", "R1L"].map((location) => (
                        <TableCell key={`reading-${location}`} sx={tdSx}>
                          {readOnly ? (
                            <ReadOnlyValue value={stage.readings[location] ?? ""} />
                          ) : (
                            <FormInput
                              value={stage.readings[location] ?? ""}
                              inputMode="decimal"
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
                                          readings: { ...s.readings, [location]: e.target.value },
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
                          )}
                        </TableCell>
                      ))}

                      {dynamicLocations.map((location) => (
                        <TableCell key={`reading-${location}`} sx={tdSx}>
                          {readOnly ? (
                            <ReadOnlyValue value={stage.readings[location] ?? ""} />
                          ) : (
                            <FormInput
                              value={stage.readings[location] ?? ""}
                              inputMode="decimal"
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
                                          readings: { ...s.readings, [location]: e.target.value },
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
                          )}
                        </TableCell>
                      ))}

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
                    Upload Report
                  </Typography>
                  <ReadOnlyValue value={activeMotorSession.reportLink} />
                </Box>
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
                <SchemaFileField
                  label="Upload Report"
                  disabled={inputsLocked}
                  value={activeMotorSession.reportLink ?? ""}
                  onChange={(val) =>
                    onMotorSessionChange(activeMotorEntry.motorId, {
                      ...activeMotorSession,
                      reportLink: val,
                    })
                  }
                  accept={FILE_PICKER_ACCEPT.IMAGE_VIDEO_PDF}
                  multiple
                />
              </>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};
