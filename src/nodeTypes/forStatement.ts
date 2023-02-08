import { LPCNode } from "./lpcNode";

export class ForStatementNode extends LPCNode {
  init: LPCNode | undefined;
  test: LPCNode | undefined;
  update: LPCNode | undefined;
  codeblock: LPCNode | undefined;

  public type = "for";
}