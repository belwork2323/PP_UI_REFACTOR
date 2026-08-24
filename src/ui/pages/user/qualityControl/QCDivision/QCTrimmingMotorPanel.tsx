import { useMemo, type ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { SchemaFormValues } from "../../../../../schema-engine";
import { TrimmingCommonTable } from "../../manufacturing/Trimming/TrimmingCommonTable";
import { getQcTrimmingMotorLabel } from "../../../../../hooks/user/qualityControl/qcTrimmingConfig";
import {
  getTrimmingSessionFromValues,
  setTrimmingSessionValues,
} from "../../../../../hooks/user/qualityControl/qcTrimmingTables";

const BRAND = QC_DIVISION_BRAND;

type QCTrimmingMotorPanelProps = {
  motorId?: string | null;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  readOnly?: boolean;
  disabled?: boolean;
  headerActions?: ReactNode;
};

const QCTrimmingMotorPanel = ({
  motorId,
  values,
  onChange,
  readOnly = false,
  disabled = false,
  headerActions,
}: QCTrimmingMotorPanelProps) => {
  const session = useMemo(() => getTrimmingSessionFromValues(values), [values]);
  const resolvedMotorId = String(motorId ?? "").trim() || "MOTOR";
  const inputsLocked = Boolean(disabled || readOnly);

  const activeMotorSession = useMemo(
    () => ({
      motorId: resolvedMotorId,
      motorStage: Number(session.motorStage ?? 0) || 0,
      motorReceivedAt: session.motorReceivedAt,
      trimmingDetails: session.trimmingDetails,
      commonFormatParameters: session.commonFormatParameters,
      commonFormatLocations: session.commonFormatLocations,
      motorRemarks: session.motorRemarks,
      reportFiles: session.reportFiles ?? [],
    }),
    [resolvedMotorId, session],
  );

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${BRAND.border}`,
        background: BRAND.surface,
        px: 1.5,
        py: 1.25,
        ...(inputsLocked && !readOnly
          ? { pointerEvents: "none", userSelect: "none", opacity: 0.92 }
          : null),
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.25} gap={1}>
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
          {getQcTrimmingMotorLabel(motorId)}
        </Typography>
        {headerActions}
      </Stack>

      <TrimmingCommonTable
        activeMotorSession={activeMotorSession}
        activeMotorEntry={{ motorId: resolvedMotorId }}
        readOnly={readOnly}
        disabled={disabled}
        allowStructureActions={false}
        theme={{
          palette: {
            primary: BRAND.primary,
            primaryLight: BRAND.primaryLight,
            border: BRAND.border,
            surface: BRAND.surface,
            text: BRAND.text,
            textSub: BRAND.textSub,
            danger: BRAND.danger,
            pageBg: "#fff",
          },
        }}
        onMotorSessionChange={(_id, nextSession) => {
          if (inputsLocked) return;
          onChange(
            setTrimmingSessionValues({
              motorStage: nextSession.motorStage ?? session.motorStage ?? "",
              motorReceivedAt: String(nextSession.motorReceivedAt ?? ""),
              trimmingDetails: nextSession.trimmingDetails ?? [],
              commonFormatParameters: nextSession.commonFormatParameters ?? [],
              commonFormatLocations: nextSession.commonFormatLocations ?? [],
              motorRemarks: String(nextSession.motorRemarks ?? ""),
              reportFiles: nextSession.reportFiles ?? [],
            }),
          );
        }}
      />
    </Box>
  );
};

export default QCTrimmingMotorPanel;
