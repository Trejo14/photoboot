import {
  isLicenseExpired,
  type LicenseInfo,
  type LicensePlan,
} from "./license";

export function getEffectivePlan(
  license: LicenseInfo | undefined,
): LicensePlan {
  if (!license || isLicenseExpired(license)) return "free";
  return license.plan;
}

export function canUseFrames(plan: LicensePlan): boolean {
  return plan !== "free";
}

export function hasTrialWatermark(plan: LicensePlan): boolean {
  return plan === "free";
}
