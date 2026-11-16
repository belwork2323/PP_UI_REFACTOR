import { resolveApiErrorMessage } from "@utils/resolveApiErrorMessage";

export const getRawMaterialSourcingErrorMessage = (response: any, fallbackMessage: string) =>
  resolveApiErrorMessage(response, fallbackMessage);
