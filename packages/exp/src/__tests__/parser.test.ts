import { describe, expect, it } from "vitest";
import { Parse, parse } from "../index";

describe("parse", () => {
  const params = {
    foo: "124",
    bar: "x",
    "b-z": "z",
    baz: "food",
    status: "published",
    role: "member",
    age: "42",
    title: "Hello world",
    email: "person@example.com",
    empty: "",
    createdAt: "2024-01-01",
  };

  it.each([
    `true`,
    `(foo == 124)`,
    `(foo >= 123)`,
    `(foo < 456)`,
    `((foo > 200) || (bar == "x"))`,
    `((foo > 100) && (bar == "x"))`,
    `('b-z' == "z")`,
    `(baz contains 'foo')`,
    `title startsWith 'Hello'`,
    `email endsWith 'example.com'`,
    `status in ['draft', 'published']`,
    `role notIn ['admin', 'owner']`,
    `age between 18 and 65`,
    `title exists`,
    `missingField missing`,
    `empty empty`,
    `title notEmpty`,
    `createdAt before '2024-02-01'`,
    `createdAt after '2023-12-31'`,
  ])("parses and evaluates %s", (source) => {
    expect(parse(source).eval(params)).toBe(true);
  });

  it("supports the Parse alias", () => {
    expect(Parse(`(foo == 124)`).Eval(params)).toBe(true);
  });

  it("supports logical not", () => {
    expect(parse(`!false`).eval(params)).toBe(true);
  });

  it("respects && precedence over ||", () => {
    expect(parse(`false || true && false`).eval(params)).toBe(false);
    expect(parse(`(false || true) && false`).eval(params)).toBe(false);
    expect(parse(`true || true && false`).eval(params)).toBe(true);
  });

  it("supports string inequality", () => {
    expect(parse(`(bar != "y")`).eval(params)).toBe(true);
  });

  it("supports contains as a string comparison operator", () => {
    expect(parse(`baz contains 'foo'`).eval(params)).toBe(true);
    expect(parse(`baz contains 'bar'`).eval(params)).toBe(false);
  });

  it("supports contains as an array membership operator", () => {
    expect(parse(`tags contains 'admin'`).eval({ tags: ["member", "admin"] })).toBe(true);
    expect(parse(`tags contains 'guest'`).eval({ tags: ["member", "admin"] })).toBe(false);
    expect(parse(`ids contains 2`).eval({ ids: [1, 2, 3] })).toBe(true);
  });

  it("supports prioritized layout-rule operators", () => {
    expect(parse(`true`).eval(params)).toBe(true);
    expect(parse(`enabled is true`).eval({ enabled: true })).toBe(true);
    expect(parse(`enabled == true`).eval({ enabled: "true" })).toBe(true);
    expect(parse(`title startsWith 'Hello'`).eval(params)).toBe(true);
    expect(parse(`email endsWith 'example.com'`).eval(params)).toBe(true);
    expect(parse(`status in ['draft', 'published']`).eval(params)).toBe(true);
    expect(parse(`role notIn ['admin', 'owner']`).eval(params)).toBe(true);
    expect(parse(`age between 18 and 65`).eval(params)).toBe(true);
    expect(parse(`title exists`).eval(params)).toBe(true);
    expect(parse(`missingField missing`).eval(params)).toBe(true);
    expect(parse(`empty empty`).eval(params)).toBe(true);
    expect(parse(`title notEmpty`).eval(params)).toBe(true);
    expect(parse(`createdAt before '2024-02-01'`).eval(params)).toBe(true);
    expect(parse(`createdAt after '2023-12-31'`).eval(params)).toBe(true);
  });

  it("supports nested param paths", () => {
    const nestedParams = {
      user: {
        profile: {
          name: "Ada",
          age: -3,
        },
        enabled: true,
      },
      items: {
        status: "published",
      },
    };

    expect(parse(`user.profile.name == 'Ada'`).eval(nestedParams)).toBe(true);
    expect(parse(`user.profile.age == -3`).eval(nestedParams)).toBe(true);
    expect(parse(`user.enabled is true and items.status == 'published'`).eval(nestedParams)).toBe(true);
    expect(parse(`user.missing missing`).eval(nestedParams)).toBe(true);
  });

  it("prefers exact param keys over nested param paths", () => {
    expect(parse(`user.profile.name == 'flat'`).eval({ "user.profile.name": "flat", user: { profile: { name: "nested" } } })).toBe(true);
  });

  it("uses optional parser context for env paths", () => {
    const env = {
      featureToggles: {
        MyNewFeature: true,
      },
      licensee: {
        id: 1,
      },
      plan: "enterprise",
    };

    expect(parse(`env.featureToggles.MyNewFeature is true`, env).eval()).toBe(true);
    expect(parse(`env.licensee.id == 1`, { env }).eval()).toBe(true);
    expect(parse(`env.plan == 'enterprise' && title exists`, env).eval(params)).toBe(true);
  });

  it("throws on unsupported string comparisons", () => {
    expect(() => parse(`(bar > "a")`)).toThrow(/strings only support ==, !=, is, contains/);
  });

  it("throws on unterminated strings", () => {
    expect(() => parse(`(bar == "x)`)).toThrow(/unexpected EOF/);
  });
});
