export type ParamValue = unknown;

export interface Params {
  get(key: string): ParamValue;
}

export type ParamsLike = Params | Readonly<Record<string, ParamValue>> | null | undefined;

export interface ParserContext {
  readonly env?: unknown;
}

export type ParserContextLike = ParserContext | Readonly<Record<string, unknown>> | null | undefined;

export interface Exp {
  eval(params?: ParamsLike): boolean;
  Eval(params?: ParamsLike): boolean;
  toString(): string;
}

export abstract class Expression implements Exp {
  abstract eval(params?: ParamsLike): boolean;

  Eval(params?: ParamsLike): boolean {
    return this.eval(params);
  }

  abstract toString(): string;
}

export class ExpMap implements Params {
  readonly values: Readonly<Record<string, ParamValue>>;

  constructor(values: Readonly<Record<string, ParamValue>> = {}) {
    this.values = values;
  }

  get(key: string): ParamValue {
    if (key in this.values) return this.values[key];
    return getPath(this.values, key);
  }
}

export function getParamValue(params: ParamsLike, key: string): ParamValue {
  if (params == null) return undefined;

  if (typeof (params as Params).get === "function") {
    return (params as Params).get(key);
  }

  if (key in params) return (params as Readonly<Record<string, ParamValue>>)[key];
  return getPath(params, key);
}

export function getParam(params: ParamsLike, key: string): string {
  const value = getParamValue(params, key);
  return value == null ? "" : String(value);
}

export function withParserContext(expression: Exp, context?: ParserContextLike): Exp {
  if (context == null) return expression;
  return new ContextualExpression(expression, context);
}

class ContextualExpression extends Expression {
  constructor(
    private readonly expression: Exp,
    private readonly context: ParserContextLike,
  ) {
    super();
  }

  eval(params?: ParamsLike): boolean {
    return this.expression.eval(new ContextualParams(params, resolveEnv(this.context)));
  }

  toString(): string {
    return this.expression.toString();
  }
}

class ContextualParams implements Params {
  constructor(
    private readonly params: ParamsLike,
    private readonly env: unknown,
  ) {}

  get(key: string): ParamValue {
    if (key === "env") return this.env;
    if (key.startsWith("env.")) return getPath(this.env, key.slice(4));
    return getParamValue(this.params, key);
  }
}

function resolveEnv(context: ParserContextLike): unknown {
  if (context != null && typeof context === "object" && "env" in context) {
    return (context as ParserContext).env;
  }

  return context;
}

function getPath(value: unknown, path: string): unknown {
  let current = value;

  for (const segment of path.split(".")) {
    if (current == null || (typeof current !== "object" && typeof current !== "function")) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}
