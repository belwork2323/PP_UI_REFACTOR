import { SubDepartmentModel } from "./SubDepartmentModel";

/* ─────────────────────────────────────────────────────────────────────────────
   DepartmentModel — a department with its list of sub-departments
───────────────────────────────────────────────────────────────────────────── */
export class DepartmentModel {
  departmentId: number;
  departmentName: string;
  subDepartments: SubDepartmentModel[];

  constructor({
    departmentId,
    departmentName,
    subDepartments = [],
  }: {
    departmentId: number | string;
    departmentName: string;
    subDepartments?: { subDepartmentId: number | string; subDepartmentName: string; [key: string]: unknown }[];
  }) {
    this.departmentId   = Number(departmentId);
    this.departmentName = departmentName;
    this.subDepartments = subDepartments.map(
      (sub) => new SubDepartmentModel({
        ...sub,
        departmentId,
        departmentName,
      })
    );
  }
}