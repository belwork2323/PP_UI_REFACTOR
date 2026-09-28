import React from "react";
import { Box, Typography } from "@mui/material";
import CasePrepTextField from "../../CasePreparation/CasePrepTextField";
import { DateTimeField } from "../../../../../components/common/DateField";
import { ApSectionCard } from "./apProcessShared";

type Props = {
  title: string;
  /** CC / IO */
  sievingDatetime?: string;
  onSievingDatetimeChange?: (value: string) => void;
  /** NONOX-D */
  quantitySieved?: string;
  onQuantitySievedChange?: (value: string) => void;
  sieveMeshSize?: string;
  onSieveMeshSizeChange?: (value: string) => void;
  dispatchDatetime: string;
  observation: string;
  totalQtySentForPremix: string;
  onDispatchDatetimeChange: (value: string) => void;
  onObservationChange: (value: string) => void;
  onTotalQtySentForPremixChange: (value: string) => void;
  disabled?: boolean;
  theme: any;
  validationErrors?: Record<string, string>;
};

/**
 * Shared format block for DOA / HTPB / TDI / CC / IO / NONOX-D.
 * Lot nos / quantity stay in Lot Details — not shown here.
 */
const DoaFormatSection = ({
  title,
  sievingDatetime,
  onSievingDatetimeChange,
  quantitySieved,
  onQuantitySievedChange,
  sieveMeshSize,
  onSieveMeshSizeChange,
  dispatchDatetime,
  observation,
  totalQtySentForPremix,
  onDispatchDatetimeChange,
  onObservationChange,
  onTotalQtySentForPremixChange,
  disabled,
  theme,
  validationErrors,
}: Props) => {
  const showSievingDatetime = sievingDatetime !== undefined && onSievingDatetimeChange != null;
  const showNonoxFields =
    quantitySieved !== undefined &&
    onQuantitySievedChange != null &&
    sieveMeshSize !== undefined &&
    onSieveMeshSizeChange != null;

  return (
    <ApSectionCard title={title}>
      {showSievingDatetime ? (
        <Box>
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, mb: 0.35 }}>
            Sieving date and time
          </Typography>
          <DateTimeField
            value={sievingDatetime}
            onChange={onSievingDatetimeChange}
            disabled={disabled}
            compact
            error={Boolean(validationErrors?.sievingDatetime)}
            helperText={validationErrors?.sievingDatetime}
          />
        </Box>
      ) : null}
      {showNonoxFields ? (
        <>
          <CasePrepTextField
            label="Quantity sieved (in kg)"
            value={quantitySieved}
            disabled={disabled}
            width="100%"
            theme={theme}
            error={Boolean(validationErrors?.quantitySieved)}
            helperText={validationErrors?.quantitySieved ?? null}
            onChange={onQuantitySievedChange}
          />
          <CasePrepTextField
            label="Sieve Mesh Size"
            value={sieveMeshSize}
            disabled={disabled}
            width="100%"
            theme={theme}
            error={Boolean(validationErrors?.sieveMeshSize)}
            helperText={validationErrors?.sieveMeshSize ?? null}
            onChange={onSieveMeshSizeChange}
          />
        </>
      ) : null}
      <Box>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, mb: 0.35 }}>
          Date/ Time of dispatch
        </Typography>
        <DateTimeField
          value={dispatchDatetime}
          onChange={onDispatchDatetimeChange}
          disabled={disabled}
          compact
          error={Boolean(validationErrors?.dispatchDatetime)}
          helperText={validationErrors?.dispatchDatetime}
        />
      </Box>
      <CasePrepTextField
        label="Any other Observation"
        value={observation}
        disabled={disabled}
        width="100%"
        theme={theme}
        onChange={onObservationChange}
      />
      <CasePrepTextField
        label="Total Quantity sent for premix"
        value={totalQtySentForPremix}
        disabled={disabled}
        width="100%"
        theme={theme}
        error={Boolean(validationErrors?.totalQtySentForPremix)}
        helperText={validationErrors?.totalQtySentForPremix ?? null}
        onChange={onTotalQtySentForPremixChange}
      />
    </ApSectionCard>
  );
};

export default DoaFormatSection;
