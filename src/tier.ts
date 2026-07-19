/**
 * Free and Pro ship as separate Marketplace SKUs; entitlement is enforced by
 * Marketplace DRM at distribution time, so tier is a build-time constant and
 * there is deliberately no runtime license check here (ADR-0003).
 */
export function isProUser(): boolean {
  return __IS_PRO__;
}
