import { defineConfig, devices } from "@playwright/experimental-ct-react";

import type { RegistryName } from "./src/harness";

export default defineConfig<{ registry: RegistryName }>({
  testDir: "./tests",
  fullyParallel: true,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    ctPort: 3100,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "react", use: { registry: "react" } },
    { name: "mantine", use: { registry: "mantine" } },
  ],
});
