import type { MDLRegistryRegistration } from "@mdl/core";
import {
  createMDLReactRegistry,
  type CreateMDLReactRegistryOptions,
  type MDLReactRegistryDefinition,
} from "@mdl/react";

import {
  MantineBooleanField,
  MantineNumberField,
  MantineOneToManyField,
  MantineReadonlyField,
  MantineStringField,
} from "./form";
import {
  MantineGridLayout,
  MantineHorizontalLayout,
  MantineVerticalLayout,
} from "./layouts";

export const defaultMantineRegistrations = [
  { kind: "layout", type: "vertical", implementation: MantineVerticalLayout },
  { kind: "layout", type: "horizontal", implementation: MantineHorizontalLayout },
  { kind: "layout", type: "grid", implementation: MantineGridLayout },
  { kind: "field", type: "string", implementation: MantineStringField },
  { kind: "field", type: "number", implementation: MantineNumberField },
  { kind: "field", type: "boolean", implementation: MantineBooleanField },
  { kind: "field", type: "readonly", implementation: MantineReadonlyField },
  { kind: "field", type: "one-to-many", implementation: MantineOneToManyField },
] satisfies readonly MDLRegistryRegistration<MDLReactRegistryDefinition>[];

export interface CreateMDLMantineRegistryOptions
  extends CreateMDLReactRegistryOptions {
  defaults?: boolean;
}

export function createMDLMantineRegistry(
  options: CreateMDLMantineRegistryOptions = {},
) {
  const { defaults = true, name = "Mantine registry", ...registryOptions } =
    options;
  const registry = createMDLReactRegistry({
    defaults: false,
    name,
    ...registryOptions,
  });

  if (defaults) registry.registerAll(defaultMantineRegistrations);
  return registry;
}

/**
 * Shared registry containing Mantine field and layout implementations. Clone it
 * before registering application-specific entries.
 */
export const defaultMantineRegistry = createMDLMantineRegistry();
