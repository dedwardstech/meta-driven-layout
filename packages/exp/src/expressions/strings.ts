import { Expression, type Exp, type ParamsLike, getParam, getParamValue } from "../types";
import { Not, Or } from "./boolean";
import { countOccurrences } from "./utils";

class MatchExpression extends Expression {
  constructor(
    private readonly key: string,
    private readonly value: string,
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    return getParam(params, this.key) === this.value;
  }

  toString(): string {
    return `[${this.key}==${this.value}]`;
  }
}

class ContainsExpression extends Expression {
  constructor(
    private readonly key: string,
    private readonly value: string | number,
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    const param = getParamValue(params, this.key);
    const value = String(this.value);

    if (Array.isArray(param)) return param.some((candidate) => String(candidate) === value);
    return getParam(params, this.key).includes(value);
  }

  toString(): string {
    return `[${this.key}∋${this.value}]`;
  }
}

class ContainsAnyExpression extends Expression {
  constructor(
    private readonly key: string,
    private readonly chars: string,
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    const value = getParam(params, this.key);
    return Array.from(this.chars).some((char) => value.includes(char));
  }

  toString(): string {
    return `[${this.key}∋${this.chars}]`;
  }
}

class LenExpression extends Expression {
  constructor(
    private readonly key: string,
    private readonly length: number,
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    return getParam(params, this.key).length === this.length;
  }

  toString(): string {
    return `[len(${this.key})==${this.length}]`;
  }
}

class CountExpression extends Expression {
  constructor(
    private readonly key: string,
    private readonly separator: string,
    private readonly count: number,
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    return countOccurrences(getParam(params, this.key), this.separator) === this.count;
  }

  toString(): string {
    return `[count(${this.key},${this.separator})==${this.count}]`;
  }
}

class EqualFoldExpression extends Expression {
  constructor(
    private readonly key: string,
    private readonly value: string,
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    return getParam(params, this.key).localeCompare(this.value, undefined, { sensitivity: "accent" }) === 0;
  }

  toString(): string {
    return `[${this.key}≈${this.value}]`;
  }
}

class StartsWithExpression extends Expression {
  constructor(
    private readonly key: string,
    private readonly prefix: string,
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    return getParam(params, this.key).startsWith(this.prefix);
  }

  toString(): string {
    return `[${this.key}^=${this.prefix}]`;
  }
}

class EndsWithExpression extends Expression {
  constructor(
    private readonly key: string,
    private readonly suffix: string,
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    return getParam(params, this.key).endsWith(this.suffix);
  }

  toString(): string {
    return `[${this.key}$=${this.suffix}]`;
  }
}

class InExpression extends Expression {
  constructor(
    private readonly key: string,
    private readonly values: readonly (string | number)[],
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    const value = getParam(params, this.key);
    return this.values.some((candidate) => String(candidate) === value);
  }

  toString(): string {
    return `[${this.key}∈[${this.values.join(",")}]]`;
  }
}

class ExistsExpression extends Expression {
  constructor(private readonly key: string) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    return getParamValue(params, this.key) != null;
  }

  toString(): string {
    return `[${this.key} exists]`;
  }
}

class EmptyExpression extends Expression {
  constructor(private readonly key: string) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    const value = getParamValue(params, this.key);
    return value == null || String(value).length === 0;
  }

  toString(): string {
    return `[${this.key} empty]`;
  }
}

export function Match(key: string, value: string): Exp {
  return new MatchExpression(key, value);
}

export function MatchAny(key: string, ...values: readonly string[]): Exp {
  return Or(...values.map((value) => Match(key, value)));
}

export function Contains(key: string, value: string | number): Exp {
  return new ContainsExpression(key, value);
}

export function ContainsAny(key: string, chars: string): Exp {
  return new ContainsAnyExpression(key, chars);
}

export function StartsWith(key: string, prefix: string): Exp {
  return new StartsWithExpression(key, prefix);
}

export function EndsWith(key: string, suffix: string): Exp {
  return new EndsWithExpression(key, suffix);
}

export function In(key: string, values: readonly (string | number)[]): Exp {
  return new InExpression(key, values);
}

export function NotIn(key: string, values: readonly (string | number)[]): Exp {
  return Not(In(key, values));
}

export function Exists(key: string): Exp {
  return new ExistsExpression(key);
}

export function Missing(key: string): Exp {
  return Not(Exists(key));
}

export function Empty(key: string): Exp {
  return new EmptyExpression(key);
}

export function NotEmpty(key: string): Exp {
  return Not(Empty(key));
}

export function Len(key: string, length: number): Exp {
  return new LenExpression(key, length);
}

export function Count(key: string, separator: string, count: number): Exp {
  return new CountExpression(key, separator, count);
}

export function EqualFold(key: string, value: string): Exp {
  return new EqualFoldExpression(key, value);
}
