import type { MDLLayoutType, MDLLayouts, MDLNode } from "./layout";
import type { MDLNodeAttributes } from "./node";

export interface MDLFormNode<
  TLayout extends MDLLayoutType,
  TData = unknown,
  TProps = Record<string, unknown>,
> extends MDLNodeAttributes {
  kind: "form";
  layout: TLayout;
  children: MDLNode<TData, TProps>[];
  props?: MDLLayouts[TLayout];
}

export type MDLForm<TData = unknown, TProps = Record<string, unknown>> = {
  [K in MDLLayoutType]: MDLFormNode<K, TData, TProps>;
}[MDLLayoutType];
