import { Expression, type Exp, type ParamsLike, getParam } from "../types";
import { parseConfiguredDate } from "../time";

abstract class DateExpression extends Expression {
  constructor(
    protected readonly key: string,
    protected readonly date: Date,
  ) {
    super();
  }

  protected readDate(params?: ParamsLike): Date | undefined {
    return parseConfiguredDate(getParam(params, this.key));
  }

  protected formatDate(): string {
    return this.date.toISOString();
  }
}

class OnExpression extends DateExpression {
  eval(params?: ParamsLike): boolean {
    const date = this.readDate(params);
    return date === undefined ? false : date.getTime() === this.date.getTime();
  }

  toString(): string {
    return `[${this.key}==${this.formatDate()}]`;
  }
}

class BeforeExpression extends DateExpression {
  eval(params?: ParamsLike): boolean {
    const date = this.readDate(params);
    return date === undefined ? false : date.getTime() < this.date.getTime();
  }

  toString(): string {
    return `[${this.key}<${this.formatDate()}]`;
  }
}

class AfterExpression extends DateExpression {
  eval(params?: ParamsLike): boolean {
    const date = this.readDate(params);
    return date === undefined ? false : date.getTime() > this.date.getTime();
  }

  toString(): string {
    return `[${this.key}>${this.formatDate()}]`;
  }
}

class WeekdayExpression extends Expression {
  constructor(
    private readonly key: string,
    private readonly weekday: WeekdayValue,
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    const date = parseConfiguredDate(getParam(params, this.key));
    return date === undefined ? false : date.getUTCDay() === this.weekday;
  }

  toString(): string {
    return `[weekday(${this.key})==${this.weekday}]`;
  }
}

class DayExpression extends Expression {
  constructor(
    private readonly key: string,
    private readonly day: number,
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    const date = parseConfiguredDate(getParam(params, this.key));
    return date === undefined ? false : date.getUTCDate() === this.day;
  }

  toString(): string {
    return `[day(${this.key})==${this.day}]`;
  }
}

class MonthExpression extends Expression {
  constructor(
    private readonly key: string,
    private readonly month: MonthValue,
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    const date = parseConfiguredDate(getParam(params, this.key));
    return date === undefined ? false : date.getUTCMonth() + 1 === this.month;
  }

  toString(): string {
    return `[month(${this.key})==${this.month}]`;
  }
}

class YearExpression extends Expression {
  constructor(
    private readonly key: string,
    private readonly year: number,
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    const date = parseConfiguredDate(getParam(params, this.key));
    return date === undefined ? false : date.getUTCFullYear() === this.year;
  }

  toString(): string {
    return `[year(${this.key})==${this.year}]`;
  }
}

export enum WeekdayValue {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export enum MonthValue {
  January = 1,
  February = 2,
  March = 3,
  April = 4,
  May = 5,
  June = 6,
  July = 7,
  August = 8,
  September = 9,
  October = 10,
  November = 11,
  December = 12,
}

export function On(key: string, date: Date): Exp {
  return new OnExpression(key, date);
}

export function Before(key: string, date: Date): Exp {
  return new BeforeExpression(key, date);
}

export function After(key: string, date: Date): Exp {
  return new AfterExpression(key, date);
}

export function Weekday(key: string, weekday: WeekdayValue | number): Exp {
  return new WeekdayExpression(key, weekday as WeekdayValue);
}

export function Day(key: string, day: number): Exp {
  return new DayExpression(key, day);
}

export function Month(key: string, month: MonthValue | number): Exp {
  return new MonthExpression(key, month as MonthValue);
}

export function Year(key: string, year: number): Exp {
  return new YearExpression(key, year);
}
