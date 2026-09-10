/** Subdepartment numeric IDs for stage lookups (not used for lock logic). */
export const SUB_DEPT = {
  RMP: 3,
  CP: 4,
  MIXING: 5,
  CC: 6,
  POST_CURE: 7,
  SUBSCALE: 8,
  TRIMMING: 9,
  NDT: 10,
  QC: 11,
  STF: 12,
  DISPATCH: 13,
} as const;

export type SubDeptId = (typeof SUB_DEPT)[keyof typeof SUB_DEPT];

export interface PremixUnit {
  premixNo: number;
  division?: string;
  subType?: string;
  stageType?: "PREMIX" | "FINAL_MIX";
  premixSubmissionType?: string;
  premixSubmissionStatus?: string;
  locked?: boolean | null;
}

export interface MotorUnit {
  motorId: string;
  division?: string;
  subType?: "MAIN_MOTOR" | "BEM" | string;
  motorSubmissionType?: string;
  motorSubmissionStatus?: string;
  locked?: boolean | null;
}

export interface StageProgress {
  departmentId?: number;
  departmentName?: string;
  subDepartmentId: number;
  subDepartmentName?: string;
  status?: string;
  premixStatuses?: PremixUnit[];
  finalMixStatuses?: PremixUnit[];
  motorStatuses?: MotorUnit[];
  divisionStatuses?: unknown[];
}

export interface BatchView {
  batchId: string;
  batchType: "MAIN" | "SUBSCALE" | string;
  parallelFlowEnabled?: boolean | null;
  motorIds?: string[];
  currentStage?: StageProgress[];
  stageProgress?: StageProgress[];
  identificationSheet?: { numberOfPremix?: number };
}
