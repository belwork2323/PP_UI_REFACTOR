import { Box, Button, Stack, Typography } from "@mui/material";
import type { SchemaApiContext, SchemaSection, SchemaThemeTokens } from "../../models/schema.types";
import { cloneSchemaRow, applyColumnDefaultsToRows } from "../../models/schemaFormState";
import { resolveSchemaCountToken, type SchemaSetupContext } from "../../utils/schemaSetupContext";
import TableSection from "./TableSection";

export type RepeatableTableCycle = {
  _cycleKey: string;
  rows: Record<string, unknown>[];
};

type RepeatableTableSectionProps = {
  section: SchemaSection;
  cycles: RepeatableTableCycle[];
  onCyclesChange: (cycles: RepeatableTableCycle[]) => void;
  readOnly?: boolean;
  theme: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
  setupContext?: SchemaSetupContext;
};

const buildCycleLabel = (pattern: string, index: number) =>
  pattern.replace("{index}", String(index)).replace("{index}", String(index));

const buildDefaultRows = (section: SchemaSection) => {
  const count = Number(section.defaultRowCount ?? 1) || 1;
  const columns = section.columns ?? [];

  const rows = Array.from({ length: count }, (_, rowIndex) => {
    const row: Record<string, unknown> = { srNo: rowIndex + 1 };
    columns.forEach((column) => {
      if (column.key === "srNo") return;
      row[column.key] = "";
    });
    return row;
  });

  return applyColumnDefaultsToRows(rows, columns);
};

const buildDefaultCycles = (section: SchemaSection, setupContext?: SchemaSetupContext) => {
  const repeatConfig = section.repeatConfig ?? {};
  const cycleCount = resolveSchemaCountToken(repeatConfig.defaultCount ?? 1, setupContext);
  const tableRows = buildDefaultRows(section);
  return Array.from({ length: cycleCount }, (_, index) => ({
    _cycleKey: `cycle-${index + 1}`,
    rows: tableRows.map((row) => cloneSchemaRow(row)),
  }));
};

const RepeatableTableSection = ({
  section,
  cycles,
  onCyclesChange,
  readOnly = false,
  theme,
  apiContext,
  setupContext,
}: RepeatableTableSectionProps) => {
  const repeatConfig = section.repeatConfig ?? {};
  const labelPattern = repeatConfig.labelPattern ?? "Cycle {index}";
  const allowAdd = repeatConfig.allowAdd !== false;
  const allowDelete = repeatConfig.allowDelete !== false;
  const minCycles = resolveSchemaCountToken(
    repeatConfig.minCycles ?? repeatConfig.defaultCount ?? 1,
    setupContext,
    1,
  );
  const maxCycles = resolveSchemaCountToken(
    repeatConfig.maxCycles ?? repeatConfig.defaultCount ?? minCycles,
    setupContext,
    minCycles,
  );
  const displayCycles =
    cycles.length > 0 ? cycles : buildDefaultCycles(section, setupContext);
  const canAdd = allowAdd && !readOnly && displayCycles.length < maxCycles;
  const canDelete = allowDelete && !readOnly && displayCycles.length > minCycles;

  const updateCycleRows = (cycleKey: string, rows: Record<string, unknown>[]) => {
    onCyclesChange(
      displayCycles.map((cycle) =>
        cycle._cycleKey === cycleKey ? { ...cycle, rows } : cycle,
      ),
    );
  };

  const addCycle = () => {
    if (!canAdd) return;
    onCyclesChange([
      ...displayCycles,
      {
        _cycleKey: `cycle-${Date.now()}`,
        rows: buildDefaultRows(section),
      },
    ]);
  };

  const removeCycle = (cycleKey: string) => {
    if (!canDelete) return;
    onCyclesChange(displayCycles.filter((cycle) => cycle._cycleKey !== cycleKey));
  };

  return (
    <Stack spacing={2}>
      {displayCycles.map((cycle, cycleIndex) => (
        <Box
          key={cycle._cycleKey}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.border}`,
            p: 1.5,
            background: theme.surface,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.84rem", color: theme.text }}>
              {buildCycleLabel(labelPattern, cycleIndex + 1)}
            </Typography>
            {canDelete ? (
              <Button
                size="small"
                color="error"
                onClick={() => removeCycle(cycle._cycleKey)}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Remove
              </Button>
            ) : null}
          </Stack>

          <TableSection
            section={{
              ...section,
              type: "table",
              sectionId: `${section.sectionId}__${cycle._cycleKey}`,
              defaultRows: cycle.rows.map((row) => cloneSchemaRow(row)),
            }}
            rows={cycle.rows}
            onRowsChange={(rows) => updateCycleRows(cycle._cycleKey, rows)}
            readOnly={readOnly}
            theme={theme}
            apiContext={apiContext}
          />
        </Box>
      ))}

      {canAdd ? (
        <Button
          variant="outlined"
          size="small"
          onClick={addCycle}
          sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
        >
          Add {buildCycleLabel(labelPattern, displayCycles.length + 1)}
        </Button>
      ) : null}
    </Stack>
  );
};

export default RepeatableTableSection;
