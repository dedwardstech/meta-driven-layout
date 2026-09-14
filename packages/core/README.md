# `@mdl/core`

Framework-agnostic types and registry utilities for describing meta-driven layouts.

`@mdl/core` lets you model a UI as a typed tree of layout and field nodes, attach rendering hints, and resolve implementations by type and tags. It does not render the tree itself, so the same schema can be consumed by React, another UI framework, or your own renderer.

## Installation

```sh
pnpm add @mdl/core
```

## Define a layout

Pass your data shape to `MDLLayout` to restrict field bindings to known keys:

```ts
import type { MDLLayout } from "@mdl/core";

interface User {
  email: string;
  firstName: string;
  lastName: string;
  age: number;
}

const userForm: MDLLayout<User> = {
  kind: "layout",
  id: "user-form",
  layout: "vertical",
  props: { gap: "1rem" },
  children: [
    {
      kind: "layout",
      id: "name",
      layout: "horizontal",
      props: { gap: 8, wrap: true },
      children: [
        { kind: "field", id: "first-name", field: "firstName", type: "string" },
        { kind: "field", id: "last-name", field: "lastName", type: "string" },
      ],
    },
    {
      kind: "field",
      id: "email-input",
      field: "email",
      type: "string",
      tags: ["full-width"],
      props: {
        class: "email-input",
        placeholder: "name@example.com",
        required: true,
      },
    },
    { kind: "field", id: "age-input", field: "age", type: "number" },
  ],
};
```

The `kind` property forms a discriminated union, making recursive consumers straightforward:

```ts
import type { MDLNode } from "@mdl/core";

function describe(node: MDLNode<User>): string {
  return node.kind === "layout" ? node.layout : node.type;
}
```

## Nodes

All nodes share `MDLNodeAttributes`: a stable `id` plus optional `tags`.

### Components

An `MDLComponent<TType, TProps>` describes a generic renderable leaf that is not necessarily bound to application data. Its `props` are passed to the selected renderer:

```ts
import type { MDLComponent } from "@mdl/core";

const heading: MDLComponent<"heading"> = {
  kind: "component",
  id: "profile-heading",
  type: "heading",
  props: { children: "Profile", class: "page-title" },
};
```

Component types are strings and can be narrowed through the `TType` parameter.

### Fields

An `MDLField<TData, TProps>` describes a value from your data model.

```ts
import type { MDLField } from "@mdl/core";

const field: MDLField<User> = {
  kind: "field",
  id: "email-input",
  field: "email",
  type: "string",
};
```

Built-in field types are:

- `string`
- `number`
- `boolean`
- `readonly`
- `one-to-many`

A field's `id` identifies the layout node, while `field` identifies the value in the data model. When `TData` is an object, `field` must be one of its string keys. Without a data type, any string field name is accepted.

### Forms

An `MDLForm<TData, TProps>` marks a subtree as a form boundary while still using a layout to arrange its children. Nested layouts inside the form remain regular `layout` nodes; renderers can carry form/value context through them to descendant fields.

```ts
import type { MDLForm } from "@mdl/core";

const form: MDLForm<User> = {
  kind: "form",
  id: "profile-form",
  layout: "vertical",
  props: { gap: "1rem" },
  children: [
    {
      kind: "layout",
      id: "name-row",
      layout: "horizontal",
      children: [
        { kind: "field", id: "first-name", field: "firstName", type: "string" },
        { kind: "field", id: "last-name", field: "lastName", type: "string" },
      ],
    },
  ],
};
```

### Layouts

An `MDLLayout<TData, TProps>` groups component, field, and layout nodes recursively. `TProps` controls the renderer props of component and field descendants. Built-in layouts and their props are:

| Layout | Props |
| --- | --- |
| `vertical` | `gap?: string \| number` |
| `horizontal` | `gap?: string \| number`, `wrap?: boolean` |
| `grid` | `columns?: number`, `gap?: string \| number` |

Use `MDLLayoutNode<"grid", TData>` when you need a specific layout variant rather than the complete layout union.

## Renderer props

Nodes can include:

- `tags`: labels used to select specialized implementations.
- `props`: values passed to the component, field, or layout implementation selected by the registry.

```ts
interface CurrencyProps {
  currency: string;
  precision: number;
  class?: string;
  "data-testid"?: string;
}

const amount: MDLField<{ total: number }, CurrencyProps> = {
  kind: "field",
  id: "total-input",
  field: "total",
  type: "number",
  tags: ["currency"],
  props: {
    currency: "USD",
    precision: 2,
    class: "amount",
    "data-testid": "total",
  },
};
```

## Resolve implementations with `MDLRegistry`

`MDLRegistry<TDefinition>` stores multiple kinds of implementation in one typed registry. The definition controls the valid types and implementation value for each kind.

```ts
import { MDLRegistry } from "@mdl/core";
import type { MDLFieldType, MDLLayoutType } from "@mdl/core";

type Renderer = (value: unknown) => string;

interface Renderers {
  layout: { type: MDLLayoutType; implementation: Renderer };
  field: { type: MDLFieldType; implementation: Renderer };
  component: { type: string; implementation: Renderer };
}

const registry = new MDLRegistry<Renderers>({ name: "renderers" });

registry.register({
  kind: "field",
  type: "string",
  implementation: (value) => String(value),
});
registry.register({
  kind: "field",
  type: "string",
  tags: ["emphasis"],
  implementation: (value) => String(value).toUpperCase(),
});
registry.register({
  kind: "layout",
  type: "vertical",
  implementation: () => "vertical layout",
});

registry.resolve({ kind: "field", type: "string" });
registry.resolve({ kind: "field", type: "string", tags: ["emphasis"] });
```

A registration is uniquely identified by its kind, type, and normalized tag set. A registration matches when all of its tags are present in the query. The registry chooses the matching registration with the most tags. Equally specific matches with different tag sets are ambiguous and throw an error.

Use `registerAll()` to apply default or integration presets. A later registration with the same kind, type, and tags can intentionally replace an earlier one:

```ts
registry.registerAll(defaultRegistrations);
registry.registerAll(companyRegistrations, { onCollision: "replace" });
```

### Registry options

| Option | Default | Description |
| --- | --- | --- |
| `name` | `"Registry"` | Name included in diagnostics. |
| `onCollision` | `"warn"` | `"warn"` or `"replace"` replaces an identical registration; `"error"` throws. |
| `onMissing` | `"undefined"` | Return `undefined` or throw when no registration matches. |
| `onWarn` | `console.warn` | Custom warning callback. |

`register()` and `registerAll()` return the registry for chaining. `has()`, `entries()`, and `clone()` support inspection and isolated composition. Unless `onMissing` is set to `"error"`, `resolve()` returns the implementation or `undefined`.

## Add custom field and layout types

The built-in registries are interfaces, so applications and integrations can extend them through module augmentation:

```ts
import "@mdl/core";

declare module "@mdl/core" {
  interface MDLFieldTypes {
    currency: true;
  }

  interface MDLLayouts {
    tabs: { activeTab?: string };
  }
}
```

The new types are then available throughout the schema and registry APIs:

```ts
import type { MDLField, MDLLayoutNode } from "@mdl/core";

const price: MDLField<{ price: number }> = {
  kind: "field",
  id: "price-input",
  field: "price",
  type: "currency",
};

const tabs: MDLLayoutNode<"tabs"> = {
  kind: "layout",
  id: "details",
  layout: "tabs",
  props: { activeTab: "summary" },
  children: [],
};
```

## API

### Values

- `MDLRegistry`
- `version`

### Types

- `MDLNodeAttributes`
- `MDLComponent`
- `MDLField`
- `MDLFieldType`
- `MDLForm`
- `MDLFormNode`
- `MDLFieldTypes`
- `MDLLayout`
- `MDLLayoutNode`
- `MDLLayoutType`
- `MDLLayouts`
- `MDLNode`
- `MDLRegistryDefinition`
- `MDLRegistryEntryDefinition`
- `MDLRegistryKind`
- `MDLRegistryOptions`
- `MDLRegistryQuery`
- `MDLRegistryRegisterOptions`
- `MDLRegistryRegistration`
