import type { MDLForm, MDLFormNode } from "../form";
import type { MDLLayout, MDLLayoutNode, MDLNode } from "../layout";

interface User {
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  orders: { id: string; total: number }[];
}

export const verticalForm: MDLLayout<User> = {
  kind: "layout",
  id: "userForm",
  layout: "vertical",
  children: [
    { kind: "field", id: "first-name", field: "firstName", type: "string" },
    { kind: "field", id: "last-name", field: "lastName", type: "string" },
  ],
};

export const nestedForm: MDLLayout<User> = {
  kind: "layout",
  id: "userForm",
  layout: "vertical",
  children: [
    { kind: "field", id: "email-input", field: "email", type: "string" },
    {
      kind: "layout",
      id: "name",
      layout: "horizontal",
      props: { gap: "1rem", wrap: true },
      children: [
        { kind: "field", id: "first-name", field: "firstName", type: "string" },
        { kind: "field", id: "last-name", field: "lastName", type: "string" },
      ],
    },
  ],
};

export const gridForm: MDLLayout<User> = {
  kind: "layout",
  id: "userForm",
  layout: "grid",
  props: { columns: 2, gap: 8 },
  tags: ["dense"],
  children: [
    { kind: "field", id: "email-input", field: "email", type: "string" },
    { kind: "field", id: "age-input", field: "age", type: "number", tags: ["stepper"] },
    { kind: "component", id: "help", type: "text" },
  ],
};

export const empty: MDLLayout = { kind: "layout", id: "spacer", layout: "vertical", children: [] };

export const deep: MDLLayout<User> = {
  kind: "layout",
  id: "root",
  layout: "vertical",
  children: [
    {
      kind: "layout",
      id: "row",
      layout: "horizontal",
      children: [
        {
          kind: "layout",
          id: "col",
          layout: "grid",
          props: { columns: 3 },
          children: [{ kind: "field", id: "age-input", field: "age", type: "number" }],
        },
      ],
    },
  ],
};

export const single: MDLLayoutNode<"grid", User> = {
  kind: "layout",
  id: "g",
  layout: "grid",
  props: { columns: 4 },
  children: [],
};

export const form: MDLForm<User> = {
  kind: "form",
  id: "user-form",
  layout: "vertical",
  props: { gap: "1rem" },
  children: [
    {
      kind: "layout",
      id: "name",
      layout: "horizontal",
      children: [
        { kind: "field", id: "first-name", field: "firstName", type: "string" },
        { kind: "field", id: "last-name", field: "lastName", type: "string" },
      ],
    },
  ],
};

export const gridFormNode: MDLFormNode<"grid", User> = {
  kind: "form",
  id: "grid-form",
  layout: "grid",
  props: { columns: 2 },
  children: [],
};

export function label(node: MDLNode<User>): string {
  if (node.kind === "layout" || node.kind === "form") return node.layout;
  return node.type;
}

// @ts-expect-error columns is a grid prop, not a vertical one
export const badProp: MDLLayout = { kind: "layout", id: "x", layout: "vertical", props: { columns: 2 }, children: [] };

// @ts-expect-error wrap is a horizontal prop, not a grid one
export const wrongProp: MDLLayout = { kind: "layout", id: "x", layout: "grid", props: { wrap: true }, children: [] };

// @ts-expect-error "tabs" is not a registered layout
export const badLayout: MDLLayout = { kind: "layout", id: "x", layout: "tabs", children: [] };

// @ts-expect-error children is required
export const noChildren: MDLLayout = { kind: "layout", id: "x", layout: "vertical" };

// @ts-expect-error kind is required
export const noKind: MDLLayout = { id: "x", layout: "vertical", children: [] };

export const nestedTypo: MDLLayout<User> = {
  kind: "layout",
  id: "root",
  layout: "vertical",
  children: [
    {
      kind: "layout",
      id: "group",
      layout: "horizontal",
      // @ts-expect-error "frstName" is not a key of User
      children: [{ kind: "field", id: "first-name", field: "frstName", type: "string" }],
    },
  ],
};

export const nestedBadType: MDLLayout<User> = {
  kind: "layout",
  id: "root",
  layout: "vertical",
  // @ts-expect-error "currency" is not a registered MDLFieldType
  children: [{ kind: "field", id: "age-input", field: "age", type: "currency" }],
};
