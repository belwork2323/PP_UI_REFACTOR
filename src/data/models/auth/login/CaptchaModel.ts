export type CaptchaData = {
  captchaId: string;
  imageUrl: string;
  expiresIn: string | null;
};

export type CaptchaPayload = {
  captchaId: string;
  captchaValue: string;
};

const normalizeCaptchaImageUrl = (captchaImage: unknown): string => {
  if (!captchaImage || typeof captchaImage !== "string") return "";
  if (captchaImage.startsWith("data:image/")) return captchaImage;
  return `data:image/png;base64,${captchaImage}`;
};

export class CaptchaModel {
  captchaId: string;
  imageUrl: string;
  expiresIn: string | null;

  constructor({ captchaId, imageUrl, expiresIn }: CaptchaData) {
    this.captchaId = captchaId;
    this.imageUrl = imageUrl;
    this.expiresIn = expiresIn;
  }

  static fromApi(response: unknown): CaptchaModel {
    const data = (response as { data?: unknown })?.data ?? response;
    const raw = data as Record<string, unknown>;
    const captchaId = String(raw?.captchaId ?? raw?.id ?? raw?.token ?? "");
    const imageUrl = normalizeCaptchaImageUrl(
      raw?.captchaImage ?? raw?.image ?? raw?.imageUrl,
    );
    const expiresIn = (raw?.expiresIn as string | null) ?? null;

    if (!captchaId || !imageUrl) {
      throw new Error("Unable to generate captcha");
    }

    return new CaptchaModel({ captchaId, imageUrl, expiresIn });
  }
}
