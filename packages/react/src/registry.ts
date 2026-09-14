import { MDLRegistry } from "@mdl/core";
import type {
  MDLRegistryOptions,
  MDLRegistryRegistration,
} from "@mdl/core";

import {
  BooleanField,
  NumberField,
  OneToManyField,
  ReadonlyField,
  StringField,
} from "./form";
import { GridLayout, HorizontalLayout, VerticalLayout } from "./layouts";
import type { MDLReactRegistryDefinition } from "./types";

export const defaultReactRegistrations = [
  { kind: "layout", type: "vertical", implementation: VerticalLayout },
  { kind: "layout", type: "horizontal", implementation: HorizontalLayout },
  { kind: "layout", type: "grid", implementation: GridLayout },
  { kind: "field", type: "string", implementation: StringField },
  { kind: "field", type: "number", implementation: NumberField },
  { kind: "field", type: "boolean", implementation: BooleanField },
  { kind: "field", type: "readonly", implementation: ReadonlyField },
  { kind: "field", type: "one-to-many", implementation: OneToManyField },
] satisfies readonly MDLRegistryRegistration<MDLReactRegistryDefinition>[];

export interface CreateMDLReactRegistryOptions extends MDLRegistryOptions {
  defaults?: boolean;
}

export function createMDLReactRegistry(
  options: CreateMDLReactRegistryOptions = {},
) {
  const { defaults = true, ...registryOptions } = options;
  const registry = new MDLRegistry<MDLReactRegistryDefinition>({
    name: "React registry",
    ...registryOptions,
  });

  if (defaults) registry.registerAll(defaultReactRegistrations);
  return registry;
}

/**
 * Shared registry containing the package's unstyled field and layout
 * implementations. Clone it before registering application-specific entries.
 */
export const defaultReactRegistry = createMDLReactRegistry();
