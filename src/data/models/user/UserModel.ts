import { normalizeRole } from "../../../utils/roleMapper";
import { DepartmentModel } from "./DepartmentModel";
import { TokenModel } from "./TokenModel";
/* ─────────────────────────────────────────────────────────────────────────────
   UserModel — the canonical logged-in user
   Built from the API response via UserModel.fromApi(apiResponse)

   API shape expected:
   {
     data: {
       user: {
         userId, username,
         role: { roleId, roleName },
         departments: [{ departmentId, departmentName, subDepartments: [...] }]
       },
       tokens: { accessToken, refreshToken, accessTokenExpiry }
     }
   }
───────────────────────────────────────────────────────────────────────────── */
export class UserModel {
  userId: number;
  username: string;
  roleId: number;
  role: string;
  departments: DepartmentModel[];
  tokens: TokenModel;
  /** Optional profile image URL if the API provides one */
  avatarUrl?: string | null;

  constructor({
    userId,
    username,
    roleId,
    roleName,           // normalized: "ADMIN" | "USER" | "APPROVER" | "SYSTEM_MANAGER"
    departments,        // DepartmentModel[]
    tokens,             // TokenModel
  }: {
    userId: number;
    username: string;
    roleId: number;
    roleName: string;
    departments: DepartmentModel[];
    tokens: TokenModel;
  }) {
    this.userId = userId;
    this.username = username;
    this.roleId = roleId;
    this.role = roleName;  // kept as `role` so existing store/selectors don't break
    this.departments = departments;
    this.tokens = tokens;
  }

  /* ── Static factory — builds from raw API response ── */
  static fromApi(apiResponse: { data: Record<string, unknown> }) {
    if (!apiResponse.data || typeof apiResponse.data !== 'object') {
      throw new Error('Invalid API response structure');
    }
    const { user, token } = apiResponse.data as {
      user: {
        userId: any;
        username: any;
        role: { roleId: number; roleName: string };
        departments: { departmentId: any; departmentName: any; subDepartments?: any[] }[];
      };
      token: any;
    };
    if (!user || !token) {
      throw new Error('Missing user or token in API response');
    }

    return new UserModel({
      userId: user.userId as number,
      username: user.username as string,
      roleId: user.role.roleId,
      roleName: normalizeRole(user.role.roleName),
      departments: user.departments.map(
        (d) => new DepartmentModel(d as { departmentId: any; departmentName: any; subDepartments?: any[] }),
      ),
      tokens: new TokenModel({
        accessToken: token.accessToken as string,
        refreshToken: token.refreshToken as string,
        accessTokenExpiry: (token.expiresIn as number) * 1000, // convert seconds to ms
      }),
    });
  }

  /* ── Serialise to a plain object for localStorage / Zustand persist ── */
  toJSON() {
    return {
      userId: this.userId,
      username: this.username,
      roleId: this.roleId,
      role: this.role,
      departments: this.departments.map((dept) => ({
        departmentId: dept.departmentId,
        departmentName: dept.departmentName,
        subDepartments: dept.subDepartments.map((sub) => ({
          subDepartmentId: sub.subDepartmentId,
          subDepartmentName: sub.subDepartmentName,
          departmentId: sub.departmentId,
          departmentName: sub.departmentName,
        })),
      })),
      tokens: {
        accessToken: this.tokens.accessToken,
        refreshToken: this.tokens.refreshToken,
        accessTokenExpiry: this.tokens.accessTokenExpiry,
      },
    };
  }

  /* ── Rehydrate from plain JSON (e.g. from localStorage on refresh) ── */
  static fromJSON(plain: unknown): UserModel | null {
    if (!plain || typeof plain !== "object") return null;
    const p = plain as Record<string, unknown>;
    return new UserModel({
      userId: p.userId as number,
      username: p.username as string,
      roleId: p.roleId as number,
      roleName: p.role as string,
      departments: ((p.departments ?? []) as Record<string, unknown>[]).map(
        (d) => new DepartmentModel(d as { departmentId: any; departmentName: any; subDepartments?: any[] }),
      ),
      tokens: new TokenModel((p.tokens as Record<string, unknown>) ?? {}),
    });
  }

copyWith(patch: { accessToken?: string; refreshToken?: string }): UserModel {
  const updated = UserModel.fromJSON(this.toJSON());
  if (!updated) throw new Error("copyWith: fromJSON returned null");
  
  // ✅ Patch tokens object directly — not the getter properties
  if (patch.accessToken) updated.tokens.accessToken = patch.accessToken;
  if (patch.refreshToken) updated.tokens.refreshToken = patch.refreshToken;
  
  return updated;
}

  /* ══ Computed helpers ══════════════════════════════════════════════════════ */

  /**
   * Flat list of ALL sub-departments across all departments.
   * SubDepartmentModel[]
   * Use anywhere you need to iterate or display the user's full access list.
   */
  get allSubDepartments() {
    return this.departments.flatMap((d) => d.subDepartments);
  }

  /**
   * Options for the login-page sub-department dropdown.
   * [{ value: subDepartmentId, label: subDepartmentName }]
   */
  get subDepartmentOptions() {
    return this.allSubDepartments.map((s) => s.asOption);
  }

  /**
   * Options for the AppHeader department switcher.
   * [{ value: "rocket-motor", label: "Sourcing - Rocket Motor Casing", dept: "sourcing" }]
   */
  get headerDeptOptions() {
    return this.allSubDepartments
      .map((s) => s.asHeaderOption)
      .filter(Boolean);
  }

  /**
   * Returns true if the user has access to a given subDepartmentId.
   * Used as an access-gate after login.
   */
  hasSubDeptAccess(subDepartmentId: string | number) {
    return this.allSubDepartments.some(
      (s) => s.subDepartmentId === Number(subDepartmentId)
    );
  }

  /**
   * Look up a single SubDepartmentModel by its ID.
   */
  getSubDepartment(subDepartmentId: string | number) {
    return this.allSubDepartments.find(
      (s) => s.subDepartmentId === Number(subDepartmentId)
    ) ?? null;
  }

  /**
   * Look up a DepartmentModel by its ID.
   */
  getDepartment(departmentId: string | number) {
    return this.departments.find(
      (d) => d.departmentId === Number(departmentId)
    ) ?? null;
  }

  /** Convenience: is this user an Admin or System Manager? */
  get isAdmin() {
    return this.role === "ADMIN" || this.role === "SYSTEM_MANAGER";
  }

  /** Convenience: does this role require a sub-department selection? */
  get requiresDept() {
    return this.role === "USER" || this.role === "APPROVER";
  }

  /** Access token (shortcut so callers don't need to go through .tokens) */
  get accessToken() {
    return this.tokens?.accessToken ?? null;
  }

  get refreshToken() {
    return this.tokens?.refreshToken ?? null;
  }
}