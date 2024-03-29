import { SpreadOperatorNode } from "./callExpression";
import { LPCNode } from "./lpcNode";

export class IdentifierNode extends LPCNode {
  public type = "identifier";
  public name: string | undefined;  
  public property: LPCNode | undefined;
  public spread: SpreadOperatorNode | undefined;
}
