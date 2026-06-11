import {
  loginApi,
  logoutApi,
  refreshTokenApi,
  resetPasswordApi,
  generateCaptchaApi,
  type ResetPasswordRequestPayload,
} from "@data/api/auth/login/loginApi";
import { useAuthStore } from "@app/store/authStore";
import { STRINGS } from "@app/config/strings";
import { UserModel } from "@data/models/user/UserModel";
import { ApiResponseModel } from "@data/models/common/ApiResponseModel";
import { generalController } from "@controllers/admin/common/generalController";
import { CaptchaModel } from "@data/models/auth/login/CaptchaModel";
import {
  toLoginRequestPayload,
  type LoginCredentialsInput,
} from "@data/models/auth/login/LoginCredentialsModel";
import {
  parseLoginRoles,
  parseLoginSubDepartments,
  type LoginLookupsResult,
  type LookupAlert,
} from "@data/models/auth/login/LoginLookupsModel";
import { mapResetPasswordError } from "@utils/errorMapper";

const _login = async (credentials: LoginCredentialsInput) => {
  try {
    const requestBody = toLoginRequestPayload(credentials);
    const apiResponse = await loginApi(requestBody);
    return new ApiResponseModel<UserModel>(apiResponse, (data) => UserModel.fromApi(data));
  } catch (error) {
    const status = (error as { status?: number })?.status;

    if (status === 401) {
      useAuthStore.getState().logout();
    }

    return new ApiResponseModel<null>(error);
  }
};

const _refreshAuthToken = async (): Promise<ApiResponseModel<UserModel> | null> => {
  try {
    const refreshToken = useAuthStore.getState().getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const refreshResponse = await refreshTokenApi({ refreshToken });

    if (refreshResponse?.success === false) {
      throw {
        status: refreshResponse.code ?? 400,
        message: refreshResponse.message ?? STRINGS.SYSTEM.UNEXPECTED_ERROR,
      };
    }

    const existingUser = useAuthStore.getState().user;
    if (!existingUser) {
      throw new Error("No existing user session to refresh");
    }

    const newAccessToken = refreshResponse?.data?.accessToken;
    const newRefreshToken = refreshResponse?.data?.refreshToken;

    if (!newAccessToken || !newRefreshToken) {
      throw new Error("Refresh response missing tokens");
    }

    const updatedUser = existingUser.copyWith({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    useAuthStore.getState().login(updatedUser);

    return new ApiResponseModel<UserModel>({
      success: true,
      statusCode: 200,
      message: "Success",
      data: updatedUser,
    });
  } catch {
    useAuthStore.getState().logout();
    return null;
  }
};

const _resetPassword = async (payload: ResetPasswordRequestPayload) => {
  try {
    const apiResponse = await resetPasswordApi(payload);
    return new ApiResponseModel<string>(apiResponse, () => STRINGS.AUTH.RESET_REQUEST_SUCCESS);
  } catch (error: unknown) {
    const err = error as { message?: string; details?: string };
    let message = err.message || STRINGS.AUTH.RESET_FAILED;

    if (err.details) {
      switch (err.details) {
        case "INVALID_REQUEST":
          message = STRINGS.AUTH.RESET_INVALID_INPUT;
          break;
        case "USER_NOT_FOUND":
          message = STRINGS.AUTH.RESET_USER_NOT_FOUND;
          break;
        case "RESET_REQUEST_ALREADY_EXISTS":
          message = STRINGS.AUTH.RESET_ALREADY_EXISTS;
          break;
        case "RATE_LIMIT_EXCEEDED":
          message = STRINGS.AUTH.RESET_RATE_LIMITED;
          break;
        case "INTERNAL_SERVER_ERROR":
          message = STRINGS.SYSTEM.SERVER_ERROR;
          break;
      }
    }

    return new ApiResponseModel<null>({ ...err, message });
  }
};

const _logout = async () => {
  const refreshToken = useAuthStore.getState().getRefreshToken();
  if (!refreshToken) {
    return new ApiResponseModel<null>({
      status: 400,
      message: STRINGS.AUTH.LOGOUT_FAILED,
    });
  }

  try {
    const logoutPayload = { refreshToken };
    const response = await logoutApi(logoutPayload);

    const apiResponse = new ApiResponseModel<string>(response, () => STRINGS.AUTH.LOGOUT_SUCCESS);
    if (apiResponse.success) {
      useAuthStore.getState().logout();
    }
    return apiResponse;
  } catch (error) {
    return new ApiResponseModel<null>(error);
  }
};

const _fetchCaptcha = async () => {
  try {
    const body = await generateCaptchaApi();
    return new ApiResponseModel<CaptchaModel>(body, (response) => CaptchaModel.fromApi(response));
  } catch (error) {
    return new ApiResponseModel<null>(error);
  }
};

const _loadLoginLookups = async (): Promise<LoginLookupsResult> => {
  const alerts: LookupAlert[] = [];

  const [rolesResult, depsResult] = await Promise.all([
    generalController.getRoles(),
    generalController.getDepartments(),
  ]);

  let roles = rolesResult.success
    ? parseLoginRoles(Array.isArray(rolesResult.data) ? rolesResult.data : [])
    : [];

  if (rolesResult.success) {
    if (roles.length === 0) {
      alerts.push({ message: STRINGS.AUTH.NO_ROLES_AVAILABLE, severity: "warning" });
    }
  } else {
    alerts.push({
      message: rolesResult.message || STRINGS.SYSTEM.UNEXPECTED_ERROR,
      severity: "error",
    });
  }

  let subDepartments: ReturnType<typeof parseLoginSubDepartments> = [];
  const deps = depsResult.success && Array.isArray(depsResult.data) ? depsResult.data : [];

  if (!depsResult.success) {
    alerts.push({
      message: depsResult.message || STRINGS.SYSTEM.UNEXPECTED_ERROR,
      severity: "error",
    });
  }

  if (deps.length > 0) {
    const subResults = await Promise.allSettled(
      deps.map((d: { departmentId: unknown }) =>
        generalController.getSubDepartments(d.departmentId),
      ),
    );

    subResults.forEach((result) => {
      if (result.status === "fulfilled" && result.value.success) {
        const list = Array.isArray(result.value.data) ? result.value.data : [];
        subDepartments = subDepartments.concat(parseLoginSubDepartments(list));
      }
    });
  }

  if (subDepartments.length === 0) {
    const subAllResult = await generalController.getSubDepartments();
    if (subAllResult.success) {
      const list = Array.isArray(subAllResult.data) ? subAllResult.data : [];
      subDepartments = parseLoginSubDepartments(list);
    }
  }

  if (subDepartments.length === 0 && roles.length > 0) {
    alerts.push({
      message: STRINGS.AUTH.NO_SUBDEPARTMENTS_FOR_LOGIN,
      severity: "warning",
    });
  }

  return { roles, subDepartments, alerts };
};

export const authLoginController = {
  login: (credentials: LoginCredentialsInput) => _login(credentials),
  logout: () => _logout(),
  refreshToken: () => _refreshAuthToken(),
  fetchCaptcha: () => _fetchCaptcha(),
  loadLookups: () => _loadLoginLookups(),
  resetPassword: (payload: ResetPasswordRequestPayload) => _resetPassword(payload),
};
