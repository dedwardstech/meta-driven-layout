import type {
  MDLComponent,
  MDLField,
  MDLFieldType,
  MDLForm,
  MDLLayout,
  MDLLayoutType,
  MDLNode,
  MDLRegistry,
  MDLRuleValues,
} from "@mdl/core";
import type { ComponentType, ReactNode } from "react";

export type MDLReactNodeProps = Record<string, unknown>;
export type MDLReactData = Record<string, unknown>;

export interface MDLReactLayoutProps {
  node:
    | MDLLayout<MDLReactData, MDLReactNodeProps>
    | MDLForm<MDLReactData, MDLReactNodeProps>;
  children?: ReactNode;
}

export interface MDLReactFieldProps {
  node: MDLField<MDLReactData, MDLReactNodeProps>;
  readOnly: boolean;
}

export interface MDLReactComponentProps {
  node: MDLComponent<string, MDLReactNodeProps>;
}

export type MDLReactLayout = ComponentType<MDLReactLayoutProps>;
export type MDLReactField = ComponentType<MDLReactFieldProps>;
export type MDLReactComponent = ComponentType<MDLReactComponentProps>;

export interface MDLReactRegistryDefinition {
  layout: { type: MDLLayoutType; implementation: MDLReactLayout };
  field: { type: MDLFieldType; implementation: MDLReactField };
  component: { type: string; implementation: MDLReactComponent };
}

export type MDLReactRegistry = MDLRegistry<MDLReactRegistryDefinition>;

export interface MDLRendererProps<
  TData = unknown,
  TProps = Record<string, unknown>,
> {
  node: MDLNode<TData, TProps>;
  registry?: MDLReactRegistry;
  readOnly?: boolean;
  onMissing?: "throw" | "null";
  /** Environment/application values available to rule expressions as `env.*`. */
  env?: unknown;
  /** Form/layout values used when evaluating layout and field rules. */
  values?: MDLRuleValues;
}
