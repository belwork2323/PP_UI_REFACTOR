import {
  SYSTEM,
  USER_OPERATIONS_ENDPOINTS,
  ADMIN_ENDPOINTS,
  USER_CASTING_CURING_FORM_ENDPOINTS,
  APPROVER_ENDPOINTS,
} from "@data/api/endPoints";
import { generalController } from "@controllers/admin/common/generalController";
import { fetchCastingStationsApi } from "@data/api/users/operationsApi";
import { operationsController } from "@controllers/user/operationsController";
import { fetchSpecificationForSubdepartment } from "@data/api/users/sourcing/rocketMotorCasingProcurementApi";
import { fetchCuringCyclesApi } from "@data/api/users/manufacturing/castingCuringFormApi";
import { fetchQualityCheck } from "@data/api/users/manufacturing/mixingFormApi";
import { fetchQcDivisionCatalogApi } from "@data/api/approver/qcDivisionApproverApi";

export type MasterDataApiSource = "admin" | "system";

export type MasterDataApiDetails = {
  name: string;
  method: "GET" | "POST";
  endpoint: string;
  request: Record<string, unknown> | null;
  response: unknown;
};

type SystemApiMeta = {
  name: string;
  method: "GET" | "POST";
  endpoint: string;
  request: Record<string, unknown> | null;
  fetch: () => Promise<unknown>;
};

const SYSTEM_API_BY_TYPE: Record<string, SystemApiMeta> = {
  mixers: {
    name: "Mixer master list",
    method: "GET",
    endpoint: SYSTEM.MIXERS,
    request: null,
    fetch: async () => {
      const resp = await generalController.getMixers();
      if (!resp.success) throw new Error(resp.message || "Failed to load mixers");
      return resp.data;
    },
  },
  buildings: {
    name: "Building master list",
    method: "GET",
    endpoint: SYSTEM.BUILDINGS,
    request: null,
    fetch: async () => {
      const resp = await generalController.getBuildings();
      if (!resp.success) throw new Error(resp.message || "Failed to load buildings");
      return resp.data;
    },
  },
  ovens: {
    name: "Oven master list",
    method: "GET",
    endpoint: SYSTEM.OVENS,
    request: null,
    fetch: async () => {
      const resp = await generalController.getOvens();
      if (!resp.success) throw new Error(resp.message || "Failed to load ovens");
      return resp.data;
    },
  },
  equipment: {
    name: "Equipment master list",
    method: "GET",
    endpoint: SYSTEM.EQUIPMENT_LIST,
    request: null,
    fetch: async () => {
      const resp = await generalController.getEquipmentList();
      if (!resp.success) throw new Error(resp.message || "Failed to load equipment");
      return resp.data;
    },
  },
  "beam-energy": {
    name: "Beam energy master list",
    method: "GET",
    endpoint: SYSTEM.ENERGY_BEAM_LIST,
    request: null,
    fetch: async () => {
      const resp = await generalController.getBeamEnergyList();
      if (!resp.success) throw new Error(resp.message || "Failed to load beam energy");
      return resp.data;
    },
  },
  "casting-stations": {
    name: "Casting station list",
    method: "GET",
    endpoint: USER_OPERATIONS_ENDPOINTS.CASTING_STATION_LIST,
    request: null,
    fetch: async () => {
      const body = await fetchCastingStationsApi();
      return (body as any)?.data ?? body;
    },
  },
  "subscale-articles": {
    name: "Subscale article master list",
    method: "GET",
    endpoint: SYSTEM.SUBSCALE_ARTICLES,
    request: { isActive: true },
    fetch: async () => {
      const resp = await generalController.getSubscaleArticles();
      if (!resp.success) throw new Error(resp.message || "Failed to load subscale articles");
      return resp.data;
    },
  },
  materials: {
    name: "Materials list (ops, active only)",
    method: "POST",
    endpoint: USER_OPERATIONS_ENDPOINTS.MATERIALS_LIST,
    request: { materialType: "BOTH" },
    fetch: async () => {
      const resp = await operationsController.fetchMaterialsList({ materialType: "BOTH" });
      if (!resp.success) throw new Error(resp.message || "Failed to load materials");
      return resp.data;
    },
  },
  "insulation-specifications": {
    name: "Insulation specification list (ops)",
    method: "POST",
    endpoint: USER_OPERATIONS_ENDPOINTS.FETCH_SPECIFICATION,
    request: { insulationType: "ROCASIN" },
    fetch: async () => {
      const body = await fetchSpecificationForSubdepartment({ insulationType: "ROCASIN" });
      return (body as any)?.data ?? body;
    },
  },
  "motor-stages": {
    name: "Motor stage list (ops, active only)",
    method: "GET",
    endpoint: USER_OPERATIONS_ENDPOINTS.MOTORS_STAGE_LIST,
    request: null,
    fetch: async () => {
      const resp = await operationsController.fetchMotorsStageList();
      if (!resp.success) throw new Error(resp.message || "Failed to load motor stages");
      return resp.data;
    },
  },
  "dimensional-parameters": {
    name: "Dimensional parameters list (ops, active only)",
    method: "POST",
    endpoint: USER_OPERATIONS_ENDPOINTS.DIMENSIONAL_PARAMETERS_LIST,
    request: { motorType: "1" },
    fetch: async () => {
      const resp = await operationsController.fetchDimensionalParametersList({ motorType: "1" });
      if (!resp.success) throw new Error(resp.message || "Failed to load dimensional parameters");
      return resp.data;
    },
  },
  "mixing-cycles": {
    name: "Mixing cycle list (ops, active only)",
    method: "POST",
    endpoint: SYSTEM.MIXING_CYCLE_LIST,
    request: { motorStage: "ALL" },
    fetch: async () => {
      const resp = await generalController.getMixingCycles("ALL");
      if (!resp.success) throw new Error(resp.message || "Failed to load mixing cycles");
      return resp.data;
    },
  },
  "curing-cycles": {
    name: "Curing cycles (ops, active only)",
    method: "POST",
    endpoint: USER_CASTING_CURING_FORM_ENDPOINTS.CURING_CYCLES,
    request: { motorStage: 1 },
    fetch: async () => {
      const body = await fetchCuringCyclesApi({ motorStage: 1 });
      return (body as any)?.data ?? body;
    },
  },
  "quality-checks": {
    name: "Quality checks (ops, active only)",
    method: "POST",
    endpoint: SYSTEM.GET_QUALITY_CHECKS,
    request: { mixType: "PREMIX", motorStage: 1 },
    fetch: async () => {
      const body = await fetchQualityCheck("PREMIX", 1);
      return (body as any)?.data ?? body;
    },
  },
  "qc-divisions": {
    name: "QC division catalog (ops)",
    method: "GET",
    endpoint: APPROVER_ENDPOINTS.QC_DIVISIONS,
    request: null,
    fetch: async () => {
      const body = await fetchQcDivisionCatalogApi();
      return (body as any)?.data ?? body;
    },
  },
};

const NESTED_ADMIN_LIST: Record<string, string> = {
  materials: ADMIN_ENDPOINTS.MASTER_DATA.MATERIALS.LIST,
  "insulation-specifications": ADMIN_ENDPOINTS.MASTER_DATA.INSULATION.LIST,
  "mixing-cycles": ADMIN_ENDPOINTS.MASTER_DATA.MIXING_CYCLES.LIST,
  "curing-cycles": ADMIN_ENDPOINTS.MASTER_DATA.CURING_CYCLES.LIST,
  "quality-checks": ADMIN_ENDPOINTS.MASTER_DATA.QUALITY_CHECKS.LIST,
  "qc-divisions": ADMIN_ENDPOINTS.MASTER_DATA.QC_DIVISIONS.LIST,
};

export const getAdminListApiDetails = (
  type: string,
  request: Record<string, unknown>,
  response: unknown,
): MasterDataApiDetails => ({
  name: "Admin master data list",
  method: "POST",
  endpoint: NESTED_ADMIN_LIST[type] ?? ADMIN_ENDPOINTS.MASTER_DATA.LIST(type),
  request,
  response,
});

export const getSystemApiMeta = (type: string): SystemApiMeta | null =>
  SYSTEM_API_BY_TYPE[type] ?? null;

export const fetchSystemListApiDetails = async (type: string): Promise<MasterDataApiDetails> => {
  const meta = getSystemApiMeta(type);
  if (!meta) {
    throw new Error(`No system list API mapped for type: ${type}`);
  }
  const response = await meta.fetch();
  return {
    name: meta.name,
    method: meta.method,
    endpoint: meta.endpoint,
    request: meta.request,
    response,
  };
};
