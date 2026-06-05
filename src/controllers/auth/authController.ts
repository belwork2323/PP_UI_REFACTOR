import { resetPasswordApi, logoutApi, refreshTokenApi } from "../../data/api/auth/authApi";
import { useAuthStore } from "../../app/store/authStore";
import { STRINGS } from "../../app/config/strings";
import { UserModel } from "../../data/models/user/UserModel";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";


export const loginController = (credentials) => _login(credentials);

// ── Real login ─────────────────────────────────────────────────────────────
const _login = async (credentials) => {
  try {
    const { loginApi } = await import("../../data/api/auth/authApi");

    const requestBody = {
      userId: credentials.userId ?? credentials.username,
      password: credentials.password,
      role:
        credentials.role ??
        ({
          roleId: credentials.roleId ?? credentials.role?.roleId,
          roleName: credentials.roleName ?? credentials.role?.roleName,
        }),
      captcha:
        credentials.captcha ??
        ({
          captchaId: credentials.captchaId ?? credentials.captcha?.captchaId,
          captchaValue:
            credentials.captchaValue ?? credentials.captcha?.captchaValue,
        }),
    };

    const apiResponse = await loginApi(requestBody);
    return new ApiResponseModel<UserModel>(apiResponse, (data) => UserModel.fromApi(data));
  } catch (error) {
    const status = (error as any)?.status;

    if (status === 401) {
      useAuthStore.getState().logout();
    }

    return new ApiResponseModel<null>(error);
  }
};

/**
 * Refresh the access token using the refresh token
 * This is called by the 401 response interceptor in httpClient.ts
 * 
 * @returns User object if refresh succeeds, null if it fails
 */
export const refreshAuthToken = async () => {
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

    // ✅ FIX: Refresh response only contains tokens — not full user data
    // Get the existing user from the store and patch just the tokens
    const existingUser = useAuthStore.getState().user;
    if (!existingUser) {
      throw new Error("No existing user session to refresh");
    }

    const newAccessToken = refreshResponse?.data?.accessToken;
    const newRefreshToken = refreshResponse?.data?.refreshToken;

    if (!newAccessToken || !newRefreshToken) {
      throw new Error("Refresh response missing tokens");
    }

    // ✅ Patch existing user with new tokens
    const updatedUser = existingUser.copyWith({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    // ✅ Save updated user back to store
    useAuthStore.getState().login(updatedUser);

    // ✅ Return a success-shaped object for httpClient to consume
    return {
      success: true,
      data: updatedUser,
    };

  } catch (error) {
    useAuthStore.getState().logout();
    return null;
  }
};


/* ═══════════════════════════════════════════════════════════════════════════
   Reset Password Controller
═══════════════════════════════════════════════════════════════════ */
export const resetPasswordController = async (payload) => {
  try {
    const apiResponse = await resetPasswordApi(payload);
    return new ApiResponseModel<string>(apiResponse, () => STRINGS.AUTH.RESET_REQUEST_SUCCESS);
  } catch (error: any) {
    let message = error.message || STRINGS.AUTH.RESET_FAILED;
    
    if (error.details) {
      switch (error.details) {
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
    
    // Pass the overridden message to ApiResponseModel via the modified error object
    return new ApiResponseModel<null>({ ...error, message });
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   Logout Controller
   Clears session, tokens, and all persisted state.
═══════════════════════════════════════════════════════════════════════════ */
export const logoutController = async () => {
  const refreshToken = useAuthStore.getState().getRefreshToken();
  if (!refreshToken) {
    return new ApiResponseModel<null>({ status: 400, message: "Logout failed: refresh token missing." });
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
