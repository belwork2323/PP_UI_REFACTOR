import { SubDepartmentModel } from "@data/models/user/SubDepartmentModel";
import type { AlertSeverity } from "@app/store/alertStore";

export type LoginRoleOption = {
  roleId: number;
  roleName: string;
};

export type LookupAlert = {
  message: string;
  severity: AlertSeverity;
};

export type LoginLookupsResult = {
  roles: LoginRoleOption[];
  subDepartments: SubDepartmentModel[];
  alerts: LookupAlert[];
};

export function parseLoginRole(raw: unknown): LoginRoleOption | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const roleId = Number(item.roleId);
  const roleName = String(item.roleName ?? "");
  if (!roleId || !roleName) return null;
  return { roleId, roleName };
}

export function parseLoginRoles(data: unknown[]): LoginRoleOption[] {
  return data.map(parseLoginRole).filter((r): r is LoginRoleOption => r !== null);
}

export function parseLoginSubDepartments(data: unknown[]): SubDepartmentModel[] {
  return data
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      if (raw.subDepartmentId == null || !raw.subDepartmentName) return null;
      return new SubDepartmentModel({
        subDepartmentId: raw.subDepartmentId as number | string,
        subDepartmentName: String(raw.subDepartmentName),
        departmentId: (raw.departmentId as number | string) ?? 0,
        departmentName: String(raw.departmentName ?? ""),
      });
    })
    .filter((s): s is SubDepartmentModel => s !== null);
}
