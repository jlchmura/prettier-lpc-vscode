import { CodeBlockNode } from "./codeBlock";
import { CommentBlockNode, CommentNode } from "./comment";
import { IdentifierNode } from "./identifier";
import { LPCNode } from "./lpcNode";
import { ParenBlockNode } from "./parenBlock";

export class SwitchNode extends LPCNode {
  public type = "switch";

  public test: ParenBlockNode | undefined;
  public cases: (SwitchCaseNode | CommentBlockNode | CommentNode)[] = [];
  public default: LPCNode | undefined;
}

export class SwitchCaseNode extends LPCNode {
  public type = "switch-case";

  public caseType: string | undefined;
  public expression: LPCNode | undefined;
  public code: CodeBlockNode | undefined;
}
