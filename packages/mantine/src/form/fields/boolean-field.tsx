import { Checkbox } from "@mantine/core";
import type { MDLReactFieldProps } from "@mdl/react";
import { useMDLFormContext } from "@mdl/react/form";
import type { ChangeEvent, FocusEvent } from "react";
import { useController } from "react-hook-form";

import type { MantineBooleanFieldProps } from "./field-types";

export function MantineBooleanField({ node, readOnly }: MDLReactFieldProps) {
  const { control } = useMDLFormContext();
  const { rules, onBlur, onChange, ...props } =
    (node.props ?? {}) as MantineBooleanFieldProps;
  const { field } = useController({ control, name: node.field, rules });

  return (
    <Checkbox
      {...props}
      checked={Boolean(field.value)}
      data-mdl-field="boolean"
      disabled={readOnly || props.disabled}
      id={node.id}
      name={field.name}
      onBlur={(event: FocusEvent<HTMLInputElement>) => {
        field.onBlur();
        onBlur?.(event);
      }}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        field.onChange(event.currentTarget.checked);
        onChange?.(event);
      }}
      ref={field.ref}
    />
  );
}
