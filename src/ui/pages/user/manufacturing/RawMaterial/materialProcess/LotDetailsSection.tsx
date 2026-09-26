import React, { useMemo } from "react";
import { Box, Button, IconButton, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CasePrepSelect from "../../CasePreparation/CasePrepSelect";
import CasePrepTextField from "../../CasePreparation/CasePrepTextField";
import {
  createEmptyLotDetailRow,
  sumLotDetailQuantities,
  type LotDetailFormRow,
} from "../../../../../../data/models/user/rmp/defaultSolidProcessForm";
import { sanitizeMasterDataDecimalInput } from "../../../../../../data/models/admin/MasterData/masterDataNumericInput";

type Props = {
  value: LotDetailFormRow[];
  onChange: (next: LotDetailFormRow[]) => void;
  lotOptions: string[];
  quantityPerPremix: number;
  disabled?: boolean;
  theme: any;
  fieldErrors?: Record<string, string>;
};

const LotDetailsSection = ({
  value,
  onChange,
  lotOptions,
  quantityPerPremix,
  disabled,
  theme,
  fieldErrors = {},
}: Props) => {
  const rows = value.length > 0 ? value : [createEmptyLotDetailRow()];
  const sum = sumLotDetailQuantities(rows);
  const limit = Number(quantityPerPremix) || 0;
  const overLimit = limit > 0 && sum > limit + 1e-9;
  const sumError = fieldErrors.sum;

  const selectedLots = useMemo(
    () => new Set(rows.map((r) => String(r.lotId ?? "").trim()).filter(Boolean)),
    [rows],
  );

  const updateRow = (index: number, patch: Partial<LotDetailFormRow>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  const addRow = () => {
    if (disabled) return;
    onChange([...rows, createEmptyLotDetailRow()]);
  };

  const removeRow = (index: number) => {
    if (disabled) return;
    if (rows.length <= 1) {
      onChange([createEmptyLotDetailRow()]);
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 1,
        }}
      >
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>Lot Details</Typography>
        <Button
          size="small"
          startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
          onClick={addRow}
          disabled={disabled || lotOptions.length === 0}
          sx={{ textTransform: "none", fontSize: "0.72rem", fontWeight: 700 }}
        >
          Add lot
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          border: "1px solid",
          borderColor: overLimit || sumError ? "error.main" : "divider",
          borderRadius: 1,
          p: 1.25,
        }}
      >
        {rows.map((row, index) => {
          const options = lotOptions
            .map((lotId) => String(lotId ?? "").trim())
            .filter(Boolean)
            .filter((lotId) => lotId === row.lotId || !selectedLots.has(lotId))
            .map((lotId) => ({ value: lotId, label: lotId }));

          return (
            <Box
              key={`lot-row-${index}`}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr auto" },
                gap: 1.25,
                alignItems: "start",
              }}
            >
              <CasePrepSelect
                label="Lot ID"
                value={row.lotId}
                placeholder="Select lot"
                options={options}
                disabled={disabled}
                width="100%"
                theme={theme}
                error={Boolean(fieldErrors[`${index}.lotId`])}
                onChange={(v) => updateRow(index, { lotId: v })}
              />
              <CasePrepTextField
                label="Quantity"
                value={row.quantity}
                disabled={disabled}
                error={Boolean(fieldErrors[`${index}.quantity`])}
                helperText={fieldErrors[`${index}.quantity`] ?? null}
                width="100%"
                theme={theme}
                onChange={(v) => {
                  const next = sanitizeMasterDataDecimalInput(v);
                  if (next === null) return;
                  updateRow(index, { quantity: next });
                }}
              />
              <IconButton
                size="small"
                onClick={() => removeRow(index)}
                disabled={disabled}
                aria-label="Remove lot row"
                sx={{ mt: { md: 2.2 } }}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        })}

        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 600,
            color: overLimit || sumError ? "error.main" : "text.secondary",
          }}
        >
          Total: {sum}
          {limit > 0 ? ` / ${limit}` : ""}
          {limit > 0 ? " (quantity per premix)" : ""}
        </Typography>
        {(sumError || (overLimit && !sumError)) && (
          <Typography sx={{ fontSize: "0.7rem", color: "error.main" }}>
            {sumError ||
              `Total lot quantity (${sum}) exceeds quantity per premix (${limit}).`}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default LotDetailsSection;
