import type { MDLReactFieldProps } from "../../types";
import { useMDLFormContext } from "../form";
import type { InputFieldProps } from "./field-types";

export function BooleanField({ node, readOnly }: MDLReactFieldProps) {
  const { register } = useMDLFormContext();
  const {
    rules,
    onBlur: onNativeBlur,
    onChange: onNativeChange,
    checked: _checked,
    value: _value,
    ...props
  } = (node.props ?? {}) as InputFieldProps;
  const registration = register(node.field, rules);

  return (
    <input
      {...props}
      {...registration}
      data-mdl-field="boolean"
      disabled={readOnly || props.disabled}
      id={node.id}
      onBlur={(event) => {
        void registration.onBlur(event);
        onNativeBlur?.(event);
      }}
      onChange={(event) => {
        void registration.onChange(event);
        onNativeChange?.(event);
      }}
      type="checkbox"
    />
  );
}
