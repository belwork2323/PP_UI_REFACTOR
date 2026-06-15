import type { SchemaFieldOption } from "../models/schema.types";

export type ResolvedFieldOption = {
  label: string;
  value: string;
};

export const resolveFieldOptions = (options?: SchemaFieldOption[]): ResolvedFieldOption[] =>
  (options ?? []).map((opt) => {
    if (typeof opt === "string") {
      return { label: opt, value: opt };
    }
    return {
      label: String(opt.label ?? opt.value ?? ""),
      value: String(opt.value ?? opt.label ?? ""),
    };
  });
