import { LPCNode } from "./lpcNode";

export class ArrayExpressionNode extends LPCNode { 
  public type = "array";
  
  public elements: LPCNode[] = [];  
}

export class IndexorExpressionNode extends LPCNode {
  public type = "indexor-exp";  
}