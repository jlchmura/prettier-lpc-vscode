import { IdentifierNode } from "./identifier";
import { LPCNode } from "./lpcNode";

export class ControlFlowStatementNode extends LPCNode {
  controlStatement: string | undefined;
  
  public type = "control-flow";
}