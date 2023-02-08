import { LPCNode } from "./lpcNode";

export class ReturnNode extends LPCNode { 
  public type = "return";
  public argument: LPCNode | undefined;
}