import { Expression, type Exp, type ParamsLike } from "../types";
import { joinExpressions } from "./utils";

class BoolExpression extends Expression {
  constructor(private readonly value: boolean) {
    super();
  }

  eval(): boolean {
    return this.value;
  }

  toString(): string {
    return this.value ? "T" : "F";
  }
}

class AndExpression extends Expression {
  constructor(private readonly expressions: readonly Exp[]) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    return this.expressions.every((expression) => expression.eval(params));
  }

  toString(): string {
    return `(${joinExpressions(this.expressions, "∧")})`;
  }
}

class OrExpression extends Expression {
  constructor(private readonly expressions: readonly Exp[]) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    return this.expressions.some((expression) => expression.eval(params));
  }

  toString(): string {
    return `(${joinExpressions(this.expressions, "∨")})`;
  }
}

class NotExpression extends Expression {
  constructor(private readonly expression: Exp) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    return !this.expression.eval(params);
  }

  toString(): string {
    return `¬${this.expression}`;
  }
}

export function Bool(value: boolean): Exp {
  return new BoolExpression(value);
}

export const True: Exp = Bool(true);
export const False: Exp = Bool(false);

export function And(...expressions: readonly Exp[]): Exp {
  return new AndExpression(expressions);
}

export function Or(...expressions: readonly Exp[]): Exp {
  return new OrExpression(expressions);
}

export function Not(expression: Exp): Exp {
  return new NotExpression(expression);
}
