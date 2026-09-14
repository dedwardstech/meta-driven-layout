import { applyMDLRules } from "@mdl/core";
import type {
  MDLComponent,
  MDLField,
  MDLForm,
  MDLLayout,
  MDLNode,
  MDLRuleValues,
} from "@mdl/core";
import {
  createContext,
  createElement,
  useContext,
  type ReactNode,
} from "react";

import { defaultReactRegistry } from "./registry";
import type {
  MDLReactData,
  MDLReactNodeProps,
  MDLReactRegistry,
  MDLRendererProps,
} from "./types";

const MDLRegistryContext = createContext<MDLReactRegistry | undefined>(undefined);

export interface MDLRegistryProviderProps {
  registry: MDLReactRegistry;
  children?: ReactNode;
}

export function MDLRegistryProvider({
  registry,
  children,
}: MDLRegistryProviderProps) {
  return (
    <MDLRegistryContext.Provider value={registry}>
      {children}
    </MDLRegistryContext.Provider>
  );
}

export function useMDLRegistry(): MDLReactRegistry {
  return useContext(MDLRegistryContext) ?? defaultReactRegistry;
}

export function MDLRenderer<TData = unknown, TProps = Record<string, unknown>>({
  node,
  registry,
  readOnly = false,
  onMissing = "throw",
  env,
  values,
}: MDLRendererProps<TData, TProps>) {
  const inheritedRegistry = useMDLRegistry();
  const activeRegistry = registry ?? inheritedRegistry;

  return renderNode({
    node,
    registry: activeRegistry,
    readOnly,
    onMissing,
    env,
    values,
  });
}

interface RenderNodeOptions<TData, TProps> {
  node: MDLNode<TData, TProps>;
  registry: MDLReactRegistry;
  readOnly: boolean;
  onMissing: "throw" | "null";
  env?: unknown;
  values?: MDLRuleValues;
}

function renderNode<TData, TProps>({
  node,
  registry,
  readOnly,
  onMissing,
  env,
  values,
}: RenderNodeOptions<TData, TProps>): ReactNode {
  node = applyMDLRules(node, { env, values });
  if (node.kind === "layout" || node.kind === "form") {
    const Implementation = registry.resolve({
      kind: "layout",
      type: node.layout,
      tags: node.tags,
    });
    if (!Implementation) return handleMissing("layout", node.layout, onMissing);

    const containerNode = node as unknown as
      | MDLLayout<MDLReactData, MDLReactNodeProps>
      | MDLForm<MDLReactData, MDLReactNodeProps>;
    const children = node.children.map((child) => (
      <MDLRenderer
        key={child.id}
        node={child}
        onMissing={onMissing}
        readOnly={readOnly}
        registry={registry}
        env={env}
        values={values}
      />
    ));

    return createElement(Implementation, { node: containerNode, children });
  }

  if (node.kind === "field") {
    const Implementation = registry.resolve({
      kind: "field",
      type: node.type,
      tags: node.tags,
    });
    if (!Implementation) return handleMissing("field", node.type, onMissing);

    const fieldNode = node as unknown as MDLField<MDLReactData, MDLReactNodeProps>;
    return createElement(Implementation, {
      node: fieldNode,
      readOnly,
    });
  }

  const Implementation = registry.resolve({
    kind: "component",
    type: node.type,
    tags: node.tags,
  });
  if (!Implementation) return handleMissing("component", node.type, onMissing);

  return createElement(Implementation, {
    node: node as unknown as MDLComponent<string, MDLReactNodeProps>,
  });
}

function handleMissing(
  kind: string,
  type: string,
  behavior: "throw" | "null",
): null {
  if (behavior === "null") return null;
  throw new Error(
    `[MDL] React renderer: nothing registered for kind "${kind}" and type "${type}".`,
  );
}

