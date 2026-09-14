# `@mdl/react`

Unstyled React 18 components and rendering utilities for `@mdl/core`.

The package provides a default registry for every built-in layout and field type. Styled packages can clone that registry and replace individual entries without changing the renderer.

## Installation

```sh
pnpm add @mdl/react react react-hook-form
```

The complete `@mdl/core` API is re-exported, so schemas, registry utilities,
and React renderers can all be imported from `@mdl/react`.

## Render an MDL tree

```tsx
import { MDLRenderer, type MDLLayout } from "@mdl/react";
import { MDLForm } from "@mdl/react/form";

interface User {
  name: string;
  age: number;
  active: boolean;
}

const layout: MDLLayout<User> = {
  kind: "layout",
  id: "user",
  layout: "vertical",
  props: { gap: 8 },
  children: [
    { kind: "field", id: "name", field: "name", type: "string" },
    { kind: "field", id: "age", field: "age", type: "number" },
    { kind: "field", id: "active", field: "active", type: "boolean" },
  ],
};

function UserForm({ user, saveUser }: { user: User; saveUser(user: User): void }) {
  return (
    <MDLForm<User> defaultValues={user} onSubmit={saveUser}>
      <MDLRenderer node={layout} />
      <button type="submit">Save</button>
    </MDLForm>
  );
}
```

`MDLForm` creates a React Hook Form provider and native `<form>`. Default fields register as uncontrolled inputs, so typing in one field does not rerender the complete MDL tree. `defaultValues`, `formOptions`, and `onSubmit` map to the corresponding React Hook Form APIs.

Default fields must be rendered under `MDLForm` or `MDLFormProvider`. Use `MDLFormProvider` with a `useForm()` result when the application needs to own the form instance. Set `readOnly` on `MDLRenderer` to prevent editing. A missing registry entry throws by default; use `onMissing="null"` when an incomplete tree should render partially.

## Default registry

`defaultReactRegistry` includes unstyled implementations for:

- layouts: `vertical`, `horizontal`, and `grid`
- fields: `string`, `number`, `boolean`, `readonly`, and `one-to-many`

The layout implementations only apply the CSS needed to establish their layout. Field implementations render native HTML controls. They include `data-mdl-layout` and `data-mdl-field` attributes as stable styling hooks.

The `one-to-many` field accepts an `options` prop:

```ts
{
  kind: "field",
  id: "roles",
  field: "roles",
  type: "one-to-many",
  props: {
    options: [
      { label: "Editor", value: "editor" },
      { label: "Reviewer", value: "reviewer" },
    ],
  },
}
```

Form components and React Hook Form integration APIs are available from `@mdl/react/form`:

- `MDLForm`
- `MDLFormProvider`
- `useMDLFormContext`
- native field implementations
- commonly used React Hook Form types

Field `props` can include a React Hook Form `rules` object for validation.

## Supply styled implementations

Clone the default registry so package-level or application-level registrations do not mutate the shared default:

```tsx
import {
  defaultReactRegistry,
  MDLRegistryProvider,
  MDLRenderer,
  type MDLReactFieldProps,
} from "@mdl/react";
import { MDLForm, useMDLFormContext } from "@mdl/react/form";

function StyledStringField({ node, readOnly }: MDLReactFieldProps) {
  const { register } = useMDLFormContext();

  return (
    <input
      {...register(node.field)}
      className="text-field"
      id={node.id}
      readOnly={readOnly}
    />
  );
}

const registry = defaultReactRegistry.clone({ name: "Acme components" });
registry.register(
  {
    kind: "field",
    type: "string",
    implementation: StyledStringField,
  },
  { onCollision: "replace" },
);

function App() {
  return (
    <MDLRegistryProvider registry={registry}>
      <MDLForm defaultValues={user}>
        <MDLRenderer node={layout} />
      </MDLForm>
    </MDLRegistryProvider>
  );
}
```

A registry can also be passed directly to `MDLRenderer`. Use `createMDLReactRegistry({ defaults: false })` to start with an empty registry.

Generic `component` nodes have no built-in types. Register each application-specific component type in the same registry:

```tsx
registry.register({
  kind: "component",
  type: "heading",
  implementation: ({ node }) => <h2>{String(node.props?.children ?? "")}</h2>,
});
```
