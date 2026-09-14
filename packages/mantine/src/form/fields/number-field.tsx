import { NumberInput } from "@mantine/core";
import type { MDLReactFieldProps } from "@mdl/react";
import { useMDLFormContext } from "@mdl/react/form";
import type { FocusEvent } from "react";
import { useController } from "react-hook-form";

import type { MantineNumberFieldProps } from "./field-types";

export function MantineNumberField({ node, readOnly }: MDLReactFieldProps) {
  const { control } = useMDLFormContext();
  const { rules, onBlur, ...props } =
    (node.props ?? {}) as MantineNumberFieldProps;
  const { field } = useController({ control, name: node.field, rules });

  return (
    <NumberInput
      {...props}
      data-mdl-field="number"
      id={node.id}
      name={field.name}
      onBlur={(event: FocusEvent<HTMLInputElement>) => {
        field.onBlur();
        onBlur?.(event);
      }}
      onChange={(value) => field.onChange(value === "" ? undefined : value)}
      readOnly={readOnly || props.readOnly}
      ref={field.ref}
      value={typeof field.value === "number" || typeof field.value === "string" ? field.value : ""}
    />
  );
}
