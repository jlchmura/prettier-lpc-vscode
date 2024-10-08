import { AstPath, Doc, Printer } from "prettier";
import { builders } from "prettier/doc";
import { LPCOptions } from ".";
import {
  ArrayExpressionNode,
  IndexorExpressionNode,
} from "../nodeTypes/arrayExpression";
import { AssignmentExpressionNode } from "../nodeTypes/assignmentExpression";
import { BinaryExpressionNode } from "../nodeTypes/binaryExpression";
import { BlankLinkNode } from "../nodeTypes/blankLine";
import {
  CallExpressionNode,
  SpreadOperatorNode,
} from "../nodeTypes/callExpression";
import { ClosureNode, InlineClosureArgumentNode } from "../nodeTypes/closure";
import { CodeBlockNode } from "../nodeTypes/codeBlock";
import { CommentBlockNode, InlineCommentNode } from "../nodeTypes/comment";
import { ControlFlowStatementNode } from "../nodeTypes/controlFlowStatement";
import { DirectiveNode } from "../nodeTypes/directive";
import {
  ForEachRangeExpressionNode,
  ForEachStatementNode,
  ForStatementNode,
  MultiExpressionNode,
} from "../nodeTypes/forStatement";
import { FunctionDeclarationNode, ParameterDefaultValueNode } from "../nodeTypes/functionDeclaration";
import { IdentifierNode } from "../nodeTypes/identifier";
import { IfNode } from "../nodeTypes/if";
import { InheritNode } from "../nodeTypes/inherit";
import {
  LambdaEmptyArgNode,
  LambdaIndexorNode,
  LambdaNode,
} from "../nodeTypes/lambda";
import { LiteralNode, StringLiteralBlockNode } from "../nodeTypes/literal";
import { LogicalExpressionNode } from "../nodeTypes/logicalExpression";
import { LPCNode } from "../nodeTypes/lpcNode";
import {
  MappingExpressionNode,
  MappingPair,
} from "../nodeTypes/mappingExpression";
import {
  MemberExpressionNode,
  ParentExpressionNode,
} from "../nodeTypes/memberExpression";
import { ParenBlockNode } from "../nodeTypes/parenBlock";
import { ReturnNode } from "../nodeTypes/returnNode";
import { StructDefinitionNode, StructLiteralNode } from "../nodeTypes/struct";
import { SwitchNode } from "../nodeTypes/switch";
import { TernaryExpressionNode } from "../nodeTypes/ternaryExpression";
import { TypeCastExpressionNode } from "../nodeTypes/typeCast";
import { UnaryPrefixExpressionNode } from "../nodeTypes/unaryPrefixExpression";
import {
  VariableDeclarationNode,
  VariableDeclaratorNode,
} from "../nodeTypes/variableDeclaration";
import { WhileStatementNode } from "../nodeTypes/whileStatement";

import {
  printArray,
  printIndexorExpression,
  printMapping,
  printMappingPair,
} from "./print/array";
import { printCodeblock } from "./print/block";
import {
  printClosure,
  printInlineClosure,
  printInlineClosureArg,
} from "./print/closure";
import { printCommentBlock, printInlineComment } from "./print/comment";
import { printIf, printSwitch, printTernary } from "./print/conditional";
import {
  printAssignmentExpression,
  printBinaryExpression,
  printCallExpression,
  printLogicalExpression,
  printMemberExpression,
  printSpreadOperator,
  printUnaryPrefixExpression,
} from "./print/expression";
import {
  printFunction,
  printParamDefaultValue,
  printParentExpression,
  printReturn,
} from "./print/function";
import {
  printControlFlowStatement,
  printForEachRangeStatement,
  printForEachStatement,
  printForStatement,
  printMultiExpression,
  printWhileStatement,
} from "./print/iteration";
import {
  printLambda,
  printLambdaEmptyArg,
  printLambdaIndexor,
} from "./print/lambda";
import { printLiteral, printStringLiteralBlock } from "./print/literal";
import {
  printBlankline,
  printDirective,
  printIdentifier,
  printInherit,
  printParenBlock,
} from "./print/misc";
import { PrintChildrenFunction, PrintNodeFunction } from "./print/shared";
import { printStructDefinition, printStructLiteral } from "./print/struct";
import { printTypeCast, printVar, printVarDecl } from "./print/var";

const {
  group,
  indent,
  markAsRoot,
  align,
  dedent,
  join,
  line,
  hardline,
  breakParent,
  softline,
  fill,
  indentIfBreak,
  ifBreak,
  lineSuffix,
} = builders;

export const lpcPrinters: { [name: string]: Printer } = {
  lpc: {
    print(
      path: AstPath<LPCNode>,
      options: LPCOptions,
      printChildren: (path: AstPath<LPCNode>) => Doc
    ) {
      const node = path.getNode();
      if (!node) {
        throw Error("Ivalid root node");
      }

      const result = printNode(
        node,
        path,
        options,
        printChildren as PrintChildrenFunction
      );
      return result;
    },
  },
};

const printNode: PrintNodeFunction = (node, ...commonPrintArgs) => {
  switch (node.type) {
    case "root":
      return printRoot(node, ...commonPrintArgs);
    case "comment-singleline":
      return printInlineComment(node as InlineCommentNode, ...commonPrintArgs);
    case "comment-block":
      return printCommentBlock(node as CommentBlockNode, ...commonPrintArgs);
    case "inherit":
      return printInherit(node as InheritNode, ...commonPrintArgs);
    case "literal":
      return printLiteral(node as LiteralNode, ...commonPrintArgs);
    case "string-literal-block":
      return printStringLiteralBlock(
        node as StringLiteralBlockNode,
        ...commonPrintArgs
      );
    case "identifier":
      return printIdentifier(node as IdentifierNode, ...commonPrintArgs);
    case "directive":
      return printDirective(node as DirectiveNode, ...commonPrintArgs);
    case "return":
      return printReturn(node as ReturnNode, ...commonPrintArgs);
    case "blankline":
      return printBlankline(node as BlankLinkNode, ...commonPrintArgs);
    case "function":
      return printFunction(node as FunctionDeclarationNode, ...commonPrintArgs);
    case "codeblock":
      return printCodeblock(node as CodeBlockNode, ...commonPrintArgs);
    case "var-decl":
      return printVarDecl(node as VariableDeclarationNode, ...commonPrintArgs);
    case "var":
      return printVar(node as VariableDeclaratorNode, ...commonPrintArgs);
    case "type-cast":
      return printTypeCast(node as TypeCastExpressionNode, ...commonPrintArgs);
    case "assignment":
    case "assignment-exp":
      return printAssignmentExpression(
        node as AssignmentExpressionNode,
        ...commonPrintArgs
      );
    case "call-exp":
      return printCallExpression(
        node as CallExpressionNode,
        ...commonPrintArgs
      );
    case "spread":
      return printSpreadOperator(
        node as SpreadOperatorNode,
        ...commonPrintArgs
      );
    case "member-exp":
      return printMemberExpression(
        node as MemberExpressionNode,
        ...commonPrintArgs
      );
    case "mapping":
      return printMapping(node as MappingExpressionNode, ...commonPrintArgs);
    case "mapping-pair":
      return printMappingPair(node as MappingPair, ...commonPrintArgs);
    case "array":
      return printArray(node as ArrayExpressionNode, ...commonPrintArgs);
    case "if":
      return printIf(node as IfNode, ...commonPrintArgs);
    case "ternary":
      return printTernary(node as TernaryExpressionNode, ...commonPrintArgs);
    case "parenblock":
      return printParenBlock(node as ParenBlockNode, ...commonPrintArgs);
    case "unary-prefix-exp":
      return printUnaryPrefixExpression(
        node as UnaryPrefixExpressionNode,
        ...commonPrintArgs
      );
    case "logical-exp":
      return printLogicalExpression(
        node as LogicalExpressionNode,
        ...commonPrintArgs
      );
    case "binary-exp":
      return printBinaryExpression(
        node as BinaryExpressionNode,
        ...commonPrintArgs
      );
    case "parent-exp":
      return printParentExpression(
        node as ParentExpressionNode,
        ...commonPrintArgs
      );
    case "foreach":
      return printForEachStatement(
        node as ForEachStatementNode,
        ...commonPrintArgs
      );
    case "foreach-range-exp":
      return printForEachRangeStatement(
        node as ForEachRangeExpressionNode,
        ...commonPrintArgs
      );
    case "for":
      return printForStatement(node as ForStatementNode, ...commonPrintArgs);
    case "multi-expression-node":
      return printMultiExpression(
        node as MultiExpressionNode,
        ...commonPrintArgs
      );
    case "while":
      return printWhileStatement(
        node as WhileStatementNode,
        ...commonPrintArgs
      );
    case "control-flow":
      return printControlFlowStatement(
        node as ControlFlowStatementNode,
        ...commonPrintArgs
      );
    case "indexor-exp":
      return printIndexorExpression(
        node as IndexorExpressionNode,
        ...commonPrintArgs
      );
    case "switch":
      return printSwitch(node as SwitchNode, ...commonPrintArgs);
    case "closure":
      return printClosure(node as ClosureNode, ...commonPrintArgs);
    case "inline-closure":
      return printInlineClosure(node as ClosureNode, ...commonPrintArgs);
    case "inline-closure-arg":
      return printInlineClosureArg(
        node as InlineClosureArgumentNode,
        ...commonPrintArgs
      );
    case "lambda":
      return printLambda(node as LambdaNode, ...commonPrintArgs);
    case "lambda-indexor":
      return printLambdaIndexor(node as LambdaIndexorNode, ...commonPrintArgs);
    case "lambda-empty-arg":
      return printLambdaEmptyArg(
        node as LambdaEmptyArgNode,
        ...commonPrintArgs
      );
    case "struct":
      return printStructDefinition(
        node as StructDefinitionNode,
        ...commonPrintArgs
      );
    case "struct-literal":
      return printStructLiteral(node as StructLiteralNode, ...commonPrintArgs);
    case "parameterDefaultValue":
      return printParamDefaultValue(node as ParameterDefaultValueNode, ...commonPrintArgs);
  }

  return ["###Printer Unknown Node Type: " + node.type];
};

const printRoot: PrintNodeFunction<LPCNode> = (
  node,
  path,
  options,
  printChildren
) => {
  const arr:Doc[] = [join(hardline, path.map(printChildren, "children")),hardline];
  return markAsRoot(arr);
};
