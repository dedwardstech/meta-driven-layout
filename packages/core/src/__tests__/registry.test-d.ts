import type { MDLFieldType, MDLLayoutType } from "../index";
import { MDLRegistry } from "../registry";

interface Renderer {
  render: () => string;
}

interface RegistryDefinition {
  layout: {
    type: MDLLayoutType;
    implementation: Renderer;
  };
  field: {
    type: MDLFieldType;
    implementation: Renderer;
  };
  component: {
    type: string;
    implementation: Renderer;
  };
}

const registry = new MDLRegistry<RegistryDefinition>({ name: "renderers" });

registry.register({
  kind: "field",
  type: "string",
  implementation: { render: () => "text" },
});
registry.register({
  kind: "field",
  type: "string",
  implementation: { render: () => "one-off" },
  tags: ["one-off"],
});
registry.register({
  kind: "layout",
  type: "vertical",
  implementation: { render: () => "Stack" },
});
registry.register({
  kind: "component",
  type: "data-display",
  implementation: { render: () => "Data" },
});

registry.registerAll([
  {
    kind: "field",
    type: "number",
    implementation: { render: () => "number" },
  },
  {
    kind: "layout",
    type: "grid",
    implementation: { render: () => "Grid" },
  },
]);

// @ts-expect-error "currency" is not a registered field type
registry.register({ kind: "field", type: "currency", implementation: { render: () => "money" } });

// @ts-expect-error "tabs" is not a registered layout type
registry.register({ kind: "layout", type: "tabs", implementation: { render: () => "Tabs" } });

// @ts-expect-error renderer does not satisfy the registered implementation type
registry.register({ kind: "field", type: "string", implementation: () => "text" });

// @ts-expect-error "service" is not a registered kind
registry.register({ kind: "service", type: "api", implementation: { render: () => "API" } });

export const maybe: Renderer | undefined = registry.resolve({
  kind: "field",
  type: "string",
  tags: "one-off",
});

// @ts-expect-error resolve returns Renderer | undefined and must be narrowed
export const notNarrowed: Renderer = registry.resolve({ kind: "field", type: "number" });

// @ts-expect-error the field kind cannot resolve a layout type
registry.resolve({ kind: "field", type: "vertical" });

// @ts-expect-error onCollision only accepts "warn" | "error" | "replace"
export const badOption = new MDLRegistry<RegistryDefinition>({ onCollision: "ignore" });
