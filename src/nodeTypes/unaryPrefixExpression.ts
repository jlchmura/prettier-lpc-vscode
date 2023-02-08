import { LPCNode } from "./lpcNode";

export class UnaryPrefixExpressionNode extends LPCNode {
  public override type: string | undefined = "unary-prefix-exp";
  
  public operator: string|undefined;
  public operand: LPCNode|undefined;
}