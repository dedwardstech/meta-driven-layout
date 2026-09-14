import type { MDLField } from "../field";

type User = {
  email: string;
  age: number;
  orders: { id: string; total: number }[];
};

type Money = {
  currency: string;
  precision: number;
};

export const untyped: MDLField = {
  kind: "field",
  id: "anything-at-all",
  field: "anything-at-all",
  type: "string",
};

export const typedField: MDLField<User> = {
  kind: "field",
  id: "email-input",
  field: "email",
  type: "string",
};

// @ts-expect-error "emial" is not a key of User
export const typoField: MDLField<User> = { kind: "field", id: "email-input", field: "emial", type: "string" };

// @ts-expect-error "currency" is not a registered MDLFieldType
export const unregisteredType: MDLField = { kind: "field", id: "total-input", field: "total", type: "currency" };

// @ts-expect-error kind is required
export const noKind: MDLField = { id: "total-input", field: "total", type: "number" };

// @ts-expect-error kind must be "field"
export const wrongKind: MDLField = { kind: "layout", id: "total-input", field: "total", type: "number" };

export const relation: MDLField<User> = {
  kind: "field",
  id: "orders-input",
  field: "orders",
  type: "one-to-many",
};

export const typedProps: MDLField<User, Money> = {
  kind: "field",
  id: "age-input",
  field: "age",
  type: "number",
  props: { currency: "USD", precision: 2 },
};

// @ts-expect-error precision is required by Money
export const partialProps: MDLField<User, Money> = { kind: "field", id: "age-input", field: "age", type: "number", props: { currency: "USD" } };

export const untypedProps: MDLField = {
  kind: "field",
  id: "total-input",
  field: "total",
  type: "number",
  props: { anything: 1, nested: { ok: true } },
};

export const tagged: MDLField<User> = {
  kind: "field",
  id: "email-input",
  field: "email",
  type: "string",
  tags: ["compact", "inline"],
  props: {
    class: "col-span-2",
    style: "min-width: 12rem",
    placeholder: "Email address",
    required: true,
    maxlength: 254,
  },
};
