import { LPCNode } from "./lpcNode";
import { VariableDeclarationNode } from "./variableDeclaration";

export class ForStatementNode extends LPCNode {
  init: LPCNode | undefined;
  test: LPCNode | undefined;
  update: LPCNode | undefined;
  codeblock: LPCNode | undefined;

  public type = "for";
}

export class ForEachStatementNode extends LPCNode {
  vars: VariableDeclarationNode[] | undefined;
  exp: LPCNode|undefined;
  codeblock:LPCNode | undefined;
  public type = "foreach";
}