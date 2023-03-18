export enum TokenType {
  None = 0,

  StartCommentBlock,
  EndCommentBlock,
  Comment,

  Semicolon,
  Colon,
  Comma,

  Directive,
  DirectiveArgument,
  DirectiveLineBreak,
  DirectiveEnd,

  Inherit,
  InheritanceAccessor,

  StartDeclaration,
  Modifier,
  Type,
  DeclarationName,

  TypeCast,

  CodeBlockStart,
  CodeBlockEnd,

  ArrayStart,
  ArrayEnd,

  MappingStart,
  MappingEnd,

  Variable,

  Arrow,

  Function,
  FunctionArgument,
  FunctionArgumentType,
  FunctionArgumentEnd,
  Return,

  Closure,
  InlineClosureStart,
  InlineClosureEnd,
  InlineClosureArgument,
  LambdaStart,
  LabmdaEnd,
  LambdaEmptyArg,
  LambdaIndexor,  

  If,
  ElseIf,
  Else,
  Expression,
  Ternary,

  Switch,
  SwitchCase,
  
  For,
  ForEach,
  ForEachIn,
  ForEachRange,
  While,
  ControlFlow,

  Literal,
  LiteralChar,
  LiteralNumber,

  ParenBlock,
  ParenBlockEnd,

  IndexorStart,
  IndexorEnd,
  IndexorFromEndPos,
  IndexorPosSep,

  StructLiteral,

  Operator,
  LogicalOperator,
  AssignmentOperator,
  Bang,
  Star,
  CallByRef,
  Spread, // FluffOS only

  Whitespace,
  BlankLines,

  StringLiteralStart,
  StringLiteralBody,

  Unknown,
  EOS,
}

export enum ScannerState {
  WithinFile,

  StartDirective,
  WithinDirective,
  WithinDirectiveArg,

  StartInherit,
  WithinInherit,

  StartDeclaration,
  WithinFunction,
  WithinFunctionArgs,
  WithinAssignment,

  WithinLiteral,

  WithinBlock,

  WithinCommentBlock,

  WithinLambda,

  IfExpression,
  ElseIfExpression,
  ElseExpression,
  WithinIf,

  WithinIndexor,

  WithinStringLiteralBlock
}
