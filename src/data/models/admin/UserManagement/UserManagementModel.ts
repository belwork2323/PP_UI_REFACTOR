/* ─────────────────────────────────────────
   UserListItemModel
   Maps a single user from the API/mock
   to the shape the UI expects.
───────────────────────────────────────── */
export class UserListItemModel {
  id: unknown;
  userUUID: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  department: unknown;
  subDepartments: unknown[];
  isActive: boolean;
  createdOn: unknown;
  createdBy: unknown;

  constructor({
    id,
    userUUID,
    userId,
    username,
    fullName,
    email,
    role,
    department,
    subDepartments,
    isActive,
    createdOn,
    createdBy,
  }: Record<string, unknown>) {
    this.id = id;
    this.userUUID = (userUUID as string) || (id as string) || "";
    this.userId = userId as string;
    this.username = username as string;
    this.fullName = fullName as string;
    this.email = email as string;
    this.role = role as string;
    this.department = department;
    this.subDepartments = Array.isArray(subDepartments) ? subDepartments : [];
    this.isActive = (isActive as boolean) ?? true;
    this.createdOn = createdOn ?? null;
    this.createdBy = createdBy ?? null; // { userId, username, role }
  }

  static fromApi(data: any) {
    const departmentSource = Array.isArray(data.departments)
      ? data.departments
      : Array.isArray(data.department)
        ? data.department
        : data.department;

    let extractedSubDepts = data.subDepartments ?? [];
    let extractedDept = departmentSource?.departmentName || departmentSource || "";

    // The API sends an array of departments, each containing its own subDepartments array.
    if (Array.isArray(departmentSource)) {
      extractedSubDepts = [];
      const deptNames: string[] = [];
      departmentSource.forEach((dept: any) => {
        if (dept.departmentName) deptNames.push(dept.departmentName);
        if (Array.isArray(dept.subDepartments)) {
          dept.subDepartments.forEach((sd: any) => {
            // Include department references just in case hooks need them
            extractedSubDepts.push({
              ...sd,
              departmentId: dept.departmentId,
              departmentName: dept.departmentName,
            });
          });
        }
      });
      extractedDept = deptNames.join(", ");
    }

    return new UserListItemModel({
      id: data.userUUID || data.user_uuid || data.userId || data.id,
      userUUID: data.userUUID || data.user_uuid || data.id || "",
      userId: data.userId ?? "",
      username: data.username ?? "",
      fullName: data.fullName || data.username || "",
      email: data.email || "",
      role: data.role?.roleName || data.role || "",
      department: extractedDept,
      subDepartments: extractedSubDepts,
      isActive: data.status === "ACTIVE" || data.isActive === true,
      createdOn: data.createdOn,
      createdBy: data.createdBy,
    });
  }
}

/* ─────────────────────────────────────────
   CreateUserPayload
   Builds the request body for user creation.
───────────────────────────────────────── */
export class CreateUserPayload {
  username: string;
  fullName: string;
  email: string;
  role: unknown;
  department: unknown;
  subDepartments: unknown[];
  isActive: boolean;
  createdOn: string;
  createdBy: unknown;

  constructor(form: Record<string, unknown>, createdBy: unknown) {
    this.username = form.username as string;
    this.fullName = form.fullName as string;
    this.email = (form.email as string) ?? "";
    this.role = form.role;
    this.department = form.department;
    this.subDepartments = Array.isArray(form.subDepartments) ? form.subDepartments : [];
    this.isActive = (form.isActive as boolean) ?? true;
    this.createdOn = new Date().toISOString();
    this.createdBy = createdBy; // { userId, username, role }
  }
}

export class UpdateUserPayload {
  fullName: string;
  email: string;
  role: unknown;
  department: unknown;
  subDepartments: unknown[];
  isActive: unknown;
  updatedBy: unknown;

  constructor(form: Record<string, unknown>, updatedBy: unknown) {
    this.fullName = form.fullName as string;
    this.email = form.email as string;
    this.role = form.role;
    this.department = form.department;
    this.subDepartments = Array.isArray(form.subDepartments) ? form.subDepartments : [];
    this.isActive = form.isActive;
    this.updatedBy = updatedBy; // { userId, username, role }
  }
}

export type UserFormState = {
  username: string;
  userId: string;
  role: string;
  subDepts: any[];
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const asUuid = (value: unknown) => {
  const v = String(value ?? "").trim();
  return UUID_REGEX.test(v) ? v : "";
};

export const resolveUserUuid = (user: any): string =>
  asUuid(user?.userUUID) || asUuid(user?.user_uuid) || asUuid(user?.uuid) || asUuid(user?.id) || "";

export const normalizeSubDepartmentIds = (values: any[]): number[] =>
  Array.from(
    new Set(
      (values || []).map((value: any) => Number(value)).filter((id: number) => Number.isFinite(id)),
    ),
  ).sort((a, b) => a - b);

export const createEmptyUserFormState = (): UserFormState => ({
  username: "",
  userId: "",
  role: "",
  subDepts: [],
});

export const mapUserToFormState = (user: any): UserFormState => ({
  username: user?.username || "",
  userId: user?.userId || "",
  role: user?.role?.roleName || user?.role || "",
  subDepts: Array.isArray(user?.subDepartments) ? user.subDepartments : [],
});

export const mapUserDetailsToFormState = (details: any, fallbackUser?: any): UserFormState => ({
  username: details?.username || "",
  userId: (details?.userId || fallbackUser?.userId || "") as string,
  role: details?.role || "",
  subDepts: Array.isArray(details?.subDepartments) ? details.subDepartments : [],
});
