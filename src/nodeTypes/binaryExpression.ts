import { LPCNode } from "./lpcNode";

export class BinaryishExpressionNode extends LPCNode {
  public left: LPCNode | undefined;
  public right: LPCNode | undefined;  
  public operator: string | undefined;
  /** when true it is an implied string literal binary expression */
  public implied = false;
}

export class BinaryExpressionNode extends BinaryishExpressionNode {
  public override type: string | undefined = "binary-exp";  
}