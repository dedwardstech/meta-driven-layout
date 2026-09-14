import { TextInput } from "@mantine/core";
import type { MDLReactFieldProps } from "@mdl/react";
import { useMDLFormContext } from "@mdl/react/form";
import type { ChangeEvent, FocusEvent } from "react";
import { useController } from "react-hook-form";

import type { MantineStringFieldProps } from "./field-types";

export function MantineStringField({ node, readOnly }: MDLReactFieldProps) {
  const { control } = useMDLFormContext();
  const { rules, onBlur, onChange, ...props } =
    (node.props ?? {}) as MantineStringFieldProps;
  const { field } = useController({ control, name: node.field, rules });

  return (
    <TextInput
      {...props}
      data-mdl-field="string"
      id={node.id}
      name={field.name}
      onBlur={(event: FocusEvent<HTMLInputElement>) => {
        field.onBlur();
        onBlur?.(event);
      }}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        field.onChange(event);
        onChange?.(event);
      }}
      readOnly={readOnly || props.readOnly}
      ref={field.ref}
      value={formatTextValue(field.value)}
    />
  );
}

function formatTextValue(value: unknown): string {
  if (value == null) return "";
  return typeof value === "string" ? value : String(value);
}
