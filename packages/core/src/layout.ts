import type { MDLComponent } from "./component";
import type { MDLField } from "./field";
import type { MDLForm } from "./form";
import type { MDLNodeAttributes } from "./node";

export interface MDLLayouts {
  vertical: { gap?: string | number };
  horizontal: { gap?: string | number; wrap?: boolean };
  grid: { columns?: number; gap?: string | number };
}

export type MDLLayoutType = keyof MDLLayouts;

export interface MDLLayoutNode<
  TLayout extends MDLLayoutType,
  TData = unknown,
  TProps = Record<string, unknown>,
> extends MDLNodeAttributes {
  kind: "layout";
  layout: TLayout;
  children: MDLNode<TData, TProps>[];
  props?: MDLLayouts[TLayout];
}

export type MDLLayout<TData = unknown, TProps = Record<string, unknown>> = {
  [K in MDLLayoutType]: MDLLayoutNode<K, TData, TProps>;
}[MDLLayoutType];

export type MDLNode<TData = unknown, TProps = Record<string, unknown>> =
  | MDLComponent<string, TProps>
  | MDLField<TData, TProps>
  | MDLLayout<TData, TProps>
  | MDLForm<TData, TProps>;
