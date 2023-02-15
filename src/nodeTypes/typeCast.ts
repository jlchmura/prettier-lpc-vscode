import { IdentifierNode } from "./identifier";
import { LPCNode } from "./lpcNode";

export class TypeCastExpressionNode extends LPCNode { 
  public type = "type-cast";
  public dataType: IdentifierNode | undefined;
  public exp: LPCNode | undefined;
}

export class StructLiteralNode extends LPCNode {
  public type="struct-literal";
  public structName: IdentifierNode|undefined;
}