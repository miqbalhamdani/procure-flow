export const PRICE_INPUT_PATTERN = /^\d+(?:\.\d{0,3})?$/;

export function normalizePriceInput(value: string): string {
  const rawValue = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const dotIndex = rawValue.indexOf(".");

  if (dotIndex === -1) {
    return rawValue.replace(/^0+(?=\d)/, "");
  }

  const integerPart = rawValue.slice(0, dotIndex).replace(/^0+(?=\d)/, "");
  const decimalPart = rawValue
    .slice(dotIndex + 1)
    .replace(/\./g, "")
    .slice(0, 3);

  if (rawValue.endsWith(".") && decimalPart.length === 0) {
    return `${integerPart || "0"}.`;
  }

  return `${integerPart || "0"}.${decimalPart}`;
}

export function formatPriceInput(value: string): string {
  const normalizedValue = normalizePriceInput(value);
  if (!normalizedValue) return "";

  const hasTrailingDot = normalizedValue.endsWith(".");
  const [integerPart, decimalPart] = normalizedValue.split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (hasTrailingDot) {
    return `${formattedInteger}.`;
  }

  return decimalPart !== undefined && decimalPart.length > 0
    ? `${formattedInteger}.${decimalPart}`
    : formattedInteger;
}

export function formatStoredPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const normalizedValue = normalizePriceInput(String(value));
  if (!normalizedValue) {
    return "";
  }

  const [integerPart, decimalPart = ""] = normalizedValue.split(".");
  const trimmedDecimalPart = decimalPart.replace(/0+$/, "");
  const baseValue = trimmedDecimalPart ? `${integerPart}.${trimmedDecimalPart}` : integerPart;
  return formatPriceInput(baseValue);
}

export function parsePriceInput(value: string): number {
  return Number.parseFloat(value.replace(/,/g, ""));
}

export function formatCurrency(value: string | number): string {
  return `$${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
