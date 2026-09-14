import type { MDLReactFieldProps } from "../../types";
import { useMDLFormContext } from "../form";
import type { InputFieldProps } from "./field-types";

export function NumberField({ node, readOnly }: MDLReactFieldProps) {
  const { register } = useMDLFormContext();
  const {
    rules,
    onBlur: onNativeBlur,
    onChange: onNativeChange,
    value: _value,
    ...props
  } = (node.props ?? {}) as InputFieldProps;
  const registration = register(node.field, {
    ...rules,
    setValueAs:
      rules?.setValueAs ??
      ((value: unknown) => (value === "" ? undefined : Number(value))),
  });

  return (
    <input
      {...props}
      {...registration}
      data-mdl-field="number"
      id={node.id}
      onBlur={(event) => {
        void registration.onBlur(event);
        onNativeBlur?.(event);
      }}
      onChange={(event) => {
        void registration.onChange(event);
        onNativeChange?.(event);
      }}
      readOnly={readOnly || props.readOnly}
      type="number"
    />
  );
}
