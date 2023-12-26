import { AstPath, Doc, util } from "prettier";
import { builders } from "prettier/doc";
import { AssignmentExpressionNode } from "../../nodeTypes/assignmentExpression";
import {
  BinaryExpressionNode,
  BinaryishExpressionNode,
} from "../../nodeTypes/binaryExpression";
import {
  CallExpressionNode,
  SpreadOperatorNode,
} from "../../nodeTypes/callExpression";
import { LogicalExpressionNode } from "../../nodeTypes/logicalExpression";
import { LPCNode } from "../../nodeTypes/lpcNode";
import { MemberExpressionNode } from "../../nodeTypes/memberExpression";
import { UnaryPrefixExpressionNode } from "../../nodeTypes/unaryPrefixExpression";
import { VariableDeclarationNode } from "../../nodeTypes/variableDeclaration";
import { pushIfVal } from "../../utils/arrays";
import { printSuffixComments } from "./comment";
import { isInParen, needsSemi, PrintNodeFunction } from "./shared";
import { printArray } from "./array";
import { ArrayExpressionNode } from "../../nodeTypes/arrayExpression";

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

export const printUnaryPrefixExpression: PrintNodeFunction<
  UnaryPrefixExpressionNode,
  UnaryPrefixExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];

  if (node.operator) printed.push(node.operator);
  if (node.operand) printed.push(path.call(printChildren, "operand"));

  return printed;
};

export const printSpreadOperator: PrintNodeFunction<
  SpreadOperatorNode,
  SpreadOperatorNode
> = (node, path, options, printChildren) => {
  return "...";
};

export const printCallExpression: PrintNodeFunction<
  CallExpressionNode,
  CallExpressionNode
> = (node, path, options, printChildren) => {
  const printed = [path.call(printChildren, "callee")];
  const sym = Symbol("argGroup");
  printed.push("(");

  if (node.arguments && node.arguments.length > 0) {
    const arg0 = node.arguments[0];
    const argPrinted = join([",", line], path.map(printChildren, "arguments"));

    const tryCondense = !util.hasNewlineInRange(
      options.originalText,
      node.start,
      arg0.start
    );

    const grouped = group([indent([softline, argPrinted])], { id: sym });
    if (tryCondense) {
      //} && node.arguments.length == 1) {
      // don't indent these
      printed.push(ifBreak(grouped, argPrinted));
    } else {
      printed.push(grouped);
    }
  }

  printed.push(ifBreak(softline, "", { groupId: sym }));
  printed.push(")");

  printed.push(printSuffixComments(node, path, options, printChildren));

  const shouldPrintSemi = needsSemi(path);
  if (shouldPrintSemi) {
    printed.push(";");
    if (util.isNextLineEmpty(options.originalText, node, (n) => n?.end)) {
      printed.push(hardline);
    }
  }

  return fill(printed);
};

export const printAssignmentExpression: PrintNodeFunction<
  AssignmentExpressionNode,
  AssignmentExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];

  if (node.left) printed.push(path.call(printChildren, "left"));

  if (node.operator != "++" && node.operator != "--") printed.push(" ");
  printed.push(node.operator || "");

  let printPairs = false;
  switch (node.left?.name) {
    case "dest_dir":
    case "items":
      printPairs = true;
      break;
  }

  if (node.right) {
    const shouldIndent =
      node.right?.type != "array" && node.right?.type != "mapping";

    const rightPrinted = path.call(printChildren, "right");

    if (shouldIndent) {
      printed.push(group(indent([line, rightPrinted])));
    } else {
      printed.push(" ", rightPrinted);
    }
  }

  const printSemi = needsSemi(path);
  if (printSemi) {
    printed.push(";");
    if (util.isNextLineEmpty(options.originalText, node, (n) => n.end)) {
      printed.push(hardline);
    }
  }

  pushIfVal(printed, printSuffixComments(node, path, options, printChildren));

  return printed;
};

export const printBinaryishExpression: PrintNodeFunction<
  BinaryishExpressionNode,
  BinaryishExpressionNode
> = (node, path, options, printChildren) => {
  const printed: Doc = [];

  printed.push(group(printChildren("left")));

  // don't print operator for an implied binary expression
  const op = node.implied ? "" : [" ", node.operator?.trim() || ""];
  const right = [op, line, printChildren("right")];

  const parent = path.getParentNode()!;
  const inParen = isInParen(path);
  const shouldGroup =
    !(inParen && node.type == "logical-exp") &&
    parent.type != node.type &&
    node.left?.type != node.type &&
    node.right?.type != node.type;

  printed.push(shouldGroup ? group(right) : right);

  return [printed];
};

export const printBinaryExpression: PrintNodeFunction<
  BinaryExpressionNode,
  BinaryExpressionNode
> = (node, path, options, printChildren) => {
  return printBinaryishExpression(node, path, options, printChildren);
};

export const printLogicalExpression: PrintNodeFunction<
  LogicalExpressionNode,
  LogicalExpressionNode
> = (node, path, options, printChildren) => {
  return printBinaryishExpression(node, path, options, printChildren);
};

export const printMemberExpression: PrintNodeFunction<
  MemberExpressionNode,
  MemberExpressionNode
> = (node, path, options, printChildren) => {
  const { object, property } = node;
  const printed: Doc = [];

  if (object) printed.push(path.call(printChildren, "object"));

  if (property?.type == "indexor-exp") {
    printed.push(
      "[",
      group([softline, path.call(printChildren, "property"), softline]),
      "]"
    );
  } else {
    if (object) printed.push("->");
    if (property) {
      const propPrinted = path.call(printChildren, "property");
      if (property.type == "identifier" || property.type == "indexor-exp")
        printed.push(propPrinted);
      else printed.push("(", propPrinted, ")"); // struct member expression
    }
  }

  if (node.arguments) {
    const printedArgs = path.map(printChildren, "arguments");
    printed.push(join([",", line], printedArgs));
  }

  if (needsSemi(path)) {
    printed.push(";");
  }

  printed.push(printSuffixComments(node, path, options, printChildren));

  return printed;
};
