import type { CaptchaPayload } from "./CaptchaModel";

export type LoginRolePayload = {
  roleId: string | number;
  roleName: string;
};

export type LoginRequestPayload = {
  userId: string;
  password: string;
  role: LoginRolePayload;
  captcha: CaptchaPayload;
};

export type LoginFormCredentials = {
  username: string;
  password: string;
  roleId: string | number;
  roleName: string;
  subDepartmentId: string | number;
};

export type LoginFormErrors = {
  roleId: string;
  subDepartmentId: string;
  username: string;
  password: string;
  captcha: string;
};

export type LoginCredentialsInput = LoginRequestPayload & {
  username?: string;
  roleId?: string | number;
  roleName?: string;
  captchaId?: string;
  captchaValue?: string;
};

export function toLoginRequestPayload(credentials: LoginCredentialsInput): LoginRequestPayload {
  return {
    userId: credentials.userId ?? credentials.username ?? "",
    password: credentials.password,
    role:
      credentials.role ??
      ({
        roleId: credentials.roleId ?? credentials.role?.roleId ?? "",
        roleName: credentials.roleName ?? credentials.role?.roleName ?? "",
      } as LoginRolePayload),
    captcha:
      credentials.captcha ??
      ({
        captchaId: credentials.captchaId ?? credentials.captcha?.captchaId ?? "",
        captchaValue: credentials.captchaValue ?? credentials.captcha?.captchaValue ?? "",
      } as CaptchaPayload),
  };
}
