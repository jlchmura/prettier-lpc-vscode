import { IdentifierNode } from "./identifier";
import { LPCNode } from "./lpcNode";

export class TypeCastExpressionNode extends LPCNode {
  public type = "type-cast";
  public dataType: IdentifierNode | undefined;
  public isArray = false;
  public exp: LPCNode | undefined;
}
