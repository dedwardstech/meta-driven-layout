import type { Exp, ParserContextLike } from "./types";
import { withParserContext } from "./types";
import {
  After,
  And,
  Before,
  Between,
  Contains,
  Empty,
  EndsWith,
  Equal,
  Exists,
  False,
  GreaterOrEqual,
  GreaterThan,
  In,
  Is,
  IsNot,
  LessOrEqual,
  LessThan,
  Match,
  Missing,
  Not,
  NotEmpty,
  NotIn,
  Or,
  StartsWith,
  True,
} from "./expressions/index";
import { parseConfiguredDate } from "./time";

export interface AstPosition {
  readonly offset: number;
  readonly line: number;
  readonly column: number;
}

export interface AstSourceSpan {
  readonly start: AstPosition;
  readonly end: AstPosition;
}

export type LogicalOperator = "and" | "or";
export type NotOperator = "not";
export type ComparisonOperator = "==" | "!=" | "is" | ">" | ">=" | "<" | "<=" | "contains" | "startsWith" | "endsWith" | "in" | "notIn" | "before" | "after";
export type UnaryComparisonOperator = "exists" | "missing" | "empty" | "notEmpty";

export type LiteralAstNode = BooleanLiteralAstNode | NumberLiteralAstNode | StringLiteralAstNode;
export type ValueAstNode = IdentifierAstNode | LiteralAstNode | ArrayLiteralAstNode | ParenthesizedAstNode;

export type ExpAstNode =
  | IdentifierAstNode
  | BooleanLiteralAstNode
  | NumberLiteralAstNode
  | StringLiteralAstNode
  | ArrayLiteralAstNode
  | ParenthesizedAstNode
  | LogicalAstNode
  | NotAstNode
  | ComparisonAstNode
  | BetweenAstNode
  | UnaryComparisonAstNode;

export interface BaseAstNode {
  readonly type: string;
  readonly loc: AstSourceSpan;
}

export interface IdentifierAstNode extends BaseAstNode {
  readonly type: "Identifier";
  readonly name: string;
}

export interface BooleanLiteralAstNode extends BaseAstNode {
  readonly type: "BooleanLiteral";
  readonly value: boolean;
  readonly raw: string;
}

export interface NumberLiteralAstNode extends BaseAstNode {
  readonly type: "NumberLiteral";
  readonly value: number;
  readonly raw: string;
}

export interface StringLiteralAstNode extends BaseAstNode {
  readonly type: "StringLiteral";
  readonly value: string;
  readonly raw: string;
  readonly quote: "'" | "\"";
}

export interface ArrayLiteralAstNode extends BaseAstNode {
  readonly type: "ArrayLiteral";
  readonly elements: readonly (StringLiteralAstNode | NumberLiteralAstNode)[];
}

export interface ParenthesizedAstNode extends BaseAstNode {
  readonly type: "ParenthesizedExpression";
  readonly expression: ExpAstNode;
}

export interface LogicalAstNode extends BaseAstNode {
  readonly type: "LogicalExpression";
  readonly operator: LogicalOperator;
  readonly left: ExpAstNode;
  readonly right: ExpAstNode;
}

export interface NotAstNode extends BaseAstNode {
  readonly type: "NotExpression";
  readonly operator: NotOperator;
  readonly argument: ExpAstNode;
}

export interface ComparisonAstNode extends BaseAstNode {
  readonly type: "ComparisonExpression";
  readonly operator: ComparisonOperator;
  readonly left: IdentifierAstNode | StringLiteralAstNode;
  readonly right: ExpAstNode;
}

export interface BetweenAstNode extends BaseAstNode {
  readonly type: "BetweenExpression";
  readonly operator: "between";
  readonly left: IdentifierAstNode | StringLiteralAstNode;
  readonly min: ExpAstNode;
  readonly max: ExpAstNode;
}

export interface UnaryComparisonAstNode extends BaseAstNode {
  readonly type: "UnaryComparisonExpression";
  readonly operator: UnaryComparisonOperator;
  readonly argument: IdentifierAstNode | StringLiteralAstNode;
}

export interface ParseResult {
  readonly source: string;
  readonly ast: ExpAstNode;
  readonly expression: Exp;
}

export class ExpressionAstError extends Error {
  constructor(
    readonly loc: AstSourceSpan,
    message: string,
  ) {
    super(`${loc.start.line}:${loc.start.column} AST error: ${message}`);
    this.name = "ExpressionAstError";
  }
}

export function compileAst(ast: ExpAstNode, context?: ParserContextLike): Exp {
  return withParserContext(compile(ast), context);
}

function compile(node: ExpAstNode): Exp {
  switch (node.type) {
    case "ParenthesizedExpression":
      return compile(node.expression);
    case "LogicalExpression":
      return node.operator === "and" ? And(compile(node.left), compile(node.right)) : Or(compile(node.left), compile(node.right));
    case "NotExpression":
      return Not(compile(node.argument));
    case "ComparisonExpression":
      return comparison(node);
    case "BetweenExpression":
      return betweenComparison(node);
    case "UnaryComparisonExpression":
      return unaryComparison(node);
    case "BooleanLiteral":
      return node.value ? True : False;
    default:
      throw new ExpressionAstError(node.loc, `${node.type} cannot be used as a boolean expression`);
  }
}

function comparison(node: ComparisonAstNode): Exp {
  const key = nodeKey(node.left);
  const right = unwrap(node.right);

  if (right.type === "NumberLiteral") {
    switch (node.operator) {
      case "==":
      case "is":
        return Equal(key, right.value);
      case "!=":
        return Not(Equal(key, right.value));
      case ">":
        return GreaterThan(key, right.value);
      case ">=":
        return GreaterOrEqual(key, right.value);
      case "<":
        return LessThan(key, right.value);
      case "<=":
        return LessOrEqual(key, right.value);
      case "contains":
        return Contains(key, right.value);
      default:
        break;
    }
  }

  if (right.type === "BooleanLiteral") {
    switch (node.operator) {
      case "==":
      case "is":
        return Is(key, right.value);
      case "!=":
        return IsNot(key, right.value);
      default:
        throw new ExpressionAstError(node.loc, "booleans only support ==, !=, and is comparisons");
    }
  }

  if (right.type === "StringLiteral") {
    switch (node.operator) {
      case "==":
      case "is":
        return Match(key, right.value);
      case "!=":
        return Not(Match(key, right.value));
      case "contains":
        return Contains(key, right.value);
      case "startsWith":
        return StartsWith(key, right.value);
      case "endsWith":
        return EndsWith(key, right.value);
      case "before":
        return Before(key, parseDateOperand(node, right.value));
      case "after":
        return After(key, parseDateOperand(node, right.value));
      default:
        throw new ExpressionAstError(node.loc, "strings only support ==, !=, is, contains, startsWith, endsWith, before, and after comparisons");
    }
  }

  if (right.type === "ArrayLiteral") {
    const values = right.elements.map((element) => element.value);
    switch (node.operator) {
      case "in":
        return In(key, values);
      case "notIn":
        return NotIn(key, values);
      default:
        throw new ExpressionAstError(node.loc, `unsupported array operator ${node.operator}`);
    }
  }

  throw new ExpressionAstError(node.loc, "right side of a comparison must be a string or number");
}

function unaryComparison(node: UnaryComparisonAstNode): Exp {
  const key = nodeKey(node.argument);
  switch (node.operator) {
    case "exists":
      return Exists(key);
    case "missing":
      return Missing(key);
    case "empty":
      return Empty(key);
    case "notEmpty":
      return NotEmpty(key);
  }
}

function betweenComparison(node: BetweenAstNode): Exp {
  const min = unwrap(node.min);
  const max = unwrap(node.max);
  if (min.type !== "NumberLiteral" || max.type !== "NumberLiteral") {
    throw new ExpressionAstError(node.loc, "between requires numeric bounds");
  }

  return Between(nodeKey(node.left), min.value, max.value);
}

function parseDateOperand(node: ExpAstNode, value: string): Date {
  const date = parseConfiguredDate(value);
  if (date === undefined) throw new ExpressionAstError(node.loc, `invalid date ${JSON.stringify(value)}`);
  return date;
}

function nodeKey(node: IdentifierAstNode | StringLiteralAstNode): string {
  return node.type === "Identifier" ? node.name : node.value;
}

function unwrap(node: ExpAstNode): ExpAstNode {
  return node.type === "ParenthesizedExpression" ? unwrap(node.expression) : node;
}
