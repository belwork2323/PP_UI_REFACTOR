import { get, post } from "../httpClient";
import { SYSTEM } from "../endPoints";
import { AppError } from "../../../utils/AppError";
import { STRINGS } from "../../../app/config/strings";

const publicGet = (url, params = {}) => get(url, params, { skipAuth: true });

/**
 * HTTP 200 envelope: `{ success: false, statusCode, message, error, data }`
 */
const assertSuccessEnvelope = (body) => {
  if (body != null && typeof body === "object" && body.success === false) {
    const status = typeof body.statusCode === "number" ? body.statusCode : 500;
    const message =
      typeof body.message === "string" && body.message.trim()
        ? body.message
        : STRINGS.SYSTEM.UNEXPECTED_ERROR;
    throw new AppError({
      status,
      message,
      details: body.error ?? null,
    });
  }
};

/**
 * Backend returns `{ success, code, message, data: T | T[] }` or a raw array.
 */
const unwrapData = (body) => {
  if (body == null) return null;
  if (Array.isArray(body)) return body;
  if (typeof body === "object" && body.data !== undefined) return body.data;
  return body;
};

const asList = (body) => {
  const raw = unwrapData(body);
  return Array.isArray(raw) ? raw : [];
};

/** Re-throw AppError; normalize unexpected failures so callers always see AppError. */
const wrapLookupError = (error, fallbackMessage = STRINGS.SYSTEM.UNEXPECTED_ERROR) => {
  if (error instanceof AppError) throw error;
  const message =
    error && typeof error.message === "string" && error.message.trim()
      ? error.message
      : fallbackMessage;
  throw new AppError({ status: 0, message, details: error });
};

/* ─────────────────────────────────────────
   System lookup — GET api/v1/system/*
   No auth. Shapes match backend (see Swagger / API docs).
───────────────────────────────────────── */

/**
 * @returns {Promise<Array<{ roleId: number, roleName: string }>>}
 */
export const fetchRoles = async () => {
  try {
    const body = await publicGet(SYSTEM.ROLES);
    assertSuccessEnvelope(body);
    return asList(body).map((r) => ({
      roleId: r.roleId ?? r.id,
      roleName: r.roleName ?? r.name,
    }));
  } catch (error) {
    wrapLookupError(error);
  }
};

/**
 * @returns {Promise<Array<{ departmentId: number, departmentName: string, subDepartments?: Array<{ subDepartmentId: number, subDepartmentName: string }> }>>}
 */
export const fetchDepartments = async () => {
  try {
    const body = await publicGet(SYSTEM.DEPARTMENTS);
    assertSuccessEnvelope(body);
    return asList(body).map((d) => ({
      departmentId: d.departmentId ?? d.id,
      departmentName: d.departmentName ?? d.name,
      subDepartments: Array.isArray(d.subDepartments)
        ? d.subDepartments.map((sd) => ({
            subDepartmentId: sd.subDepartmentId ?? sd.id,
            subDepartmentName: sd.subDepartmentName ?? sd.name,
            departmentId: sd.departmentId ?? sd.department_id ?? d.departmentId ?? d.id,
          }))
        : [],
    }));
  } catch (error) {
    wrapLookupError(error);
  }
};

/**
 * @param {number|null|undefined} departmentId — optional server-side filter (?departmentId=)
 * @returns {Promise<Array<{ subDepartmentId: number, subDepartmentName: string, departmentId: number }>>}
 */
export const fetchSubDepartments = async (departmentId = null) => {
  try {
    const params = departmentId != null && departmentId !== "" ? { departmentId } : {};
    const body = await publicGet(SYSTEM.SUB_DEPARTMENTS, params);
    assertSuccessEnvelope(body);
    let list = asList(body).map((s) => ({
      subDepartmentId: s.subDepartmentId ?? s.id,
      subDepartmentName: s.subDepartmentName ?? s.name,
      departmentId: s.departmentId ?? s.department_id,
    }));
    if (departmentId != null && departmentId !== "") {
      list = list.filter((s) => Number(s.departmentId) === Number(departmentId));
    }
    return list;
  } catch (error) {
    wrapLookupError(error);
  }
};

export type SystemMasterOption = {
  id: number;
  code: string;
  name: string;
};

const mapSystemMasterOption = (row: Record<string, unknown>): SystemMasterOption => ({
  id: Number(row.id ?? 0),
  code: String(row.code ?? row.name ?? "").trim(),
  name: String(row.name ?? row.code ?? "").trim(),
});

/**
 * Mixer master — GET api/v1/system/mixers (authenticated)
 * @returns {Promise<SystemMasterOption[]>}
 */
export const fetchMixers = async (): Promise<SystemMasterOption[]> => {
  try {
    const body = await get(SYSTEM.MIXERS);
    assertSuccessEnvelope(body);
    return asList(body)
      .map(mapSystemMasterOption)
      .filter((item) => item.code);
  } catch (error) {
    wrapLookupError(error);
    return [];
  }
};

/**
 * Building master — GET api/v1/system/buildings (authenticated)
 * @returns {Promise<SystemMasterOption[]>}
 */
export const fetchBuildings = async (): Promise<SystemMasterOption[]> => {
  try {
    const body = await get(SYSTEM.BUILDINGS);
    assertSuccessEnvelope(body);
    return asList(body)
      .map(mapSystemMasterOption)
      .filter((item) => item.code);
  } catch (error) {
    wrapLookupError(error);
    return [];
  }
};

/** motorStage filter for mixing cycle master — always sent as string ("0" | "1" | "2" | "3" | "ALL") */
export type MixingCycleMotorStage = 0 | 1 | 2 | 3 | "ALL" | number | string;

export type MixingCycleMasterItem = {
  mixingCycleId: number;
  mixingCycleCode: string;
  mixingCycleName: string;
  motorStage: number;
};

/** Normalize to string for this API only — e.g. 0 → "0", 1 → "1", ALL → "ALL" */
const normalizeMixingCycleMotorStage = (
  motorStage: MixingCycleMotorStage | null | undefined,
): string => {
  if (motorStage === null || motorStage === undefined || motorStage === "") return "ALL";
  const raw = String(motorStage).trim();
  if (!raw || raw.toUpperCase() === "ALL") return "ALL";
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber)) return String(asNumber);
  return "ALL";
};

const mapMixingCycleMasterItem = (row: Record<string, unknown>): MixingCycleMasterItem => ({
  mixingCycleId: Number(row.mixingCycleId ?? row.id ?? 0),
  mixingCycleCode: String(row.mixingCycleCode ?? row.code ?? "").trim(),
  mixingCycleName: String(row.mixingCycleName ?? row.name ?? "").trim(),
  motorStage: Number(row.motorStage ?? 0),
});

/**
 * Mixing cycle master — POST api/v1/system/mixing-cycle-list (authenticated)
 * Request body: `{ motorStage: "0" | "1" | "2" | "3" | "ALL" }` (always string)
 */
export const fetchMixingCycles = async (
  motorStage: MixingCycleMotorStage = "ALL",
): Promise<MixingCycleMasterItem[]> => {
  try {
    const body = await post(SYSTEM.MIXING_CYCLE_LIST, {
      motorStage: normalizeMixingCycleMotorStage(motorStage),
    });
    assertSuccessEnvelope(body);
    return asList(body)
      .map(mapMixingCycleMasterItem)
      .filter((item) => item.mixingCycleId > 0 || Boolean(item.mixingCycleCode));
  } catch (error) {
    wrapLookupError(error);
    return [];
  }
};

export type SubscaleArticleOption = {
  subscaleArticleId: number;
  subscaleArticleCode: string;
  subscaleArticleName: string;
  displayOrder: number;
  isActive: boolean;
};

export type FetchSubscaleArticlesParams = {
  subBatchType?: string;
};

const mapSubscaleArticleOption = (row: Record<string, unknown>): SubscaleArticleOption => ({
  subscaleArticleId: Number(row.subscaleArticleId ?? row.id ?? 0),
  subscaleArticleCode: String(row.subscaleArticleCode ?? row.code ?? "").trim(),
  subscaleArticleName: String(row.subscaleArticleName ?? row.name ?? "").trim(),
  displayOrder: Number(row.displayOrder ?? 0),
  isActive: row.isActive !== false,
});

/**
 * Subscale article master — GET api/v1/system/subscale-articles (authenticated)
 * Used for Experimental subscale batch multi-select.
 */
export const fetchSubscaleArticles = async (
  params: FetchSubscaleArticlesParams = {},
): Promise<SubscaleArticleOption[]> => {
  try {
    const query: Record<string, string> = {};
    if (params.subBatchType) query.subBatchType = params.subBatchType;

    const body = await get(SYSTEM.SUBSCALE_ARTICLES, query);
    assertSuccessEnvelope(body);
    return asList(body)
      .map(mapSubscaleArticleOption)
      .filter((item) => Boolean(item.subscaleArticleName))
      .sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
        return a.subscaleArticleName.localeCompare(b.subscaleArticleName);
      });
  } catch (error) {
    wrapLookupError(error);
    return [];
  }
};
