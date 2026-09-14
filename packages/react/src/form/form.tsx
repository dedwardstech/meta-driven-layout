import type {
  FormEvent,
  FormHTMLAttributes,
  ReactNode,
} from "react";
import {
  FormProvider,
  useForm,
  useFormContext,
  type DefaultValues,
  type FieldValues,
  type SubmitHandler,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";

export interface MDLFormProviderProps<TFieldValues extends FieldValues> {
  methods: UseFormReturn<TFieldValues>;
  children?: ReactNode;
}

export function MDLFormProvider<TFieldValues extends FieldValues>({
  methods,
  children,
}: MDLFormProviderProps<TFieldValues>) {
  return <FormProvider {...methods}>{children}</FormProvider>;
}

type NativeFormProps = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  "children" | "onSubmit"
>;

export interface MDLFormProps<TFieldValues extends FieldValues>
  extends NativeFormProps {
  children?: ReactNode;
  defaultValues?: DefaultValues<TFieldValues>;
  formOptions?: Omit<UseFormProps<TFieldValues>, "defaultValues">;
  onSubmit?: SubmitHandler<TFieldValues>;
}

/**
 * Creates an isolated React Hook Form instance for an MDL tree. Native fields
 * register themselves without subscribing the complete tree to value changes.
 */
export function MDLForm<TFieldValues extends FieldValues>({
  children,
  defaultValues,
  formOptions,
  onSubmit,
  ...formProps
}: MDLFormProps<TFieldValues>) {
  const methods = useForm<TFieldValues>({
    shouldUnregister: true,
    ...formOptions,
    defaultValues,
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (onSubmit) {
      void methods.handleSubmit(onSubmit)(event);
      return;
    }
    event.preventDefault();
  }

  return (
    <MDLFormProvider methods={methods}>
      <form {...formProps} onSubmit={handleSubmit}>
        {children}
      </form>
    </MDLFormProvider>
  );
}

export function useMDLFormContext<
  TFieldValues extends FieldValues = FieldValues,
>(): UseFormReturn<TFieldValues> {
  const methods = useFormContext<TFieldValues>();
  if (!methods) {
    throw new Error(
      "[MDL] Form fields must be rendered inside MDLForm or MDLFormProvider.",
    );
  }
  return methods;
}
