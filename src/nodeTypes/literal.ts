import { LPCNode } from "./lpcNode";

export class LiteralNode extends LPCNode { 
  public type = "literal";
  public dataType: string = "string";
}