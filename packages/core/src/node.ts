import type { MDLRule } from "./rules";

export interface MDLNodeAttributes {
  id: string;
  tags?: string[];
  rules?: readonly MDLRule[];
}
