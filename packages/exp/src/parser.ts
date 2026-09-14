import { compileAst, type AstPosition, type AstSourceSpan, type ComparisonOperator, type ExpAstNode, type NumberLiteralAstNode, type ParseResult, type StringLiteralAstNode, type UnaryComparisonOperator } from "./ast";
import type { Exp, ParserContextLike } from "./types";

const enum TokenType {
  EOF = "EOF",
  Identifier = "Identifier",
  Number = "Number",
  String = "String",
  Boolean = "Boolean",
  And = "&&",
  Or = "||",
  Not = "!",
  NotKeyword = "not",
  LeftParen = "(",
  RightParen = ")",
  LeftBracket = "[",
  RightBracket = "]",
  Comma = ",",
  Equal = "==",
  NotEqual = "!=",
  Is = "is",
  Greater = ">",
  GreaterOrEqual = ">=",
  Less = "<",
  LessOrEqual = "<=",
  Contains = "contains",
  StartsWith = "startsWith",
  EndsWith = "endsWith",
  In = "in",
  NotIn = "notIn",
  Between = "between",
  Before = "before",
  After = "after",
  Exists = "exists",
  Missing = "missing",
  Empty = "empty",
  NotEmpty = "notEmpty",
  AndKeyword = "and",
  OrKeyword = "or",
}

interface Token {
  readonly type: TokenType;
  readonly value: string;
  readonly raw: string;
  readonly quote?: "'" | "\"";
  readonly loc: AstSourceSpan;
}

class SyntaxError extends Error {
  constructor(token: Token, message: string) {
    super(`${token.loc.start.line}:${token.loc.start.column} syntax error: ${message}`);
    this.name = "ExpressionSyntaxError";
  }
}

class Lexer {
  private position = 0;

  constructor(private readonly input: string) {}

  next(): Token {
    this.skipWhitespace();

    const start = this.position;
    const char = this.input[start];
    if (char === undefined) return this.token(TokenType.EOF, "", start, start);

    if (isNumberStart(char, this.input[start + 1], this.input[start + 2])) return this.number(start);
    if (isIdentifierChar(char)) return this.identifier(start);
    if (char === "'") return this.quotedString(start, "'");
    if (char === '"') return this.quotedString(start, '"');
    if (char === "(") return this.single(TokenType.LeftParen, start);
    if (char === ")") return this.single(TokenType.RightParen, start);
    if (char === "[") return this.single(TokenType.LeftBracket, start);
    if (char === "]") return this.single(TokenType.RightBracket, start);
    if (char === ",") return this.single(TokenType.Comma, start);
    if (isOperatorChar(char)) return this.operator(start);

    throw new SyntaxError(this.token(TokenType.EOF, char, start, start + 1), `unexpected character ${JSON.stringify(char)}`);
  }

  private skipWhitespace(): void {
    while (this.position < this.input.length && /\s/u.test(this.input[this.position] ?? "")) this.position += 1;
  }

  private single(type: TokenType, start: number): Token {
    this.position += 1;
    return this.token(type, this.input.slice(start, this.position), start, this.position);
  }

  private identifier(start: number): Token {
    while (isIdentifierChar(this.input[this.position] ?? "")) this.position += 1;
    const value = this.input.slice(start, this.position);
    if (value === "true" || value === "false") return this.token(TokenType.Boolean, value, start, this.position);

    switch (value.toLowerCase()) {
      case "contains": return this.token(TokenType.Contains, value, start, this.position);
      case "startswith": return this.token(TokenType.StartsWith, value, start, this.position);
      case "endswith": return this.token(TokenType.EndsWith, value, start, this.position);
      case "in": return this.token(TokenType.In, value, start, this.position);
      case "is": return this.token(TokenType.Is, value, start, this.position);
      case "notin": return this.token(TokenType.NotIn, value, start, this.position);
      case "between": return this.token(TokenType.Between, value, start, this.position);
      case "before": return this.token(TokenType.Before, value, start, this.position);
      case "after": return this.token(TokenType.After, value, start, this.position);
      case "exists": return this.token(TokenType.Exists, value, start, this.position);
      case "missing": return this.token(TokenType.Missing, value, start, this.position);
      case "empty": return this.token(TokenType.Empty, value, start, this.position);
      case "notempty": return this.token(TokenType.NotEmpty, value, start, this.position);
      case "and": return this.token(TokenType.AndKeyword, value, start, this.position);
      case "or": return this.token(TokenType.OrKeyword, value, start, this.position);
      case "not": return this.token(TokenType.NotKeyword, value, start, this.position);
      default: return this.token(TokenType.Identifier, value, start, this.position);
    }
  }

  private number(start: number): Token {
    if (this.input[this.position] === "-") this.position += 1;
    while (/[0-9.]/u.test(this.input[this.position] ?? "")) this.position += 1;
    return this.token(TokenType.Number, this.input.slice(start, this.position), start, this.position);
  }

  private quotedString(start: number, quote: "'" | "\""): Token {
    this.position += 1;
    let value = "";

    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (char === quote) {
        this.position += 1;
        return this.token(TokenType.String, value, start, this.position, quote);
      }

      if (char === "\\") {
        value += this.escapeSequence(start);
        continue;
      }

      value += char;
      this.position += 1;
    }

    throw new SyntaxError(this.token(TokenType.EOF, "", this.position, this.position), "unexpected EOF");
  }

  private escapeSequence(start: number): string {
    this.position += 1;
    const char = this.input[this.position];
    if (char === undefined) throw new SyntaxError(this.token(TokenType.EOF, "", this.position, this.position), "unexpected EOF");

    this.position += 1;
    switch (char) {
      case "'":
      case '"':
      case "\\": return char;
      case "n": return "\n";
      case "r": return "\r";
      case "t": return "\t";
      case "b": return "\b";
      case "f": return "\f";
      case "u": {
        const hex = this.input.slice(this.position, this.position + 4);
        if (!/^[0-9a-fA-F]{4}$/u.test(hex)) throw new SyntaxError(this.token(TokenType.EOF, `\\u${hex}`, start, this.position), "invalid unicode escape");
        this.position += 4;
        return String.fromCharCode(Number.parseInt(hex, 16));
      }
      default: throw new SyntaxError(this.token(TokenType.EOF, `\\${char}`, start, this.position), `invalid escape sequence ${JSON.stringify(`\\${char}`)}`);
    }
  }

  private operator(start: number): Token {
    while (isOperatorChar(this.input[this.position] ?? "")) this.position += 1;
    const value = this.input.slice(start, this.position);
    switch (value) {
      case "!": return this.token(TokenType.Not, value, start, this.position);
      case "&&": return this.token(TokenType.And, value, start, this.position);
      case "||": return this.token(TokenType.Or, value, start, this.position);
      case "==": return this.token(TokenType.Equal, value, start, this.position);
      case "!=": return this.token(TokenType.NotEqual, value, start, this.position);
      case ">": return this.token(TokenType.Greater, value, start, this.position);
      case ">=": return this.token(TokenType.GreaterOrEqual, value, start, this.position);
      case "<": return this.token(TokenType.Less, value, start, this.position);
      case "<=": return this.token(TokenType.LessOrEqual, value, start, this.position);
      default: throw new SyntaxError(this.token(TokenType.EOF, value, start, this.position), `unknown operator ${JSON.stringify(value)}`);
    }
  }

  private token(type: TokenType, value: string, start: number, end: number, quote?: "'" | "\""): Token {
    return { type, value, raw: this.input.slice(start, end), quote, loc: { start: this.positionFor(start), end: this.positionFor(end) } };
  }

  private positionFor(offset: number): AstPosition {
    const before = this.input.slice(0, offset);
    const lines = before.split("\n");
    return { offset, line: lines.length, column: lines[lines.length - 1]?.length ?? 0 };
  }
}

class Parser {
  private current: Token;
  private readonly lexer: Lexer;

  constructor(input: string) {
    this.lexer = new Lexer(input);
    this.current = this.lexer.next();
  }

  parseAst(): ExpAstNode {
    const expression = this.parseExpression();
    this.expect(TokenType.EOF);
    return expression;
  }

  private parseExpression(): ExpAstNode { return this.parseOr(); }

  private parseOr(): ExpAstNode {
    let left = this.parseAnd();
    while (this.matchAny(TokenType.Or, TokenType.OrKeyword)) {
      const right = this.parseAnd();
      left = { type: "LogicalExpression", operator: "or", left, right, loc: span(left, right) };
    }
    return left;
  }

  private parseAnd(): ExpAstNode {
    let left = this.parseNot();
    while (this.matchAny(TokenType.And, TokenType.AndKeyword)) {
      const right = this.parseNot();
      left = { type: "LogicalExpression", operator: "and", left, right, loc: span(left, right) };
    }
    return left;
  }

  private parseNot(): ExpAstNode {
    if (this.current.type === TokenType.Not || this.current.type === TokenType.NotKeyword) {
      const operator = this.current;
      this.advance();
      const argument = this.parseNot();
      return { type: "NotExpression", operator: "not", argument, loc: spanToken(operator, argument) };
    }
    return this.parseComparison();
  }

  private parseComparison(): ExpAstNode {
    const left = this.parsePrimary();
    const operator = this.current;
    if (!isComparison(operator.type) && !isUnaryComparison(operator.type)) return left;

    const comparisonLeft = asComparisonLeft(left, operator);

    if (isUnaryComparison(operator.type)) {
      this.advance();
      return { type: "UnaryComparisonExpression", operator: unaryOperator(operator), argument: comparisonLeft, loc: span(comparisonLeft, operator) };
    }

    this.advance();

    if (operator.type === TokenType.Between) {
      const min = this.parsePrimary();
      this.expect(TokenType.AndKeyword);
      const max = this.parsePrimary();
      return { type: "BetweenExpression", operator: "between", left: comparisonLeft, min, max, loc: span(comparisonLeft, max) };
    }

    const right = operator.type === TokenType.In || operator.type === TokenType.NotIn ? this.parseArray() : this.parsePrimary();
    return { type: "ComparisonExpression", operator: comparisonOperator(operator), left: comparisonLeft, right, loc: span(comparisonLeft, right) };
  }

  private parsePrimary(): ExpAstNode {
    const token = this.current;

    switch (token.type) {
      case TokenType.Boolean:
        this.advance();
        return { type: "BooleanLiteral", value: token.value === "true", raw: token.raw, loc: token.loc };
      case TokenType.String:
        this.advance();
        return { type: "StringLiteral", value: token.value, raw: token.raw, quote: token.quote ?? '"', loc: token.loc };
      case TokenType.Number: {
        this.advance();
        const value = Number(token.value);
        if (Number.isNaN(value)) throw new SyntaxError(token, `invalid number ${JSON.stringify(token.value)}`);
        return { type: "NumberLiteral", value, raw: token.raw, loc: token.loc };
      }
      case TokenType.Identifier:
      case TokenType.Contains:
      case TokenType.StartsWith:
      case TokenType.EndsWith:
      case TokenType.In:
      case TokenType.NotIn:
      case TokenType.Is:
      case TokenType.Between:
      case TokenType.Before:
      case TokenType.After:
      case TokenType.Exists:
      case TokenType.Missing:
      case TokenType.Empty:
      case TokenType.NotEmpty:
      case TokenType.AndKeyword:
      case TokenType.OrKeyword:
      case TokenType.NotKeyword:
        this.advance();
        return { type: "Identifier", name: token.value, loc: token.loc };
      case TokenType.LeftParen: {
        const open = token;
        this.advance();
        const expression = this.parseExpression();
        const close = this.expect(TokenType.RightParen);
        return { type: "ParenthesizedExpression", expression, loc: { start: open.loc.start, end: close.loc.end } };
      }
      default:
        throw new SyntaxError(token, `unexpected ${token.type}`);
    }
  }

  private parseArray(): ExpAstNode {
    const open = this.expect(TokenType.LeftBracket);
    const elements: (StringLiteralAstNode | NumberLiteralAstNode)[] = [];
    if (this.current.type === TokenType.RightBracket) {
      const close = this.current;
      this.advance();
      return { type: "ArrayLiteral", elements: [], loc: { start: open.loc.start, end: close.loc.end } };
    }

    while (true) {
      const node = this.parsePrimary();
      if (node.type !== "StringLiteral" && node.type !== "NumberLiteral") throw new SyntaxError(this.current, "array values must be strings or numbers");
      elements.push(node);
      if (!this.match(TokenType.Comma)) break;
    }

    const close = this.expect(TokenType.RightBracket);
    return { type: "ArrayLiteral", elements, loc: { start: open.loc.start, end: close.loc.end } };
  }

  private match(type: TokenType): boolean {
    if (this.current.type !== type) return false;
    this.advance();
    return true;
  }

  private matchAny(...types: TokenType[]): boolean {
    if (!types.includes(this.current.type)) return false;
    this.advance();
    return true;
  }

  private expect(type: TokenType): Token {
    const token = this.current;
    if (token.type !== type) throw new SyntaxError(token, `expected ${type} but found ${token.type}`);
    this.advance();
    return token;
  }

  private advance(): void { this.current = this.lexer.next(); }
}

function asComparisonLeft(node: ExpAstNode, token: Token) {
  const unwrapped = node.type === "ParenthesizedExpression" ? node.expression : node;
  if (unwrapped.type === "Identifier") return unwrapped;
  if (unwrapped.type === "StringLiteral") return unwrapped;
  throw new SyntaxError(token, "left side of a comparison must be an identifier");
}

function comparisonOperator(token: Token): ComparisonOperator {
  switch (token.type) {
    case TokenType.Equal: return "==";
    case TokenType.NotEqual: return "!=";
    case TokenType.Is: return "is";
    case TokenType.Greater: return ">";
    case TokenType.GreaterOrEqual: return ">=";
    case TokenType.Less: return "<";
    case TokenType.LessOrEqual: return "<=";
    case TokenType.Contains: return "contains";
    case TokenType.StartsWith: return "startsWith";
    case TokenType.EndsWith: return "endsWith";
    case TokenType.In: return "in";
    case TokenType.NotIn: return "notIn";
    case TokenType.Before: return "before";
    case TokenType.After: return "after";
    default: throw new SyntaxError(token, `unsupported comparison operator ${token.value}`);
  }
}

function unaryOperator(token: Token): UnaryComparisonOperator {
  switch (token.type) {
    case TokenType.Exists: return "exists";
    case TokenType.Missing: return "missing";
    case TokenType.Empty: return "empty";
    case TokenType.NotEmpty: return "notEmpty";
    default: throw new SyntaxError(token, `unsupported unary operator ${token.value}`);
  }
}

function span(left: ExpAstNode | { readonly loc: AstSourceSpan }, right: ExpAstNode | Token | { readonly loc: AstSourceSpan }): AstSourceSpan {
  return { start: left.loc.start, end: right.loc.end };
}

function spanToken(left: Token, right: ExpAstNode): AstSourceSpan {
  return { start: left.loc.start, end: right.loc.end };
}

function isComparison(type: TokenType): boolean {
  return type === TokenType.Equal || type === TokenType.NotEqual || type === TokenType.Is || type === TokenType.Greater || type === TokenType.GreaterOrEqual || type === TokenType.Less || type === TokenType.LessOrEqual || type === TokenType.Contains || type === TokenType.StartsWith || type === TokenType.EndsWith || type === TokenType.In || type === TokenType.NotIn || type === TokenType.Between || type === TokenType.Before || type === TokenType.After;
}

function isUnaryComparison(type: TokenType): boolean {
  return type === TokenType.Exists || type === TokenType.Missing || type === TokenType.Empty || type === TokenType.NotEmpty;
}

function isDigit(value: string | undefined): boolean {
  return value !== undefined && /^[0-9]$/u.test(value);
}

function isNumberStart(value: string, next: string | undefined, afterNext: string | undefined): boolean {
  return isDigit(value) || (value === "-" && (isDigit(next) || (next === "." && isDigit(afterNext))));
}

function isIdentifierChar(value: string): boolean {
  return /^[\p{L}\p{N}_.]$/u.test(value);
}

function isOperatorChar(value: string): boolean {
  return /^[=!><&|]$/u.test(value);
}

export function parseAst(input: string): ExpAstNode {
  return new Parser(input).parseAst();
}

export function parseResult(input: string, context?: ParserContextLike): ParseResult {
  const ast = parseAst(input);
  return { source: input, ast, expression: compileAst(ast, context) };
}

export function Parse(input: string, context?: ParserContextLike): Exp {
  return parseResult(input, context).expression;
}

export const parse = Parse;
