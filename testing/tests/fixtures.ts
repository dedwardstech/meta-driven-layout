import { test as base } from "@playwright/experimental-ct-react";

import type { RegistryName } from "../src/harness";

export const test = base.extend<{ registry: RegistryName }>({
  registry: ["react", { option: true }],
});

export { expect } from "@playwright/experimental-ct-react";
