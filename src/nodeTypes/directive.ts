import { IdentifierNode } from "./identifier";
import { LiteralNode } from "./literal";
import { LPCNode } from "./lpcNode";

export class DirectiveNode extends LPCNode { 
  public type = "directive";
  public override endsLine: boolean = true;
  public directiveType!: IdentifierNode;
  
  public key: LiteralNode | undefined;
  public arguments: LiteralNode[] = [];
}