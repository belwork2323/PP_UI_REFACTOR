import { get } from "../httpClient";
import { SYSTEM } from "../endPoints";
import { AppError } from "../../../utils/AppError";
import { STRINGS } from "../../../app/config/strings";

const publicGet = (url, params = {}) => get(url, params, { skipAuth: true });

/**
 * HTTP 200 envelope: `{ success: false, statusCode, message, error, data }`
 */
const assertSuccessEnvelope = (body) => {
  if (body != null && typeof body === "object" && body.success === false) {
    const status =
      typeof body.statusCode === "number" ? body.statusCode : 500;
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
          departmentId:
            sd.departmentId ?? sd.department_id ?? d.departmentId ?? d.id,
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
      list = list.filter(
        (s) => Number(s.departmentId) === Number(departmentId),
      );
    }
    return list;
  } catch (error) {
    wrapLookupError(error);
  }
};
