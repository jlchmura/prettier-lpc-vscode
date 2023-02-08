import { LPCNode } from "./lpcNode";

export class ClosureNode extends LPCNode {
  public type = "closure";
  public argument!: LPCNode;
}

export class InlineClosureNode extends LPCNode {
  public type = "inline-closure";
}

export class InlineClosureArgumentNode extends LPCNode {
  public type = "inline-closure-arg";

  public name!: string;
}

export class LambdaEmptyArgNode extends LPCNode {
  public type = "lambda-empty-arg";
}
