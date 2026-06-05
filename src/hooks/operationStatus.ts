export const OPERATION_STATUS = {
  INITIATED: "Initiated",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_APPROVAL: "Waiting for Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

export type OperationStatus = (typeof OPERATION_STATUS)[keyof typeof OPERATION_STATUS];

type OperationStatusIconMap = {
  initiated: any;
  inProgress: any;
  waitingForApproval: any;
  approved: any;
  rejected: any;
};

export const getOperationStatusConfig = (icons: OperationStatusIconMap) => ({
  [OPERATION_STATUS.INITIATED]: {
    Icon: icons.initiated,
    label: OPERATION_STATUS.INITIATED,
  },
  [OPERATION_STATUS.IN_PROGRESS]: {
    Icon: icons.inProgress,
    label: OPERATION_STATUS.IN_PROGRESS,
  },
  [OPERATION_STATUS.WAITING_FOR_APPROVAL]: {
    Icon: icons.waitingForApproval,
    label: OPERATION_STATUS.WAITING_FOR_APPROVAL,
  },
  [OPERATION_STATUS.APPROVED]: {
    Icon: icons.approved,
    label: OPERATION_STATUS.APPROVED,
  },
  [OPERATION_STATUS.REJECTED]: {
    Icon: icons.rejected,
    label: OPERATION_STATUS.REJECTED,
  },
});
