import React from "react";
import { Box, Typography } from "@mui/material";
import CasePrepTextField from "../../CasePreparation/CasePrepTextField";
import CasePrepSelect, {
  type CasePrepSelectOption,
} from "../../CasePreparation/CasePrepSelect";
import { DateTimeField } from "../../../../../components/common/DateField";
import type { DryingTrayOvenForm } from "../../../../../../data/models/user/rmp/defaultSolidProcessForm";
import { sanitizeMasterDataDecimalInput } from "../../../../../../data/models/admin/MasterData/masterDataNumericInput";

const OVEN_TYPE_OPTIONS: CasePrepSelectOption[] = [
  { value: "WATER_HEATED", label: "Water Heated" },
  { value: "AIR_HEATED", label: "Air Heated" },
];

type Props = {
  value: DryingTrayOvenForm;
  onChange: (next: DryingTrayOvenForm) => void;
  disabled?: boolean;
  theme: any;
  fieldErrors?: Record<string, string>;
  /** Defaults to "Drying in Tray Oven". */
  title?: string;
};

const DryingTrayOvenSection = ({
  value,
  onChange,
  disabled,
  theme,
  fieldErrors = {},
  title = "Drying in Tray Oven",
}: Props) => {
  const patch = (patchValue: Partial<DryingTrayOvenForm>) =>
    onChange({ ...value, ...patchValue });

  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 1.25,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          p: 1.25,
        }}
      >
        <CasePrepSelect
          label="Oven Type"
          value={value.ovenType}
          options={OVEN_TYPE_OPTIONS}
          disabled={disabled}
          width="100%"
          theme={theme}
          onChange={(v) => patch({ ovenType: v })}
        />
        <CasePrepTextField
          label="Oven no."
          value={value.ovenNumber}
          disabled={disabled}
          error={Boolean(fieldErrors.ovenNumber)}
          helperText={fieldErrors.ovenNumber ?? null}
          width="100%"
          theme={theme}
          onChange={(v) => patch({ ovenNumber: v })}
        />
        <CasePrepTextField
          label="Oven Set Temp (°C)"
          value={value.ovenSetTemperature}
          disabled={disabled}
          error={Boolean(fieldErrors.ovenSetTemperature)}
          helperText={fieldErrors.ovenSetTemperature ?? null}
          width="100%"
          theme={theme}
          onChange={(v) => {
            const next = sanitizeMasterDataDecimalInput(v);
            if (next === null) return;
            patch({ ovenSetTemperature: next });
          }}
        />
        <Box>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, mb: 0.35 }}>
            Start Date/ Time
          </Typography>
          <DateTimeField
            value={value.startDatetime}
            onChange={(v) => patch({ startDatetime: v })}
            disabled={disabled}
            compact
          />
        </Box>
        <Box>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, mb: 0.35 }}>
            End Date / Time
          </Typography>
          <DateTimeField
            value={value.endDatetime}
            onChange={(v) => patch({ endDatetime: v })}
            disabled={disabled}
            compact
          />
        </Box>
        <CasePrepTextField
          label="Moisture, %"
          value={value.moisture}
          disabled={disabled}
          error={Boolean(fieldErrors.moisture)}
          helperText={fieldErrors.moisture ?? null}
          width="100%"
          theme={theme}
          onChange={(v) => {
            const next = sanitizeMasterDataDecimalInput(v);
            if (next === null) return;
            patch({ moisture: next });
          }}
        />
        <CasePrepTextField
          label="Any other observation"
          value={value.observation}
          disabled={disabled}
          width="100%"
          theme={theme}
          onChange={(v) => patch({ observation: v })}
        />
      </Box>
    </Box>
  );
};

export default DryingTrayOvenSection;
