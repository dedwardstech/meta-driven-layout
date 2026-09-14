import type { ParserContextLike, ParamsLike } from "@mdl/exp";
import { parse } from "@mdl/exp";

import type { MDLComponent } from "./component";
import type { MDLField } from "./field";
import type { MDLForm } from "./form";
import type { MDLLayout, MDLNode } from "./layout";

export type MDLRuleValue = unknown;
export type MDLRuleValues = Readonly<Record<string, MDLRuleValue>>;

export interface MDLRuleContext {
  /** Environment/application values exposed through `env.*`. */
  env?: unknown;
  /** Current field/component value, exposed as `value`. */
  value?: unknown;
  /** Form/layout values. Layout rules receive these as top-level params. */
  values?: MDLRuleValues;
  /** Extra params exposed as top-level expression identifiers. */
  params?: MDLRuleValues;
}

export interface MDLRulePatch<TProps = Record<string, unknown>> {
  props?: Partial<TProps>;
}

export interface MDLRule<TProps = Record<string, unknown>> {
  when: string;
  then: MDLRulePatch<TProps>;
}

export interface MDLRuleEvaluationOptions extends MDLRuleContext {
  /** Parser context. Defaults to `{ env }`. */
  parserContext?: ParserContextLike;
}

export function applyMDLRules<TData, TProps>(
  node: MDLNode<TData, TProps>,
  options: MDLRuleEvaluationOptions = {},
): MDLNode<TData, TProps> {
  if (node.kind === "field") {
    return applyFieldRules(node, options) as MDLNode<TData, TProps>;
  }

  if (node.kind === "layout" || node.kind === "form") {
    return applyContainerRules(node, options) as MDLNode<TData, TProps>;
  }

  return applyComponentRules(node, options) as MDLNode<TData, TProps>;
}

function applyFieldRules<TData, TProps>(
  node: MDLField<TData, TProps>,
  options: MDLRuleEvaluationOptions,
): MDLField<TData, TProps> {
  const value = options.value ?? valueForField(node, options.values);
  const params = {
    ...options.params,
    value,
    [node.field]: value,
  };

  return applyRulesToNode(node, params, options);
}

function applyContainerRules<TData, TProps>(
  node: MDLLayout<TData, TProps> | MDLForm<TData, TProps>,
  options: MDLRuleEvaluationOptions,
): MDLLayout<TData, TProps> | MDLForm<TData, TProps> {
  const params = {
    ...options.values,
    ...options.params,
  };

  return applyRulesToNode(node, params, options);
}

function applyComponentRules<TProps>(
  node: MDLComponent<string, TProps>,
  options: MDLRuleEvaluationOptions,
): MDLComponent<string, TProps> {
  const params = {
    ...options.params,
    value: options.value,
  };

  return applyRulesToNode(node, params, options);
}

function applyRulesToNode<TNode extends { props?: unknown; rules?: readonly MDLRule<any>[] }>(
  node: TNode,
  params: ParamsLike,
  options: MDLRuleEvaluationOptions,
): TNode {
  if (!node.rules?.length) return node;

  let props = node.props as Record<string, unknown> | undefined;
  let changed = false;

  for (const rule of node.rules) {
    if (!evaluateCondition(rule.when, params, options)) continue;

    if (rule.then.props) {
      props = {
        ...(props ?? {}),
        ...(rule.then.props as Record<string, unknown>),
      };
      changed = true;
    }
  }

  if (!changed) return node;
  return { ...node, props };
}

function evaluateCondition(
  condition: string,
  params: ParamsLike,
  options: MDLRuleEvaluationOptions,
): boolean {
  return parse(condition, options.parserContext ?? { env: options.env }).eval(params);
}

function valueForField<TData, TProps>(
  node: MDLField<TData, TProps>,
  values: MDLRuleValues | undefined,
): unknown {
  if (!values) return undefined;
  if (node.field in values) return values[node.field];

  let current: unknown = values;
  for (const segment of node.field.split(".")) {
    if (current == null || (typeof current !== "object" && typeof current !== "function")) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}
