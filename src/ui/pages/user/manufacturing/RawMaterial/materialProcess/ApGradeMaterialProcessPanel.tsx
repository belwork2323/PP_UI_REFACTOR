import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import CasePrepTextField from "../../CasePreparation/CasePrepTextField";
import { DateTimeField } from "../../../../../components/common/DateField";
import type { ApCoarseProcessForm } from "../../../../../../data/models/user/rmp/apCoarseProcessForm";
import type { ApFineProcessForm } from "../../../../../../data/models/user/rmp/apFineProcessForm";
import {
  AP_ULTRA_FINE_PARTICLE_SIZE_SPEC,
  type ApUltraFineProcessForm,
} from "../../../../../../data/models/user/rmp/apUltraFineProcessForm";
import type { AluminumProcessForm } from "../../../../../../data/models/user/rmp/aluminumProcessForm";
import type { DoaProcessForm } from "../../../../../../data/models/user/rmp/doaProcessForm";
import {
  isLiquidDispatchUiKey,
  liquidDispatchSectionTitle,
} from "../../../../../../data/models/user/rmp/doaProcessForm";
import {
  ensureProcessFormMatchesUiKey,
  type DryingTrayOvenForm,
  type RmpMaterialProcessForm,
  type SievingForm,
} from "../../../../../../data/models/user/rmp/defaultSolidProcessForm";
import {
  isTypedSolidUiKey,
  type RmpMaterialUiKey,
} from "../../../../../../data/models/user/rmp/rmpMaterialUiRegistry";
import LotDetailsSection from "./LotDetailsSection";
import DoaFormatSection from "./DoaFormatSection";
import DryingTrayOvenSection from "./DryingTrayOvenSection";
import SievingSection from "./SievingSection";
import {
  ApBlendingTable,
  ApPsdTable,
  ApRvdTable,
  ApSectionCard,
  splitFieldErrors,
} from "./apProcessShared";

type TypedSolidForm =
  | ApCoarseProcessForm
  | ApFineProcessForm
  | ApUltraFineProcessForm
  | AluminumProcessForm
  | DoaProcessForm;

type Props = {
  uiKey: Extract<
    RmpMaterialUiKey,
    "apCoarse" | "apFine" | "apUltraFine" | "aluminum" | "doa" | "htpb" | "tdi"
  >;
  value: TypedSolidForm;
  onChange: (next: RmpMaterialProcessForm) => void;
  lotOptions: string[];
  quantityPerPremix: number;
  disabled?: boolean;
  theme: any;
  validationErrors?: Record<string, string>;
};

const fieldError = (
  errors: Record<string, string> | undefined,
  key: string,
): { error: boolean; helperText: string | null } => ({
  error: Boolean(errors?.[key]),
  helperText: errors?.[key] ?? null,
});

/** Unified typed solid process UI (AP grades + Aluminum) — shared lot details / tables / drying / sieving. */
const ApGradeMaterialProcessPanel = ({
  uiKey,
  value,
  onChange,
  lotOptions,
  quantityPerPremix,
  disabled,
  theme,
  validationErrors,
}: Props) => {
  const aligned = useMemo(
    () => ensureProcessFormMatchesUiKey(uiKey, value) as TypedSolidForm,
    [uiKey, value],
  );

  const lotErrors = useMemo(
    () => splitFieldErrors(validationErrors, "lotDetails"),
    [validationErrors],
  );

  const patchCoarse = (partial: Partial<ApCoarseProcessForm>) => {
    if (aligned.uiKey !== "apCoarse") return;
    onChange({ ...aligned, ...partial });
  };
  const patchFine = (partial: Partial<ApFineProcessForm>) => {
    if (aligned.uiKey !== "apFine") return;
    onChange({ ...aligned, ...partial });
  };
  const patchUltra = (partial: Partial<ApUltraFineProcessForm>) => {
    if (aligned.uiKey !== "apUltraFine") return;
    onChange({ ...aligned, ...partial });
  };
  const patchAluminum = (partial: Partial<AluminumProcessForm>) => {
    if (aligned.uiKey !== "aluminum") return;
    onChange({ ...aligned, ...partial });
  };
  const patchDoa = (partial: Partial<DoaProcessForm>) => {
    if (!isLiquidDispatchUiKey(aligned.uiKey)) return;
    onChange({ ...aligned, ...partial });
  };

  return (
    <>
      <LotDetailsSection
        value={aligned.lotDetails}
        onChange={(lotDetails) => onChange({ ...aligned, lotDetails } as TypedSolidForm)}
        lotOptions={lotOptions}
        quantityPerPremix={quantityPerPremix}
        disabled={disabled}
        theme={theme}
        fieldErrors={lotErrors}
      />

      {uiKey === "apCoarse" && aligned.uiKey === "apCoarse" ? (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, mb: 1 }}>Equipment</Typography>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                p: 1.25,
                maxWidth: 320,
              }}
            >
              <CasePrepTextField
                label="Equipment Type"
                value={aligned.equipmentType || "RVD"}
                disabled
                width="100%"
                theme={theme}
                onChange={() => undefined}
              />
            </Box>
          </Box>
          <ApBlendingTable
            rows={aligned.blendingDryingParameters}
            onChange={(rows) => patchCoarse({ blendingDryingParameters: rows })}
            disabled={disabled}
            theme={theme}
            validationErrors={validationErrors}
          />
          <ApRvdTable
            rows={aligned.dryingOperationRvd}
            onChange={(rows) => patchCoarse({ dryingOperationRvd: rows })}
            disabled={disabled}
            theme={theme}
            validationErrors={validationErrors}
          />
          <ApPsdTable
            rows={aligned.particleSizeDistribution}
            onChange={(rows) => patchCoarse({ particleSizeDistribution: rows })}
            disabled={disabled}
            theme={theme}
            validationErrors={validationErrors}
          />
        </>
      ) : null}

      {uiKey === "apFine" && aligned.uiKey === "apFine" ? (
        <>
          <ApSectionCard title="Grinding">
            <CasePrepTextField
              label="ACM Equipment Id"
              value={aligned.acmEquipmentId}
              disabled={disabled}
              width="100%"
              theme={theme}
              {...fieldError(validationErrors, "acmEquipmentId")}
              onChange={(v) => patchFine({ acmEquipmentId: v })}
            />
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, mt: 0.5 }}>Set RPM</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 1,
              }}
            >
              {(
                [
                  ["millRpm", "Mill RPM"],
                  ["classifierRpm", "Classifier RPM"],
                  ["screwFeederRpm", "Screw Feeder RPM"],
                  ["idFanRpm", "ID Fan RPM"],
                ] as const
              ).map(([key, label]) => (
                <CasePrepTextField
                  key={key}
                  label={label}
                  value={value[key]}
                  disabled={disabled}
                  width="100%"
                  theme={theme}
                  {...fieldError(validationErrors, key)}
                  onChange={(v) => patchFine({ [key]: v })}
                />
              ))}
            </Box>
            <CasePrepTextField
              label="Set Pressure"
              value={aligned.setPressure}
              disabled={disabled}
              width="100%"
              theme={theme}
              {...fieldError(validationErrors, "setPressure")}
              onChange={(v) => patchFine({ setPressure: v })}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 1,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, mb: 0.35 }}>
                  Start Date/ Time
                </Typography>
                <DateTimeField
                  value={aligned.grindingStartDatetime}
                  onChange={(v) => patchFine({ grindingStartDatetime: v })}
                  disabled={disabled}
                  compact
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, mb: 0.35 }}>
                  End Date/ Time
                </Typography>
                <DateTimeField
                  value={aligned.grindingEndDatetime}
                  onChange={(v) => patchFine({ grindingEndDatetime: v })}
                  disabled={disabled}
                  compact
                />
              </Box>
            </Box>
            <CasePrepTextField
              label="Any other observation"
              value={aligned.grindingObservation}
              disabled={disabled}
              width="100%"
              theme={theme}
              onChange={(v) => patchFine({ grindingObservation: v })}
            />
            <ApPsdTable
              title="Particle size Distribution"
              requirementLabel="PSD / Spec band"
              rows={aligned.particleSizeDistribution}
              onChange={(rows) => patchFine({ particleSizeDistribution: rows })}
              disabled={disabled}
              theme={theme}
              validationErrors={validationErrors}
              inlineAdd
            />
            <CasePrepTextField
              label="Qty. (kg) qualified"
              value={aligned.qtyKgQualified}
              disabled={disabled}
              width="100%"
              theme={theme}
              {...fieldError(validationErrors, "qtyKgQualified")}
              onChange={(v) => patchFine({ qtyKgQualified: v })}
            />
          </ApSectionCard>

          <ApBlendingTable
            title="Blending cum Drying"
            rows={aligned.blendingDryingParameters}
            onChange={(rows) => patchFine({ blendingDryingParameters: rows })}
            disabled={disabled}
            theme={theme}
            validationErrors={validationErrors}
          />
          <ApRvdTable
            rows={aligned.dryingOperationRvd}
            onChange={(rows) => patchFine({ dryingOperationRvd: rows })}
            disabled={disabled}
            theme={theme}
            validationErrors={validationErrors}
          />
          <DryingTrayOvenSection
            title="Storage in Tray Oven"
            value={aligned.trayOvenStorage as DryingTrayOvenForm}
            onChange={(trayOvenStorage) =>
              patchFine({
                trayOvenStorage: trayOvenStorage as ApFineProcessForm["trayOvenStorage"],
              })
            }
            disabled={disabled}
            theme={theme}
            fieldErrors={splitFieldErrors(validationErrors, "trayOvenStorage")}
          />
          <SievingSection
            value={aligned.sieving as SievingForm}
            onChange={(sieving) => patchFine({ sieving: sieving as ApFineProcessForm["sieving"] })}
            disabled={disabled}
            theme={theme}
            fieldErrors={splitFieldErrors(validationErrors, "sieving")}
          />
        </>
      ) : null}

      {uiKey === "apUltraFine" && aligned.uiKey === "apUltraFine" ? (
        <>
          <ApSectionCard title="Grinding">
            <CasePrepTextField
              label="Equipment Id"
              value={aligned.equipmentId}
              disabled={disabled}
              width="100%"
              theme={theme}
              {...fieldError(validationErrors, "equipmentId")}
              onChange={(v) => patchUltra({ equipmentId: v })}
            />
            <CasePrepTextField
              label="Set Screw Feeder RPM"
              value={aligned.screwFeederRpm}
              disabled={disabled}
              width="100%"
              theme={theme}
              {...fieldError(validationErrors, "screwFeederRpm")}
              onChange={(v) => patchUltra({ screwFeederRpm: v })}
            />
            <CasePrepTextField
              label="Set Feed Pressure"
              value={aligned.feedPressure}
              disabled={disabled}
              width="100%"
              theme={theme}
              {...fieldError(validationErrors, "feedPressure")}
              onChange={(v) => patchUltra({ feedPressure: v })}
            />
            <CasePrepTextField
              label="Set Grinding Pressure"
              value={aligned.grindingPressure}
              disabled={disabled}
              width="100%"
              theme={theme}
              {...fieldError(validationErrors, "grindingPressure")}
              onChange={(v) => patchUltra({ grindingPressure: v })}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 1,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, mb: 0.35 }}>
                  Start Date/ Time
                </Typography>
                <DateTimeField
                  value={aligned.grindingStartDatetime}
                  onChange={(v) => patchUltra({ grindingStartDatetime: v })}
                  disabled={disabled}
                  compact
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, mb: 0.35 }}>
                  End Date/ Time
                </Typography>
                <DateTimeField
                  value={aligned.grindingEndDatetime}
                  onChange={(v) => patchUltra({ grindingEndDatetime: v })}
                  disabled={disabled}
                  compact
                />
              </Box>
            </Box>
            <CasePrepTextField
              label="Any other observation"
              value={aligned.grindingObservation}
              disabled={disabled}
              width="100%"
              theme={theme}
              onChange={(v) => patchUltra({ grindingObservation: v })}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 1,
                alignItems: "start",
              }}
            >
              <CasePrepTextField
                label={`Particle Size (${AP_ULTRA_FINE_PARTICLE_SIZE_SPEC})`}
                value={aligned.particleSizeResult}
                disabled={disabled}
                width="100%"
                theme={theme}
                {...fieldError(validationErrors, "particleSizeResult")}
                onChange={(v) => patchUltra({ particleSizeResult: v })}
              />
              <CasePrepTextField
                label="Qty. (kg) qualified"
                value={aligned.qtyKgQualified}
                disabled={disabled}
                width="100%"
                theme={theme}
                {...fieldError(validationErrors, "qtyKgQualified")}
                onChange={(v) => patchUltra({ qtyKgQualified: v })}
              />
            </Box>
          </ApSectionCard>

          <DryingTrayOvenSection
            title="Drying in Tray Oven"
            value={aligned.drying as DryingTrayOvenForm}
            onChange={(drying) =>
              patchUltra({ drying: drying as ApUltraFineProcessForm["drying"] })
            }
            disabled={disabled}
            theme={theme}
            fieldErrors={splitFieldErrors(validationErrors, "drying")}
          />
          <SievingSection
            value={aligned.sieving as SievingForm}
            onChange={(sieving) =>
              patchUltra({ sieving: sieving as ApUltraFineProcessForm["sieving"] })
            }
            disabled={disabled}
            theme={theme}
            fieldErrors={splitFieldErrors(validationErrors, "sieving")}
          />
        </>
      ) : null}

      {uiKey === "aluminum" && aligned.uiKey === "aluminum" ? (
        <ApSectionCard title="Aluminum Powder Processing">
          <CasePrepTextField
            label="Equipment Id"
            value={aligned.equipmentId}
            disabled={disabled}
            width="100%"
            theme={theme}
            {...fieldError(validationErrors, "equipmentId")}
            onChange={(v) => patchAluminum({ equipmentId: v })}
          />
          <CasePrepTextField
            label="Set RPM"
            value={aligned.setRpm}
            disabled={disabled}
            width="100%"
            theme={theme}
            {...fieldError(validationErrors, "setRpm")}
            onChange={(v) => patchAluminum({ setRpm: v })}
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 1,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, mb: 0.35 }}>
                Start Date/ Time
              </Typography>
              <DateTimeField
                value={aligned.startDatetime}
                onChange={(v) => patchAluminum({ startDatetime: v })}
                disabled={disabled}
                compact
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, mb: 0.35 }}>
                End Date/ Time
              </Typography>
              <DateTimeField
                value={aligned.endDatetime}
                onChange={(v) => patchAluminum({ endDatetime: v })}
                disabled={disabled}
                compact
              />
            </Box>
          </Box>
          <CasePrepTextField
            label="Any other observation"
            value={aligned.observation}
            disabled={disabled}
            width="100%"
            theme={theme}
            onChange={(v) => patchAluminum({ observation: v })}
          />
          <CasePrepTextField
            label="Qty. (kg) qualified"
            value={aligned.qtyKgQualified}
            disabled={disabled}
            width="100%"
            theme={theme}
            {...fieldError(validationErrors, "qtyKgQualified")}
            onChange={(v) => patchAluminum({ qtyKgQualified: v })}
          />
          <Box>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, mb: 0.35 }}>
              Date/ Time of dispatch
            </Typography>
            <DateTimeField
              value={aligned.dispatchDatetime}
              onChange={(v) => patchAluminum({ dispatchDatetime: v })}
              disabled={disabled}
              compact
            />
          </Box>
        </ApSectionCard>
      ) : null}

      {isLiquidDispatchUiKey(uiKey) && isLiquidDispatchUiKey(aligned.uiKey) ? (
        <DoaFormatSection
          title={liquidDispatchSectionTitle(uiKey)}
          dispatchDatetime={aligned.dispatchDatetime}
          observation={aligned.observation}
          totalQtySentForPremix={aligned.totalQtySentForPremix}
          onDispatchDatetimeChange={(dispatchDatetime) => patchDoa({ dispatchDatetime })}
          onObservationChange={(observation) => patchDoa({ observation })}
          onTotalQtySentForPremixChange={(totalQtySentForPremix) =>
            patchDoa({ totalQtySentForPremix })
          }
          disabled={disabled}
          theme={theme}
          validationErrors={validationErrors}
        />
      ) : null}
    </>
  );
};

export default ApGradeMaterialProcessPanel;

/** @deprecated Prefer isTypedSolidUiKey from registry */
export const isApGradeUiKey = isTypedSolidUiKey;
