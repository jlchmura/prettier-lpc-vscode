import { LPCNode } from "./lpcNode";

export class CommentNode extends LPCNode {
  public type = "comment";  
}

export class CommentBlockNode extends CommentNode {
  public type = "comment-block";
}

export class InlineCommentNode extends CommentNode {
  public type = "comment-singleline";  
}
