import { IdentifierNode } from "./identifier";
import { LPCNode } from "./lpcNode";

export class BaseDeclarationNode extends LPCNode {
  public varType: IdentifierNode | undefined;
  public modifiers: IdentifierNode[] = [];
}

export class VariableDeclarationNode extends BaseDeclarationNode {
  public override type: string | undefined = "var-decl"; 
  public declarations: VariableDeclaratorNode[] = [];
}

export class VariableDeclaratorNode extends LPCNode {
  public override type: string | undefined = "var";
  public id: IdentifierNode | undefined;
  public init: LPCNode | undefined;
}