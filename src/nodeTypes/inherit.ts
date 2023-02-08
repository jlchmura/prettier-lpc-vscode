import { LPCNode } from "./lpcNode";

export class InheritNode extends LPCNode { 
  public type = "inherit";
  public override endsLine: boolean = true;  
  public argument: LPCNode | undefined;
}