import type { Exp } from "../types";

export function formatNumber(value: number): string {
  return value.toFixed(2);
}

export function joinExpressions(expressions: readonly Exp[], separator: string): string {
  return expressions.map((expression) => expression.toString()).join(separator);
}

export function countOccurrences(value: string, separator: string): number {
  if (separator === "") return Array.from(value).length + 1;

  let count = 0;
  let index = 0;

  while (true) {
    const found = value.indexOf(separator, index);
    if (found === -1) return count;

    count += 1;
    index = found + separator.length;
  }
}
