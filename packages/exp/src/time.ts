export type DateParser = (value: string) => Date | null | undefined;
export type DateFormatValue = string | DateParser;

let currentDateFormat: DateFormatValue = "2006-01-02";

export function DateFormat(format: DateFormatValue): DateFormatValue {
  const previous = currentDateFormat;
  currentDateFormat = format;
  return previous;
}

export function parseConfiguredDate(value: string): Date | undefined {
  const parsed =
    typeof currentDateFormat === "function"
      ? currentDateFormat(value)
      : parseDateWithFormat(value, currentDateFormat);

  if (parsed == null || Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function parseDateWithFormat(value: string, format: string): Date | undefined {
  if (format === "2006-01-02") return parseYMD(value);
  if (format === "02 Jan 06 15:04 MST") return parseRFC822Like(value);

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseYMD(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return undefined;
  }

  return date;
}

function parseRFC822Like(value: string): Date | undefined {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
