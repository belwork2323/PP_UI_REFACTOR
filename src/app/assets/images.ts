/**
 * Centralized image asset paths for app chrome and auth pages.
 * PNG assets live under src/assets/images/ (served by Vite at /src/assets/...).
 */
export const APP_IMAGES = {
  drdoLogo: "/src/assets/images/DRDO-logo.png",
  belLogoDark: "/src/assets/images/bel_logo_dark.png",
  belLogoLight: "/src/assets/images/bel_logo_light.png",
} as const;

export type AppImageKey = keyof typeof APP_IMAGES;

export function getBelLogo(mode: "light" | "dark") {
  return mode === "dark" ? APP_IMAGES.belLogoDark : APP_IMAGES.belLogoLight;
}
