import { MantineProvider } from "@mantine/core";
import { defaultMantineRegistry } from "@mdl/mantine";
import {
  defaultReactRegistry,
  MDLRenderer,
  type MDLReactComponentProps,
  type MDLReactFieldProps,
  type MDLReactRegistry,
  type MDLRendererProps,
} from "@mdl/react";
import { MDLForm, useMDLFormContext, type FieldValues } from "@mdl/react/form";
import { useWatch } from "react-hook-form";

export type RegistryName = "react" | "mantine";

function Heading({ node }: MDLReactComponentProps) {
  return <h2 id={node.id}>{String(node.props?.text ?? "")}</h2>;
}

function Notice({ node }: MDLReactComponentProps) {
  return (
    <p id={node.id} role="status">
      {String(node.props?.message ?? "")}
    </p>
  );
}

function UrgentNotice({ node }: MDLReactComponentProps) {
  return (
    <p id={node.id} role="alert">
      {String(node.props?.message ?? "")}
    </p>
  );
}

function Stat({ node }: MDLReactComponentProps) {
  return (
    <figure id={node.id}>
      <figcaption>{String(node.props?.label ?? "")}</figcaption>
      {String(node.props?.value ?? "")}
    </figure>
  );
}

function SecretField({ node, readOnly }: MDLReactFieldProps) {
  const { register } = useMDLFormContext();

  return (
    <input
      {...node.props}
      {...register(node.field)}
      data-mdl-field="secret"
      id={node.id}
      readOnly={readOnly}
      type="password"
    />
  );
}

const registries: Record<RegistryName, MDLReactRegistry> = {
  react: defaultReactRegistry.clone({ name: "Testing React registry" }),
  mantine: defaultMantineRegistry.clone({ name: "Testing Mantine registry" }),
};

for (const registry of Object.values(registries)) {
  registry.registerAll([
    { kind: "component", type: "heading", implementation: Heading },
    { kind: "component", type: "notice", implementation: Notice },
    { kind: "component", type: "notice", tags: ["urgent"], implementation: UrgentNotice },
    { kind: "component", type: "stat", implementation: Stat },
    { kind: "field", type: "string", tags: ["secret"], implementation: SecretField },
  ]);
}

export type LayoutHarnessProps = Omit<MDLRendererProps, "registry"> & {
  registry: RegistryName;
};

export function LayoutHarness({ registry, ...rendererProps }: LayoutHarnessProps) {
  const layout = <MDLRenderer {...rendererProps} registry={registries[registry]} />;

  return registry === "mantine" ? <MantineProvider>{layout}</MantineProvider> : layout;
}

export type FormHarnessProps = Omit<LayoutHarnessProps, "values"> & {
  defaultValues?: FieldValues;
  onSubmit?: (values: FieldValues) => void;
};

export function FormHarness({
  registry,
  defaultValues,
  onSubmit,
  ...rendererProps
}: FormHarnessProps) {
  const form = (
    <MDLForm defaultValues={defaultValues} onSubmit={(values) => onSubmit?.(values)}>
      <WatchedRenderer {...rendererProps} registry={registries[registry]} />
      <button type="submit">Submit</button>
    </MDLForm>
  );

  return registry === "mantine" ? <MantineProvider>{form}</MantineProvider> : form;
}

function WatchedRenderer(props: Omit<MDLRendererProps, "values">) {
  const values = useWatch();

  return <MDLRenderer {...props} values={values} />;
}
