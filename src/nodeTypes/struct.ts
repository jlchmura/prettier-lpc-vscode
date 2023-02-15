import { CodeBlockNode } from "./codeBlock";
import { IdentifierNode } from "./identifier";
import { LPCNode } from "./lpcNode";

export class StructDefinitionNode extends LPCNode {
  public type = "struct";
  public structName: IdentifierNode | undefined;
  public definition: CodeBlockNode | undefined;
}

export class StructLiteralNode extends LPCNode {
  public type = "struct-literal";
  public structName: IdentifierNode | undefined;
}
