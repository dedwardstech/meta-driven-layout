import type { InputHTMLAttributes } from "react";
import type { RegisterOptions } from "react-hook-form";

export interface FieldRegistrationProps {
  rules?: RegisterOptions;
}

export type InputFieldProps = InputHTMLAttributes<HTMLInputElement> &
  FieldRegistrationProps;
