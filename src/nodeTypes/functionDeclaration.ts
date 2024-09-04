import { CodeBlockNode } from "./codeBlock";
import { IdentifierNode } from "./identifier";
import { LPCNode } from "./lpcNode";
import { BaseDeclarationNode } from "./variableDeclaration";

export class FunctionDeclarationNode extends BaseDeclarationNode {
  public override type: string | undefined = "function";

  public id: IdentifierNode | undefined;
  public params: LPCNode[] = [];
  public codeBlock: CodeBlockNode | undefined;
  /** When true indicates that this is a function stub instead of an actual function declaration */
  public isStub = false;
}

export class ParameterDefaultValueNode extends LPCNode {
  public override type: string | undefined = "parameterDefaultValue";
  public value: LPCNode | undefined;
}