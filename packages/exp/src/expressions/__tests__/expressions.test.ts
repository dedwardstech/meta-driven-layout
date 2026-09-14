import { describe, expect, it } from "vitest";
import {
  After,
  And,
  Before,
  Between,
  Contains,
  ContainsAny,
  Count,
  DateFormat,
  Day,
  Empty,
  EndsWith,
  Eq,
  EqualFold,
  Exists,
  False,
  GreaterThan,
  Gte,
  In,
  Is,
  IsNot,
  Len,
  LessThan,
  Lte,
  Match,
  MatchAny,
  Missing,
  Month,
  MonthValue,
  Neq,
  Not,
  NotEmpty,
  NotIn,
  On,
  Or,
  StartsWith,
  True,
  Weekday,
  WeekdayValue,
  Map as ExpMap,
} from "../../index";

describe("boolean expressions", () => {
  it("evaluates constants and logical expressions", () => {
    expect(True.eval()).toBe(true);
    expect(False.eval()).toBe(false);
    expect(Not(True).eval()).toBe(false);
    expect(Not(False).eval()).toBe(true);
    expect(And(True, True, True).eval()).toBe(true);
    expect(And(True, False, True).eval()).toBe(false);
    expect(Or(False, False, True).eval()).toBe(true);
    expect(Or(False, False).eval()).toBe(false);
  });

  it("keeps Go-compatible Eval aliases", () => {
    expect(And(True, Not(False)).Eval()).toBe(true);
  });
});

describe("number expressions", () => {
  const params = { foo: "23", bar: "5" };

  it("evaluates numeric comparisons", () => {
    expect(Eq("foo", 23).eval(params)).toBe(true);
    expect(GreaterThan("bar", 4.9).eval(params)).toBe(true);
    expect(GreaterThan("bar", 5.1).eval(params)).toBe(false);
    expect(LessThan("bar", 6.2).eval(params)).toBe(true);
    expect(LessThan("bar", 4.2).eval(params)).toBe(false);
    expect(Neq("bar", 6).eval(params)).toBe(true);
    expect(Gte("bar", 4.9).eval(params)).toBe(true);
    expect(Gte("bar", 5).eval(params)).toBe(true);
    expect(Gte("bar", 6).eval(params)).toBe(false);
    expect(Lte("foo", 23).eval(params)).toBe(true);
    expect(Lte("foo", 22).eval(params)).toBe(false);
    expect(Lte("foo", 24).eval(params)).toBe(true);
  });

  it("returns false when the parameter cannot be parsed as a number", () => {
    expect(Eq("foo", 23).eval({ foo: "not-a-number" })).toBe(false);
  });

  it("evaluates inclusive between comparisons", () => {
    expect(Between("bar", 5, 10).eval(params)).toBe(true);
    expect(Between("bar", 6, 10).eval(params)).toBe(false);
  });
});

describe("string expressions", () => {
  const params = {
    foo: "bar",
    bar: "baz",
    baz: "booyah",
  };

  it("evaluates exact and any-of matches", () => {
    expect(Match("foo", "bar").eval(params)).toBe(true);
    expect(Match("foo", "baz").eval(params)).toBe(false);
    expect(MatchAny("foo", "zzz", "bar").eval(params)).toBe(true);
  });

  it("evaluates string content checks", () => {
    expect(Contains("foo", "ar").eval(params)).toBe(true);
    expect(ContainsAny("bar", "zax").eval(params)).toBe(true);
    expect(StartsWith("baz", "boo").eval(params)).toBe(true);
    expect(EndsWith("baz", "yah").eval(params)).toBe(true);
    expect(Len("baz", 6).eval(params)).toBe(true);
    expect(Count("baz", "o", 2).eval(params)).toBe(true);
    expect(EqualFold("foo", "Bar").eval(params)).toBe(true);
  });

  it("evaluates array contains checks", () => {
    expect(Contains("tags", "admin").eval({ tags: ["member", "admin"] })).toBe(true);
    expect(Contains("tags", "guest").eval({ tags: ["member", "admin"] })).toBe(false);
    expect(Contains("ids", 2).eval({ ids: [1, 2, 3] })).toBe(true);
    expect(Contains("ids", "2").eval({ ids: [1, 2, 3] })).toBe(true);
  });

  it("evaluates in and notIn checks", () => {
    expect(In("foo", ["bar", "baz"]).eval(params)).toBe(true);
    expect(In("foo", ["zip", "zap"]).eval(params)).toBe(false);
    expect(NotIn("foo", ["zip", "zap"]).eval(params)).toBe(true);
  });

  it("evaluates existence and empty checks", () => {
    expect(Exists("foo").eval(params)).toBe(true);
    expect(Missing("nope").eval(params)).toBe(true);
    expect(Empty("empty").eval({ empty: "" })).toBe(true);
    expect(Empty("missing").eval(params)).toBe(true);
    expect(NotEmpty("foo").eval(params)).toBe(true);
  });

  it("evaluates boolean is checks", () => {
    expect(Is("enabled", true).eval({ enabled: true })).toBe(true);
    expect(Is("enabled", true).eval({ enabled: "true" })).toBe(true);
    expect(IsNot("enabled", true).eval({ enabled: false })).toBe(true);
  });
});

describe("parameter sources", () => {
  it("accepts object params", () => {
    expect(Match("event", "signup").eval({ event: "signup" })).toBe(true);
  });

  it("accepts URLSearchParams-style params", () => {
    const params = {
      get(key: string) {
        return key === "event" ? "signup" : key === "value" ? "199.90" : null;
      },
    };
    expect(And(Match("event", "signup"), GreaterThan("value", 99.99)).eval(params)).toBe(true);
  });

  it("exports a map params helper", () => {
    const params = new ExpMap({ foo: "bar" });
    expect(Match("foo", "bar").eval(params)).toBe(true);
  });
});

describe("date expressions", () => {
  const params = {
    past: "1969-07-10",
    present: "2014-12-15",
    future: "2033-03-09",
    iso: "2001-03-02T14:00:00.000Z",
  };

  it("evaluates date comparisons using the default yyyy-mm-dd parser", () => {
    expect(On("present", new Date(Date.UTC(2014, 11, 15))).eval(params)).toBe(true);
    expect(Before("past", new Date()).eval(params)).toBe(true);
    expect(After("future", new Date()).eval(params)).toBe(true);
  });

  it("evaluates date parts", () => {
    expect(Weekday("present", WeekdayValue.Monday).eval(params)).toBe(true);
    expect(Day("present", 15).eval(params)).toBe(true);
    expect(Month("present", MonthValue.December).eval(params)).toBe(true);
  });

  it("allows the configured date parser to be changed", () => {
    const previous = DateFormat((value) => new Date(value));

    try {
      expect(On("iso", new Date("2001-03-02T14:00:00.000Z")).eval(params)).toBe(true);
    } finally {
      DateFormat(previous);
    }
  });
});

describe("string formatting", () => {
  it("matches the original expression string format", () => {
    expect(String(True)).toBe("T");
    expect(String(False)).toBe("F");
    expect(String(Not(True))).toBe("¬T");
    expect(String(And(True, False))).toBe("(T∧F)");
    expect(String(Or(True, False))).toBe("(T∨F)");
    expect(String(Eq("foo", 10))).toBe("[foo==10.00]");
    expect(String(Neq("foo", 5))).toBe("¬[foo==5.00]");
    expect(String(Gte("bar", 10))).toBe("([bar>10.00]∨[bar==10.00])");
    expect(String(Lte("bar", 5))).toBe("([bar<5.00]∨[bar==5.00])");
    expect(String(Match("baz", "abc"))).toBe("[baz==abc]");
    expect(String(Contains("foo", "bc"))).toBe("[foo∋bc]");
    expect(String(EqualFold("bar", "AbC"))).toBe("[bar≈AbC]");
  });
});
