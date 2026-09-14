import type { SelectHTMLAttributes } from "react";

import type { MDLReactFieldProps } from "../../types";
import { useMDLFormContext } from "../form";
import type { FieldRegistrationProps } from "./field-types";

export interface OneToManyOption {
  label: string;
  value: string;
}

export interface OneToManyProps
  extends Omit<
      SelectHTMLAttributes<HTMLSelectElement>,
      "children" | "multiple" | "value"
    >,
    FieldRegistrationProps {
  options?: readonly OneToManyOption[];
}

export function OneToManyField({ node, readOnly }: MDLReactFieldProps) {
  const { register } = useMDLFormContext();
  const {
    options = [],
    rules,
    onBlur: onNativeBlur,
    onChange: onNativeChange,
    ...props
  } = (node.props ?? {}) as OneToManyProps;
  const registration = register(node.field, rules);

  return (
    <select
      {...props}
      {...registration}
      data-mdl-field="one-to-many"
      disabled={readOnly || props.disabled}
      id={node.id}
      multiple
      onBlur={(event) => {
        void registration.onBlur(event);
        onNativeBlur?.(event);
      }}
      onChange={(event) => {
        void registration.onChange(event);
        onNativeChange?.(event);
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
