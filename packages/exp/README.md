# @mdl/exp

TypeScript rewrite of [`github.com/alexkappa/exp`](https://github.com/alexkappa/exp): a small binary expression tree / rules engine.

```ts
import { And, GreaterThan, LessThan, Match, parse } from "@mdl/exp";

const condition = And(
  Match("event", "signup"),
  GreaterThan("basketValue", 99.99),
  LessThan("riskScore", 10),
);

condition.eval({ event: "signup", basketValue: 199.9, riskScore: 3 }); // true
condition.Eval({ event: "signup", basketValue: 199.9, riskScore: 3 }); // true

const fromText = parse(`((foo > 100) and (bar == "x"))`);
fromText.eval({ foo: "124", bar: "x" }); // true

const withContains = parse(`baz contains 'foo'`);
withContains.eval({ baz: "food" }); // true

parse(`status in ['draft', 'published']`).eval({ status: "published" }); // true
parse(`age between -10 and 65`).eval({ age: 42 }); // true
parse(`title == "say \\"hello\\""`).eval({ title: 'say "hello"' }); // true
parse(`title exists`).eval({ title: "Hello" }); // true
parse(`createdAt before '2024-02-01'`).eval({ createdAt: "2024-01-01" }); // true

const env = {
  featureToggles: { MyNewFeature: true },
  licensee: { id: 1 },
};

parse(`env.featureToggles.MyNewFeature is true`, env).eval(); // true
parse(`env.licensee.id == 1`, { env }).eval(); // true
```

## AST and parser results

Use `parseAst` or `parseResult` to build editor, linting, visualization, and migration tooling around expression text.

```ts
import { compileAst, parseAst, parseResult } from "@mdl/exp";

const ast = parseAst(`foo > 10 and bar == "x"`);
ast.type; // "LogicalExpression"
ast.loc.start.offset; // 0

const result = parseResult(`env.featureToggles.MyNewFeature is true`, env);
result.ast; // exported AST node tree with source spans
result.expression.eval(); // true

compileAst(ast).eval({ foo: 11, bar: "x" }); // true
```

## Supported expressions

- Boolean: `True`, `False`, `Not`, `And`, `Or`
- Number comparisons: `Equal`/`Eq`, `NotEqual`/`Neq`, `GreaterThan`/`Gt`, `GreaterOrEqual`/`Gte`, `LessThan`/`Lt`, `LessOrEqual`/`Lte`, `Between`
- String checks: `Match`, `MatchAny`, `Contains`, `ContainsAny`, `StartsWith`, `EndsWith`, `In`, `NotIn`, `Len`, `Count`, `EqualFold`
- Existence/value checks: `Exists`, `Missing`, `Empty`, `NotEmpty`, `Is`, `IsNot`
- Dates: `On`, `Before`, `After`, `Weekday`, `Day`, `Month`, `Year`, `DateFormat`
- Text parsing: `parse`/`Parse` with boolean operators `and`/`&&`, `or`/`||`, `not`/`!`; comparisons including `is`, `contains`, `startsWith`, `endsWith`, `in`, `notIn`, `between`, `exists`, `missing`, `empty`, `notEmpty`, `before`, and `after`; escaped strings; and negative numbers

## Parser context

`parse` and `Parse` accept an optional context. Values in that context are available from expressions via the `env.` prefix. You can pass either the env object directly or an object with an `env` property.

## Attribution

This package is a TypeScript rewrite of the MIT-licensed Go package `github.com/alexkappa/exp` by Alex Kalyvitis.
