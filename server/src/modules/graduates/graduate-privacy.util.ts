/**
 * Salary figures are personally sensitive and are only ever surfaced —
 * in listings, dashboards, or exported reports — when the graduate has
 * explicitly opted in via `consentToShareSalary`.
 *
 * The field is overwritten to `undefined` rather than deleted from the
 * object. `res.json()` (via JSON.stringify) omits `undefined`-valued keys
 * automatically, so it's still fully hidden from any API response — but the
 * *key itself* stays present on the object. That matters for report exports
 * (report.controller.ts), which derive their CSV/Excel column set from
 * `Object.keys(data[0])`: deleting the key outright would make the whole
 * salary column vanish from an export whenever the first row happened to be
 * a non-consenting graduate, even if later rows had consented and had data.
 */
export function maskGraduateSalary<T extends { salaryRange?: string; consentToShareSalary?: boolean }>(doc: T): T {
  if (doc.consentToShareSalary) return doc;
  return { ...doc, salaryRange: undefined };
}

export function maskFollowUpSalary<T extends { monthlySalary?: number; consentToShareSalary?: boolean }>(doc: T): T {
  if (doc.consentToShareSalary) return doc;
  return { ...doc, monthlySalary: undefined };
}
