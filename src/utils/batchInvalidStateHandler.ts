type ApiErrorShape = {
  code?: string;
  message?: string;
  statusCode?: number;
};

const extractErrorShape = (error: unknown): ApiErrorShape => {
  if (!error || typeof error !== "object") return {};
  const source = error as Record<string, unknown>;
  const nested =
    source.response && typeof source.response === "object"
      ? (source.response as Record<string, unknown>)
      : null;
  const nestedData =
    nested?.data && typeof nested.data === "object"
      ? (nested.data as Record<string, unknown>)
      : null;

  return {
    code: String(source.code ?? nestedData?.code ?? nested?.code ?? "").trim() || undefined,
    message: String(
      source.message ?? nestedData?.message ?? nested?.message ?? "Request failed.",
    ).trim(),
    statusCode: Number(source.statusCode ?? nested?.status ?? nestedData?.statusCode ?? 0) || undefined,
  };
};

export async function handleBatchInvalidState(
  error: unknown,
  refetch: () => Promise<void>,
  showAlert: (message: string, severity: "error" | "warning" | "success" | "info") => void,
): Promise<boolean> {
  const parsed = extractErrorShape(error);
  const code = String(parsed.code ?? "").trim().toUpperCase();
  const isInvalidState = code === "INVALID_STATE" || parsed.statusCode === 409;

  if (!isInvalidState) return false;

  showAlert(parsed.message || "This unit is not yet unlocked.", "error");
  await refetch();
  return true;
}
