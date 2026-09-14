import type { HTMLAttributes } from "react";
import { useWatch } from "react-hook-form";

import type { MDLReactFieldProps } from "../../types";
import { useMDLFormContext } from "../form";

export function ReadonlyField({ node }: MDLReactFieldProps) {
  const { control } = useMDLFormContext();
  const value = useWatch({ control, name: node.field, exact: true });
  const props = node.props as HTMLAttributes<HTMLOutputElement> | undefined;

  return (
    <output {...props} data-mdl-field="readonly" id={node.id}>
      {formatValue(value)}
    </output>
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
