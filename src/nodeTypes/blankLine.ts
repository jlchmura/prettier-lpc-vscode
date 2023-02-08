import { LPCNode } from "./lpcNode";

export class BlankLinkNode extends LPCNode {
  public override type: string | undefined = "blankline";
  public override endsLine: boolean=true;
}
