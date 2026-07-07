import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import type { SchemaDocumentV2, SchemaFormValues } from "../../../../../schema-engine";
import { createQcInitialValues } from "../../../../../schema-engine/adapters/qc.adapter";
import type { QcPremixEntry } from "../../../../../data/models/user/QualityControlFormModel";
import { getQcPremixLabel } from "../../../../../hooks/user/qualityControl/qcProcessingConfig";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import RemoveProcessButton from "../../../../components/common/RemoveProcessButton";
import QCSchemaPanel from "./QCSchemaPanel";

export type QCProcessingPremixPanelCopy = {
  sectionTitle: string;
  noPremixMessage: string;
  navTitle: string;
  navHint: string;
  navBack: string;
  navNext: string;
  counter: string;
  removeTooltip: string;
};

type QCProcessingPremixPanelProps = {
  schema: SchemaDocumentV2 | null;
  premixEntries: QcPremixEntry[];
  premixValuesByNo: Record<number, SchemaFormValues>;
  copy: QCProcessingPremixPanelCopy;
  slotKey: string;
  subDepartmentId?: number;
  batchId?: string;
  schemaLoading?: boolean;
  schemaError?: string | null;
  onPremixValuesChange: (premixNo: number, values: SchemaFormValues) => void;
  onRemovePremix: (premixNo: number) => void;
};

const QCProcessingPremixPanel = ({
  schema,
  premixEntries,
  premixValuesByNo,
  copy,
  slotKey,
  subDepartmentId,
  batchId,
  schemaLoading = false,
  schemaError = null,
  onPremixValuesChange,
  onRemovePremix,
}: QCProcessingPremixPanelProps) => {
  const BRAND = QC_DIVISION_BRAND;
  const [activePremixIndex, setActivePremixIndex] = useState(0);
  const prevPremixCountRef = useRef(premixEntries.length);

  useEffect(() => {
    if (premixEntries.length === 0) {
      setActivePremixIndex(0);
      prevPremixCountRef.current = 0;
      return;
    }

    if (premixEntries.length > prevPremixCountRef.current) {
      setActivePremixIndex(premixEntries.length - 1);
    } else {
      setActivePremixIndex((prev) => Math.min(prev, premixEntries.length - 1));
    }
    prevPremixCountRef.current = premixEntries.length;
  }, [premixEntries.length]);

  const activeEntry = useMemo(
    () => (premixEntries.length > 0 ? premixEntries[activePremixIndex] : null),
    [premixEntries, activePremixIndex],
  );

  if (!schema || !premixEntries.length || !activeEntry) {
    return (
      <Box
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${BRAND.border}`,
          background: BRAND.surface,
          px: 2,
          py: 2.5,
        }}
      >
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: BRAND.primary, mb: 0.75 }}>
          {copy.sectionTitle}
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", color: BRAND.textSub, textAlign: "center" }}>
          {copy.noPremixMessage}
        </Typography>
      </Box>
    );
  }

  const activeValues =
    premixValuesByNo[activeEntry.premixNo] ?? createQcInitialValues(schema);

  return (
    <Stack spacing={1.25}>
      <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
        {copy.sectionTitle}
      </Typography>

      <Box
        sx={{
          border: `1px solid ${BRAND.border}`,
          borderRadius: 2,
          px: 1.2,
          py: 1,
          background: BRAND.surface,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button
            variant="outlined"
            size="small"
            disabled={activePremixIndex === 0}
            onClick={() => setActivePremixIndex((prev) => Math.max(0, prev - 1))}
            sx={{ textTransform: "none", minWidth: 72 }}
          >
            {copy.navBack}
          </Button>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: BRAND.primary }}>
            {copy.counter
              .replace("{current}", String(activePremixIndex + 1))
              .replace("{total}", String(premixEntries.length))}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            disabled={activePremixIndex >= premixEntries.length - 1}
            onClick={() =>
              setActivePremixIndex((prev) => Math.min(premixEntries.length - 1, prev + 1))
            }
            sx={{ textTransform: "none", minWidth: 72 }}
          >
            {copy.navNext}
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          border: `1px solid ${BRAND.border}`,
          borderRadius: 2,
          px: 1,
          py: 1,
          background: BRAND.surface,
        }}
      >
        <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: BRAND.primary, mb: 0.4 }}>
          {copy.navTitle}
        </Typography>
        <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mb: 0.9 }}>
          {copy.navHint}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
          {premixEntries.map((entry, index) => {
            const active = index === activePremixIndex;
            return (
              <Button
                key={`qc-${slotKey}-premix-${entry.premixNo}`}
                size="small"
                variant={active ? "contained" : "outlined"}
                onClick={() => setActivePremixIndex(index)}
                sx={{ whiteSpace: "nowrap", flexShrink: 0, textTransform: "none" }}
              >
                {getQcPremixLabel(entry.premixNo)}
              </Button>
            );
          })}
        </Stack>
      </Box>

      <Box
        key={activeEntry.premixNo}
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${BRAND.border}`,
          background: BRAND.surface,
          px: 1.5,
          py: 1.25,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
            {getQcPremixLabel(activeEntry.premixNo)}
          </Typography>
          <RemoveProcessButton
            onClick={() => onRemovePremix(activeEntry.premixNo)}
            dangerColor={BRAND.danger}
            tooltip={copy.removeTooltip}
          />
        </Stack>

        <QCSchemaPanel
          schema={schema}
          formValues={activeValues}
          subDepartmentId={subDepartmentId}
          batchId={batchId}
          onChange={(values) => onPremixValuesChange(activeEntry.premixNo, values)}
          loading={schemaLoading}
          error={schemaError}
        />
      </Box>
    </Stack>
  );
};

export default QCProcessingPremixPanel;
