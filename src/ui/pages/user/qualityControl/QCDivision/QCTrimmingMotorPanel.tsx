import { useCallback, useMemo, type ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { SchemaFormValues } from "../../../../../schema-engine";
import type { FileRef } from "../../../../../data/models/common/FileUploadModel";
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

const mergeReportFilesPreferLive = (current: FileRef[], incoming: FileRef[]): FileRef[] => {
  const byKey = new Map<string, FileRef>();
  const keyOf = (ref: FileRef) =>
    String(ref.localId ?? "").trim() || String(ref.fileId ?? "").trim() || "";
  for (const ref of current ?? []) {
    const key = keyOf(ref);
    if (key) byKey.set(key, ref);
  }
  for (const ref of incoming ?? []) {
    const key = keyOf(ref);
    if (!key) continue;
    const prev = byKey.get(key);
    byKey.set(key, prev ? { ...prev, ...ref } : ref);
  }
  // Preserve in-flight uploads from current that incoming omitted.
  const incomingKeys = new Set((incoming ?? []).map(keyOf).filter(Boolean));
  for (const ref of current ?? []) {
    const key = keyOf(ref);
    if (!key || incomingKeys.has(key)) continue;
    if (ref.status === "uploading" || ref.status === "failed" || ref.isTemp) {
      byKey.set(key, ref);
    }
  }
  return Array.from(byKey.values());
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

  const handleMotorSessionChange = useCallback(
    (_id: string, nextSession: typeof activeMotorSession) => {
      if (inputsLocked) return;
      const nextReportFiles = mergeReportFilesPreferLive(
        session.reportFiles ?? [],
        nextSession.reportFiles ?? [],
      );
      onChange(
        setTrimmingSessionValues({
          motorStage: nextSession.motorStage ?? session.motorStage ?? "",
          motorReceivedAt: String(nextSession.motorReceivedAt ?? ""),
          trimmingDetails: nextSession.trimmingDetails ?? [],
          commonFormatParameters: nextSession.commonFormatParameters ?? [],
          commonFormatLocations: nextSession.commonFormatLocations ?? [],
          motorRemarks: String(nextSession.motorRemarks ?? ""),
          reportFiles: nextReportFiles,
        }),
      );
    },
    [inputsLocked, onChange, session],
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
        fileSubDeptSlug="qc-division"
        useQcDivisionFileField
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
        onMotorSessionChange={handleMotorSessionChange}
      />
    </Box>
  );
};

export default QCTrimmingMotorPanel;
