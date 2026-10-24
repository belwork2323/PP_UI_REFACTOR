import { Box, Stack, Typography, alpha } from "@mui/material";
import type { ReactNode } from "react";
import type { SchemaFormValues } from "@/data/models/shared/sectionFormTypes";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import StfMotorPanel from "../StaticTestFacility/StfMotorPanel";
import {
  getStfMotorDataFromValues,
  setStfMotorDataInValues,
} from "../../../../../hooks/user/qualityControl/qcStfTables";

type QCStfMotorPanelProps = {
  motorId?: string;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues | ((prev: SchemaFormValues) => SchemaFormValues)) => void;
  readOnly?: boolean;
  disabled?: boolean;
  headerActions?: ReactNode;
  batchId?: string;
  subDepartmentId?: number;
};

const QCStfMotorPanel = ({
  motorId,
  values,
  onChange,
  readOnly = false,
  disabled = false,
  headerActions,
  batchId,
  subDepartmentId,
}: QCStfMotorPanelProps) => {
  const BRAND = QC_DIVISION_BRAND;
  const stfData = getStfMotorDataFromValues(values);
  const fieldsDisabled = disabled || readOnly;

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${BRAND.border}`,
        background: "#fff",
        px: 1.5,
        py: 1.25,
        ...(fieldsDisabled && !readOnly
          ? { pointerEvents: "none", userSelect: "none", opacity: 0.92 }
          : null),
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1.25}
        gap={1}
        sx={{
          pb: 1,
          borderBottom: `1px solid ${alpha(BRAND.border, 0.55)}`,
        }}
      >
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
          {motorId
            ? `Static Test Facility · ${motorId}`
            : `Static Test Facility · ${stfData.variant === "MAIN_MOTOR" ? "Main Motor" : "BEM"}`}
        </Typography>
        {headerActions}
      </Stack>
      <StfMotorPanel
        value={stfData}
        onChange={(next) =>
          onChange((prev) => setStfMotorDataInValues(prev, next))
        }
        disabled={fieldsDisabled}
        readOnly={readOnly}
        qaRemarksMode
        batchId={batchId}
        motorId={motorId}
        subDepartmentId={subDepartmentId}
        subDeptSlug="static-test-facility"
      />
    </Box>
  );
};

export default QCStfMotorPanel;
