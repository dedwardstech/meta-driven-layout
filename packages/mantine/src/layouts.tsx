import { Group, SimpleGrid, Stack } from "@mantine/core";

import type { MDLReactLayoutProps } from "@mdl/react";

export function MantineVerticalLayout({ node, children }: MDLReactLayoutProps) {
  const { gap } = (node.props ?? {}) as { gap?: string | number };

  return (
    <Stack data-mdl-layout="vertical" gap={gap} id={node.id}>
      {children}
    </Stack>
  );
}

export function MantineHorizontalLayout({ node, children }: MDLReactLayoutProps) {
  const { gap, wrap } = (node.props ?? {}) as {
    gap?: string | number;
    wrap?: boolean;
  };

  return (
    <Group
      data-mdl-layout="horizontal"
      gap={gap}
      id={node.id}
      wrap={wrap === false ? "nowrap" : "wrap"}
    >
      {children}
    </Group>
  );
}

export function MantineGridLayout({ node, children }: MDLReactLayoutProps) {
  const { columns, gap } = (node.props ?? {}) as {
    columns?: number;
    gap?: string | number;
  };

  return (
    <SimpleGrid
      cols={columns ?? 1}
      data-mdl-layout="grid"
      id={node.id}
      spacing={gap}
    >
      {children}
    </SimpleGrid>
  );
}
