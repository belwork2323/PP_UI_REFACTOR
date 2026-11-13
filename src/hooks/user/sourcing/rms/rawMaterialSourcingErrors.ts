export const getRawMaterialSourcingErrorMessage = (response: any, fallbackMessage: string) => {
  const details = response?.error?.details;
  if (details) return String(details);
  if (response?.message) return response.message;
  return fallbackMessage;
};
