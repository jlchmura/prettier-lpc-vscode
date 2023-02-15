import { IndexorExpressionNode } from "./arrayExpression";
import { CallExpressionNode } from "./callExpression";
import { IdentifierNode } from "./identifier";
import { LiteralNode } from "./literal";
import { LPCNode } from "./lpcNode";
import { VariableDeclarationNode } from "./variableDeclaration";

export class MemberExpressionNode extends LPCNode {
  public type = "member-exp";

  public object: LPCNode | CallExpressionNode | undefined;
  public property: IdentifierNode|IndexorExpressionNode|LPCNode|undefined;
  public arguments: (VariableDeclarationNode | LiteralNode)[] = [];
  /** indicates if this member expression is a struct member expression */
  public isStruct = false;
}

export class ParentExpressionNode extends MemberExpressionNode {
  public type = "parent-exp";
}
