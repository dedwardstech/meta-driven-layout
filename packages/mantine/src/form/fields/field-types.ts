import type {
  CheckboxProps,
  MultiSelectProps,
  NumberInputProps,
  TextInputProps,
  TextProps,
} from "@mantine/core";
import type { RegisterOptions } from "react-hook-form";

export interface FieldRegistrationProps {
  rules?: RegisterOptions;
}

export type MantineStringFieldProps = Omit<
  TextInputProps,
  "defaultValue" | "name" | "value"
> &
  FieldRegistrationProps;

export type MantineNumberFieldProps = Omit<
  NumberInputProps,
  "defaultValue" | "name" | "onChange" | "value"
> &
  FieldRegistrationProps;

export type MantineBooleanFieldProps = Omit<
  CheckboxProps,
  "checked" | "defaultChecked" | "name"
> &
  FieldRegistrationProps;

export interface MantineOneToManyOption {
  label: string;
  value: string;
}

export type MantineOneToManyFieldProps = Omit<
  MultiSelectProps,
  "data" | "defaultValue" | "name" | "onChange" | "value"
> &
  FieldRegistrationProps & {
    options?: readonly MantineOneToManyOption[];
  };

export type MantineReadonlyFieldProps = TextProps;
