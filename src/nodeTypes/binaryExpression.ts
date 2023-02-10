import { LPCNode } from "./lpcNode";

export class BinaryishExpressionNode extends LPCNode {
  public left: LPCNode | undefined;
  public right: LPCNode | undefined;  
  public operator: string | undefined;
}

export class BinaryExpressionNode extends BinaryishExpressionNode {
  public override type: string | undefined = "binary-exp";  
}