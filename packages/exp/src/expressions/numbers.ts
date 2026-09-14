import { Expression, type Exp, type ParamsLike, getParam, getParamValue } from "../types";
import { Not, Or } from "./boolean";
import { formatNumber } from "./utils";

abstract class NumberComparisonExpression extends Expression {
  constructor(
    protected readonly key: string,
    protected readonly value: number,
  ) {
    super();
  }

  protected readNumber(params?: ParamsLike): number | undefined {
    const value = Number.parseFloat(getParam(params, this.key));
    return Number.isNaN(value) ? undefined : value;
  }
}

class EqualExpression extends NumberComparisonExpression {
  eval(params?: ParamsLike): boolean {
    return this.readNumber(params) === this.value;
  }

  toString(): string {
    return `[${this.key}==${formatNumber(this.value)}]`;
  }
}

class IsExpression extends Expression {
  constructor(
    private readonly key: string,
    private readonly value: boolean,
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    const value = getParamValue(params, this.key);
    if (typeof value === "boolean") return value === this.value;
    if (typeof value === "string") return value.toLowerCase() === String(this.value);
    return false;
  }

  toString(): string {
    return `[${this.key} is ${this.value}]`;
  }
}

class GreaterThanExpression extends NumberComparisonExpression {
  eval(params?: ParamsLike): boolean {
    const value = this.readNumber(params);
    return value === undefined ? false : value > this.value;
  }

  toString(): string {
    return `[${this.key}>${formatNumber(this.value)}]`;
  }
}

class LessThanExpression extends NumberComparisonExpression {
  eval(params?: ParamsLike): boolean {
    const value = this.readNumber(params);
    return value === undefined ? false : value < this.value;
  }

  toString(): string {
    return `[${this.key}<${formatNumber(this.value)}]`;
  }
}

class BetweenExpression extends NumberComparisonExpression {
  constructor(
    key: string,
    private readonly min: number,
    private readonly max: number,
  ) {
    super(key, min);
  }

  eval(params?: ParamsLike): boolean {
    const value = this.readNumber(params);
    return value === undefined ? false : value >= this.min && value <= this.max;
  }

  toString(): string {
    return `[${this.key} between ${formatNumber(this.min)} and ${formatNumber(this.max)}]`;
  }
}

export function Equal(key: string, value: number): Exp {
  return new EqualExpression(key, value);
}

export const Eq = Equal;

export function NotEqual(key: string, value: number): Exp {
  return Neq(key, value);
}

export function Neq(key: string, value: number): Exp {
  return Not(Eq(key, value));
}

export function Is(key: string, value: boolean): Exp {
  return new IsExpression(key, value);
}

export function IsNot(key: string, value: boolean): Exp {
  return Not(Is(key, value));
}

export function GreaterThan(key: string, value: number): Exp {
  return new GreaterThanExpression(key, value);
}

export const Gt = GreaterThan;

export function GreaterOrEqual(key: string, value: number): Exp {
  return Or(Gt(key, value), Eq(key, value));
}

export const Gte = GreaterOrEqual;
export const GreaterThanEqual = GreaterOrEqual;

export function LessThan(key: string, value: number): Exp {
  return new LessThanExpression(key, value);
}

export const Lt = LessThan;

export function LessOrEqual(key: string, value: number): Exp {
  return Or(Lt(key, value), Eq(key, value));
}

export const Lte = LessOrEqual;
export const LessThanEqual = LessOrEqual;

export function Between(key: string, min: number, max: number): Exp {
  return new BetweenExpression(key, min, max);
}
