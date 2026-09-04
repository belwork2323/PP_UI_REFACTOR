# Validation framework

Shared intent-based validation for workflow forms. Each subdepartment owns one config file; hooks orchestrate tier runs and store `validationErrors` for UI.

## Tiers

| Tier | When | What |
|------|------|------|
| `FORMAT` | Live on field change | Type/format on non-empty values only |
| `UNIT` | Save draft, add lot, persist unit | Minimum fields to persist a lot/unit |
| `SUBMIT` | Submit for approval | All mandatory fields + business rules |

## Layout

```
src/data/validation/
  submissionIntent.ts    — ValidationTier, isRequiredForTier
  fieldValidators.ts     — shared primitives (date, number, text, file)
  validationErrors.ts    — fieldError, getVisibleFieldError
  runValidation.ts       — generic engine
  configs/               — one file per subdepartment
  adapters/              — thin wrappers + path helpers

src/ui/components/validation/
  ValidatedFormField.tsx
  FieldErrorText.tsx
  useValidationDisplay.ts
```

## Adding a subdepartment

1. Create `configs/{name}.validation.config.ts` with `fields`, `resolveFieldPaths`, optional `customRules` and `isUnitComplete`.
2. Create `adapters/{name}.validation.ts` exporting `validateX(data, tier)`.
3. In the form hook: `validationErrors` state, run tiers on change/actions, pass errors to components.
4. Add message strings under `STRINGS` and reference them from the config (no hardcoded copy in validators).

## Config template

```ts
import { STRINGS } from "@/app/config/strings";
import type { ValidationTier } from "../submissionIntent";
import type { SubDeptValidationConfig } from "../runValidation";

const M = STRINGS.YOUR_MODULE.VALIDATION;

export const yourValidationConfig: SubDeptValidationConfig<YourData> = {
  id: "your-subdepartment",
  fields: {
    fieldName: {
      valueType: "text",
      pattern: /^[A-Za-z0-9][A-Za-z0-9 /-]*$/,
      requiredIn: ["UNIT", "SUBMIT"] as ValidationTier[],
      messages: { required: M.fieldName.required, invalid: M.fieldName.invalid },
    },
  },
  resolveFieldPaths: (data) => [/* { path, value, ruleKey } */],
  customRules: [],
  isUnitComplete: (data) => true,
};
```

## Pilot: Raw Material Sourcing

- Config: `configs/rawMaterialSourcing.validation.config.ts`
- Adapter: `adapters/rawMaterialSourcing.validation.ts`
- Hooks: `useRawMaterialSpecificationForm`, `useRawMaterialProcurementHook`

Path convention for blocks:

- `blocks.{i}.supplyOrderNo` / `manufacturerName` / `receiptDate`
- `blocks.{i}.lots.0.lotNo`
- `blocks.{i}.lots.0.rows.{j}.analysedResult`
- `blocks.{i}.lots.0.certificates`

Create-lot UI maps material/lot indices to flat block index via `flatBlockIndexFromGroup`.
