import { IdentifierNode } from "./identifier";
import { LPCNode } from "./lpcNode";

export class AssignmentExpressionNode extends LPCNode {
  public override type: string | undefined = "assignment-exp";
  public left: IdentifierNode | undefined;
  public right: LPCNode | undefined;  
  public operator: string | undefined;
}