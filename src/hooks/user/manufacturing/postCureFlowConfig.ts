import { STRINGS } from "../../../app/config/strings";
import {
  isPostCureInhibitionOperation,
  mapPostCureInhibitorTypeToApi,
  mapPostCureOperationToApi,
  type PostCureMotorOption,
} from "./postCureConfig";

const S = STRINGS.MANUFACTURING.POST_CURE;

export type PostCureAddedMotor = {
  motorId: string;
  motorReceiptDate: string;
};

const hasValidSetup = (operation: string, inhibitorType: string) => {
  if (!mapPostCureOperationToApi(operation)) return false;
  if (isPostCureInhibitionOperation(operation) && !mapPostCureInhibitorTypeToApi(inhibitorType)) {
    return false;
  }
  return true;
};

export const canLoadPostCureForm = ({
  motorId,
  motorReceiptDate,
  operation,
  inhibitorType,
  schemaFormLoaded,
}: {
  motorId: string;
  motorReceiptDate: string;
  operation: string;
  inhibitorType: string;
  schemaFormLoaded: boolean;
}) => {
  // Allow initial load only when schema isn't loaded yet
  if (schemaFormLoaded) return false;
  if (!String(motorId ?? "").trim()) return false;
  if (!String(motorReceiptDate ?? "").trim()) return false;
  return hasValidSetup(operation, inhibitorType);
};
export const canAddPostCureMotor = ({
  motorId,
  motorReceiptDate,
  operation,
  inhibitorType,
  usedMotorIds,
  availableMotorOptions,
}: {
  motorId: string;
  motorReceiptDate: string;
  operation: string;
  inhibitorType: string;
  usedMotorIds: string[];
  availableMotorOptions: PostCureMotorOption[];
}) => {
  const id = String(motorId ?? "").trim();
  if (!id || !String(motorReceiptDate ?? "").trim()) return false;
  if (!hasValidSetup(operation, inhibitorType)) return false;
  if (usedMotorIds.includes(id)) return false;
  if (
    availableMotorOptions.length > 0 &&
    !availableMotorOptions.some((option) => option.value === id)
  ) {
    return false;
  }
  return true;
};
