import type { MDLNodeAttributes } from "./node";

export interface MDLFieldTypes {
  string: true;
  number: true;
  "one-to-many": true;
  boolean: true;
  readonly: true;
}

export type MDLFieldType = keyof MDLFieldTypes;

export interface MDLField<TData = unknown, TProps = Record<string, unknown>>
  extends MDLNodeAttributes {
  kind: "field";
  field: TData extends object ? Extract<keyof TData, string> : string;
  type: MDLFieldType;
  props?: TProps;
}
