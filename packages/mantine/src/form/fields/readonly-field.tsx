import { Text } from "@mantine/core";
import type { MDLReactFieldProps } from "@mdl/react";
import { useMDLFormContext } from "@mdl/react/form";
import { useWatch } from "react-hook-form";

import type { MantineReadonlyFieldProps } from "./field-types";

export function MantineReadonlyField({ node }: MDLReactFieldProps) {
  const { control } = useMDLFormContext();
  const value = useWatch({ control, name: node.field, exact: true });
  const props = (node.props ?? {}) as MantineReadonlyFieldProps;

  return (
    <Text {...props} component="output" data-mdl-field="readonly" id={node.id}>
      {formatValue(value)}
    </Text>
  );
}

function formatValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toLocaleString();
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  return JSON.stringify(value);
}
