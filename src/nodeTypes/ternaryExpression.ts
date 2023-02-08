import { LPCNode } from "./lpcNode";

export class TernaryExpressionNode extends LPCNode {
  public test: LPCNode | undefined;
  public consequent: LPCNode | undefined;  
  public alternate: LPCNode | undefined;
  public type = "ternary";
}