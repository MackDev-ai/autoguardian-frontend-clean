export function isValidVIN(vin?: string) {
  if (!vin) return true;
  const v = vin.toUpperCase().trim();
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(v);
}
export function isDateRangeValid(from?: string, to?: string) {
  if (!from || !to) return true;
  return new Date(from) <= new Date(to);
}
export function isNonNegativeNumberLike(v?: string | number) {
  if (v === undefined || v === null || v === "") return true;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
}
