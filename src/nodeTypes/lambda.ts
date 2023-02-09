import { ArrayExpressionNode } from "./arrayExpression";
import { LPCNode } from "./lpcNode";

export class LambdaNode extends LPCNode {
  public type = "lambda";
  public arguments: ArrayExpressionNode|undefined;
  public code: LPCNode|undefined;
}

export class LambdaEmptyArgNode extends LPCNode {
  public type = "lambda-empty-arg";  
}

export class LambdaIndexorNode extends LPCNode {
  public type = "lambda-indexor";
}