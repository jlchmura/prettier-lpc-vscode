import { IdentifierNode } from "./identifier";
import { LPCNode } from "./lpcNode";

export class MappingPair {
  public key: LPCNode;
  public value: LPCNode[] | undefined;    
  
  public type = "mapping-pair";

  constructor(key: LPCNode, value?: LPCNode[]) {
    this.key = key;
    this.value = value;
  }
}

export class MappingExpressionNode extends LPCNode { 
  public type = "mapping";
    
  public elements: MappingPair[] = [];
}

