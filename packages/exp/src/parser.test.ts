import { describe, expect, it } from "vitest";
import { compileAst, parse, parseAst, parseResult } from "./index";

describe("parser", () => {
  it("supports and/or/not keyword boolean operators", () => {
    expect(parse(`foo > 10 and bar == "x"`).eval({ foo: 11, bar: "x" })).toBe(true);
    expect(parse(`foo > 10 or bar == "x"`).eval({ foo: 1, bar: "x" })).toBe(true);
    expect(parse(`not (foo > 10)`).eval({ foo: 1 })).toBe(true);
  });

  it("keeps keyword operator precedence aligned with symbolic operators", () => {
    expect(parse(`not foo == "x" or bar == "y" and baz == "z"`).eval({ foo: "a", bar: "y", baz: "z" })).toBe(true);
    expect(parse(`not (foo == "x" or bar == "y")`).eval({ foo: "a", bar: "y" })).toBe(false);
  });

  it("supports escaped strings", () => {
    expect(parse(`value == "say \\"hello\\""`).eval({ value: 'say "hello"' })).toBe(true);
    expect(parse(`value == 'it\\'s ok'`).eval({ value: "it's ok" })).toBe(true);
    expect(parse(`value == "line\\nbreak"`).eval({ value: "line\nbreak" })).toBe(true);
    expect(parse(`value == "snowman \\u2603"`).eval({ value: "snowman ☃" })).toBe(true);
  });

  it("supports negative numbers", () => {
    expect(parse(`value == -3`).eval({ value: -3 })).toBe(true);
    expect(parse(`value > -10 and value < -1`).eval({ value: -5 })).toBe(true);
    expect(parse(`value between -10 and -1`).eval({ value: -5 })).toBe(true);
    expect(parse(`value in [-3, -2, -1]`).eval({ value: -2 })).toBe(true);
  });

  it("exposes an AST for parser tooling", () => {
    const ast = parseAst(`foo > 10 and bar == "x"`);

    expect(ast.type).toBe("LogicalExpression");
    if (ast.type !== "LogicalExpression") return;

    expect(ast.operator).toBe("and");
    expect(ast.loc.start.offset).toBe(0);
    expect(ast.loc.end.offset).toBe(23);
    expect(ast.left.type).toBe("ComparisonExpression");
    expect(ast.right.type).toBe("ComparisonExpression");
  });

  it("returns AST and compiled expression parser results", () => {
    const result = parseResult(`env.enabled is true`, { enabled: true });

    expect(result.source).toBe(`env.enabled is true`);
    expect(result.ast.type).toBe("ComparisonExpression");
    expect(result.expression.eval()).toBe(true);
  });

  it("compiles exported AST nodes", () => {
    const ast = parseAst(`age between 18 and 65`);

    expect(compileAst(ast).eval({ age: 42 })).toBe(true);
  });
});
