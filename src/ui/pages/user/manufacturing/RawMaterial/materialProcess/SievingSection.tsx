import React from "react";
import { Box, Typography } from "@mui/material";
import CasePrepTextField from "../../CasePreparation/CasePrepTextField";
import { DateTimeField } from "../../../../../components/common/DateField";
import type { SievingForm } from "../../../../../../data/models/user/rmp/defaultSolidProcessForm";
import { sanitizeMasterDataDecimalInput } from "../../../../../../data/models/admin/MasterData/masterDataNumericInput";

type Props = {
  value: SievingForm;
  onChange: (next: SievingForm) => void;
  disabled?: boolean;
  theme: any;
  fieldErrors?: Record<string, string>;
};

const SievingSection = ({ value, onChange, disabled, theme, fieldErrors = {} }: Props) => {
  const patch = (patchValue: Partial<SievingForm>) => onChange({ ...value, ...patchValue });

  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, mb: 1 }}>
        Sieving
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
        <Box sx={{ gridColumn: { md: "1 / -1" } }}>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, mb: 0.35 }}>
            Date of Sieving/Dispatch
          </Typography>
          <DateTimeField
            value={value.sievingDispatchDatetime}
            onChange={(v) => patch({ sievingDispatchDatetime: v })}
            disabled={disabled}
            compact
          />
        </Box>
        <CasePrepTextField
          label="Sieved Quantity (kg)"
          value={value.sievedQuantity}
          disabled={disabled}
          error={Boolean(fieldErrors.sievedQuantity)}
          helperText={fieldErrors.sievedQuantity ?? null}
          width="100%"
          theme={theme}
          onChange={(v) => {
            const next = sanitizeMasterDataDecimalInput(v);
            if (next === null) return;
            patch({ sievedQuantity: next });
          }}
        />
        <CasePrepTextField
          label="Sieve Mesh Size"
          value={value.sieveMeshSize}
          disabled={disabled}
          error={Boolean(fieldErrors.sieveMeshSize)}
          helperText={fieldErrors.sieveMeshSize ?? null}
          width="100%"
          theme={theme}
          onChange={(v) => patch({ sieveMeshSize: v })}
        />
        <CasePrepTextField
          label="Any Observation"
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

export default SievingSection;
