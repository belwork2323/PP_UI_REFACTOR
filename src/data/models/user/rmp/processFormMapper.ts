import { formatDateTimeForApi, toCamelCaseKey } from "../rawMaterialPreparationApiMapper";
import type {
  ApCoarseProcessDto,
  ApFineProcessDto,
  ApUltraFineProcessDto,
  AluminumProcessDto,
  DoaProcessDto,
  DryingTrayOvenDto,
  LotDetailDto,
  PreparationProcessEntry,
  SievingDto,
} from "./rmpProcessTypes";
import { processTypeToUiKey, uiKeyToProcessType } from "./rmpProcessTypes";
import type {
  DefaultLiquidProcessForm,
  DefaultSolidProcessForm,
  DryingTrayOvenForm,
  LotDetailFormRow,
  RmpMaterialProcessForm,
  SievingForm,
} from "./defaultSolidProcessForm";
import {
  createEmptyDefaultLiquidProcessForm,
  createEmptyDefaultSolidProcessForm,
  createEmptyDryingTrayOvenForm,
  createEmptyLotDetailRow,
  createEmptySievingForm,
} from "./defaultSolidProcessForm";
import type { RmpMaterialUiKey } from "./rmpMaterialUiRegistry";
import { createSeededApCoarseProcessForm, type ApCoarseProcessForm } from "./apCoarseProcessForm";
import { createSeededApFineProcessForm, type ApFineProcessForm } from "./apFineProcessForm";
import {
  createSeededApUltraFineProcessForm,
  type ApUltraFineProcessForm,
} from "./apUltraFineProcessForm";
import { createEmptyAluminumProcessForm, type AluminumProcessForm } from "./aluminumProcessForm";
import { createEmptyDoaProcessForm, type DoaProcessForm } from "./doaProcessForm";

const str = (v: unknown) => (v == null ? "" : String(v)).trim();

const pickField = (row: Record<string, unknown>, ...candidates: string[]): string => {
  for (const candidate of candidates) {
    const camel = toCamelCaseKey(candidate);
    const keys = [candidate, camel, candidate.toUpperCase(), candidate.toLowerCase()];
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
        return String(row[key]).trim();
      }
    }
  }
  return "";
};

const normalizeSectionId = (sectionId: string): string =>
  toCamelCaseKey(String(sectionId ?? "").trim());

const firstSectionRow = (
  sections: PreparationProcessEntry["sections"] | undefined,
  sectionId: string,
): Record<string, unknown> => {
  const target = normalizeSectionId(sectionId);
  const section = (sections ?? []).find(
    (entry) => normalizeSectionId(String(entry.sectionId ?? "")) === target,
  );
  const data = section?.sectionData;
  if (!Array.isArray(data) || data.length === 0) return {};
  const row = data[0];
  if (row && typeof row === "object" && !Array.isArray(row)) {
    return row as Record<string, unknown>;
  }
  return {};
};

const sectionRows = (
  sections: PreparationProcessEntry["sections"] | undefined,
  sectionId: string,
): Record<string, unknown>[] => {
  const target = normalizeSectionId(sectionId);
  const section = (sections ?? []).find(
    (entry) => normalizeSectionId(String(entry.sectionId ?? "")) === target,
  );
  const data = section?.sectionData;
  if (!Array.isArray(data)) return [];
  return data.filter(
    (row): row is Record<string, unknown> =>
      Boolean(row) && typeof row === "object" && !Array.isArray(row),
  );
};

const toLotFormRows = (lots: LotDetailDto[] | undefined): LotDetailFormRow[] => {
  const rows = (lots ?? [])
    .map((lot) => ({
      lotId: str(lot?.lotId),
      quantity:
        lot?.quantity == null || Number.isNaN(Number(lot.quantity)) ? "" : String(lot.quantity),
    }))
    .filter((row) => row.lotId || row.quantity);
  return rows.length > 0 ? rows : [createEmptyLotDetailRow()];
};

const toLotDtos = (rows: LotDetailFormRow[] | undefined): LotDetailDto[] =>
  (rows ?? [])
    .map((row) => {
      const lotId = str(row.lotId);
      const qtyText = str(row.quantity).replace(/,/g, "");
      const quantity = qtyText ? Number(qtyText) : null;
      return { lotId, quantity: Number.isFinite(quantity as number) ? quantity : null };
    })
    .filter((row) => row.lotId || row.quantity != null);

const dryingFormFromDto = (dto: DryingTrayOvenDto | null | undefined): DryingTrayOvenForm => ({
  ...createEmptyDryingTrayOvenForm(),
  ovenType: str(dto?.ovenType),
  ovenNumber: str(dto?.ovenNumber),
  ovenSetTemperature: str(dto?.ovenSetTemperature),
  startDatetime: str(dto?.startDatetime),
  endDatetime: str(dto?.endDatetime),
  moisture: str(dto?.moisture),
  observation: str(dto?.observation),
});

const sievingFormFromDto = (dto: SievingDto | null | undefined): SievingForm => ({
  ...createEmptySievingForm(),
  sievingDispatchDatetime: str(dto?.sievingDispatchDatetime),
  sievedQuantity: str(dto?.sievedQuantity),
  sieveMeshSize: str(dto?.sieveMeshSize),
  observation: str(dto?.observation),
});

const dryingDtoFromForm = (drying: DryingTrayOvenForm): DryingTrayOvenDto | null => {
  const start = formatDateTimeForApi(drying.startDatetime);
  const end = formatDateTimeForApi(drying.endDatetime);
  const dto: DryingTrayOvenDto = {
    ovenType: drying.ovenType.trim() || null,
    ovenNumber: drying.ovenNumber.trim() || null,
    ovenSetTemperature: drying.ovenSetTemperature.trim() || null,
    startDatetime: start || null,
    endDatetime: end || null,
    moisture: drying.moisture.trim() || null,
    observation: drying.observation.trim() || null,
  };
  const hasValue = Object.values(dto).some((v) => v != null && String(v).trim() !== "");
  return hasValue ? dto : null;
};

const sievingDtoFromForm = (sieving: SievingForm): SievingDto | null => {
  const dispatch = formatDateTimeForApi(sieving.sievingDispatchDatetime);
  const dto: SievingDto = {
    sievingDispatchDatetime: dispatch || null,
    sievedQuantity: sieving.sievedQuantity.trim() || null,
    sieveMeshSize: sieving.sieveMeshSize.trim() || null,
    observation: sieving.observation.trim() || null,
  };
  const hasValue = Object.values(dto).some((v) => v != null && String(v).trim() !== "");
  return hasValue ? dto : null;
};

const apCoarseDtoFromForm = (form: ApCoarseProcessForm): ApCoarseProcessDto => ({
  equipmentType: form.equipmentType.trim() || "RVD",
  blendingDryingParameters: (form.blendingDryingParameters ?? []).map((row) => ({
    operation: row.operation.trim() || null,
    setParameter: row.setParameter.trim() || null,
    actualParameter: row.actualParameter.trim() || null,
  })),
  dryingOperationRvd: (form.dryingOperationRvd ?? []).map((row) => ({
    operation: row.operation.trim() || null,
    setParameter: row.setParameter.trim() || null,
    actualParameter: row.actualParameter.trim() || null,
    startTime: row.startTime.trim() || null,
    endTime: row.endTime.trim() || null,
  })),
  particleSizeDistribution: (form.particleSizeDistribution ?? []).map((row) => ({
    psdRequirement: row.psdRequirement.trim() || null,
    specification: row.specification.trim() || null,
    result: row.result.trim() || null,
  })),
});

const apCoarseFormFromDto = (
  dto: ApCoarseProcessDto | null | undefined,
  lotDetails: LotDetailFormRow[],
): ApCoarseProcessForm => {
  const seeded = createSeededApCoarseProcessForm();
  if (!dto) {
    return { ...seeded, lotDetails };
  }
  return {
    uiKey: "apCoarse",
    lotDetails,
    equipmentType: str(dto.equipmentType) || "RVD",
    blendingDryingParameters: dto.blendingDryingParameters?.length
      ? dto.blendingDryingParameters.map((row) => ({
          operation: str(row?.operation),
          setParameter: str(row?.setParameter),
          actualParameter: str(row?.actualParameter),
        }))
      : seeded.blendingDryingParameters,
    dryingOperationRvd: dto.dryingOperationRvd?.length
      ? dto.dryingOperationRvd.map((row) => ({
          operation: str(row?.operation),
          setParameter: str(row?.setParameter),
          actualParameter: str(row?.actualParameter),
          startTime: str(row?.startTime),
          endTime: str(row?.endTime),
        }))
      : seeded.dryingOperationRvd,
    particleSizeDistribution: dto.particleSizeDistribution?.length
      ? dto.particleSizeDistribution.map((row) => ({
          psdRequirement: str(row?.psdRequirement),
          specification: str(row?.specification),
          result: str(row?.result),
        }))
      : seeded.particleSizeDistribution,
  };
};

const apFineDtoFromForm = (form: ApFineProcessForm): ApFineProcessDto => ({
  acmEquipmentId: form.acmEquipmentId.trim() || null,
  millRpm: form.millRpm.trim() || null,
  classifierRpm: form.classifierRpm.trim() || null,
  screwFeederRpm: form.screwFeederRpm.trim() || null,
  idFanRpm: form.idFanRpm.trim() || null,
  setPressure: form.setPressure.trim() || null,
  grindingStartDatetime: formatDateTimeForApi(form.grindingStartDatetime) || null,
  grindingEndDatetime: formatDateTimeForApi(form.grindingEndDatetime) || null,
  grindingObservation: form.grindingObservation.trim() || null,
  particleSizeDistribution: (form.particleSizeDistribution ?? []).map((row) => ({
    psdRequirement: row.psdRequirement.trim() || null,
    specification: row.specification.trim() || null,
    result: row.result.trim() || null,
  })),
  qtyKgQualified: form.qtyKgQualified.trim() || null,
  blendingDryingParameters: (form.blendingDryingParameters ?? []).map((row) => ({
    operation: row.operation.trim() || null,
    setParameter: row.setParameter.trim() || null,
    actualParameter: row.actualParameter.trim() || null,
  })),
  dryingOperationRvd: (form.dryingOperationRvd ?? []).map((row) => ({
    operation: row.operation.trim() || null,
    setParameter: row.setParameter.trim() || null,
    actualParameter: row.actualParameter.trim() || null,
    startTime: row.startTime.trim() || null,
    endTime: row.endTime.trim() || null,
  })),
  trayOvenStorage: dryingDtoFromForm(form.trayOvenStorage as DryingTrayOvenForm),
  sieving: sievingDtoFromForm(form.sieving as SievingForm),
});

const apFineFormFromDto = (
  dto: ApFineProcessDto | null | undefined,
  lotDetails: LotDetailFormRow[],
): ApFineProcessForm => {
  const seeded = createSeededApFineProcessForm();
  if (!dto) {
    return { ...seeded, lotDetails };
  }
  return {
    uiKey: "apFine",
    lotDetails,
    acmEquipmentId: str(dto.acmEquipmentId),
    millRpm: str(dto.millRpm),
    classifierRpm: str(dto.classifierRpm),
    screwFeederRpm: str(dto.screwFeederRpm),
    idFanRpm: str(dto.idFanRpm),
    setPressure: str(dto.setPressure),
    grindingStartDatetime: str(dto.grindingStartDatetime),
    grindingEndDatetime: str(dto.grindingEndDatetime),
    grindingObservation: str(dto.grindingObservation),
    particleSizeDistribution: dto.particleSizeDistribution?.length
      ? dto.particleSizeDistribution.map((row) => ({
          psdRequirement: str(row?.psdRequirement),
          specification: str(row?.specification),
          result: str(row?.result),
        }))
      : seeded.particleSizeDistribution,
    qtyKgQualified: str(dto.qtyKgQualified),
    blendingDryingParameters: dto.blendingDryingParameters?.length
      ? dto.blendingDryingParameters.map((row) => ({
          operation: str(row?.operation),
          setParameter: str(row?.setParameter),
          actualParameter: str(row?.actualParameter),
        }))
      : seeded.blendingDryingParameters,
    dryingOperationRvd: dto.dryingOperationRvd?.length
      ? dto.dryingOperationRvd.map((row) => ({
          operation: str(row?.operation),
          setParameter: str(row?.setParameter),
          actualParameter: str(row?.actualParameter),
          startTime: str(row?.startTime),
          endTime: str(row?.endTime),
        }))
      : seeded.dryingOperationRvd,
    trayOvenStorage: dryingFormFromDto(dto.trayOvenStorage) as ApFineProcessForm["trayOvenStorage"],
    sieving: sievingFormFromDto(dto.sieving) as ApFineProcessForm["sieving"],
  };
};

const apUltraFineDtoFromForm = (form: ApUltraFineProcessForm): ApUltraFineProcessDto => ({
  equipmentId: form.equipmentId.trim() || null,
  screwFeederRpm: form.screwFeederRpm.trim() || null,
  feedPressure: form.feedPressure.trim() || null,
  grindingPressure: form.grindingPressure.trim() || null,
  grindingStartDatetime: formatDateTimeForApi(form.grindingStartDatetime) || null,
  grindingEndDatetime: formatDateTimeForApi(form.grindingEndDatetime) || null,
  grindingObservation: form.grindingObservation.trim() || null,
  particleSizeResult: form.particleSizeResult.trim() || null,
  qtyKgQualified: form.qtyKgQualified.trim() || null,
  drying: dryingDtoFromForm(form.drying as DryingTrayOvenForm),
  sieving: sievingDtoFromForm(form.sieving as SievingForm),
});

const apUltraFineFormFromDto = (
  dto: ApUltraFineProcessDto | null | undefined,
  lotDetails: LotDetailFormRow[],
): ApUltraFineProcessForm => {
  const seeded = createSeededApUltraFineProcessForm();
  if (!dto) {
    return { ...seeded, lotDetails };
  }
  return {
    uiKey: "apUltraFine",
    lotDetails,
    equipmentId: str(dto.equipmentId),
    screwFeederRpm: str(dto.screwFeederRpm),
    feedPressure: str(dto.feedPressure),
    grindingPressure: str(dto.grindingPressure),
    grindingStartDatetime: str(dto.grindingStartDatetime),
    grindingEndDatetime: str(dto.grindingEndDatetime),
    grindingObservation: str(dto.grindingObservation),
    particleSizeResult: str(dto.particleSizeResult),
    qtyKgQualified: str(dto.qtyKgQualified),
    drying: dryingFormFromDto(dto.drying) as ApUltraFineProcessForm["drying"],
    sieving: sievingFormFromDto(dto.sieving) as ApUltraFineProcessForm["sieving"],
  };
};

const aluminumDtoFromForm = (form: AluminumProcessForm): AluminumProcessDto => ({
  equipmentId: form.equipmentId.trim() || null,
  setRpm: form.setRpm.trim() || null,
  startDatetime: formatDateTimeForApi(form.startDatetime) || null,
  endDatetime: formatDateTimeForApi(form.endDatetime) || null,
  observation: form.observation.trim() || null,
  qtyKgQualified: form.qtyKgQualified.trim() || null,
  dispatchDatetime: formatDateTimeForApi(form.dispatchDatetime) || null,
});

const aluminumFormFromDto = (
  dto: AluminumProcessDto | null | undefined,
  lotDetails: LotDetailFormRow[],
): AluminumProcessForm => {
  const empty = createEmptyAluminumProcessForm();
  if (!dto) {
    return { ...empty, lotDetails };
  }
  return {
    uiKey: "aluminum",
    lotDetails,
    equipmentId: str(dto.equipmentId),
    setRpm: str(dto.setRpm),
    startDatetime: str(dto.startDatetime),
    endDatetime: str(dto.endDatetime),
    observation: str(dto.observation),
    qtyKgQualified: str(dto.qtyKgQualified),
    dispatchDatetime: str(dto.dispatchDatetime),
  };
};

const doaDtoFromForm = (form: DoaProcessForm): DoaProcessDto => ({
  dispatchDatetime: formatDateTimeForApi(form.dispatchDatetime) || null,
  observation: form.observation.trim() || null,
  totalQtySentForPremix: form.totalQtySentForPremix.trim() || null,
});

const doaFormFromDto = (
  dto: DoaProcessDto | null | undefined,
  lotDetails: LotDetailFormRow[],
): DoaProcessForm => {
  const empty = createEmptyDoaProcessForm();
  if (!dto) {
    return { ...empty, lotDetails };
  }
  return {
    uiKey: "doa",
    lotDetails,
    dispatchDatetime: str(dto.dispatchDatetime),
    observation: str(dto.observation),
    totalQtySentForPremix: str(dto.totalQtySentForPremix),
  };
};

/** Migrate legacy section bags into typed DTOs when typed fields are empty. */
const migrateLegacySections = (
  entry: PreparationProcessEntry,
): Pick<PreparationProcessEntry, "lotDetails" | "drying" | "sieving"> => {
  const sections = entry.sections;
  let lotDetails = entry.lotDetails ?? [];
  let drying = entry.drying ?? null;
  let sieving = entry.sieving ?? null;

  const needs =
    (!lotDetails || lotDetails.length === 0) && !drying && !sieving && Boolean(sections?.length);
  if (!needs || !sections) {
    return { lotDetails, drying, sieving };
  }

  const lotRows = [...sectionRows(sections, "lotDetails"), ...sectionRows(sections, "lotDetail")];
  if (lotRows.length > 0) {
    lotDetails = lotRows.map((row) => {
      const lotId = pickField(row, "lotId", "lotNumber");
      const qtyText = pickField(row, "quantity");
      const quantity = qtyText ? Number(qtyText.replace(/,/g, "")) : null;
      return {
        lotId,
        quantity: Number.isFinite(quantity as number) ? quantity : null,
      };
    });
  }

  const dryingRow = firstSectionRow(sections, "dryingTrayOven");
  if (Object.keys(dryingRow).length > 0) {
    drying = {
      ovenType: pickField(dryingRow, "ovenType", "OVEN_TYPE") || null,
      ovenNumber: pickField(dryingRow, "ovenNumber", "OVEN_NUMBER") || null,
      ovenSetTemperature:
        pickField(dryingRow, "ovenSetTemperature", "OVEN_SET_TEMPERATURE") || null,
      startDatetime: pickField(dryingRow, "startDatetime", "START_DATETIME") || null,
      endDatetime: pickField(dryingRow, "endDatetime", "END_DATETIME") || null,
      moisture: pickField(dryingRow, "moisture", "MOISTURE") || null,
      observation: pickField(dryingRow, "observation", "OBSERVATION") || null,
    };
  }

  const sievingRow = firstSectionRow(sections, "sieving");
  if (Object.keys(sievingRow).length > 0) {
    sieving = {
      sievingDispatchDatetime:
        pickField(sievingRow, "sievingDispatchDatetime", "SIEVING_DISPATCH_DATETIME") || null,
      sievedQuantity: pickField(sievingRow, "sievedQuantity", "SIEVED_QUANTITY") || null,
      sieveMeshSize: pickField(sievingRow, "sieveMeshSize", "SIEVE_MESH_SIZE") || null,
      observation: pickField(sievingRow, "observation", "OBSERVATION") || null,
    };
  }

  return { lotDetails, drying, sieving };
};

export const hydrateProcessFormFromEntry = (
  uiKey: RmpMaterialUiKey,
  entry: PreparationProcessEntry | null | undefined,
): RmpMaterialProcessForm => {
  if (!entry) {
    return uiKey === "defaultLiquid"
      ? createEmptyDefaultLiquidProcessForm()
      : createEmptyDefaultSolidProcessForm();
  }

  const migrated = migrateLegacySections(entry);
  const lotDetails = toLotFormRows(migrated.lotDetails);

  if (uiKey === "defaultLiquid") {
    const form: DefaultLiquidProcessForm = {
      uiKey: "defaultLiquid",
      lotDetails,
    };
    return form;
  }

  if (uiKey === "apCoarse") {
    return apCoarseFormFromDto(entry.apCoarse ?? null, lotDetails);
  }

  if (uiKey === "apFine") {
    return apFineFormFromDto(entry.apFine ?? null, lotDetails);
  }

  if (uiKey === "apUltraFine") {
    return apUltraFineFormFromDto(entry.apUltraFine ?? null, lotDetails);
  }

  if (uiKey === "aluminum") {
    return aluminumFormFromDto(entry.aluminum ?? null, lotDetails);
  }

  if (uiKey === "doa") {
    return doaFormFromDto(entry.doa ?? null, lotDetails);
  }

  const form: DefaultSolidProcessForm = {
    uiKey: "defaultSolid",
    lotDetails,
    drying: dryingFormFromDto(migrated.drying),
    sieving: sievingFormFromDto(migrated.sieving),
  };
  return form;
};

/** @deprecated Prefer hydrateProcessFormFromEntry */
export const hydrateProcessFormFromSections = (
  uiKey: RmpMaterialUiKey,
  sections: PreparationProcessEntry["sections"] | undefined,
): RmpMaterialProcessForm =>
  hydrateProcessFormFromEntry(uiKey, {
    materialId: 0,
    materialCode: "",
    materialName: "",
    gradeId: null,
    gradeCode: null,
    processType: uiKeyToProcessType(uiKey),
    lotDetails: [],
    sections,
  });

export const processFormToTypedFields = (
  form: RmpMaterialProcessForm,
): Pick<
  PreparationProcessEntry,
  | "processType"
  | "lotDetails"
  | "drying"
  | "sieving"
  | "apCoarse"
  | "apFine"
  | "apUltraFine"
  | "aluminum"
  | "doa"
> => {
  const lotDetails = toLotDtos(form.lotDetails);
  if (form.uiKey === "defaultLiquid") {
    return {
      processType: "DEFAULT_LIQUID",
      lotDetails,
      drying: null,
      sieving: null,
      apCoarse: null,
      apFine: null,
      apUltraFine: null,
      aluminum: null,
      doa: null,
    };
  }
  if (form.uiKey === "apCoarse") {
    return {
      processType: "AP_COARSE",
      lotDetails,
      drying: null,
      sieving: null,
      apCoarse: apCoarseDtoFromForm(form),
      apFine: null,
      apUltraFine: null,
      aluminum: null,
      doa: null,
    };
  }
  if (form.uiKey === "apFine") {
    return {
      processType: "AP_FINE",
      lotDetails,
      drying: null,
      sieving: null,
      apCoarse: null,
      apFine: apFineDtoFromForm(form),
      apUltraFine: null,
      aluminum: null,
      doa: null,
    };
  }
  if (form.uiKey === "apUltraFine") {
    return {
      processType: "AP_ULTRA_FINE",
      lotDetails,
      drying: null,
      sieving: null,
      apCoarse: null,
      apFine: null,
      apUltraFine: apUltraFineDtoFromForm(form),
      aluminum: null,
      doa: null,
    };
  }
  if (form.uiKey === "aluminum") {
    return {
      processType: "ALUMINUM",
      lotDetails,
      drying: null,
      sieving: null,
      apCoarse: null,
      apFine: null,
      apUltraFine: null,
      aluminum: aluminumDtoFromForm(form),
      doa: null,
    };
  }
  if (form.uiKey === "doa") {
    return {
      processType: "DOA",
      lotDetails,
      drying: null,
      sieving: null,
      apCoarse: null,
      apFine: null,
      apUltraFine: null,
      aluminum: null,
      doa: doaDtoFromForm(form),
    };
  }
  return {
    processType: "DEFAULT_SOLID",
    lotDetails,
    drying: dryingDtoFromForm(form.drying),
    sieving: sievingDtoFromForm(form.sieving),
    apCoarse: null,
    apFine: null,
    apUltraFine: null,
    aluminum: null,
    doa: null,
  };
};

/** Convert typed process to display sections for approver / details tables. */
export const typedProcessToDisplaySections = (
  entry: PreparationProcessEntry,
): Array<{ sectionId: string; sectionData: Record<string, unknown>[] }> => {
  const migrated = migrateLegacySections(entry);
  const sections: Array<{ sectionId: string; sectionData: Record<string, unknown>[] }> = [];

  if (migrated.lotDetails?.length) {
    sections.push({
      sectionId: "lotDetails",
      sectionData: migrated.lotDetails.map((lot) => ({
        lotId: lot.lotId,
        quantity: lot.quantity,
      })),
    });
  }
  if (migrated.drying) {
    const row: Record<string, unknown> = {};
    Object.entries(migrated.drying).forEach(([k, v]) => {
      if (v != null && String(v).trim() !== "") row[k] = v;
    });
    if (Object.keys(row).length > 0) {
      sections.push({ sectionId: "dryingTrayOven", sectionData: [row] });
    }
  }
  if (migrated.sieving) {
    const row: Record<string, unknown> = {};
    Object.entries(migrated.sieving).forEach(([k, v]) => {
      if (v != null && String(v).trim() !== "") row[k] = v;
    });
    if (Object.keys(row).length > 0) {
      sections.push({ sectionId: "sieving", sectionData: [row] });
    }
  }
  if (entry.apCoarse) {
    const ap = entry.apCoarse;
    if (ap.equipmentType) {
      sections.push({
        sectionId: "apEquipment",
        sectionData: [{ equipmentType: ap.equipmentType }],
      });
    }
    if (ap.blendingDryingParameters?.length) {
      sections.push({
        sectionId: "blendingDryingParameters",
        sectionData: ap.blendingDryingParameters as Record<string, unknown>[],
      });
    }
    if (ap.dryingOperationRvd?.length) {
      sections.push({
        sectionId: "dryingOperationRvd",
        sectionData: ap.dryingOperationRvd as Record<string, unknown>[],
      });
    }
    if (ap.particleSizeDistribution?.length) {
      sections.push({
        sectionId: "particleSizeDistribution",
        sectionData: ap.particleSizeDistribution as Record<string, unknown>[],
      });
    }
  }
  if (entry.apFine) {
    const ap = entry.apFine;
    sections.push({
      sectionId: "apFineGrinding",
      sectionData: [
        {
          acmEquipmentId: ap.acmEquipmentId,
          millRpm: ap.millRpm,
          classifierRpm: ap.classifierRpm,
          screwFeederRpm: ap.screwFeederRpm,
          idFanRpm: ap.idFanRpm,
          setPressure: ap.setPressure,
          grindingStartDatetime: ap.grindingStartDatetime,
          grindingEndDatetime: ap.grindingEndDatetime,
          grindingObservation: ap.grindingObservation,
          qtyKgQualified: ap.qtyKgQualified,
        },
      ],
    });
    if (ap.particleSizeDistribution?.length) {
      sections.push({
        sectionId: "particleSizeDistribution",
        sectionData: ap.particleSizeDistribution as Record<string, unknown>[],
      });
    }
    if (ap.blendingDryingParameters?.length) {
      sections.push({
        sectionId: "blendingDryingParameters",
        sectionData: ap.blendingDryingParameters as Record<string, unknown>[],
      });
    }
    if (ap.dryingOperationRvd?.length) {
      sections.push({
        sectionId: "dryingOperationRvd",
        sectionData: ap.dryingOperationRvd as Record<string, unknown>[],
      });
    }
    if (ap.trayOvenStorage) {
      const row: Record<string, unknown> = {};
      Object.entries(ap.trayOvenStorage).forEach(([k, v]) => {
        if (v != null && String(v).trim() !== "") row[k] = v;
      });
      if (Object.keys(row).length > 0) {
        sections.push({ sectionId: "trayOvenStorage", sectionData: [row] });
      }
    }
    if (ap.sieving) {
      const row: Record<string, unknown> = {};
      Object.entries(ap.sieving).forEach(([k, v]) => {
        if (v != null && String(v).trim() !== "") row[k] = v;
      });
      if (Object.keys(row).length > 0) {
        sections.push({ sectionId: "sieving", sectionData: [row] });
      }
    }
  }
  if (entry.apUltraFine) {
    const ap = entry.apUltraFine;
    sections.push({
      sectionId: "apUltraFineGrinding",
      sectionData: [
        {
          equipmentId: ap.equipmentId,
          screwFeederRpm: ap.screwFeederRpm,
          feedPressure: ap.feedPressure,
          grindingPressure: ap.grindingPressure,
          grindingStartDatetime: ap.grindingStartDatetime,
          grindingEndDatetime: ap.grindingEndDatetime,
          grindingObservation: ap.grindingObservation,
          particleSizeResult: ap.particleSizeResult,
          qtyKgQualified: ap.qtyKgQualified,
        },
      ],
    });
    if (ap.drying) {
      const row: Record<string, unknown> = {};
      Object.entries(ap.drying).forEach(([k, v]) => {
        if (v != null && String(v).trim() !== "") row[k] = v;
      });
      if (Object.keys(row).length > 0) {
        sections.push({ sectionId: "dryingTrayOven", sectionData: [row] });
      }
    }
    if (ap.sieving) {
      const row: Record<string, unknown> = {};
      Object.entries(ap.sieving).forEach(([k, v]) => {
        if (v != null && String(v).trim() !== "") row[k] = v;
      });
      if (Object.keys(row).length > 0) {
        sections.push({ sectionId: "sieving", sectionData: [row] });
      }
    }
  }
  if (entry.aluminum) {
    const al = entry.aluminum;
    sections.push({
      sectionId: "aluminumProcessing",
      sectionData: [
        {
          equipmentId: al.equipmentId,
          setRpm: al.setRpm,
          startDatetime: al.startDatetime,
          endDatetime: al.endDatetime,
          observation: al.observation,
          qtyKgQualified: al.qtyKgQualified,
          dispatchDatetime: al.dispatchDatetime,
        },
      ],
    });
  }
  if (entry.doa) {
    const d = entry.doa;
    sections.push({
      sectionId: "doaProcessing",
      sectionData: [
        {
          dispatchDatetime: d.dispatchDatetime,
          observation: d.observation,
          totalQtySentForPremix: d.totalQtySentForPremix,
        },
      ],
    });
  }
  return sections;
};

export const resolveUiKeyForProcessEntry = (
  slot: "solid" | "liquid",
  entry: PreparationProcessEntry | null | undefined,
  materialCode: string,
  resolveUiKey: (params: { materialCode: string; slot: "solid" | "liquid" }) => RmpMaterialUiKey,
): RmpMaterialUiKey => {
  if (entry?.processType) return processTypeToUiKey(entry.processType);
  return resolveUiKey({ materialCode, slot });
};
