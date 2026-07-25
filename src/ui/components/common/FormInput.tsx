import AppTextField, { type AppTextFieldProps } from "./AppTextField";

/** @deprecated Prefer `AppTextField` — kept as an alias for existing imports. */
const FormInput = (props: AppTextFieldProps) => <AppTextField {...props} />;

export type { AppTextFieldProps as FormInputProps };
export default FormInput;
