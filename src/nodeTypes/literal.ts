import { LPCNode } from "./lpcNode";

export class LiteralNode extends LPCNode {
  public type = "literal";
  public dataType: string = "string";
}

export class StringLiteralBlockNode extends LiteralNode {
  public type = "string-literal-block";
  public dataType: string = "string";
  public marker: string | undefined;
}
