import { LPCNode } from "./lpcNode";

export class ArrayExpressionNode extends LPCNode { 
  public type = "array";
  
  public elements: LPCNode[] = [];  
  public printAsPairs=false;
}

export class IndexorExpressionNode extends LPCNode {
  public type = "indexor-exp";  
}