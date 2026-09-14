import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.tsx", "src/form/index.tsx"],
  format: ["esm"],
  fixedExtension: false,
  dts: true,
  sourcemap: true,
  clean: true,
});
