import type { MDLComponent } from "../component";

interface HeadingProps {
  level: 1 | 2 | 3;
}

export const component: MDLComponent = {
  kind: "component",
  id: "intro",
  type: "text",
};

export const narrowedType: MDLComponent<"heading", HeadingProps> = {
  kind: "component",
  id: "title",
  type: "heading",
  tags: ["prominent"],
  props: { level: 1 },
};

// @ts-expect-error type must be "heading"
export const wrongType: MDLComponent<"heading"> = { kind: "component", id: "title", type: "text" };

// @ts-expect-error kind must be "component"
export const wrongKind: MDLComponent = { kind: "field", id: "intro", type: "text" };
