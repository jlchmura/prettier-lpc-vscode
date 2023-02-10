import { BinaryishExpressionNode } from "./binaryExpression";
import { LPCNode } from "./lpcNode";

export class LogicalExpressionNode extends BinaryishExpressionNode {
  public override type: string | undefined = "logical-exp";  
}