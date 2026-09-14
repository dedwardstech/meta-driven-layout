import { MultiSelect } from "@mantine/core";
import type { MDLReactFieldProps } from "@mdl/react";
import { useMDLFormContext } from "@mdl/react/form";
import type { FocusEvent } from "react";
import { useController } from "react-hook-form";

import type { MantineOneToManyFieldProps } from "./field-types";

export function MantineOneToManyField({
  node,
  readOnly,
}: MDLReactFieldProps) {
  const { control } = useMDLFormContext();
  const { options = [], rules, onBlur, ...props } =
    (node.props ?? {}) as MantineOneToManyFieldProps;
  const { field } = useController({ control, name: node.field, rules });

  return (
    <MultiSelect
      {...props}
      data={[...options]}
      data-mdl-field="one-to-many"
      disabled={readOnly || props.disabled}
      id={node.id}
      name={field.name}
      onBlur={(event: FocusEvent<HTMLInputElement>) => {
        field.onBlur();
        onBlur?.(event);
      }}
      onChange={field.onChange}
      ref={field.ref}
      value={Array.isArray(field.value) ? field.value.map(String) : []}
    />
  );
}
