import { LPCNode } from "./lpcNode";

export class IfNode extends LPCNode {
  public test: LPCNode | undefined;
  public consequent: LPCNode | undefined;  
  public alternate: IfNode | undefined;
  public type = "if";
}