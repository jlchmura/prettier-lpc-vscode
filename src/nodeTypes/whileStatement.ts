import { LPCNode } from "./lpcNode";

export class WhileStatementNode extends LPCNode {
  test: LPCNode | undefined;
  codeblock: LPCNode | undefined;

  public type = "while";
}