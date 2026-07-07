import { generateCaptchaApi } from "../../data/api/auth/authApi";
import { ApiResponseModel } from "../../data/models/common/ApiResponseModel";

const normalizeCaptchaImageUrl = (captchaImage: unknown) => {
  if (!captchaImage) return "";
  if (typeof captchaImage !== "string") return "";

  // Backend typically returns `data:image/png;base64,...` but keep this resilient.
  if (captchaImage.startsWith("data:image/")) return captchaImage;
  return `data:image/png;base64,${captchaImage}`;
};

/**
 * Controller to fetch, parse, and normalize captcha data.
 * Returns: { captchaId, imageUrl, expiresIn }
 */
export const fetchCaptchaController = async () => {
  try {
    const body = await generateCaptchaApi();

    return new ApiResponseModel<{ captchaId: string; imageUrl: string; expiresIn: string | null }>(body, (response) => {
      // `ApiResponseModel` passes the full response object to the modeler.
      // The actual captcha payload lives under `response.data`.
      const data = response?.data ?? response;
      const captchaId = data?.captchaId ?? data?.id ?? data?.token ?? "";
      const imageUrl = normalizeCaptchaImageUrl(
        data?.captchaImage ?? data?.image ?? data?.imageUrl,
      );
      const expiresIn = data?.expiresIn ?? null;

      if (!captchaId || !imageUrl) {
        throw new Error("Unable to generate captcha");
      }

      return { captchaId, imageUrl, expiresIn };
    });
  } catch (error) {
    return new ApiResponseModel<null>(error);
  }
};
