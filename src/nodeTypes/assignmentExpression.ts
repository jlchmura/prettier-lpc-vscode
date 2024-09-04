import { IdentifierNode } from "./identifier";
import { LPCNode } from "./lpcNode";

export const ASSIGN_EXP_TYPE: string = "assignment-exp";

export class AssignmentExpressionNode extends LPCNode {
  public override type: string | undefined = ASSIGN_EXP_TYPE;
  public left: IdentifierNode | undefined;
  public right: LPCNode | undefined;
  public operator: string | undefined;  
}
