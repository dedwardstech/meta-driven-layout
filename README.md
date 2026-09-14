# Meta-Driven Layout (MDL)

Describe user interfaces as typed, serializable trees of layouts, forms, fields, and components, then render them through swappable implementation registries. Conditional behaviour lives in the tree itself as plain-text rule expressions, so a layout can be stored as JSON, shipped from a server, and rendered by any UI kit you register.

```jsonc
{
  "kind": "field",
  "id": "age",
  "field": "age",
  "type": "number",
  "props": { "label": "Age", "min": 0 },
  "rules": [
    { "when": "value < 18", "then": { "props": { "description": "Parental consent required" } } }
  ]
}
```

## Packages

| Package | Path | Description |
| --- | --- | --- |
| [`@mdl/exp`](packages/exp/README.md) | `packages/exp` | Expression parser and rules engine (`foo > 10 and bar in ['x', 'y']`), with an exported AST for tooling. |
| [`@mdl/core`](packages/core/README.md) | `packages/core` | Framework-agnostic node types, the tag-aware `MDLRegistry`, and `applyMDLRules`. |
| [`@mdl/react`](packages/react/README.md) | `packages/react` | React 18 renderer, unstyled default layouts and fields, and React Hook Form integration. |
| [`@mdl/mantine`](packages/mantine/README.md) | `packages/mantine` | Mantine 8 implementations of every built-in layout and field. |
| `@mdl/playground` | `demos/playground` | Vite app with a live JSON editor and Mantine preview. |

```mermaid
graph LR
  exp["@mdl/exp"] --> core["@mdl/core"]
  core --> react["@mdl/react"]
  react --> mantine["@mdl/mantine"]
  mantine --> playground["@mdl/playground"]
```

## Concepts

**Nodes.** Every node has an `id`, optional `tags`, and optional `rules`. The `kind` property discriminates between:

| Kind | Purpose | Key properties |
| --- | --- | --- |
| `layout` | Arranges children. | `layout` (`vertical`, `horizontal`, `grid`), `children`, `props` |
| `form` | A layout that marks a form boundary. | Same as `layout` |
| `field` | Binds to a value in your data model. | `field` (a key of your data type), `type` (`string`, `number`, `boolean`, `readonly`, `one-to-many`), `props` |
| `component` | An application-defined leaf not bound to data. | `type`, `props` |

Passing your data type (`MDLLayout<User>`) restricts `field` bindings to known keys at compile time. Field and layout types are open interfaces, so applications can add their own through module augmentation.

**Registries.** Renderers never hard-code components. They ask an `MDLRegistry` for the implementation matching a node's `kind`, `type`, and `tags`. A registration matches when all of its tags are present on the node, the match with the most tags wins, and equally specific matches with different tag sets throw. This lets you override a single tagged variant (for example a `string` field tagged `currency`) without replacing the default.

**Rules.** Each rule is a `when` expression, parsed by `@mdl/exp`, and a `then` patch. When the condition holds, `then.props` is shallow-merged over the node's props. Rules run in order, so later matches win. The identifiers available to an expression depend on the node:

| Node kind | Identifiers |
| --- | --- |
| `field` | `value` and the field's own name, e.g. `age` |
| `layout`, `form` | Every key of the `values` passed to the renderer |
| `component` | None beyond `env.*` |

All nodes can read `env.*`, which comes from the renderer's `env` prop. See the [`@mdl/exp` README](packages/exp/README.md) for the full expression syntax.

## Example

Render a tree with Mantine, re-evaluating rules as the user types:

```tsx
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { defaultMantineRegistry } from "@mdl/mantine";
import { MDLRenderer, type MDLLayout } from "@mdl/react";
import { MDLForm } from "@mdl/react/form";
import { useWatch } from "react-hook-form";

interface Profile {
  firstName: string;
  age: number;
  newsletter: boolean;
}

const profileLayout: MDLLayout<Profile> = {
  kind: "layout",
  id: "profile",
  layout: "vertical",
  props: { gap: "md" },
  rules: [
    { when: "env.featureFlags.compactForms is true", then: { props: { gap: "xs" } } },
  ],
  children: [
    {
      kind: "field",
      id: "first-name",
      field: "firstName",
      type: "string",
      props: { label: "First name" },
    },
    {
      kind: "field",
      id: "age",
      field: "age",
      type: "number",
      props: { label: "Age", min: 0 },
      rules: [
        { when: "value < 18", then: { props: { description: "Parental consent required" } } },
      ],
    },
    {
      kind: "field",
      id: "newsletter",
      field: "newsletter",
      type: "boolean",
      props: { label: "Subscribe to the newsletter" },
    },
  ],
};

function ProfileFields() {
  const values = useWatch<Profile>();

  return (
    <MDLRenderer
      env={{ featureFlags: { compactForms: false } }}
      node={profileLayout}
      registry={defaultMantineRegistry}
      values={values}
    />
  );
}

export function ProfileForm({ profile, onSave }: { profile: Profile; onSave(profile: Profile): void }) {
  return (
    <MantineProvider>
      <MDLForm<Profile> defaultValues={profile} onSubmit={onSave}>
        <ProfileFields />
        <button type="submit">Save</button>
      </MDLForm>
    </MantineProvider>
  );
}
```

A few things to note:

- Fields must be rendered inside `MDLForm`, or inside `MDLFormProvider` if you own the `useForm()` instance.
- `values` is only needed when rules depend on form input. Without it, field and layout rules only see `env`.
- `@mdl/mantine` does not render a `MantineProvider` or import Mantine CSS. The application provides both.
- `MDLRenderer` throws when a node has no registered implementation. Pass `onMissing="null"` to skip those nodes instead, and `readOnly` to disable editing.

## Customizing implementations

Clone a default registry before registering your own entries so the shared instance stays untouched:

```tsx
import { defaultMantineRegistry } from "@mdl/mantine";
import { MDLRegistryProvider, MDLRenderer } from "@mdl/react";

const registry = defaultMantineRegistry.clone({ name: "App registry" });

registry.register({
  kind: "field",
  type: "string",
  tags: ["currency"],
  implementation: CurrencyField,
});

registry.register({
  kind: "component",
  type: "heading",
  implementation: ({ node }) => <h2>{String(node.props?.children ?? "")}</h2>,
});
```

Pass the registry to `MDLRenderer` directly or provide it to a subtree with `MDLRegistryProvider`. String fields tagged `currency` now use `CurrencyField`, and every other string field keeps the Mantine default. To start from nothing, use `createMDLReactRegistry({ defaults: false })`.

To add new field or layout *types* rather than implementations, extend `MDLFieldTypes` or `MDLLayouts` through module augmentation. See the [`@mdl/core` README](packages/core/README.md#add-custom-field-and-layout-types).

## Development

This is a pnpm workspace. You need Node.js (developed against v24) and pnpm 11. The root `devEngines` field downloads a matching pnpm if your installed version differs.

```sh
pnpm install
pnpm -r build
```

Workspace packages resolve each other through their built `dist` output. Build before running the playground or typechecking a package that depends on another.

| Task | Command |
| --- | --- |
| Build every package in dependency order | `pnpm -r build` |
| Rebuild libraries on change | `pnpm --filter "./packages/**" --parallel dev` |
| Start the playground | `pnpm --filter @mdl/playground dev` |
| Typecheck every package | `pnpm -r typecheck` |
| Run the expression engine tests | `pnpm --filter @mdl/exp test` |

`@mdl/exp` has a Vitest suite. `@mdl/core` has type-level tests in `src/__tests__/*.test-d.ts`, which use `@ts-expect-error` assertions and run as part of `typecheck`.

Libraries are bundled with [tsdown](https://tsdown.dev) as ESM with type declarations.

### Playground

The playground is a two-pane editor. The left pane has two files:

- `tree.mdl.json`: the MDL tree to render. Rule conditions are validated as you type.
- `environment.json`: feature flags (readable as `env.*`), form default values, renderer options (`readOnly`, `onMissing`), and the `MantineProvider` theme.

The right pane renders the result with `@mdl/mantine` and keeps the last valid preview visible while the documents contain errors.

## Project layout

```
.
├── packages/
│   ├── exp/          @mdl/exp: expression parser, AST, and rules engine
│   ├── core/         @mdl/core: node types, registry, rule application
│   ├── react/        @mdl/react: React renderer, unstyled defaults, forms
│   └── mantine/      @mdl/mantine: Mantine layouts and fields
├── demos/
│   └── playground/   Vite playground with Monaco editor and live preview
├── package.json
└── pnpm-workspace.yaml
```

## Attribution

`@mdl/exp` is a TypeScript rewrite of the MIT-licensed Go package [`github.com/alexkappa/exp`](https://github.com/alexkappa/exp) by Alex Kalyvitis. See [`packages/exp/LICENSE`](packages/exp/LICENSE).
