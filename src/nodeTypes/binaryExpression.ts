import { LPCNode } from "./lpcNode";

export class BinaryExpressionNode extends LPCNode {
  public override type: string | undefined = "binary-exp";
  public left: LPCNode | undefined;
  public right: LPCNode | undefined;  
  public operator: string | undefined;
}