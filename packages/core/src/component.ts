import type { MDLNodeAttributes } from "./node";

export interface MDLComponent<
  TType extends string = string,
  TProps = Record<string, unknown>,
> extends MDLNodeAttributes {
  kind: "component";
  type: TType;
  props?: TProps;
}
