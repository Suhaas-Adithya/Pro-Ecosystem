/**
 Pro — Professional Tier Access Control
 * 
 * Emails listed here are granted Conferencing Professional access
 * automatically, regardless of subscription state.
 * In a production environment this would be driven by a Firestore
 * `users/{uid}/subscription` document verified server-side.
 */

const PRO_ALLOWLIST = new Set([
  'suhaasadithyag@gmail.com',
]);

/**
 * Returns true if the given email has Conferencing Professional access.
 * Checks both the hardcoded allow-list and the localStorage flag set by
 * the checkout simulator.
 *
 * @param {string | null | undefined} email
 * @returns {boolean}
 */
export function isProUser(email) {
  if (!email) return false;
  if (PRO_ALLOWLIST.has(email.toLowerCase())) return true;
  return localStorage.getItem('pro_isPro') === 'true';
}
