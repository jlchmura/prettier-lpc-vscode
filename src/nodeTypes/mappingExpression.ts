import { last } from "../utils/arrays";
import { IdentifierNode } from "./identifier";
import { LPCNode } from "./lpcNode";

export class MappingPair extends LPCNode {
  public key: LPCNode;
  public value: LPCNode[] | undefined;

  public type = "mapping-pair";

  constructor(key: LPCNode, value?: LPCNode[]) {
    const lastVal = !!value ? last(value) : undefined;
    super(key.start, lastVal?.end || key.end, [], void 0);
    this.key = key;
    this.value = value;
  }
}

export class MappingExpressionNode extends LPCNode {
  public type = "mapping";

  public elements: MappingPair[] = [];
}
