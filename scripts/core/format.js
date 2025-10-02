export function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat(undefined).format(value);
}

export function ordinal(value) {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = value % 100;
  return `${value}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}
