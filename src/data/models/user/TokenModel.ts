/* ─────────────────────────────────────────────────────────────────────────────
   TokenModel — auth tokens
───────────────────────────────────────────────────────────────────────────── */
export class TokenModel {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;

  constructor({
    accessToken,
    refreshToken,
    accessTokenExpiry,
  }: {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiry?: number;
  }) {
    this.accessToken       = accessToken ?? "";
    this.refreshToken      = refreshToken ?? "";
    this.accessTokenExpiry = accessTokenExpiry ?? 0; // ms
  }

  /** Unix timestamp (ms) when the access token expires */
  get expiresAt() {
    return Date.now() + this.accessTokenExpiry;
  }

  get isExpired() {
    return Date.now() > this.expiresAt;
  }
}