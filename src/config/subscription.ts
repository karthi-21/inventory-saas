/**
 * Subscription and billing configuration constants.
 */

/** Free trial duration in days */
export const TRIAL_DAYS = 14

/** Compute trial end date from now */
export function getTrialEndDate(): Date {
  return new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
}
