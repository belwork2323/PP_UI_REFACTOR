import { getSlugsFromNames } from "../../../utils/roleMapper";
/* ─────────────────────────────────────────────────────────────────────────────
   SubDepartment — represents a single sub-department the user has access to
───────────────────────────────────────────────────────────────────────────── */
export class SubDepartmentModel {
  subDepartmentId: number;
  subDepartmentName: string;
  departmentId: number;
  departmentName: string;

  constructor({
    subDepartmentId,
    subDepartmentName,
    departmentId,
    departmentName,
  }: {
    subDepartmentId: number | string;
    subDepartmentName: string;
    departmentId: number | string;
    departmentName: string;
  }) {
    this.subDepartmentId = Number(subDepartmentId);
    this.subDepartmentName = subDepartmentName;
    this.departmentId = Number(departmentId);
    this.departmentName = departmentName;
  }

  /** URL slug mapping for this sub-department, e.g. { dept: "sourcing", subDept: "rocket-motor" } */
  get slugs() {
    return getSlugsFromNames(this.departmentName, this.subDepartmentName) ?? null;
  }

  /** Full URL path segment: "sourcing/rocket-motor" */
  get urlPath() {
    const s = this.slugs;
    return s ? `${s.dept}/${s.subDept}` : null;
  }

  /** Dropdown option shape { value, label } */
  get asOption() {
    return {
      value: this.subDepartmentId,
      label: this.subDepartmentName,
    };
  }

  /** Header switcher option shape { value: slug, label, dept } */
  get asHeaderOption() {
    const s = this.slugs;
    if (!s) return null;
    return {
      value: s.subDept,
      label: this.subDepartmentName,
      dept: s.dept,
    };
  }
}