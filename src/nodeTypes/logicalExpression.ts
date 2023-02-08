import { LPCNode } from "./lpcNode";

export class LogicalExpressionNode extends LPCNode {
  public override type: string | undefined = "logical-exp";
  public left: LPCNode | undefined;
  public right: LPCNode | undefined;  
  public operator: string | undefined;
}