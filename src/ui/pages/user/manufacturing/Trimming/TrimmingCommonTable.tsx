import React, { useState } from "react";
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
import { styled, keyframes } from "@mui/material/styles";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import FormInput from "@/ui/components/common/FormInput";
import DateField from "@/ui/components/common/DateField";
import SchemaFileField from "@/ui/components/common/SchemaFileField";

// --- Theme Tokens & Animations ---
const BRAND = {
  primary: "#1565C0",
  primaryLight: "#1976D2",
  border: "rgba(21, 101, 192, 0.2)",
  borderDark: "rgba(21, 101, 192, 0.14)",
  surface: "#F4F6F9",
  text: "#1E293B",
  textSub: "#64748B",
  tableBorder: "rgba(213, 216, 220, 0.5)",
  danger: "#d32f2f",
};

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components ---
const SectionCard = styled(Box)({
  borderRadius: 16,
  border: `1px solid ${BRAND.border}`,
  background: "#fff",
  overflow: "hidden",
  boxShadow: "0 2px 18px rgba(21, 101, 192, 0.07)",
  animation: `${slideIn} 0.35s ease both`,
  marginBottom: 24,
});

const SectionHeader = styled(Box)({
  padding: "13px 20px",
  background: "linear-gradient(135deg, rgba(21, 101, 192, 0.07), rgba(25, 118, 210, 0.03))",
  borderBottom: `1px solid ${BRAND.borderDark}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.7rem",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  padding: "11px 14px",
  whiteSpace: "nowrap",
  borderBottom: "none",
  verticalAlign: "middle",
});

const TD = styled(TableCell)({
  padding: "10px 10px",
  borderBottom: `1px solid ${BRAND.tableBorder}`,
  verticalAlign: "middle",
});

const tableShellSx = {
  border: `1px solid ${alpha(BRAND.tableBorder, 0.85)}`,
  borderRadius: 2,
  background: "#fff",
  overflowX: "visible",
};

export const TrimmingCommonTable = ({
  activeMotorSession,
  activeMotorEntry,
  onMotorSessionChange,
}) => {
  const dynamicLocations = activeMotorSession.commonFormatLocations ?? [];
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColInput, setNewColInput] = useState("");

  // --- Handlers for Dynamic Columns ---
  const handleSaveNewColumn = () => {
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
    const nextRows = [...(activeMotorSession.trimmingDetails ?? [])];
    nextRows.splice(rowIndex, 1);
    onMotorSessionChange(activeMotorEntry.motorId, {
      ...activeMotorSession,
      trimmingDetails: nextRows,
    });
  };

  // Deletes the entire parameter (including both before & after trimming stages)
  const handleDeleteParameter = (paramIndex) => {
    const currentParams = [...(activeMotorSession.commonFormatParameters ?? [])];
    currentParams.splice(paramIndex, 1);

    onMotorSessionChange(activeMotorEntry.motorId, {
      ...activeMotorSession,
      commonFormatParameters: currentParams,
    });
  };

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* MOTOR RECEIVE DATE (WITH TIME) */}
      <SectionCard>
        <SectionHeader>
          <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
            Motor Receive date & Time
          </Typography>
        </SectionHeader>
        <Box sx={{ p: 2 }}>
          <TextField
            type="datetime-local"
            size="small"
            value={activeMotorSession.motorReceivedAt ?? ""}
            onChange={(e) =>
              onMotorSessionChange(activeMotorEntry.motorId, {
                ...activeMotorSession,
                motorReceivedAt: e.target.value,
              })
            }
            InputLabelProps={{ shrink: true }}
            sx={{ width: 260 }}
          />
        </Box>
      </SectionCard>

      {/* TABLE 1: TRIMMING DETAILS */}
      <SectionCard>
        <SectionHeader>
          <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
            Trimming Details
          </Typography>
        </SectionHeader>

        <Box sx={{ p: 2 }}>
          <TableContainer sx={{ ...tableShellSx, mb: 1.5, overflow: "visible" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TH>Machine Details</TH>
                  <TH>Start Date</TH>
                  <TH>Completion Date</TH>
                  <TH>Arbor Size</TH>
                  <TH>Cutter Size</TH>
                  <TH>Remarks</TH>
                  <TH align="center" sx={{ width: 50 }}>
                    Actions
                  </TH>
                </TableRow>
              </TableHead>
              <TableBody>
                {(activeMotorSession.trimmingDetails ?? []).map((row, rowIndex) => (
                  <TableRow
                    key={`detail-row-${rowIndex}`}
                    sx={{
                      background: rowIndex % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55),
                    }}
                  >
                    <TD>
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
                      />
                    </TD>
                    <TD>
                      <DateField
                        value={row.startDate}
                        onChange={(val) => {
                          const nextRows = [...(activeMotorSession.trimmingDetails ?? [])];
                          nextRows[rowIndex] = { ...nextRows[rowIndex], startDate: val };
                          onMotorSessionChange(activeMotorEntry.motorId, {
                            ...activeMotorSession,
                            trimmingDetails: nextRows,
                          });
                        }}
                      />
                    </TD>
                    <TD>
                      <DateField
                        value={row.completionDate}
                        onChange={(val) => {
                          const nextRows = [...(activeMotorSession.trimmingDetails ?? [])];
                          nextRows[rowIndex] = { ...nextRows[rowIndex], completionDate: val };
                          onMotorSessionChange(activeMotorEntry.motorId, {
                            ...activeMotorSession,
                            trimmingDetails: nextRows,
                          });
                        }}
                      />
                    </TD>
                    <TD>
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
                      />
                    </TD>
                    <TD>
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
                      />
                    </TD>
                    <TD>
                      <FormInput
                        value={row.remarks}
                        onChange={(e) => {
                          const nextRows = [...(activeMotorSession.trimmingDetails ?? [])];
                          nextRows[rowIndex] = { ...nextRows[rowIndex], remarks: e.target.value };
                          onMotorSessionChange(activeMotorEntry.motorId, {
                            ...activeMotorSession,
                            trimmingDetails: nextRows,
                          });
                        }}
                      />
                    </TD>
                    <TD align="center">
                      {rowIndex > 0 && (
                        <IconButton
                          size="small"
                          sx={{ color: BRAND.danger }}
                          onClick={() => handleDeleteTrimmingRow(rowIndex)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TD>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="flex-start">
            <Button
              variant="outlined"
              size="small"
              sx={{
                fontWeight: 700,
                textTransform: "none",
                borderColor: alpha(BRAND.primary, 0.4),
                color: BRAND.primary,
                "&:hover": {
                  borderColor: BRAND.primary,
                  background: alpha(BRAND.primary, 0.04),
                },
              }}
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
        </Box>
      </SectionCard>

      {/* TABLE 2: DIMENSIONS AFTER TRIMMING */}
      <SectionCard>
        <SectionHeader>
          <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
            Dimensions After Trimming
          </Typography>

          <Button
            variant="contained"
            size="small"
            disableElevation
            startIcon={<AddIcon />}
            sx={{
              fontWeight: 700,
              textTransform: "none",
              background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
              color: "#fff",
              "&:hover": { background: BRAND.primary },
            }}
            onClick={() => setIsAddingColumn(true)}
          >
            Add Column
          </Button>
        </SectionHeader>

        <Box sx={{ p: 2 }}>
          <TableContainer sx={{ ...tableShellSx, mb: 1.5, overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TH sx={{ minWidth: 160 }}>Parameter</TH>
                  <TH sx={{ minWidth: 110 }}>Stage</TH>
                  <TH sx={{ minWidth: 110 }}>Specification</TH>
                  <TH sx={{ minWidth: 80 }}>R2T</TH>
                  <TH sx={{ minWidth: 80 }}>R2B</TH>
                  <TH sx={{ minWidth: 80 }}>R1R</TH>
                  <TH sx={{ minWidth: 80 }}>R1L</TH>
                  {dynamicLocations.map((loc) => (
                    <TH key={`col-head-${loc}`} sx={{ minWidth: 100 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <span>{loc}</span>
                        <IconButton
                          size="small"
                          sx={{ color: "#fff", p: 0.2 }}
                          onClick={() => handleDeleteColumn(loc)}
                        >
                          <DeleteOutlineIcon sx={{ fontSize: "1rem" }} />
                        </IconButton>
                      </Stack>
                    </TH>
                  ))}
                  {isAddingColumn && (
                    <TH sx={{ minWidth: 120, p: "4px 8px" }}>
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
                          bg: "#fff",
                          borderRadius: 1,
                          input: {
                            color: "#000",
                            fontSize: "0.75rem",
                            padding: "4px 8px",
                            background: "#fff",
                          },
                        }}
                      />
                    </TH>
                  )}
                  <TH align="center" sx={{ width: 50 }}>
                    Actions
                  </TH>
                </TableRow>
              </TableHead>
              <TableBody>
                {(activeMotorSession.commonFormatParameters ?? []).flatMap((param, paramIndex) =>
                  param.stages.map((stage, stageIndex) => (
                    <TableRow
                      key={`param-${paramIndex}-stage-${stageIndex}`}
                      sx={{
                        background: paramIndex % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55),
                      }}
                    >
                      {/* Spans full height of the parameter (Before + After) */}
                      {stageIndex === 0 ? (
                        <TD
                          rowSpan={param.stages.length}
                          sx={{
                            fontWeight: 700,
                            verticalAlign: "middle",
                            borderRight: `1px solid ${BRAND.tableBorder}`,
                          }}
                        >
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
                          />
                        </TD>
                      ) : null}

                      <TD>
                        <Typography
                          sx={{
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: BRAND.text,
                          }}
                        >
                          {stage.stage === "BEFORE_TRIMMING" ? "Before Trimming" : "After Trimming"}
                        </Typography>
                      </TD>

                      <TD>
                        <FormInput
                          value={stage.specification}
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
                        />
                      </TD>

                      {["R2T", "R2B", "R1R", "R1L"].map((location) => (
                        <TD key={`reading-${location}`}>
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
                          />
                        </TD>
                      ))}

                      {dynamicLocations.map((location) => (
                        <TD key={`reading-${location}`}>
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
                          />
                        </TD>
                      ))}

                      {isAddingColumn && <TD />}

                      {/* Single Action Cell spanning across all stages for the Parameter */}
                      {stageIndex === 0 ? (
                        <TD
                          align="center"
                          rowSpan={param.stages.length}
                          sx={{ verticalAlign: "middle" }}
                        >
                          {paramIndex >= 3 && (
                            <IconButton
                              size="small"
                              sx={{ color: BRAND.danger }}
                              onClick={() => handleDeleteParameter(paramIndex)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TD>
                      ) : null}
                    </TableRow>
                  )),
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" justifyContent="flex-start">
            <Button
              variant="outlined"
              size="small"
              sx={{
                fontWeight: 700,
                textTransform: "none",
                borderColor: alpha(BRAND.primary, 0.4),
                color: BRAND.primary,
                "&:hover": {
                  borderColor: BRAND.primary,
                  background: alpha(BRAND.primary, 0.04),
                },
              }}
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
                          specification: "",
                          readings: { ...initialReadings },
                        },
                        {
                          stage: "AFTER_TRIMMING",
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
        </Box>
      </SectionCard>

      {/* SECTION 3: REMARKS & ATTACHMENTS */}
      <SectionCard>
        <SectionHeader>
          <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
            Remarks & Attachments
          </Typography>
        </SectionHeader>
        <Box sx={{ p: 2 }}>
          <Stack spacing={2.5}>
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
            />
            <SchemaFileField
              label="Upload Report"
              value={activeMotorSession.reportLink ?? ""}
              onChange={(val) =>
                onMotorSessionChange(activeMotorEntry.motorId, {
                  ...activeMotorSession,
                  reportLink: val,
                })
              }
              accept="image/*,video/*,application/pdf"
              multiple
            />
          </Stack>
        </Box>
      </SectionCard>
    </Box>
  );
};
