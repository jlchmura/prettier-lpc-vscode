import { LPCNode } from "./lpcNode";

export class ClosureNode extends LPCNode {
  public type = "closure";
  public argument!: LPCNode;
}
