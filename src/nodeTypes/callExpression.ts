import { LPCNode } from "./lpcNode";

export class CallExpressionNode extends LPCNode {
  public override type: string | undefined = "call-exp";  
  public callee: LPCNode | undefined;
  public arguments: LPCNode[] | undefined;  
}
