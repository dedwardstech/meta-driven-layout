import type { CSSProperties } from "react";

import type { MDLReactLayoutProps } from "./types";

export function VerticalLayout({ node, children }: MDLReactLayoutProps) {
  const { gap } = node.props ?? {};

  return (
    <div
      data-mdl-layout="vertical"
      id={node.id}
      style={{ display: "flex", flexDirection: "column", gap }}
    >
      {children}
    </div>
  );
}

export function HorizontalLayout({ node, children }: MDLReactLayoutProps) {
  const { gap, wrap } = (node.props ?? {}) as {
    gap?: string | number;
    wrap?: boolean;
  };

  return (
    <div
      data-mdl-layout="horizontal"
      id={node.id}
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: wrap ? "wrap" : undefined,
        gap,
      }}
    >
      {children}
    </div>
  );
}

export function GridLayout({ node, children }: MDLReactLayoutProps) {
  const { columns, gap } = (node.props ?? {}) as {
    columns?: number;
    gap?: string | number;
  };
  const style: CSSProperties = {
    display: "grid",
    gridTemplateColumns: columns
      ? `repeat(${columns}, minmax(0, 1fr))`
      : undefined,
    gap,
  };

  return (
    <div data-mdl-layout="grid" id={node.id} style={style}>
      {children}
    </div>
  );
}

